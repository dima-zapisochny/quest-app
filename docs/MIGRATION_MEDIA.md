# Phase 5 — Migration: Local/Base64 Media → Supabase Storage URLs

## Goal

- Quiz JSON and DB hold **only URLs** (no base64).
- All media files live in **Supabase Storage** (`quest-media` bucket).
- Existing quests with base64 can be migrated so that `questionMedia`/`answerMedia` entries point to Storage URLs.

## 1. List existing media

- **In DB:** Rows in `quests` where `data` JSONB contains `questionMedia` or `answerMedia` with `url` starting with `data:`.
- **In repo:** `src/data/kinokvest.json` has empty arrays. Exported files (e.g. `quest-*.json`) may contain base64 in `questionMedia[].url` / `answerMedia[].url`.

To find base64 in DB (run in Supabase SQL Editor):

```sql
SELECT id, title,
  jsonb_path_query_array(data, '$.rounds[*].categories[*].questions[*].questionMedia[*] ? (@.url != null && @.url like "data:%")') AS q_media,
  jsonb_path_query_array(data, '$.rounds[*].categories[*].questions[*].answerMedia[*] ? (@.url != null && @.url like "data:%")') AS a_media
FROM quests
WHERE data::text LIKE '%data:image%' OR data::text LIKE '%data:audio%';
```

## 2. Mapping: local/base64 → Supabase URL

| Source | Future URL pattern |
|--------|--------------------|
| `questionMedia[i].url` (base64) | `https://<project>.supabase.co/storage/v1/object/public/quest-media/<userId>/<questId>/<mediaId>.<ext>` |
| New uploads | Already stored via `uploadQuestMedia()`; `url` in `MediaAsset` is this public URL. |

- **mediaId:** use existing `MediaAsset.id` or generate new UUID.
- **ext:** from original filename or MIME (e.g. `mp3`, `png`).

## 3. Migration steps

1. **Create bucket and policies**  
   Run `scripts/create-quest-media-storage-policy.sql` and ensure bucket `quest-media` exists (see `SUPABASE_SETUP.md`).

2. **For each quest that has base64 in `data`:**
   - Parse `data.rounds[].categories[].questions[]`.
   - For each question, for each `questionMedia` and `answerMedia` item with `url.startsWith('data:')`:
     - Decode base64 and upload to Storage: path `{userId}/{questId}/{media.id}.{ext}`.
     - Replace `url` with the Storage public URL (from `getPublicUrl`).
   - Optionally set lightweight fields: `question.imageUrl` = first image URL, `question.audioUrl` = first audio URL; same for `answerImageUrl` / `answerAudioUrl`.
   - Update the quest row: `UPDATE quests SET data = $newData WHERE id = $id`.

3. **Run the migration script**  
   From project root:
   ```bash
   node scripts/migrate-quest-media-to-storage.mjs
   ```
   **Required in `.env`:**
   - `VITE_SUPABASE_URL` (or `SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase Dashboard → Settings → API → `service_role` (secret)

   **Optional:** `DRY_RUN=1` to only list quests and media without uploading or updating:
   ```bash
   DRY_RUN=1 node scripts/migrate-quest-media-to-storage.mjs
   ```
   The script fetches all quests, finds base64 in `questionMedia`/`answerMedia`, uploads each to `quest-media/{userId}/{questId}/{mediaId}.{ext}`, replaces `url` with the public Storage URL, and updates the quest row.

4. **Refactor quiz files (exports)**  
   - When exporting, ensure no base64 is written: either export only metadata + URLs, or run the same “upload base64 → replace with URL” step before saving.
   - Seed/static JSON (e.g. `kinokvest.json`) already uses empty media arrays; new seeds should use only Storage URLs if they need media.

## 4. Making replacement easy

- **Types:** `Question` has optional `imageUrl`, `audioUrl`, `answerImageUrl`, `answerAudioUrl`. Components use them when set and fall back to `questionMedia`/`answerMedia`.
- **Display:** `QuestionMediaPreview` and `QuestionModal` accept both:
  - Array form: `questionMedia` / `answerMedia` with `MediaAsset[]`.
  - Lightweight form: `imageUrl` / `audioUrl` (and answer equivalents).
- **Upload path:** New uploads go through `appendQuestionMedia` → `uploadQuestMedia`; only Storage URL is stored (or base64 only if Storage fails). Prefer fixing Storage RLS so all new media are URLs.

## 5. After migration

- Quest list stays light: `getQuestList()` does not select `data`.
- Full quest load: `loadQuestFull(questId)` loads one quest with `data`; with base64 replaced by URLs, payload size stays small.
- No large base64 in JSON: smaller DB and faster responses.
