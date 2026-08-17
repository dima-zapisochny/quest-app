-- ============================================================================
-- 003_secure_rls.sql — Закрытие открытых RLS-политик (находка аудита №1)
-- ============================================================================
--
-- ПРОБЛЕМА (подтверждена на проде quizzes.website):
--   Все политики созданы через USING (true). Анонимный ключ, лежащий в бандле,
--   без авторизации читает ВСЕ строки всех пользователей:
--     70 профилей, 15 чужих квестов, 7 сессий, 239 записей прогресса.
--   По коду приложения он же может их изменить и удалить.
--
-- КОРЕНЬ ПРИЧИНЫ:
--   Приложение не использует Supabase Auth (persistSession: false), user_id —
--   это строка, сгенерированная на клиенте в localStorage. У БД нет доверенной
--   личности (auth.uid()), поэтому RLS физически нечем фильтровать «свои» строки.
--   Пока личности нет — переписать названия политик недостаточно, дыра остаётся.
--
-- ⚠️  ВАЖНО ПЕРЕД ПРИМЕНЕНИЕМ:
--   1. Этот файл — ПЛАН, а не готовый к слепому запуску на проде скрипт.
--      Он требует согласованных изменений в клиенте (см. раздел «CLIENT CHANGES»).
--   2. Применение политик БЕЗ изменений клиента СЛОМАЕТ живую игру у текущих
--      пользователей. Сначала прогоните на отдельном staging-проекте Supabase.
--   3. У 70 существующих пользователей user_id — это 'player-xxx' (не uuid).
--      Переход на auth.uid() требует миграции этих данных (см. ниже).
--
-- ============================================================================
-- РЕКОМЕНДУЕМОЕ РЕШЕНИЕ: Анонимная авторизация Supabase (даёт auth.uid())
-- ============================================================================
--
-- Шаг 0 (Dashboard, вручную):
--   Authentication → Providers → включить «Anonymous sign-ins».
--
-- CLIENT CHANGES (нужны вместе с этой миграцией):
--   • src/config/supabase.ts: persistSession: true.
--   • При старте приложения:
--       const { data } = await supabase.auth.getSession()
--       if (!data.session) await supabase.auth.signInAnonymously()
--     Полученный auth uid использовать как id профиля вместо generateId('player').
--   • Все вставки (quests.user_id, game_sessions.host_id, quest_progress.user_id)
--     должны писать auth.uid(), а не строку из localStorage.
--   • Существующие 70 пользователей потеряют привязку к своим квестам, если не
--     сделать миграцию user_id → uuid. Вариант: разовый маппинг старого
--     'player-xxx' на новый auth uid при первом входе (сохранить старый id в
--     user_metadata и переписать user_id в quests/quest_progress).
--
-- ----------------------------------------------------------------------------
-- ПОЛИТИКИ ПОСЛЕ ВКЛЮЧЕНИЯ АНОНИМНОЙ АВТОРИЗАЦИИ
-- (запускать ТОЛЬКО после client changes + миграции user_id, на staging)
-- ----------------------------------------------------------------------------

-- Предполагается: quests.user_id, game_sessions.host_id, quest_progress.user_id
-- имеют тип, совместимый с auth.uid() (uuid или его text-представление).
-- Ниже примеры сравнивают как text, чтобы не зависеть от точного типа колонки.

-- ВАЖНО: точечный DROP POLICY IF EXISTS "<имя>" ненадёжен — реальные имена в БД
-- могут отличаться (в этом проекте оказались "Anyone can read/update/delete quests"
-- с USING(true), а не "Users can read own quests"). Одна забытая дозволяющая
-- политика через OR сводит на нет владельческую. Поэтому сносим ВСЕ политики на
-- каждой таблице динамически, затем создаём нужные.

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('user_profiles','quests','game_sessions','quest_progress')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- --- user_profiles ---------------------------------------------------------
-- Профили нужны участникам, чтобы видеть имена/аватары соперников в сессии,
-- поэтому чтение оставляем публичным (в них нет чувствительных данных).
-- Менять/создавать — только свой профиль.
CREATE POLICY "read profiles"       ON user_profiles FOR SELECT USING (true);
CREATE POLICY "insert own profile"  ON user_profiles FOR INSERT WITH CHECK (id = auth.uid()::text);
CREATE POLICY "update own profile"  ON user_profiles FOR UPDATE USING (id = auth.uid()::text);

-- --- quests ----------------------------------------------------------------
-- Владелец видит и правит только свои квесты. Участникам квест приходит СНИМКОМ
-- в game_sessions.quest_data — прямой доступ к чужой таблице quests им не нужен.
CREATE POLICY "owner read quests"   ON quests FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "owner insert quests" ON quests FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "owner update quests" ON quests FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "owner delete quests" ON quests FOR DELETE USING (user_id = auth.uid()::text);

-- --- game_sessions ---------------------------------------------------------
-- Присоединение по коду требует чтения сессии не-хостом, поэтому SELECT открыт.
-- Создаёт/удаляет сессию только её хост.
CREATE POLICY "read sessions"       ON game_sessions FOR SELECT USING (true);
CREATE POLICY "host insert session" ON game_sessions FOR INSERT WITH CHECK (host_id = auth.uid()::text);
CREATE POLICY "host delete session" ON game_sessions FOR DELETE USING (host_id = auth.uid()::text);
-- UPDATE нужен и хосту, и игрокам (баззер, вход, счёт) → оставляем открытым.
-- Правильный путь дальше (находка №17) — перенести все мутации сессии в RPC
-- (SECURITY DEFINER, как try_buzz / join_session / award_points) и закрыть прямой UPDATE.
CREATE POLICY "update sessions"     ON game_sessions FOR UPDATE USING (true);

-- --- quest_progress --------------------------------------------------------
CREATE POLICY "owner read progress"   ON quest_progress FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "owner insert progress" ON quest_progress FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "owner update progress" ON quest_progress FOR UPDATE USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "owner delete progress" ON quest_progress FOR DELETE USING (user_id = auth.uid()::text);

-- ============================================================================
-- ПРОВЕРЕНО НА ПРОДЕ (17 авг 2026): аноним без входа больше не читает quests
-- (было 15 → стало 0) и quest_progress (239 → 0); свежий анонимный пользователь
-- видит только свои квесты. user_profiles и game_sessions оставлены открытыми
-- на чтение осознанно (см. комментарии выше).
-- Список текущих политик:
--   select tablename, policyname, cmd, qual, with_check
--   from pg_policies where schemaname='public' order by tablename, cmd;
-- ============================================================================
