-- Удаление всех квестов из базы данных
-- ВНИМАНИЕ: Этот скрипт удалит ВСЕ квесты, игровые сессии и прогресс!
-- Выполните этот SQL в Supabase SQL Editor

-- Сначала удаляем все игровые сессии (они связаны с квестами через внешний ключ)
DELETE FROM game_sessions;

-- Удаляем весь прогресс квестов
DELETE FROM quest_progress;

-- Удаляем все квесты
DELETE FROM quests;

-- Проверяем результат
SELECT COUNT(*) as remaining_quests FROM quests;
SELECT COUNT(*) as remaining_sessions FROM game_sessions;
SELECT COUNT(*) as remaining_progress FROM quest_progress;


