-- =====================================================================
-- UniPath Multi-Tenant: business_type column
-- Run this in: Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Add business_type column to tenants table
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'consulting';

-- 2. Add comment for clarity
COMMENT ON COLUMN tenants.business_type IS
  'Business vertical: consulting | academy | tour | hotel | restaurant | clinic | gym | manufacturing | parking | auto_service | wholesale | wedding_hall | kindergarten | library | cosmetics | stadium | pharmacy';

-- 3. Create index for fast vertical-based queries
CREATE INDEX IF NOT EXISTS idx_tenants_business_type ON tenants(business_type);

-- =====================================================================
-- IMPORTANT: After running the above, update your existing tenants!
-- Replace the subdomain values below with your actual subdomain names.
-- =====================================================================

-- Set NOVA tenants to 'academy'
-- UPDATE tenants SET business_type = 'academy'
--   WHERE subdomain IN ('nova', 'novaios', 'your-nova-subdomain');

-- Set UniTour tenants to 'tour'
-- UPDATE tenants SET business_type = 'tour'
--   WHERE subdomain IN ('unitour', 'your-unitour-subdomain');

-- Set Hotel tenants
-- UPDATE tenants SET business_type = 'hotel'
--   WHERE subdomain IN ('your-hotel-subdomain');

-- =====================================================================
-- VERIFY: Check all tenants and their business types
-- =====================================================================
-- SELECT id, name, subdomain, business_type FROM tenants ORDER BY business_type, name;
