-- ============================================================
-- Promote the platform owner account to super_admin (DB side).
-- ============================================================
-- The frontend (useUserRole.ts SUPER_ADMIN_EMAILS) already routes this email to
-- the super-admin UI, but server-side RLS — is_super_admin() and tenant
-- impersonation reads — checks the DB role / JWT, NOT the frontend allowlist.
-- Run this once in Supabase → SQL Editor so the owner has real super powers.
--
-- Change the email below if needed.
-- ============================================================

-- 1. Confirm user's email in auth.users (so they can log in without email verification).
UPDATE auth.users
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE lower(email) = lower('unipath.community@gmail.com');

-- 2. profiles.role → super_admin (fallback path of is_super_admin()).
UPDATE public.profiles
SET role = 'super_admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE lower(email) = lower('unipath.community@gmail.com')
);

-- 3. JWT user_metadata.role → super_admin (fast path of is_super_admin()).
--    Takes effect after the user signs out and back in (JWT refresh).
UPDATE auth.users
SET raw_user_meta_data =
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role":"super_admin"}'::jsonb
WHERE lower(email) = lower('unipath.community@gmail.com');

-- 3. Verify (should return role = super_admin):
--   SELECT u.email, p.role
--   FROM auth.users u JOIN public.profiles p ON p.user_id = u.id
--   WHERE lower(u.email) = lower('unipath.community@gmail.com');
--
-- If step 1 updated 0 rows, the user has no profiles row yet — sign in once with
-- the account (which creates the profile), then re-run this file.
