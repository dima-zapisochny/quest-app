-- ============================================================================
-- 004_atomic_game_rpc.sql — Атомарные RPC для игрового цикла
-- Устраняет read-modify-write гонки (находки аудита №7, №14, №12).
-- Модель — как в supabase-buzz-rpc.sql (try_buzz): SELECT ... FOR UPDATE → правка jsonb → UPDATE.
--
-- Выполнить один раз в Supabase SQL Editor. Клиент вызывает эти функции через supabase.rpc(...),
-- при отсутствии функции (не задеплоено) откатывается на старый путь updateSession.
-- ============================================================================

-- --- Вход в сессию: атомарно добавляет игрока (#7) ---------------------------
-- Если игрок с таким id уже есть — просто возвращает сессию (идемпотентно).
-- Если участников >= p_max — исключение (клиент покажет сообщение).
CREATE OR REPLACE FUNCTION join_session(p_session_id text, p_player jsonb, p_max int DEFAULT 20)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pl jsonb;
  pid text;
BEGIN
  SELECT players INTO pl FROM game_sessions WHERE id = p_session_id FOR UPDATE;
  IF pl IS NULL THEN
    RETURN; -- сессии нет
  END IF;

  pid := p_player->>'id';

  -- Уже в сессии — ничего не меняем
  IF EXISTS (SELECT 1 FROM jsonb_array_elements(pl) e WHERE e->>'id' = pid) THEN
    RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
    RETURN;
  END IF;

  IF jsonb_array_length(pl) >= p_max THEN
    RAISE EXCEPTION 'SESSION_FULL';
  END IF;

  UPDATE game_sessions
  SET players = pl || jsonb_build_array(p_player), updated_at = now()
  WHERE id = p_session_id;

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

-- --- Выход из сессии: атомарно удаляет игрока -------------------------------
CREATE OR REPLACE FUNCTION leave_session(p_session_id text, p_player_id text)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pl jsonb;
BEGIN
  SELECT players INTO pl FROM game_sessions WHERE id = p_session_id FOR UPDATE;
  IF pl IS NULL THEN RETURN; END IF;

  UPDATE game_sessions
  SET players = COALESCE((
        SELECT jsonb_agg(e) FROM jsonb_array_elements(pl) e WHERE e->>'id' <> p_player_id
      ), '[]'::jsonb),
      updated_at = now()
  WHERE id = p_session_id;

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

-- --- Начисление очков одному игроку (#14): score = score + p_delta ----------
CREATE OR REPLACE FUNCTION award_points(p_session_id text, p_player_id text, p_delta int)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pl jsonb;
BEGIN
  SELECT players INTO pl FROM game_sessions WHERE id = p_session_id FOR UPDATE;
  IF pl IS NULL THEN RETURN; END IF;

  UPDATE game_sessions
  SET players = (
        SELECT jsonb_agg(
          CASE WHEN e->>'id' = p_player_id
            THEN e || jsonb_build_object('score', GREATEST(0, COALESCE((e->>'score')::int, 0) + p_delta))
            ELSE e
          END)
        FROM jsonb_array_elements(pl) e
      ),
      updated_at = now()
  WHERE id = p_session_id;

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

-- --- Установка точного счёта одному игроку (ручная правка ведущим) ----------
CREATE OR REPLACE FUNCTION set_player_score(p_session_id text, p_player_id text, p_score int)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pl jsonb;
BEGIN
  SELECT players INTO pl FROM game_sessions WHERE id = p_session_id FOR UPDATE;
  IF pl IS NULL THEN RETURN; END IF;

  UPDATE game_sessions
  SET players = (
        SELECT jsonb_agg(
          CASE WHEN e->>'id' = p_player_id
            THEN e || jsonb_build_object('score', GREATEST(0, p_score))
            ELSE e
          END)
        FROM jsonb_array_elements(pl) e
      ),
      updated_at = now()
  WHERE id = p_session_id;

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

-- --- Сброс очков всех участников -------------------------------------------
CREATE OR REPLACE FUNCTION reset_scores(p_session_id text)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pl jsonb;
BEGIN
  SELECT players INTO pl FROM game_sessions WHERE id = p_session_id FOR UPDATE;
  IF pl IS NULL THEN RETURN; END IF;

  UPDATE game_sessions
  SET players = (
        SELECT jsonb_agg(e || jsonb_build_object('score', 0))
        FROM jsonb_array_elements(pl) e
      ),
      updated_at = now()
  WHERE id = p_session_id;

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

-- --- Таймаут отвечающего (#12): снимает право ответа, если он ещё текущий ----
-- Идемпотентно: если currentResponderId уже не p_player_id — ничего не делает.
CREATE OR REPLACE FUNCTION timeout_responder(p_session_id text, p_player_id text)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  aq jsonb;
  pl jsonb;
  new_aq jsonb;
  new_pl jsonb;
BEGIN
  SELECT active_question, players INTO aq, pl
  FROM game_sessions WHERE id = p_session_id FOR UPDATE;
  IF aq IS NULL THEN RETURN; END IF;

  -- Уже не этот отвечающий или ответ уже показан — no-op
  IF (aq->>'currentResponderId') IS DISTINCT FROM p_player_id
     OR COALESCE((aq->>'showAnswer')::boolean, false) THEN
    RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
    RETURN;
  END IF;

  new_aq := jsonb_set(
    jsonb_set(
      jsonb_set(aq, '{currentResponderId}', 'null'::jsonb),
      '{responderStartedAt}', 'null'::jsonb),
    '{timerPaused}', 'false'::jsonb);

  -- Провинившийся — locked; остальные не-locked → idle
  new_pl := (
    SELECT jsonb_agg(
      CASE WHEN e->>'id' = p_player_id
        THEN e || jsonb_build_object('status', 'locked')
        WHEN e->>'status' <> 'locked'
        THEN e || jsonb_build_object('status', 'idle')
        ELSE e
      END)
    FROM jsonb_array_elements(pl) e
  );

  UPDATE game_sessions
  SET active_question = new_aq, players = new_pl, updated_at = now()
  WHERE id = p_session_id;

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

-- --- Права на вызов от анонимного и аутентифицированного ролей ---------------
GRANT EXECUTE ON FUNCTION join_session(text, jsonb, int)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION leave_session(text, text)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION award_points(text, text, int)       TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_player_score(text, text, int)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_scores(text)                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION timeout_responder(text, text)       TO anon, authenticated;
