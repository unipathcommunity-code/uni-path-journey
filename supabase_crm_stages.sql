-- ============================================================
-- UniPath: CRM Stages Migration (no dependency on has_role/app_role)
-- Run in a CLEAN Supabase SQL Editor tab (clear any old SQL first).
-- RLS is tenant-scoped via the profiles table (columns the app already uses).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.crm_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    stage TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_crm_stages_tenant ON public.crm_stages(tenant_id);

ALTER TABLE public.crm_stages ENABLE ROW LEVEL SECURITY;

-- A member of the same tenant can manage that tenant's CRM stages.
-- (The CRM board is already admin-gated in the app; this keeps rows tenant-isolated.)
DROP POLICY IF EXISTS "Tenant members manage crm stages" ON public.crm_stages;
CREATE POLICY "Tenant members manage crm stages" ON public.crm_stages FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.tenant_id = crm_stages.tenant_id)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.tenant_id = crm_stages.tenant_id));
