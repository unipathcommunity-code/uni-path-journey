-- =====================================================================
-- UniPath NOVA: Websites, Website Blocks, and Website Pages Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Ensure schema exists
CREATE SCHEMA IF NOT EXISTS nova;

-- 2. Create Websites Table
CREATE TABLE IF NOT EXISTS nova.websites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    theme TEXT DEFAULT 'aurora',
    primary_color TEXT,
    accent_color TEXT,
    meta_description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    custom_domain TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Website Blocks Table
CREATE TABLE IF NOT EXISTS nova.website_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES nova.websites(id) ON DELETE CASCADE,
    block_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    position INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Website Pages Table
CREATE TABLE IF NOT EXISTS nova.website_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    website_id UUID NOT NULL REFERENCES nova.websites(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    page_type TEXT DEFAULT 'custom',
    payload JSONB DEFAULT '{}'::jsonb,
    is_visible BOOLEAN DEFAULT TRUE,
    show_in_nav BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(website_id, slug)
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE nova.websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova.website_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE nova.website_pages ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Websites
DROP POLICY IF EXISTS "Websites select policy" ON nova.websites;
CREATE POLICY "Websites select policy" ON nova.websites FOR SELECT
USING (
  is_published = true
  OR
  organization_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  OR
  'super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Websites insert policy" ON nova.websites;
CREATE POLICY "Websites insert policy" ON nova.websites FOR INSERT
WITH CHECK (
  organization_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  AND
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'owner', 'super_admin')
);

DROP POLICY IF EXISTS "Websites update policy" ON nova.websites;
CREATE POLICY "Websites update policy" ON nova.websites FOR UPDATE
USING (
  organization_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  AND
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'owner', 'super_admin')
);

DROP POLICY IF EXISTS "Websites delete policy" ON nova.websites;
CREATE POLICY "Websites delete policy" ON nova.websites FOR DELETE
USING (
  organization_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  AND
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'owner', 'super_admin')
);

-- 7. RLS Policies for Website Blocks
DROP POLICY IF EXISTS "Blocks select policy" ON nova.website_blocks;
CREATE POLICY "Blocks select policy" ON nova.website_blocks FOR SELECT
USING (
  (SELECT is_published FROM nova.websites WHERE id = website_id) = true
  OR
  (SELECT organization_id FROM nova.websites WHERE id = website_id) = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  OR
  'super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Blocks manage policy" ON nova.website_blocks;
CREATE POLICY "Blocks manage policy" ON nova.website_blocks FOR ALL
USING (
  (SELECT organization_id FROM nova.websites WHERE id = website_id) = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  AND
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'owner', 'super_admin')
);

-- 8. RLS Policies for Website Pages
DROP POLICY IF EXISTS "Pages select policy" ON nova.website_pages;
CREATE POLICY "Pages select policy" ON nova.website_pages FOR SELECT
USING (
  (is_visible = true AND (SELECT is_published FROM nova.websites WHERE id = website_id) = true)
  OR
  (SELECT organization_id FROM nova.websites WHERE id = website_id) = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  OR
  'super_admin' = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Pages manage policy" ON nova.website_pages;
CREATE POLICY "Pages manage policy" ON nova.website_pages FOR ALL
USING (
  (SELECT organization_id FROM nova.websites WHERE id = website_id) = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
  AND
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'owner', 'super_admin')
);

-- 9. RPC Functions for Public Site Resolution
CREATE OR REPLACE FUNCTION public.site_branding_by_slug(_slug TEXT)
RETURNS TABLE (
    org_name TEXT,
    org_logo_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.name AS org_name,
        t.config->'branding'->>'logo_url' AS org_logo_url
    FROM public.tenants t
    WHERE t.subdomain = _slug OR t.custom_domain = _slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.site_pages_by_slug(_slug TEXT)
RETURNS TABLE (
    page_id UUID,
    page_slug TEXT,
    page_title TEXT,
    show_in_nav BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        wp.id AS page_id,
        wp.slug AS page_slug,
        wp.title AS page_title,
        wp.show_in_nav AS show_in_nav
    FROM nova.website_pages wp
    JOIN nova.websites w ON w.id = wp.website_id
    WHERE w.slug = _slug;
END;
$$;

-- 10. Reload PostgREST Cache
NOTIFY pgrst, 'reload schema';
