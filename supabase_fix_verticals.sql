-- ============================================================
-- UniPath: Vertikal tuzatish migratsiyasi
-- Muammo: config.modules.tour mavjud emas edi ba'zi tenantlarda
--         va vertical ustuni bo'sh qolgan edi
-- ============================================================

-- 1. config.business_type asosida modules ni to'g'rilab qo'yish
-- (har bir tenant o'zining business turiga mos module ni oladi)
UPDATE tenants
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{modules}',
  jsonb_build_object(
    config->>'business_type', true,
    'billing', true
  )
)
WHERE config->>'business_type' IS NOT NULL
  AND (config->'modules' IS NULL OR config->'modules' = '{}'::jsonb OR config->'modules' = 'null'::jsonb);

-- 2. Agar vertical ustun mavjud bo'lsa — config.business_type dan to'ldirish
-- (Agar ustun yo'q bo'lsa bu qator xatolik beradi — shunda skip qiling)
UPDATE tenants
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{business_type}',
  to_jsonb(COALESCE(config->>'business_type', 'consulting'))
)
WHERE config->>'business_type' IS NULL;

-- 3. Tour tenantlar uchun modules.tour = true bo'lishini ta'minlash
UPDATE tenants
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{modules,tour}',
  'true'::jsonb
)
WHERE config->>'business_type' = 'tour'
  AND (config->'modules'->>'tour' IS NULL OR config->'modules'->>'tour' = 'false');

-- 4. Academy tenantlar uchun modules.academy = true
UPDATE tenants
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{modules,academy}',
  'true'::jsonb
)
WHERE config->>'business_type' = 'academy'
  AND (config->'modules'->>'academy' IS NULL OR config->'modules'->>'academy' = 'false');

-- 5. Consulting tenantlar uchun modules.consulting = true
UPDATE tenants
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{modules,consulting}',
  'true'::jsonb
)
WHERE config->>'business_type' = 'consulting'
  AND (config->'modules'->>'consulting' IS NULL OR config->'modules'->>'consulting' = 'false');

-- Tekshirish: barcha tenantlar va ularning vertikallari
SELECT
  name,
  subdomain,
  config->>'business_type' AS business_type,
  config->'modules' AS modules
FROM tenants
ORDER BY created_at DESC;
