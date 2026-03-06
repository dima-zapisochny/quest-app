-- Квест сохраняется индивидуально для пользователя (таблица quests по user_id).
-- Участники получают данные квеста только через сессию по коду (quest_data).
ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS quest_data JSONB;

COMMENT ON COLUMN game_sessions.quest_data IS 'Снимок квеста на момент создания сессии; участники получают его по коду без доступа к таблице quests';
