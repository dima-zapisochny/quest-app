-- Включение Real-time (WebSocket) для таблицы game_sessions в Supabase
-- Выполните этот SQL в Supabase SQL Editor

-- ВАЖНО: Real-time должен быть включен для работы автоматических обновлений!

-- Способ 1: Через SQL (если есть права)
DO $$
BEGIN
  -- Пытаемся добавить таблицу в публикацию
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
    RAISE NOTICE '✅ Таблица game_sessions добавлена в real-time публикацию';
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'ℹ️ Таблица game_sessions уже в real-time публикации';
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Не удалось добавить через SQL. Используйте Dashboard метод.';
  END;
END $$;

-- Проверяем, что публикация включена
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND tablename = 'game_sessions'
    ) THEN '✅ Real-time включен для game_sessions'
    ELSE '❌ Real-time НЕ включен для game_sessions'
  END as realtime_status;

-- Способ 2: Через Supabase Dashboard (РЕКОМЕНДУЕТСЯ)
-- 1. Откройте Supabase Dashboard
-- 2. Перейдите в Database -> Replication
-- 3. Найдите таблицу "game_sessions"
-- 4. Включите переключатель "Enable Realtime" для этой таблицы
-- 5. Сохраните изменения

