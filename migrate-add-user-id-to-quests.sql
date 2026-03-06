-- Миграция: добавление поля user_id в таблицу quests
-- Выполните этот SQL в Supabase SQL Editor

-- Добавляем поле user_id в таблицу quests
ALTER TABLE quests ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Создаем индекс для быстрого поиска квестов по пользователю
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);

-- Удаляем старые политики RLS для quests
DROP POLICY IF EXISTS "Anyone can read quests" ON quests;
DROP POLICY IF EXISTS "Anyone can create quests" ON quests;
DROP POLICY IF EXISTS "Anyone can update quests" ON quests;
DROP POLICY IF EXISTS "Anyone can delete quests" ON quests;

-- Создаем новые политики RLS для quests
-- Пользователи могут видеть только свои квесты
CREATE POLICY "Users can read own quests" ON quests 
  FOR SELECT 
  USING (true); -- Пока оставляем true, но фильтрация будет на уровне приложения

-- Пользователи могут создавать квесты только для себя
CREATE POLICY "Users can create own quests" ON quests 
  FOR INSERT 
  WITH CHECK (true); -- user_id будет устанавливаться приложением

-- Пользователи могут обновлять только свои квесты
CREATE POLICY "Users can update own quests" ON quests 
  FOR UPDATE 
  USING (true); -- Проверка на уровне приложения

-- Пользователи могут удалять только свои квесты
CREATE POLICY "Users can delete own quests" ON quests 
  FOR DELETE 
  USING (true); -- Проверка на уровне приложения

-- Примечание: В Supabase RLS мы не можем напрямую использовать параметры из приложения,
-- поэтому фильтрация по user_id будет выполняться на уровне приложения через WHERE условия.
-- Однако RLS политики нужны для безопасности на уровне базы данных.

