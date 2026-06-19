-- ============================================================
-- Platform-wide settings (singleton) for the Super Admin panel
-- ============================================================
-- Backs SuperAdminSettings.tsx so general settings + default tenant features
-- actually persist (previously the page only fired a toast and discarded the
-- input). One row, id = 'global'. Public may READ (maintenance_mode gates the
-- app), only super_admin may WRITE.
--
-- SAFE TO RE-RUN: idempotent (CREATE IF NOT EXISTS / ON CONFLICT DO NOTHING /
-- DROP POLICY IF EXISTS). Run in Supabase → SQL Editor.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  app_name TEXT NOT NULL DEFAULT 'UniPath',
  support_email TEXT,
  allow_self_registration BOOLEAN NOT NULL DEFAULT true,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  default_features JSONB NOT NULL DEFAULT '{"accountant":true,"mentor":true,"api_access":false,"unicoin":false}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT platform_settings_singleton CHECK (id = 'global')
);

-- Seed the singleton row.
INSERT INTO public.platform_settings (id) VALUES ('global')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_settings public read" ON public.platform_settings;
CREATE POLICY "platform_settings public read"
  ON public.platform_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "platform_settings super_admin write" ON public.platform_settings;
CREATE POLICY "platform_settings super_admin write"
  ON public.platform_settings FOR ALL
  USING ('super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK ('super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
