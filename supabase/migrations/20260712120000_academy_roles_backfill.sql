-- Academy role unification — STEP 1: backfill user_roles → tenant_memberships.
-- Academy (NOVA) assigns roles in the org-scoped `user_roles` table where
-- organization_id == the platform tenant_id. Routing reads `tenant_memberships`
-- (via get_membership_role), so this copies each academy user's HIGHEST role into
-- memberships so existing teachers/owners/accountants keep their access.
-- Idempotent + non-destructive: user_roles is untouched; memberships are only
-- inserted or UPGRADED (never downgraded).

-- Priority helper (higher = more access). Maps both academy and platform names.
CREATE OR REPLACE FUNCTION public.role_rank(r text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE r
    WHEN 'super_admin' THEN 100 WHEN 'superadmin' THEN 100
    WHEN 'owner' THEN 90 WHEN 'admin' THEN 80 WHEN 'manager' THEN 70
    WHEN 'accountant' THEN 60 WHEN 'teacher' THEN 50 WHEN 'mentor' THEN 45
    WHEN 'agent' THEN 40 WHEN 'specialist' THEN 35 WHEN 'parent' THEN 20
    WHEN 'student' THEN 10 WHEN 'member' THEN 5 ELSE 30 END
$$;

WITH ranked AS (
  SELECT
    ur.user_id,
    ur.organization_id AS tenant_id,
    CASE ur.role WHEN 'superadmin' THEN 'super_admin' ELSE ur.role END AS role
  FROM public.user_roles ur
  JOIN public.tenants t ON t.id = ur.organization_id   -- only org rows that are real tenants
  WHERE ur.organization_id IS NOT NULL AND ur.user_id IS NOT NULL
),
top AS (
  SELECT DISTINCT ON (user_id, tenant_id) user_id, tenant_id, role
  FROM ranked
  ORDER BY user_id, tenant_id, public.role_rank(role) DESC
)
INSERT INTO public.tenant_memberships (user_id, tenant_id, role, status)
SELECT user_id, tenant_id, role, 'active' FROM top
ON CONFLICT (user_id, tenant_id) DO UPDATE
  SET role = EXCLUDED.role, updated_at = now()
  WHERE public.role_rank(EXCLUDED.role) > public.role_rank(tenant_memberships.role);
