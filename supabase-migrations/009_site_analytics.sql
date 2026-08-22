-- ============================================================================
-- 009_site_analytics.sql — лічильник відвідувань і кліків для власника
-- ============================================================================
--
-- Застосувати в Supabase SQL Editor один раз.
-- Потім ОБОВʼЯЗКОВО змініть токен:
--   UPDATE site_analytics_secrets SET token = 'ваш-довгий-секрет' WHERE id = 1;
-- Дашборд: https://ваш-сайт/admin/stats?t=ваш-довгий-секрет
-- Сторінка noindex; /admin/ уже в robots.txt Disallow.
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'click')),
  path text NOT NULL DEFAULT '/',
  name text,
  locale text,
  referrer text,
  session_id text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT site_analytics_path_len CHECK (char_length(path) <= 300),
  CONSTRAINT site_analytics_name_len CHECK (name IS NULL OR char_length(name) <= 120),
  CONSTRAINT site_analytics_locale_len CHECK (locale IS NULL OR char_length(locale) <= 16),
  CONSTRAINT site_analytics_session_len CHECK (session_id IS NULL OR char_length(session_id) <= 64)
);

CREATE INDEX IF NOT EXISTS site_analytics_events_created_idx
  ON site_analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS site_analytics_events_type_created_idx
  ON site_analytics_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS site_analytics_events_path_idx
  ON site_analytics_events (path, created_at DESC)
  WHERE event_type = 'page_view';

CREATE INDEX IF NOT EXISTS site_analytics_events_click_name_idx
  ON site_analytics_events (name, created_at DESC)
  WHERE event_type = 'click' AND name IS NOT NULL;

-- Єдиний рядок із секретом для читання статистики (не в бандлі клієнта).
CREATE TABLE IF NOT EXISTS site_analytics_secrets (
  id int PRIMARY KEY CHECK (id = 1),
  token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_analytics_secrets (id, token)
VALUES (1, 'CHANGE_ME_set_a_long_random_token')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE site_analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_analytics_secrets ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_analytics_events'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON site_analytics_events', p.policyname);
  END LOOP;
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'site_analytics_secrets'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON site_analytics_secrets', p.policyname);
  END LOOP;
END $$;

-- Писати події може будь-хто з anon key (телеметрія). Читати таблицю напряму — ні.
CREATE POLICY "insert site analytics events"
  ON site_analytics_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Секрет недоступний клієнту напряму (лише через RPC).
-- Жодних SELECT/INSERT/UPDATE/DELETE політик на site_analytics_secrets.

CREATE OR REPLACE FUNCTION get_site_analytics(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected text;
  result jsonb;
BEGIN
  SELECT token INTO expected FROM site_analytics_secrets WHERE id = 1;

  IF expected IS NULL
     OR p_token IS NULL
     OR length(p_token) < 16
     OR p_token IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total_views', (
      SELECT count(*)::bigint FROM site_analytics_events WHERE event_type = 'page_view'
    ),
    'total_clicks', (
      SELECT count(*)::bigint FROM site_analytics_events WHERE event_type = 'click'
    ),
    'views_7d', (
      SELECT count(*)::bigint
      FROM site_analytics_events
      WHERE event_type = 'page_view'
        AND created_at >= (timezone('utc', now()) - interval '7 days')
    ),
    'clicks_7d', (
      SELECT count(*)::bigint
      FROM site_analytics_events
      WHERE event_type = 'click'
        AND created_at >= (timezone('utc', now()) - interval '7 days')
    ),
    'unique_sessions_7d', (
      SELECT count(DISTINCT session_id)::bigint
      FROM site_analytics_events
      WHERE session_id IS NOT NULL
        AND created_at >= (timezone('utc', now()) - interval '7 days')
    ),
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'views', d.views,
        'clicks', d.clicks,
        'sessions', d.sessions
      ) ORDER BY d.day), '[]'::jsonb)
      FROM (
        SELECT
          (timezone('utc', created_at))::date AS day,
          count(*) FILTER (WHERE event_type = 'page_view')::bigint AS views,
          count(*) FILTER (WHERE event_type = 'click')::bigint AS clicks,
          count(DISTINCT session_id)::bigint AS sessions
        FROM site_analytics_events
        WHERE created_at >= ((timezone('utc', now()))::date - 6)
        GROUP BY 1
      ) d
    ),
    'top_paths', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'path', p.path,
        'views', p.views
      ) ORDER BY p.views DESC), '[]'::jsonb)
      FROM (
        SELECT path, count(*)::bigint AS views
        FROM site_analytics_events
        WHERE event_type = 'page_view'
          AND created_at >= (timezone('utc', now()) - interval '30 days')
        GROUP BY path
        ORDER BY views DESC
        LIMIT 12
      ) p
    ),
    'top_clicks', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'name', c.name,
        'clicks', c.clicks
      ) ORDER BY c.clicks DESC), '[]'::jsonb)
      FROM (
        SELECT coalesce(nullif(name, ''), '(unnamed)') AS name, count(*)::bigint AS clicks
        FROM site_analytics_events
        WHERE event_type = 'click'
          AND created_at >= (timezone('utc', now()) - interval '30 days')
        GROUP BY 1
        ORDER BY clicks DESC
        LIMIT 12
      ) c
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION get_site_analytics(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_site_analytics(text) TO anon, authenticated;

REVOKE ALL ON TABLE site_analytics_secrets FROM PUBLIC;
REVOKE ALL ON TABLE site_analytics_secrets FROM anon, authenticated;
REVOKE ALL ON TABLE site_analytics_events FROM PUBLIC;
GRANT INSERT ON TABLE site_analytics_events TO anon, authenticated;
-- SELECT/UPDATE/DELETE на events не даємо ролям клієнта.
