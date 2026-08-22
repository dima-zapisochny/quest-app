-- ============================================================================
-- 014_site_analytics_kyiv_timezone.sql — календарні дні діаграми по Europe/Kyiv
-- ============================================================================
--
-- Застосувати в Supabase SQL Editor після 013.
-- До цього дні на діаграмі були по UTC (для UTC+3 «сьогодні» ще вчора до 03:00).
-- ============================================================================

CREATE OR REPLACE FUNCTION get_site_analytics(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expected text;
  result jsonb;
  kyiv_today date := (timezone('Europe/Kyiv', now()))::date;
  kyiv_7d_start timestamptz := (kyiv_today - 6)::timestamp AT TIME ZONE 'Europe/Kyiv';
  kyiv_30d_start timestamptz := (kyiv_today - 30)::timestamp AT TIME ZONE 'Europe/Kyiv';
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
      SELECT count(*)::bigint
      FROM site_analytics_events
      WHERE event_type = 'page_view'
        AND path NOT LIKE '/admin/stats%'
    ),
    'total_clicks', (
      SELECT count(*)::bigint
      FROM site_analytics_events
      WHERE event_type = 'click'
        AND path NOT LIKE '/admin/stats%'
    ),
    'views_7d', (
      SELECT count(*)::bigint
      FROM site_analytics_events
      WHERE event_type = 'page_view'
        AND path NOT LIKE '/admin/stats%'
        AND created_at >= kyiv_7d_start
    ),
    'clicks_7d', (
      SELECT count(*)::bigint
      FROM site_analytics_events
      WHERE event_type = 'click'
        AND path NOT LIKE '/admin/stats%'
        AND created_at >= kyiv_7d_start
    ),
    'unique_sessions_7d', (
      SELECT count(DISTINCT session_id)::bigint
      FROM site_analytics_events
      WHERE session_id IS NOT NULL
        AND path NOT LIKE '/admin/stats%'
        AND created_at >= kyiv_7d_start
    ),
    'unique_visitors_7d', (
      SELECT count(DISTINCT visitor_id)::bigint
      FROM site_analytics_events
      WHERE visitor_id IS NOT NULL
        AND path NOT LIKE '/admin/stats%'
        AND created_at >= kyiv_7d_start
    ),
    'unique_visitors_total', (
      SELECT count(DISTINCT visitor_id)::bigint
      FROM site_analytics_events
      WHERE visitor_id IS NOT NULL
        AND path NOT LIKE '/admin/stats%'
    ),
    'daily', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'views', d.views,
        'clicks', d.clicks,
        'sessions', d.sessions,
        'visitors', d.visitors
      ) ORDER BY d.day), '[]'::jsonb)
      FROM (
        SELECT
          (timezone('Europe/Kyiv', created_at))::date AS day,
          count(*) FILTER (WHERE event_type = 'page_view')::bigint AS views,
          count(*) FILTER (WHERE event_type = 'click')::bigint AS clicks,
          count(DISTINCT session_id)::bigint AS sessions,
          count(DISTINCT visitor_id)::bigint AS visitors
        FROM site_analytics_events
        WHERE created_at >= kyiv_7d_start
          AND path NOT LIKE '/admin/stats%'
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
          AND path NOT LIKE '/admin/stats%'
          AND created_at >= kyiv_30d_start
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
          AND path NOT LIKE '/admin/stats%'
          AND created_at >= kyiv_30d_start
        GROUP BY 1
        ORDER BY clicks DESC
        LIMIT 12
      ) c
    ),
    'top_countries', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'country_code', g.country_code,
        'views', g.views
      ) ORDER BY g.views DESC), '[]'::jsonb)
      FROM (
        SELECT upper(country_code) AS country_code, count(*)::bigint AS views
        FROM site_analytics_events
        WHERE event_type = 'page_view'
          AND path NOT LIKE '/admin/stats%'
          AND country_code IS NOT NULL
          AND char_length(trim(country_code)) >= 2
          AND created_at >= kyiv_30d_start
        GROUP BY 1
        ORDER BY views DESC
        LIMIT 12
      ) g
    ),
    'top_regions', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
        'country_code', r.country_code,
        'region', r.region,
        'views', r.views
      ) ORDER BY r.views DESC), '[]'::jsonb)
      FROM (
        SELECT
          upper(country_code) AS country_code,
          coalesce(nullif(trim(region), ''), '—') AS region,
          count(*)::bigint AS views
        FROM site_analytics_events
        WHERE event_type = 'page_view'
          AND path NOT LIKE '/admin/stats%'
          AND country_code IS NOT NULL
          AND char_length(trim(country_code)) >= 2
          AND created_at >= kyiv_30d_start
        GROUP BY 1, 2
        ORDER BY views DESC
        LIMIT 12
      ) r
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION get_site_analytics(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_site_analytics(text) TO anon, authenticated;
