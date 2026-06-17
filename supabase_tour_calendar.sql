-- ============================================================
-- UniPath: Tour Calendar Migration
-- Adds departure_date column to tour_packages table
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add departure_date column if it doesn't exist
ALTER TABLE tour_packages
ADD COLUMN IF NOT EXISTS departure_date DATE;

-- 2. Add guide_name column if missing
ALTER TABLE tour_packages
ADD COLUMN IF NOT EXISTS guide_name TEXT;

-- 3. Add itinerary JSONB column if missing
ALTER TABLE tour_packages
ADD COLUMN IF NOT EXISTS itinerary JSONB DEFAULT '[]'::jsonb;

-- 4. Index for fast calendar queries (tenant + month)
CREATE INDEX IF NOT EXISTS idx_tour_packages_departure
  ON tour_packages(tenant_id, departure_date);

-- 5. Verify
SELECT
  id,
  name,
  tenant_id,
  departure_date,
  guide_name,
  duration_days
FROM tour_packages
ORDER BY departure_date ASC NULLS LAST
LIMIT 20;
