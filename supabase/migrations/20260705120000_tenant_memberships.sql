-- Migration: 20260705120000_tenant_memberships.sql
-- Description: "One account, many businesses" identity layer.
--   A user (one global Supabase auth account) can belong to MANY tenants, with a
--   separate role in each. This is additive: profiles.role / profiles.tenant_id and
--   get_auth_user_role() stay untouched so all existing RLS policies keep working.
-- Idempotent: safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member',   -- owner|admin|manager|accountant|agent|specialist|mentor|teacher|student|member|parent
  status      text NOT NULL DEFAULT 'active',   -- active|pending|blocked
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user   ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. BACKFILL (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
-- 2a. Existing profile→tenant links become memberships with their current role.
INSERT INTO public.tenant_memberships (user_id, tenant_id, role)
SELECT p.user_id, p.tenant_id, COALESCE(NULLIF(p.role, ''), 'student')
FROM public.profiles p
WHERE p.tenant_id IS NOT NULL AND p.user_id IS NOT NULL
ON CONFLICT (user_id, tenant_id) DO NOTHING;

-- 2b. Business owners (tenants.owner_email ↔ auth.users.email) become 'owner' members.
INSERT INTO public.tenant_memberships (user_id, tenant_id, role)
SELECT u.id, t.id, 'owner'
FROM public.tenants t
JOIN auth.users u ON lower(u.email) = lower(t.owner_email)
WHERE t.owner_email IS NOT NULL
ON CONFLICT (user_id, tenant_id)
  DO UPDATE SET role = 'owner', updated_at = now()
  WHERE tenant_memberships.role IN ('member', 'student');

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- A user always sees their own memberships ("my businesses" list).
DROP POLICY IF EXISTS "tm_own_select" ON public.tenant_memberships;
CREATE POLICY "tm_own_select" ON public.tenant_memberships
  FOR SELECT USING (user_id = auth.uid());

-- Staff manage memberships (same role gate as the rest of the app).
DROP POLICY IF EXISTS "tm_staff_all" ON public.tenant_memberships;
CREATE POLICY "tm_staff_all" ON public.tenant_memberships
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RPC: join_tenant — self-service join as a LOW-privilege role only.
--    Called after login/signup on a tenant subdomain. Privilege escalation is
--    blocked: only 'member' or 'student' can be self-assigned; an existing
--    higher role is never downgraded.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.join_tenant(p_tenant_id uuid, p_role text DEFAULT 'member')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_role NOT IN ('member', 'student') THEN
    p_role := 'member';
  END IF;

  -- The business owner joining their own tenant must come in as 'owner',
  -- never be created as a plain member (guards businesses registered after
  -- the backfill ran).
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF EXISTS (
    SELECT 1 FROM public.tenants t
    WHERE t.id = p_tenant_id AND lower(t.owner_email) = lower(v_email)
  ) THEN
    p_role := 'owner';
  END IF;

  INSERT INTO public.tenant_memberships (user_id, tenant_id, role)
  VALUES (auth.uid(), p_tenant_id, p_role)
  ON CONFLICT (user_id, tenant_id) DO UPDATE
    SET role = EXCLUDED.role, updated_at = now()
    WHERE EXCLUDED.role = 'owner' AND tenant_memberships.role <> 'owner';

  -- First business becomes the profile's default tenant (keeps legacy paths working).
  UPDATE public.profiles
  SET tenant_id = p_tenant_id
  WHERE user_id = auth.uid() AND tenant_id IS NULL;

  SELECT role INTO v_role
  FROM public.tenant_memberships
  WHERE user_id = auth.uid() AND tenant_id = p_tenant_id;

  RETURN v_role;
END;
$$;
GRANT EXECUTE ON FUNCTION public.join_tenant(uuid, text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RPC: get_membership_role — the caller's role in a given tenant (NULL if none).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_membership_role(p_tenant_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.tenant_memberships
  WHERE user_id = auth.uid() AND tenant_id = p_tenant_id AND status = 'active'
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_membership_role(uuid) TO authenticated;
