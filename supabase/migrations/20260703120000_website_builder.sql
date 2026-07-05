-- Migration: 20260703120000_website_builder.sql
-- Description: Website builder tables (`websites` + `website_blocks`) that the
--              WebsiteBuilder page expects. Their absence caused the runtime error
--              "Could not find the table 'public.websites' in the schema cache".
-- Idempotent: IF NOT EXISTS / DROP POLICY IF EXISTS — safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────────
-- websites — one brandable public site per tenant (organization_id = tenant id)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.websites (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  slug             text,
  title            text,
  tagline          text,
  theme            jsonb NOT NULL DEFAULT '{}'::jsonb,
  meta_description text,
  is_published     boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
-- Guard columns in case a partial table already exists
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS theme jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS meta_description text;
ALTER TABLE public.websites ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_websites_org ON public.websites(organization_id);
CREATE INDEX IF NOT EXISTS idx_websites_slug ON public.websites(slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- website_blocks — ordered content blocks (hero/contact/features live in payload)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.website_blocks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id  uuid NOT NULL REFERENCES public.websites(id) ON DELETE CASCADE,
  block_type  text NOT NULL DEFAULT 'content',
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_website_blocks_site ON public.website_blocks(website_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.websites       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_blocks ENABLE ROW LEVEL SECURITY;

-- websites: published sites are world-readable (public site rendering); staff manage.
DROP POLICY IF EXISTS "websites_public_select" ON public.websites;
CREATE POLICY "websites_public_select" ON public.websites
  FOR SELECT USING (is_published = true);
DROP POLICY IF EXISTS "websites_staff_all" ON public.websites;
CREATE POLICY "websites_staff_all" ON public.websites
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));

-- website_blocks: readable when the parent site is published; staff manage.
DROP POLICY IF EXISTS "website_blocks_public_select" ON public.website_blocks;
CREATE POLICY "website_blocks_public_select" ON public.website_blocks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.websites w WHERE w.id = website_blocks.website_id AND w.is_published = true)
  );
DROP POLICY IF EXISTS "website_blocks_staff_all" ON public.website_blocks;
CREATE POLICY "website_blocks_staff_all" ON public.website_blocks
  FOR ALL USING (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'))
  WITH CHECK (get_auth_user_role() IN ('admin','owner','manager','super_admin','accountant','agent','specialist'));
