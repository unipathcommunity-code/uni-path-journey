-- ============================================================
-- UniPath Migration: Add 'car_showroom' to business_vertical enum
-- Run this in the Supabase Dashboard SQL Editor
-- ============================================================

-- 1. Add 'car_showroom' value to the business_vertical enum type
-- Supabase uses Postgres 15+, which supports IF NOT EXISTS for ADD VALUE
ALTER TYPE public.business_vertical ADD VALUE IF NOT EXISTS 'car_showroom';

-- 2. Notify PostgREST to reload its schema cache so it picks up the new value
NOTIFY pgrst, 'reload schema';

-- 3. Verify the values in the enum (optional)
-- SELECT enum_range(NULL::business_vertical);
