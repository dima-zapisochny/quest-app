-- Атомарный «первый нажал — получил право ответа» для кнопки «Ответить».
-- Выполните в Supabase SQL Editor один раз.

CREATE OR REPLACE FUNCTION try_buzz(p_session_id text, p_player_id text)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  aq jsonb;
  new_aq jsonb;
  pl jsonb;
  new_pl jsonb;
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

  IF (aq->>'currentResponderId') IS NULL THEN
    new_aq := jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(aq,
            '{currentResponderId}', to_jsonb(p_player_id)),
            '{timerPaused}', 'true'::jsonb),
            '{responderStartedAt}', to_jsonb((round(extract(epoch from now()) * 1000))::bigint)),
      '{buzzedOrder}', COALESCE(aq->'buzzedOrder', '[]'::jsonb) || to_jsonb(ARRAY[p_player_id]));
    new_pl := (
      SELECT jsonb_agg(
        CASE WHEN (elem->>'id') = p_player_id
          THEN elem || jsonb_build_object('status', 'buzzed', 'buzzedAt', round(extract(epoch from now()) * 1000)::bigint)
          ELSE elem
        END
      )
      FROM jsonb_array_elements(pl) AS elem
    );
  ELSE
    new_aq := jsonb_set(aq, '{buzzedOrder}', COALESCE(aq->'buzzedOrder', '[]'::jsonb) || to_jsonb(ARRAY[p_player_id]));
    new_pl := (
      SELECT jsonb_agg(
        CASE WHEN (elem->>'id') = p_player_id
          THEN elem || jsonb_build_object('status', 'queued', 'buzzedAt', round(extract(epoch from now()) * 1000)::bigint)
          ELSE elem
        END
      )
      FROM jsonb_array_elements(pl) AS elem
    );
  END IF;

  UPDATE game_sessions
  SET active_question = new_aq, players = new_pl, updated_at = now()
  WHERE id = p_session_id;

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

-- Разрешить вызов от анонимного и аутентифицированного ролей
GRANT EXECUTE ON FUNCTION try_buzz(text, text) TO anon;
GRANT EXECUTE ON FUNCTION try_buzz(text, text) TO authenticated;
