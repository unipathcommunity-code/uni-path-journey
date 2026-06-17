-- ============================================================
-- Super Admin — user role / business (tenant) assignment
-- ============================================================
-- Lets a super_admin set any user's role and attach them to a business (tenant)
-- from the Super Admin panel. profiles UPDATE RLS is mostly "own profile", so a
-- plain client UPDATE by the super admin is unreliable — this SECURITY DEFINER
-- RPC bypasses RLS but is gated to super_admin only.
--
-- SAFE TO RE-RUN (CREATE OR REPLACE). Run in Supabase → SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_set_user_role_and_tenant(
  target_user uuid,
  new_role text DEFAULT NULL,
  new_tenant uuid DEFAULT NULL
)
RETURNS public.profiles AS $$
DECLARE
  result public.profiles;
  target_email text;
BEGIN
  -- Only super admins may reassign roles / attach users to businesses.
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super_admin can assign roles and tenants';
  END IF;

  -- Whitelist assignable roles.
  IF new_role IS NOT NULL AND new_role NOT IN (
    'super_admin','owner','admin','manager','accountant','agent',
    'specialist','mentor','teacher','parent','user','student'
  ) THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Get target user's email
  SELECT email INTO target_email FROM auth.users WHERE id = target_user;

  UPDATE public.profiles
  SET
    role      = COALESCE(new_role, role),
    tenant_id = CASE
                  WHEN new_tenant = '00000000-0000-0000-0000-000000000000'::uuid THEN NULL
                  ELSE COALESCE(new_tenant, tenant_id)
                END
  WHERE user_id = target_user
  RETURNING * INTO result;

  IF result.user_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', target_user;
  END IF;

  -- If role is owner and a tenant is linked, update tenants.owner_email to enable RLS ownership bypass
  IF result.role = 'owner' AND result.tenant_id IS NOT NULL AND target_email IS NOT NULL THEN
    UPDATE public.tenants
    SET owner_email = target_email
    WHERE id = result.tenant_id;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Allow authenticated clients to call it (the body enforces super_admin).
GRANT EXECUTE ON FUNCTION public.admin_set_user_role_and_tenant(uuid, text, uuid) TO authenticated;

-- Verify:
--   SELECT public.admin_set_user_role_and_tenant(
--     '<user_uuid>', 'owner', '<tenant_uuid>');  -- must error unless caller is super_admin
