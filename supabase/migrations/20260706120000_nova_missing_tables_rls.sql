-- Migration: 20260706120000_nova_missing_tables_rls.sql
-- Description: Finish integrating NOVA's accounting/owner/notification/website tables into
--   the UniPath DB. The tables were created from NOVA migrations, but NOVA's RLS uses helper
--   functions (has_role/user_organization/org_has_feature) that DO NOT exist in UniPath —
--   so those tables ended up LOCKED (RLS on, no working staff policy). This creates the one
--   missing table (teacher_contracts) and gives all of them clean UniPath-style RLS using the
--   existing get_auth_user_role(), matching how the rest of the NOVA tables already work here.
-- Idempotent.

-- teacher_contracts was never created (its NOVA policies referenced missing fns and aborted it).
CREATE TABLE IF NOT EXISTS public.teacher_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  subject_id UUID,
  group_id UUID,
  contract_type TEXT NOT NULL DEFAULT 'monthly_salary',
  percentage NUMERIC,
  per_lesson_amount NUMERIC,
  monthly_amount NUMERIC,
  base_amount NUMERIC,
  bonus_rules JSONB DEFAULT '{}'::jsonb,
  currency TEXT NOT NULL DEFAULT 'UZS',
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teacher_contracts_teacher ON public.teacher_contracts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_contracts_org ON public.teacher_contracts(organization_id);

-- Enable RLS on all target tables (no-op if already enabled)
ALTER TABLE public.invoices               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salaries               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tuition_plans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_contracts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_pages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_charges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_calls             ENABLE ROW LEVEL SECURITY;

-- ── Staff management policies (get_auth_user_role() — same model as existing NOVA tables) ──
DO $$
DECLARE
  t text;
  fin_tables text[] := ARRAY['invoices','salaries','tuition_plans','teacher_contracts','student_charges'];
  ops_tables text[] := ARRAY['notification_templates','website_pages','lead_calls'];
BEGIN
  -- Financial tables: admin/owner/manager/super_admin/accountant manage
  FOREACH t IN ARRAY fin_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "nova_staff_all" ON public.%I', t);
    EXECUTE format($f$CREATE POLICY "nova_staff_all" ON public.%I FOR ALL TO authenticated
      USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant'))
      WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant'))$f$, t);
  END LOOP;

  -- Ops tables: admin/owner/manager/super_admin manage
  FOREACH t IN ARRAY ops_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "nova_staff_all" ON public.%I', t);
    EXECUTE format($f$CREATE POLICY "nova_staff_all" ON public.%I FOR ALL TO authenticated
      USING (get_auth_user_role() IN ('admin','owner','manager','super_admin'))
      WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin'))$f$, t);
  END LOOP;
END $$;

-- Students see their own financial rows (invoices + charges)
DROP POLICY IF EXISTS "nova_student_own_invoices" ON public.invoices;
CREATE POLICY "nova_student_own_invoices" ON public.invoices
  FOR SELECT TO authenticated USING (student_id = auth.uid());

DROP POLICY IF EXISTS "nova_student_own_charges" ON public.student_charges;
CREATE POLICY "nova_student_own_charges" ON public.student_charges
  FOR SELECT TO authenticated USING (student_id = auth.uid());

-- Teachers see their own contracts
DROP POLICY IF EXISTS "nova_teacher_own_contract" ON public.teacher_contracts;
CREATE POLICY "nova_teacher_own_contract" ON public.teacher_contracts
  FOR SELECT TO authenticated USING (teacher_id = auth.uid());
