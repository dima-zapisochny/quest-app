-- ============================================================================
-- 005_anon_auth_claim.sql — Одноразовая привязка старых данных к auth.uid()
-- Часть перехода на анонимную авторизацию Supabase (закрытие RLS, находка №1).
--
-- ⚠️  ТОЛЬКО ДЛЯ STAGING на первом этапе. Порядок применения:
--   1. Dashboard → Authentication → Providers → включить Anonymous sign-ins.
--   2. Задеплоить клиент из ветки feat/anon-auth-rls (persistSession + signInAnonymously).
--   3. Применить ЭТУ миграцию (claim_user_data).
--   4. Проверить на staging, что старые квесты/прогресс «переезжают» на новый uid.
--   5. Только потом — 003_secure_rls.sql (закрытие политик).
-- ============================================================================

-- Переносит данные, ранее привязанные к клиентскому id (player-xxx),
-- на текущего анонимно авторизованного пользователя (auth.uid()).
-- SECURITY DEFINER: выполняется с правами владельца, поэтому работает
-- даже после закрытия RLS (пользователь клеймит СВОЙ старый id один раз).
CREATE OR REPLACE FUNCTION claim_user_data(p_old_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid text := auth.uid()::text;
BEGIN
  IF uid IS NULL OR p_old_id IS NULL OR p_old_id = uid THEN
    RETURN;
  END IF;

  -- Квесты и прогресс — ключевые данные владельца
  UPDATE quests         SET user_id = uid WHERE user_id = p_old_id;
  UPDATE quest_progress SET user_id = uid WHERE user_id = p_old_id;

  -- Сессии, где старый id был хостом (иначе checkActiveHostSession их не увидит)
  UPDATE game_sessions  SET host_id = uid WHERE host_id = p_old_id;

  -- Профиль: переносим id, только если для uid профиля ещё нет (id — PK)
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = uid) THEN
    UPDATE user_profiles SET id = uid WHERE id = p_old_id;
  END IF;

  -- ПРИМЕЧАНИЕ: записи игроков внутри game_sessions.players[] (jsonb) и
  -- активная сессия игрока в localStorage используют старый id. Для игрока
  -- (не хоста) это некритично — при следующем входе он добавится под новым uid.
  -- При необходимости полной перепривязки jsonb-массивов — доработать отдельно.
END;
$$;

GRANT EXECUTE ON FUNCTION claim_user_data(text) TO anon, authenticated;
