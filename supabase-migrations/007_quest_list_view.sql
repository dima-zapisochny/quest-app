-- ============================================================================
-- 007_quest_list_view.sql — Лёгкий список квестов (#16).
--
-- getQuestList тянул полный data (JSONB со всей структурой) только ради счётчиков
-- раундов/вопросов на карточках. View считает счётчики на сервере и отдаёт лишь
-- маленькие колонки — полный data по сети не передаётся.
--
-- security_invoker=true → RLS таблицы quests применяется к запрашивающему
-- (владелец видит только свои квесты, как и в самой таблице).
--
-- Выполнить один раз в Supabase SQL Editor.
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
  ), 0) AS questions_count
FROM quests q;

GRANT SELECT ON quest_list_view TO anon, authenticated;
