-- Migration: 20260526000000_tenant_cascade_deletion.sql
-- Description: Creates the delete_tenant_cascade function to safely delete a tenant and all its modular/associated records.

CREATE OR REPLACE FUNCTION public.delete_tenant_cascade(target_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_ids UUID[];
BEGIN
  -- 1. Gather all user_ids of auth.users who are associated with the tenant
  SELECT COALESCE(array_agg(user_id), '{}'::uuid[])
  INTO v_user_ids
  FROM public.profiles
  WHERE tenant_id = target_tenant_id AND user_id IS NOT NULL;

  -- 2. Explicitly delete from tables that do not have foreign key constraints or have SET NULL but we want hard deletion

  -- Clean up referrals and credit tables
  IF array_length(v_user_ids, 1) > 0 THEN
    DELETE FROM public.referrals WHERE referrer_id = ANY(v_user_ids) OR referred_id = ANY(v_user_ids);
    DELETE FROM public.user_credits WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.credit_transactions WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.daily_login_streaks WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.documents WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.expenses WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.mentors WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.notifications WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.payment_transactions WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.saved_housing WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.saved_jobs WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.spin_wheel_logs WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.student_feature_overrides WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.visa_applications WHERE user_id = ANY(v_user_ids);
    DELETE FROM public.visa_documents WHERE visa_application_id IN (
      SELECT id FROM public.visa_applications WHERE user_id = ANY(v_user_ids)
    );
    DELETE FROM public.users WHERE auth_user_id = ANY(v_user_ids);
  END IF;

  -- Delete from applications (which has SET NULL but we want CASCADE)
  DELETE FROM public.applications WHERE tenant_id = target_tenant_id;

  -- Delete from profiles (which has SET NULL but we want CASCADE)
  DELETE FROM public.profiles WHERE tenant_id = target_tenant_id;

  -- 3. Delete from auth.users (this will cascade delete via FK constraints to profiles, etc.)
  IF array_length(v_user_ids, 1) > 0 THEN
    DELETE FROM auth.users WHERE id = ANY(v_user_ids);
  END IF;

  -- 4. Delete the tenant itself (this will trigger ON DELETE CASCADE on all tables that reference tenants(id))
  DELETE FROM public.tenants WHERE id = target_tenant_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
