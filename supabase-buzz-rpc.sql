-- Атомарный «первый нажал — получил право ответа» для кнопки «Ответить».
-- Используется client_timestamp: кто нажал раньше по своему времени, тот и отвечает (устраняет гонку из-за порядка прихода запросов на сервер).
-- Выполните в Supabase SQL Editor один раз.

CREATE OR REPLACE FUNCTION try_buzz(p_session_id text, p_player_id text, p_client_ts bigint DEFAULT NULL)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  aq jsonb;
  new_aq jsonb;
  pl jsonb;
  new_pl jsonb;
  cur_responder text;
  cur_ts bigint;
  server_ts bigint;
BEGIN
  SELECT active_question, players INTO aq, pl
  FROM game_sessions WHERE id = p_session_id FOR UPDATE;

  IF aq IS NULL THEN
    RETURN;
  END IF;

  -- Уже нажимал — не меняем
  IF COALESCE(aq->'buzzedOrder', '[]'::jsonb) ? p_player_id THEN
    RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
    RETURN;
  END IF;

  server_ts := (round(extract(epoch from now()) * 1000))::bigint;

  IF (aq->>'currentResponderId') IS NULL THEN
    -- Пока никого нет — этот игрок становится отвечающим
    new_aq := jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(aq,
              '{currentResponderId}', to_jsonb(p_player_id)),
              '{timerPaused}', 'true'::jsonb),
              '{responderStartedAt}', to_jsonb(server_ts)),
            '{responderClientTs}', to_jsonb(COALESCE(p_client_ts, server_ts))),
      '{buzzedOrder}', COALESCE(aq->'buzzedOrder', '[]'::jsonb) || to_jsonb(ARRAY[p_player_id]));
    new_pl := (
      SELECT jsonb_agg(
        CASE WHEN (elem->>'id') = p_player_id
          THEN elem || jsonb_build_object('status', 'buzzed', 'buzzedAt', server_ts)
          ELSE elem
        END
      )
      FROM jsonb_array_elements(pl) AS elem
    );
  ELSE
    cur_responder := aq->>'currentResponderId';
    cur_ts := (aq->>'responderClientTs')::bigint;
    -- Если у текущего отвечающего нет timestamp — считаем его первым (обратная совместимость)
    IF cur_ts IS NULL THEN cur_ts := 0; END IF;
    -- Новый игрок нажал раньше по клиентскому времени — меняем отвечающего
    IF p_client_ts IS NOT NULL AND p_client_ts < cur_ts THEN
      new_aq := jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(aq, '{currentResponderId}', to_jsonb(p_player_id)),
              '{timerPaused}', 'true'::jsonb),
              '{responderStartedAt}', to_jsonb(server_ts)),
            '{responderClientTs}', to_jsonb(p_client_ts)),
          '{buzzedOrder}', COALESCE(aq->'buzzedOrder', '[]'::jsonb) || to_jsonb(ARRAY[p_player_id]));
      new_pl := (
        SELECT jsonb_agg(
          CASE WHEN (elem->>'id') = p_player_id
            THEN elem || jsonb_build_object('status', 'buzzed', 'buzzedAt', server_ts)
            WHEN (elem->>'id') = cur_responder
            THEN elem || jsonb_build_object('status', 'queued', 'buzzedAt', (elem->>'buzzedAt')::bigint)
            ELSE elem
          END
        )
        FROM jsonb_array_elements(pl) AS elem
      );
    ELSE
      -- Обычная очередь
      new_aq := jsonb_set(aq, '{buzzedOrder}', COALESCE(aq->'buzzedOrder', '[]'::jsonb) || to_jsonb(ARRAY[p_player_id]));
      new_pl := (
        SELECT jsonb_agg(
          CASE WHEN (elem->>'id') = p_player_id
            THEN elem || jsonb_build_object('status', 'queued', 'buzzedAt', server_ts)
            ELSE elem
          END
        )
        FROM jsonb_array_elements(pl) AS elem
      );
    END IF;
  END IF;

  UPDATE game_sessions
  SET active_question = new_aq, players = new_pl, updated_at = now()
  WHERE id = p_session_id;

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

-- Разрешить вызов от анонимного и аутентифицированного ролей
GRANT EXECUTE ON FUNCTION try_buzz(text, text, bigint) TO anon;
GRANT EXECUTE ON FUNCTION try_buzz(text, text, bigint) TO authenticated;
