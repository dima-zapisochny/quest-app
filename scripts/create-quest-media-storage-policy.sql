-- Політики для bucket quest-media: дозвіл на завантаження для anon.
-- 1) Створіть bucket в Dashboard: Storage → New bucket → ім'я "quest-media", увімкніть Public.
-- 2) Виконайте цей SQL в Supabase Dashboard → SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow anon upload to quest-media'
  ) THEN
    EXECUTE 'CREATE POLICY "Allow anon upload to quest-media" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = ''quest-media'')';
  END IF;
END $$;
