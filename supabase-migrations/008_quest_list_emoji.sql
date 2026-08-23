-- ============================================================================
-- 008_quest_list_emoji.sql — emoji квеста в лёгком списке.
--
-- Выполнить один раз в Supabase SQL Editor после 007.
-- emoji — в КОНЦЕ select: CREATE OR REPLACE не меняет порядок существующих
-- колонок (иначе 42P16: cannot change name of view column "rounds_count" to "emoji").
-- ============================================================================

CREATE OR REPLACE VIEW quest_list_view
WITH (security_invoker = true)
AS
SELECT
  q.id,
  q.title,
  q.description,
  q.user_id,
  q.created_at,
  q.updated_at,
  COALESCE(jsonb_array_length(q.data->'rounds'), 0) AS rounds_count,
  COALESCE((
    SELECT SUM(jsonb_array_length(cat->'questions'))
    FROM jsonb_array_elements(q.data->'rounds') AS r,
         jsonb_array_elements(r->'categories') AS cat
  ), 0) AS questions_count,
  q.data->>'emoji' AS emoji
FROM quests q;

GRANT SELECT ON quest_list_view TO anon, authenticated;
