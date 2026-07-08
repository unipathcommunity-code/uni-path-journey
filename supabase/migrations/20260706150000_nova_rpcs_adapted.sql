-- Migration: 20260706150000_nova_rpcs_adapted.sql
-- Description: NOVA (academy) RPCs the frontend calls, ADAPTED to UniPath's schema
--   (tenant_id / tenants / tenant_memberships instead of NOVA's organization_id / organizations).
--   Without these the academy website-builder login + super-admin org tools throw
--   "function does not exist". Plus mfg_tasks table used by the manufacturing admin.

-- 1) caller's / a user's tenant
CREATE OR REPLACE FUNCTION public.user_org_id(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.user_org_id(uuid) TO anon, authenticated;

-- 2) public site branding by subdomain slug (anon-safe)
CREATE OR REPLACE FUNCTION public.site_branding_by_slug(_slug text)
RETURNS TABLE (
  org_id uuid, org_name text, org_logo_url text, primary_color text,
  accent_color text, site_title text, site_tagline text, is_published boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.name,
         t.config->'branding'->>'logo_url',
         COALESCE(t.config->'branding'->>'theme_color', '#10b981'),
         COALESCE(t.config->'branding'->>'theme_color', '#10b981'),
         t.name, NULL::text, true
  FROM public.tenants t
  WHERE t.subdomain = _slug
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.site_branding_by_slug(text) TO anon, authenticated;

-- 3) re-home a fresh signup into the tenant whose site they registered on
CREATE OR REPLACE FUNCTION public.claim_signup_for_org(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_current uuid;
BEGIN
  IF auth.uid() IS DISTINCT FROM _user_id THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE id = _org_id) THEN RAISE EXCEPTION 'org_not_found'; END IF;
  SELECT tenant_id INTO v_current FROM public.profiles WHERE user_id = _user_id;
  IF v_current IS NULL THEN
    UPDATE public.profiles SET tenant_id = _org_id WHERE user_id = _user_id;
  END IF;
  INSERT INTO public.tenant_memberships (user_id, tenant_id, role)
  VALUES (_user_id, _org_id, 'student')
  ON CONFLICT (user_id, tenant_id) DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_signup_for_org(uuid, uuid) TO authenticated;

-- 4) owner/admin removes a member from THEIR tenant
CREATE OR REPLACE FUNCTION public.remove_user_from_org(_target_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor uuid := auth.uid(); v_org uuid;
BEGIN
  IF v_actor IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF v_actor = _target_user_id THEN RAISE EXCEPTION 'cannot_remove_self'; END IF;
  IF get_auth_user_role() NOT IN ('admin','owner','manager','super_admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT tenant_id INTO v_org FROM public.profiles WHERE user_id = v_actor;
  DELETE FROM public.tenant_memberships WHERE user_id = _target_user_id AND tenant_id = v_org;
  UPDATE public.profiles SET tenant_id = NULL WHERE user_id = _target_user_id AND tenant_id = v_org;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_user_from_org(uuid) TO authenticated;

-- 5) super admin deletes an entire tenant (reuses the existing cascade)
CREATE OR REPLACE FUNCTION public.delete_organization(_org_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthenticated'; END IF;
  IF get_auth_user_role() <> 'super_admin' THEN RAISE EXCEPTION 'forbidden'; END IF;
  PERFORM public.delete_tenant_cascade(_org_id);
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.delete_organization(uuid) TO authenticated;

-- mfg_tasks — production tasks for the manufacturing admin
CREATE TABLE IF NOT EXISTS public.mfg_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  bom_id uuid,
  bom_name text,
  qty integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'planned',
  assigned_worker_id uuid,
  assigned_worker_name text,
  piece_rate_salary numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mfg_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mfg_staff_all" ON public.mfg_tasks;
CREATE POLICY "mfg_staff_all" ON public.mfg_tasks FOR ALL TO authenticated
  USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','agent','specialist'));
