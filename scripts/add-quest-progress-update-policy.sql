-- Додати політику RLS для UPDATE на quest_progress (потрібно для upsert при повторній позначці питання).
-- Виконати в Supabase Dashboard → SQL Editor.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'quest_progress' AND policyname = 'Anyone can update progress'
  ) THEN
    CREATE POLICY "Anyone can update progress" ON quest_progress
    FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;
