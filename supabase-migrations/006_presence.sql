-- ============================================================================
-- 006_presence.sql — Presence гравців (heartbeat + prune), закриття #5 і #10.
--
-- ПРОБЛЕМА: гравець, що закрив вкладку, ніколи не видалявся з сесії (накопичення
-- «привидів»); realtime-обробник глушив оновлення, щоб приховати симптом (#10).
--
-- РІШЕННЯ: presence зберігаємо в ОКРЕМІЙ таблиці session_presence (щоб heartbeat
-- не тригерив realtime на game_sessions кожні 10с). Хост періодично викидає з
-- game_sessions.players тих, чий last_seen застарів.
--
-- Виконати один раз у Supabase SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS session_presence (
  session_id text NOT NULL,
  player_id  text NOT NULL,
  last_seen  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, player_id)
);

ALTER TABLE session_presence ENABLE ROW LEVEL SECURITY;

-- Пінги пишуть анонимно авторизованные игроки; данные не приватные (только «жив ли»)
DROP POLICY IF EXISTS "presence read"   ON session_presence;
DROP POLICY IF EXISTS "presence upsert" ON session_presence;
DROP POLICY IF EXISTS "presence update" ON session_presence;
DROP POLICY IF EXISTS "presence delete" ON session_presence;
CREATE POLICY "presence read"   ON session_presence FOR SELECT USING (true);
CREATE POLICY "presence upsert" ON session_presence FOR INSERT WITH CHECK (true);
CREATE POLICY "presence update" ON session_presence FOR UPDATE USING (true);
CREATE POLICY "presence delete" ON session_presence FOR DELETE USING (true);

-- --- heartbeat: игрок отмечает, что жив -------------------------------------
CREATE OR REPLACE FUNCTION heartbeat(p_session_id text, p_player_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO session_presence (session_id, player_id, last_seen)
  VALUES (p_session_id, p_player_id, now())
  ON CONFLICT (session_id, player_id)
  DO UPDATE SET last_seen = now();
END;
$$;

-- --- prune: хост убирает игроков, чей heartbeat протух ------------------------
-- Игрок удаляется, если now - COALESCE(last_seen, joinedAt) > p_ttl_ms.
-- Хост (host_id) не удаляется никогда. Возвращает обновлённую сессию (или ничего,
-- если никого не убрали — чтобы не гонять лишний realtime).
CREATE OR REPLACE FUNCTION prune_stale_players(p_session_id text, p_ttl_ms bigint DEFAULT 30000)
RETURNS SETOF game_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pl jsonb;
  host text;
  now_ms bigint := (round(extract(epoch from now()) * 1000))::bigint;
  new_pl jsonb;
BEGIN
  SELECT players, host_id INTO pl, host
  FROM game_sessions WHERE id = p_session_id FOR UPDATE;
  IF pl IS NULL THEN RETURN; END IF;

  new_pl := (
    SELECT COALESCE(jsonb_agg(e), '[]'::jsonb)
    FROM jsonb_array_elements(pl) e
    WHERE
      -- хост остаётся всегда
      (e->>'id') = host
      -- либо есть свежий presence
      OR EXISTS (
        SELECT 1 FROM session_presence sp
        WHERE sp.session_id = p_session_id
          AND sp.player_id = (e->>'id')
          AND now_ms - (round(extract(epoch from sp.last_seen) * 1000))::bigint <= p_ttl_ms
      )
      -- либо игрок только что зашёл (joinedAt свежий) и ещё не успел пингануть
      OR (now_ms - COALESCE((e->>'joinedAt')::bigint, 0) <= p_ttl_ms)
  );

  -- Никого не убрали — ничего не пишем (не триггерим realtime зря)
  IF jsonb_array_length(new_pl) = jsonb_array_length(pl) THEN
    RETURN;
  END IF;

  UPDATE game_sessions
  SET players = new_pl, updated_at = now()
  WHERE id = p_session_id;

  -- Чистим presence удалённых игроков
  DELETE FROM session_presence sp
  WHERE sp.session_id = p_session_id
    AND NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(new_pl) e WHERE (e->>'id') = sp.player_id
    );

  RETURN QUERY SELECT * FROM game_sessions WHERE id = p_session_id;
END;
$$;

GRANT EXECUTE ON FUNCTION heartbeat(text, text)                 TO anon, authenticated;
GRANT EXECUTE ON FUNCTION prune_stale_players(text, bigint)    TO anon, authenticated;
