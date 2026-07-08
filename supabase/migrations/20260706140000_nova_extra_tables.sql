-- Auto-generated from src/academy/integrations/supabase/types.ts — NOVA tables missing in live DB.
CREATE TABLE IF NOT EXISTS public.parent_students (
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid,
  "parent_id" uuid,
  "student_id" uuid
);
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nova_auth_read" ON public.parent_students;
CREATE POLICY "nova_auth_read" ON public.parent_students FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "nova_auth_write" ON public.parent_students;
CREATE POLICY "nova_auth_write" ON public.parent_students FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.security_incidents (
  "branch_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind" text,
  "metadata" jsonb,
  "organization_id" uuid,
  "reason" text,
  "resolved" boolean,
  "resolved_at" timestamptz,
  "resolved_by" text,
  "user_id" uuid
);
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nova_auth_read" ON public.security_incidents;
CREATE POLICY "nova_auth_read" ON public.security_incidents FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "nova_auth_write" ON public.security_incidents;
CREATE POLICY "nova_auth_write" ON public.security_incidents FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  "code" text,
  "created_at" timestamptz DEFAULT now(),
  "currency" text,
  "description" text,
  "features" jsonb,
  "highlight" boolean,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "is_active" boolean,
  "max_students" numeric,
  "max_teachers" numeric,
  "monthly_price" numeric,
  "name" text,
  "org_type" text,
  "paddle_monthly_product_id" uuid,
  "paddle_yearly_product_id" uuid,
  "sort_order" numeric,
  "tier" text,
  "updated_at" timestamptz DEFAULT now(),
  "yearly_price" numeric
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nova_public_read" ON public.subscription_plans;
CREATE POLICY "nova_public_read" ON public.subscription_plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "nova_auth_write" ON public.subscription_plans;
CREATE POLICY "nova_auth_write" ON public.subscription_plans FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.teacher_payouts (
  "breakdown" jsonb,
  "computed_amount" numeric,
  "contract_id" uuid,
  "created_at" timestamptz DEFAULT now(),
  "currency" text,
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "notes" text,
  "organization_id" uuid,
  "paid_amount" numeric,
  "paid_at" timestamptz,
  "paid_by" text,
  "period_month" text,
  "status" text,
  "teacher_id" uuid,
  "updated_at" timestamptz DEFAULT now()
);
ALTER TABLE public.teacher_payouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nova_auth_read" ON public.teacher_payouts;
CREATE POLICY "nova_auth_read" ON public.teacher_payouts FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "nova_auth_write" ON public.teacher_payouts;
CREATE POLICY "nova_auth_write" ON public.teacher_payouts FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE TABLE IF NOT EXISTS public.telegram_link_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" text,
  "created_at" timestamptz DEFAULT now(),
  "expires_at" timestamptz,
  "organization_id" uuid,
  "used_at" timestamptz,
  "user_id" uuid
);
ALTER TABLE public.telegram_link_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "nova_auth_read" ON public.telegram_link_codes;
CREATE POLICY "nova_auth_read" ON public.telegram_link_codes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "nova_auth_write" ON public.telegram_link_codes;
CREATE POLICY "nova_auth_write" ON public.telegram_link_codes FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
