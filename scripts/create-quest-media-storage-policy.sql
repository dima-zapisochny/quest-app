-- Політики для bucket quest-media (усуває 403 "new row violates row-level security policy").
-- 1) Створіть bucket в Dashboard: Storage → New bucket → ім'я "quest-media", увімкніть Public.
-- 2) Виконайте цей SQL в Supabase Dashboard → SQL Editor.
-- Якщо політики вже є і все одно 403 — у Dashboard → Storage → quest-media → Policies
-- перевірте, що немає політик, які забороняють доступ, і що ці три політики існують.

-- INSERT: дозволити завантаження в quest-media (без TO — для будь-якої ролі, зокрема anon)
DROP POLICY IF EXISTS "Allow anon upload to quest-media" ON storage.objects;
CREATE POLICY "Allow anon upload to quest-media" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'quest-media');

-- UPDATE: для upsert (перезапис існуючого файлу)
DROP POLICY IF EXISTS "Allow anon update quest-media" ON storage.objects;
CREATE POLICY "Allow anon update quest-media" ON storage.objects
FOR UPDATE USING (bucket_id = 'quest-media') WITH CHECK (bucket_id = 'quest-media');

-- SELECT: публічне читання (getPublicUrl)
DROP POLICY IF EXISTS "Allow public read quest-media" ON storage.objects;
CREATE POLICY "Allow public read quest-media" ON storage.objects
FOR SELECT USING (bucket_id = 'quest-media');
