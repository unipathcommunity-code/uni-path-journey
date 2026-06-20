-- =====================================================================
-- supabase_contact_requests_align.sql
-- Author: Claude · Run by: Antigravity / human in Supabase SQL Editor
--
-- WHY: The app writes contact_requests with the shape
--   { tenant_id, name, phone, message, source, status }
-- (see TenantPublicPage public form, admin/UpgradeGate, and the new landing
--  DemoRequestDialog). But the original table (migration 20260512160913) was
-- created with { full_name NOT NULL, source_page NOT NULL, ... } and NO
-- tenant_id / name / source columns. That drift means those inserts can fail
-- (missing column) or violate NOT NULL — and TenantPublicPage swallows the
-- error silently, so leads/demo requests were being lost.
--
-- This migration is IDEMPOTENT, ADDITIVE and NON-DESTRUCTIVE: it only adds
-- missing columns, relaxes legacy NOT NULLs, backfills across the old/new
-- column names, and guarantees the public (anon) INSERT policy. It drops no
-- columns and deletes no data.
-- =====================================================================

-- 1) Ensure the columns the app actually uses exist.
ALTER TABLE public.contact_requests
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS name      TEXT,
  ADD COLUMN IF NOT EXISTS source    TEXT;

-- 2) Relax legacy NOT NULLs so the new insert shape never violates them.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_requests'
      AND column_name = 'full_name' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.contact_requests ALTER COLUMN full_name DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'contact_requests'
      AND column_name = 'source_page' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.contact_requests ALTER COLUMN source_page DROP NOT NULL;
  END IF;
END $$;

-- 3) Keep old & new column names in sync so BOTH admin views work
--    (AdminContactRequests reads full_name/source_page; AdminNotificationCenter
--     reads name/source). Backfill only where one side is null.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='contact_requests' AND column_name='full_name') THEN
    UPDATE public.contact_requests SET name = full_name        WHERE name IS NULL AND full_name IS NOT NULL;
    UPDATE public.contact_requests SET full_name = name        WHERE full_name IS NULL AND name IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='contact_requests' AND column_name='source_page') THEN
    UPDATE public.contact_requests SET source = source_page    WHERE source IS NULL AND source_page IS NOT NULL;
    UPDATE public.contact_requests SET source_page = source    WHERE source_page IS NULL AND source IS NOT NULL;
  END IF;
END $$;

-- 4) Guarantee RLS + a public (anon) INSERT policy so the landing
--    demo-request form and tenant public contact forms can submit.
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create contact requests" ON public.contact_requests;
CREATE POLICY "Anyone can create contact requests"
  ON public.contact_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Helpful index for the source filter used by admin/notification views.
CREATE INDEX IF NOT EXISTS idx_contact_requests_source ON public.contact_requests (source);
