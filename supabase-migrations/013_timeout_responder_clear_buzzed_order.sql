-- Очищення buzzedOrder при таймауті відповідача (як при неправильній відповіді).
-- Без цього queued-учасники не могли знову натиснути «Відповісти».

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

  IF (aq->>'currentResponderId') IS DISTINCT FROM p_player_id
     OR COALESCE((aq->>'showAnswer')::boolean, false) THEN
    RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
    RETURN;
  END IF;

  new_aq := jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(aq, '{currentResponderId}', 'null'::jsonb),
        '{responderStartedAt}', 'null'::jsonb),
      '{timerPaused}', 'false'::jsonb),
    '{buzzedOrder}', '[]'::jsonb);

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
