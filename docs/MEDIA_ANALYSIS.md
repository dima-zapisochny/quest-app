# Phase 1 — Media & Quiz Data Analysis

## 1. Quiz / question definitions

| Location | Format | Description |
|----------|--------|-------------|
| **Supabase `quests` table** | JSONB column `data` | Full quest (id, title, description, rounds → categories → questions). Each question has `questionMedia[]`, `answerMedia[]`. |
| **`src/data/kinokvest.json`** | JSON | Seed quest (~57 KB); all questions have empty `questionMedia: []`, `answerMedia: []`. |
| **Exported files** (e.g. `quest-1661af7b.json`) | JSON | Full quest export; can be ~3 MB when questions contain base64 media. |
| **`src/store/quizStore.ts`** | TS | Creates/updates questions with `questionMedia`, `answerMedia`; `appendQuestionMedia` uploads to Storage or falls back to base64. |
| **`src/types/index.ts`** | TS | `Question` has `questionMedia?: MediaAsset[]`, `answerMedia?: MediaAsset[]`. `MediaAsset`: id, type, name, url, delay?. |

## 2. Where media is used in quiz questions

- **Question (during play):** images and audio from `question.questionMedia` (images with optional `delay`, audio for playback).
- **Answer (after reveal):** images and audio from `question.answerMedia`.
- **Admin:** `AdminQuestionRow.vue` — upload image/audio per question or answer; stored via `appendQuestionMedia` (Storage or base64 fallback).

## 3. Audio / image files and base64

- **Static assets:** No `.mp3`/`.wav`/`.png`/`.jpg` in repo used by quiz content (only UI assets if any).
- **Base64:** Present inside quest JSON (Supabase `data` or exported JSON). `QuestionModal.vue` detects `data:...;base64,...` for validation. New uploads prefer Supabase Storage URLs when configured.
- **Large files:** `quest-1661af7b.json` ~2.9 MB (base64 media inside). No other large quiz files in repo.

## 4. How media is rendered

| Component | Usage |
|-----------|--------|
| **QuestionMediaPreview.vue** | `<img :src="media.url">`, `<audio :src="media.url">` — one asset per instance. |
| **QuestionModal.vue** | Uses `questionMediaAudio`, `questionMediaImages` (from `questionMedia`); `answerMediaImages`, `answerMediaAudio` (from `answerMedia`). Renders `QuestionMediaPreview` for images; custom block + `<audio :src="audio.url">` for audio. |
| **AdminQuestionRow.vue** | Lists `questionMediaList` / `answerMediaList`; upload buttons add to these arrays. |

## 5. Lightweight target structure

- **No base64 in persisted quiz data.** Store only URLs (e.g. Supabase Storage).
- **Convenience:** First image URL = `question.imageUrl` (or first of `questionMedia` where type image). First audio URL = `question.audioUrl` (or first of `questionMedia` where type audio). Same for answer.
- **Existing shape:** Keep `questionMedia[]` / `answerMedia[]` with `MediaAsset { id, type, name, url, delay? }`; enforce `url` = external URL only for new data; components support both URL-only and legacy base64 for backward compatibility during migration.

## 6. Supabase Storage (Phase 3)

- **Bucket:** `quest-media`. Path: `{userId}/{questId}/{mediaId}.{ext}`.
- **Service:** `uploadQuestMedia(questId, userId, file, mediaId)` in `supabaseService.ts`; used by `appendQuestionMedia` in `quizStore.ts`. New media stored as URL; fallback to base64 only when Storage fails / not configured.
- **Policies:** See `scripts/create-quest-media-storage-policy.sql` (INSERT/UPDATE/SELECT for anon).

## 7. Performance (Phase 6)

- **Light JSON:** `getQuestList()` loads only `id, title, description, user_id, created_at, updated_at` (no `data`). Full quest with media only on demand via `loadQuestFull(questId)`.
- **Lazy media:** Images use `loading="lazy"`; audio uses `preload="none"` or `preload="metadata"` so files load when needed.
- **No large bundling:** No static audio/image assets for quiz content in the app bundle; media comes from Storage or inline data URLs (legacy) at runtime.
