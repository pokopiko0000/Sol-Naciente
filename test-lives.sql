-- 2025年7月のテスト用ライブデータ
-- 口火ライブ（11組定員）
INSERT INTO "Live" (id, date, type, capacity, "createdAt", "updatedAt") VALUES 
  (gen_random_uuid(), '2025-07-03 20:00:00', 'KUCHIBE', 11, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-05 20:00:00', 'KUCHIBE', 11, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-08 20:00:00', 'KUCHIBE', 11, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-10 20:00:00', 'KUCHIBE', 11, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-12 20:00:00', 'KUCHIBE', 11, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-15 20:00:00', 'KUCHIBE', 11, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-17 20:00:00', 'KUCHIBE', 11, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-19 20:00:00', 'KUCHIBE', 11, NOW(), NOW());

-- 二足のわらじライブ（16組定員）  
INSERT INTO "Live" (id, date, type, capacity, "createdAt", "updatedAt") VALUES 
  (gen_random_uuid(), '2025-07-06 19:00:00', 'NIWARA', 16, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-13 19:00:00', 'NIWARA', 16, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-20 19:00:00', 'NIWARA', 16, NOW(), NOW()),
  (gen_random_uuid(), '2025-07-27 19:00:00', 'NIWARA', 16, NOW(), NOW());