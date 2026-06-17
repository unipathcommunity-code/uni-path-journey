-- ============================================================
-- Create public.organizations view and add plan_id mapping
-- ============================================================

-- Helper function to drop relation (table/view/mview) safely without type conflicts
CREATE OR REPLACE FUNCTION public.safe_drop_relation(p_schema TEXT, p_relation TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_relkind CHAR;
BEGIN
  SELECT c.relkind INTO v_relkind
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = p_schema AND c.relname = p_relation;

  IF v_relkind IS NULL THEN
    RETURN;
  END IF;

  IF v_relkind = 'r' THEN
    EXECUTE format('DROP TABLE %I.%I CASCADE', p_schema, p_relation);
  ELSIF v_relkind = 'v' THEN
    EXECUTE format('DROP VIEW %I.%I CASCADE', p_schema, p_relation);
  ELSIF v_relkind = 'm' THEN
    EXECUTE format('DROP MATERIALIZED VIEW %I.%I CASCADE', p_schema, p_relation);
  ELSE
    EXECUTE format('DROP TABLE IF EXISTS %I.%I CASCADE', p_schema, p_relation);
  END IF;
END;
$$;

-- Run safe drops
SELECT public.safe_drop_relation('public', 'organizations');
SELECT public.safe_drop_relation('nova', 'organizations');

-- Create view in public schema
CREATE OR REPLACE VIEW public.organizations AS
SELECT 
  id,
  name,
  subdomain AS slug,
  COALESCE(config->>'business_type', 'center') AS org_type,
  status,
  plan AS billing_tier,
  plan AS plan_id,
  config->'branding'->>'logo_url' AS logo_url,
  COALESCE(config->'branding'->>'theme_color', 'emerald') AS primary_color,
  COALESCE(config->'branding'->>'accent_color', 'indigo') AS accent_color,
  owner_email AS contact_email,
  owner_phone AS contact_phone,
  config->'settings'->>'city' AS city,
  config->'settings'->>'notes' AS notes,
  COALESCE(config->'features', '{}'::jsonb) AS features,
  (config->'settings'->>'monthly_price')::numeric AS monthly_price,
  COALESCE(config->'settings'->>'currency', 'UZS') AS currency,
  (config->'settings'->>'max_students')::integer AS max_students,
  config->'settings'->>'trial_ends_at' AS trial_ends_at,
  created_at
FROM public.tenants;

-- Create view in nova schema
CREATE OR REPLACE VIEW nova.organizations AS
SELECT * FROM public.organizations;

-- Clean up helper function
DROP FUNCTION IF EXISTS public.safe_drop_relation(TEXT, TEXT);
