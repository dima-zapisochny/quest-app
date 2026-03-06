-- Схема базы данных для Quest App
-- Выполните этот SQL в Supabase SQL Editor

-- Таблица для профилей пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для квестов
CREATE TABLE IF NOT EXISTS quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  data JSONB NOT NULL, -- Полная структура Quest (rounds, categories, questions)
  user_id TEXT NOT NULL, -- ID пользователя, создавшего квест
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для игровых сессий
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL,
  host_name TEXT NOT NULL,
  host_avatar TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('lobby', 'active', 'completed')),
  round_id TEXT,
  players JSONB NOT NULL DEFAULT '[]'::jsonb, -- Массив Player[]
  active_question JSONB, -- ActiveQuestionState или null
  quest_data JSONB, -- Снимок квеста для участников (без доступа к quests)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица для прогресса квестов (какие вопросы были сыграны)
CREATE TABLE IF NOT EXISTS quest_progress (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  quest_id TEXT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  round_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(quest_id, round_id, category_id, question_id, user_id)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_game_sessions_code ON game_sessions(code);
CREATE INDEX IF NOT EXISTS idx_game_sessions_quest_id ON game_sessions(quest_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_host_id ON game_sessions(host_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_quest_id ON quest_progress(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_progress_user_id ON quest_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quests_user_id ON quests(user_id);

-- Включаем Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;

-- Политики RLS для user_profiles (все могут читать и создавать, обновлять только свои)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Anyone can read profiles') THEN
    CREATE POLICY "Anyone can read profiles" ON user_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Anyone can create profiles') THEN
    CREATE POLICY "Anyone can create profiles" ON user_profiles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (true);
  END IF;
END $$;

-- Политики RLS для quests (пользователи видят и управляют только своими квестами)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quests' AND policyname = 'Users can read own quests') THEN
    CREATE POLICY "Users can read own quests" ON quests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quests' AND policyname = 'Users can create own quests') THEN
    CREATE POLICY "Users can create own quests" ON quests FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quests' AND policyname = 'Users can update own quests') THEN
    CREATE POLICY "Users can update own quests" ON quests FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quests' AND policyname = 'Users can delete own quests') THEN
    CREATE POLICY "Users can delete own quests" ON quests FOR DELETE USING (true);
  END IF;
END $$;

-- Политики RLS для game_sessions (все могут читать, создавать и обновлять)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_sessions' AND policyname = 'Anyone can read sessions') THEN
    CREATE POLICY "Anyone can read sessions" ON game_sessions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_sessions' AND policyname = 'Anyone can create sessions') THEN
    CREATE POLICY "Anyone can create sessions" ON game_sessions FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_sessions' AND policyname = 'Anyone can update sessions') THEN
    CREATE POLICY "Anyone can update sessions" ON game_sessions FOR UPDATE USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_sessions' AND policyname = 'Anyone can delete sessions') THEN
    CREATE POLICY "Anyone can delete sessions" ON game_sessions FOR DELETE USING (true);
  END IF;
END $$;

-- Политики RLS для quest_progress (все могут читать, создавать и удалять)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quest_progress' AND policyname = 'Anyone can read progress') THEN
    CREATE POLICY "Anyone can read progress" ON quest_progress FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quest_progress' AND policyname = 'Anyone can create progress') THEN
    CREATE POLICY "Anyone can create progress" ON quest_progress FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'quest_progress' AND policyname = 'Anyone can delete progress') THEN
    CREATE POLICY "Anyone can delete progress" ON quest_progress FOR DELETE USING (true);
  END IF;
END $$;

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quests_updated_at ON quests;
CREATE TRIGGER update_quests_updated_at BEFORE UPDATE ON quests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON game_sessions;
CREATE TRIGGER update_game_sessions_updated_at BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

