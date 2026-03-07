# QA Audit: Game Lifecycle & Supabase Integration

**Role:** Senior Full-Stack QA / Code Auditor  
**Scope:** Game sessions, quests, progress, realtime, UI sync

---

## 1. Flow Analysis

### 1.1 Game session creation

| Step | Location | Notes |
|------|----------|--------|
| Host selects quest, clicks Start | `HostSetupView.vue:264-265` | `quizStore.getQuestById` → `sessionStore.createSession(questId, questSnapshot)` |
| createSession | `gameSessionStore.ts:292-329` | Builds `GameSession` with `questSnapshot`, calls `createSessionInDb(session)`, pushes to `sessions.value` |
| createSessionInDb | `supabaseService.ts:232-258` | INSERT into `game_sessions`, returns mapped row |
| Realtime | `supabaseService.ts:459-478` | INSERT event → `getSessionById(sessionId)` → callback(session). **Issue:** Extra GET after INSERT; if GET fails (500), new session never appears in other clients. |

### 1.2 Quests loading

| Step | Location | Notes |
|------|----------|--------|
| Initial load | `quizStore.ts:60-73` | `loadFromStorage()` → `getAllQuests(userId)` → `quests.value = dbQuests` |
| Default quest | `quizStore.ts:76-82` | If no "Музыкальная викторина", `importQuest(musicQuestSeed)` |
| Progress | `quizStore.ts:71, 103-120` | `loadQuestProgress()` fetches `quest_progress`, applies `played` / `answeredBy` to `quests.value` |
| Subscription | `quizStore.ts:146-165` | `initializeSubscription()` → `subscribeToQuests(userId, callback)`. Callback replaces/inserts quest in `quests.value`. **No sync of `session.quest`** when quest is updated (by design; snapshot is fixed at game start). |

### 1.3 Quest progress update

| Step | Location | Notes |
|------|----------|--------|
| Mark played | `QuestionModal.vue`, `QuizBoard.vue`, `gameSessionStore.ts:811` | `quizStore.markQuestionAsPlayed(questId, roundId, categoryId, questionId, answeredBy?)` |
| Implementation | `quizStore.ts:566-592` | Updates local `question.played` / `answeredBy`, then `markQuestionAsPlayedInDb` (INSERT into `quest_progress`), then `saveToStorage()` (writes full quests to Supabase). |
| Session snapshot | `gameSessionStore.ts:824-838` | `resolveQuestion` (correct) also updates `session.quest` in memory so tiles show "who answered". |

### 1.4 Game state saving

| Step | Location | Notes |
|------|----------|--------|
| All session mutations | `gameSessionStore.ts` | `openQuestion`, `closeQuestion`, `revealAnswer`, `buzz`, `resolveQuestion`, `setActiveRound`, `leaveSession`, `joinSessionByCode`, etc. |
| Pattern | Everywhere | Mutate `session` object → `updateSession(session)` → on success `updateSessionInArray(updated)`, on error fallback `updateSessionInArray(session)` (local only). |
| Risk | `supabaseService.ts:312-314` | If session was deleted (e.g. CASCADE when quest deleted, or another tab closed game), `update()` affects 0 rows, `select()` returns nothing → **"Session not found or update returned no rows"**. UI keeps working locally but next refresh or other tab loses consistency. |

### 1.5 Game session closed

| Step | Location | Notes |
|------|----------|--------|
| Host exit | `QuestView.vue:841-865` | `confirmExit()` → **first** `quizStore.resetQuestProgress(questId)` → **then** `sessionStore.deleteSession(session.id)`. |
| resetQuestProgress | `quizStore.ts:615-640` | Clears `played`/`answeredBy`, `resetQuestProgressInDb`, `saveToStorage()`, **then** `sessionStore.syncSessionQuestSnapshot(questId, quest)`. |
| Bug | Order of operations | `syncSessionQuestSnapshot` runs **before** `deleteSession`. It does `updateSession(sessionToUpdate)` for every session with `questId`, including the current one. If that update fails (e.g. session already gone or 500), we throw; then we still call `deleteSession`. So we can get "Session not found or update returned no rows" **before** the session is actually deleted. **Fix:** Call `deleteSession` first, then `resetQuestProgress`. Then `syncSessionQuestSnapshot` will not include the current session (already removed from `sessions.value`). |

### 1.6 Supabase realtime / subscriptions

| Subscription | Where | Cleanup |
|--------------|--------|--------|
| `game_sessions` | `gameSessionStore.ts:99-201` | **Never unsubscribed.** Set once at module load (`if (typeof window !== 'undefined')`). No cleanup on "logout" or app teardown. |
| `quests` | `quizStore.ts:158` inside `initializeSubscription()` | Unsubscribed when `initializeSubscription()` is called again (previous `unsubscribeQuests()`). Subscribed when `loadFromStorage()` runs (after userId is set). |
| Realtime handler | `supabaseService.ts:452-487` | On INSERT/UPDATE: `getSessionById(sessionId)` (network round-trip). On DELETE: only logs, **does not remove session from `sessions.value`** → stale session remains; subsequent updates fail with "Session not found or update returned no rows". |

### 1.7 UI reaction to data updates

| Source | UI |
|--------|-----|
| `sessions.value` | QuestView (host/player), PlayerSessionView: `session` computed from `sessionStore.getSessionByCode` / `getSessionById`. Leaderboard, round, active question, players all derive from `session`. |
| Realtime | Same store; callback updates `sessions.value` via `updateSessionInArray` or push. Vue reactivity propagates. |
| Quests | Host setup: `quizStore.quests`; in-game host uses `session.quest` (snapshot). Player uses `session.quest`. So quest edits in admin **do not** affect running game (intended). |

---

## 2. Identified Flows Where Bugs Can Occur

| Flow | Risk |
|------|------|
| **Starting a game** | Quest missing in store → `getQuestById` undefined → createSession gets undefined snapshot; host view may still work if quest is loaded later. |
| **Opening existing session** | Session in URL/localStorage but deleted in DB (e.g. CASCADE) → `getSessionById` 500 or null → "Session not found" errors on any action; DELETE not reflected in client. |
| **Editing quest in Supabase** | Realtime updates `quests.value`; `session.quest` is not updated (snapshot). By design. |
| **Realtime updates** | Two quick UPDATEs → two `getSessionById` in flight → second may return before first → first overwrites with stale state (race). Also GET can 500 (e.g. large `quest_data`). |
| **Quest progress update** | `markQuestionAsPlayed` + `saveToStorage` update quest in DB; no direct link to `game_sessions`. Session snapshot updated only in memory in `resolveQuestion` / `closeQuestion`. |
| **Saving the game** | Every action calls `updateSession`. If session was deleted (another tab, or CASCADE), update returns no rows → error logged, local fallback. |
| **Closing the game session** | Order: resetQuestProgress (includes syncSessionQuestSnapshot) then deleteSession. syncSessionQuestSnapshot updates current session → can fail if session already invalid. |
| **Reconnecting to existing session** | Player refresh: `checkActivePlayerSession` → getSessionById from DB; if 500 or null, we clear active player. Session might still be in `sessions.value` from before (stale). |
| **Refreshing during game** | Host: session from store by code; if store was cleared or session deleted, quest load + session by code may fail → redirect to host-setup. Player: restore from localStorage + getSessionById; same 500/null issues. |
| **Multiple tabs** | Shared Pinia state. Both tabs see same `sessions.value`. If one tab deletes session, the other still has it until realtime DELETE is handled (currently not removing from array). |
| **Lost network** | updateSession fails → fallback to local only; realtime stops. On reconnect, no automatic refetch of session; user can refresh. |
| **Supabase subscription reconnect** | On TIMED_OUT we `setTimeout(..., 1000)` and `channel.subscribe()`. No deduplication; `handleReconnect` is defined but never used (dead code). |

---

## 3. Edge Cases Simulated

| Case | Result |
|------|--------|
| **Quest updated while player in game** | `quests.value` updated via realtime; `session.quest` unchanged. UI shows snapshot. OK. |
| **Quest deleted in Supabase** | CASCADE deletes all `game_sessions` with that `quest_id`. Realtime sends DELETE; we only log, **do not remove from `sessions.value`**. Host/player still see session; any updateSession → "Session not found or update returned no rows". **Bug.** |
| **Quest structure changed** | If `session.quest` has different rounds/categories than current quest in store, `resolveQuestion` uses `quizStore.getQuestById(session.questId)` for value; if quest deleted, getQuestById is undefined, we only warn. |
| **Session closed while UI listens to realtime** | DELETE event received; we don't remove session from store. UI still shows closed session. **Bug.** |
| **Stale cached state** | e.g. Session deleted in another tab; we don't handle DELETE → cache stale. |
| **Multiple realtime listeners** | One `subscribeToSessions` per app load (store singleton). One `subscribeToQuests` per user; re-subscribe on each `initializeSubscription()` after unsubscribe. No duplicate channels. |
| **Unhandled promise rejections** | updateSession throws; callers use try/catch and fallback to local. No unhandled rejection. |
| **Race: state update vs realtime** | Possible: our updateSession completes → realtime fires → getSessionById returns; meanwhile we already did updateSessionInArray(updated). Then callback runs with same or newer data. If getSessionById is slow and returns stale, we overwrite with stale. **Improvement:** use payload.new and map to GameSession to avoid extra GET and race. |

---

## 4. Checklist Results

| Check | Status |
|-------|--------|
| Console errors | Possible: "Session not found or update returned no rows", getSessionById 500, "Error fetching session". |
| Memory leaks from realtime | Sessions subscription never unsubscribed (lives for app lifetime; acceptable for SPA). visibilitychange listener never removed (minor leak). |
| Duplicate Supabase listeners | Single sessions channel per app; single quests channel per user, replaced on re-init. |
| Missing unsubscribe logic | Quests: unsubscribe before re-subscribe. Sessions: **no unsubscribe** (no "logout" flow). |
| Invalid state updates | Possible: session in store but deleted in DB; we don't invalidate. |
| Incorrect async handling | All updateSession call sites use try/catch and local fallback. |
| UI state vs DB state | Can diverge after session DELETE (we don't remove from store) or after failed update (we keep local). |

---

## 5. Potential Bugs (Summary)

1. **Realtime DELETE not reflected**  
   **File:** `supabaseService.ts` (realtime handler), `gameSessionStore.ts` (subscription callback).  
   **Issue:** On session DELETE we only log; `sessions.value` is not updated.  
   **Fix:** Support an `onSessionDeleted(sessionId)` (or extend callback); in store, remove session from `sessions.value`.

2. **confirmExit order**  
   **File:** `QuestView.vue:841-865`.  
   **Issue:** resetQuestProgress (which calls syncSessionQuestSnapshot) runs before deleteSession; we may update a session we are about to delete.  
   **Fix:** Call deleteSession first, then resetQuestProgress.

3. **Realtime INSERT/UPDATE always fetches session**  
   **File:** `supabaseService.ts:472-476`.  
   **Issue:** getSessionById can 500 or be slow; race when multiple events.  
   **Fix (optional):** Map `payload.new` (row) to GameSession and callback with it; fallback to getSessionById only on mapping failure.

4. **Sessions subscription never cleaned up**  
   **File:** `gameSessionStore.ts:99-201`.  
   **Issue:** If you add a "logout" or full app teardown, subscription will remain.  
   **Fix:** Export a way to unsubscribe (e.g. `stopSubscriptions()`) and call it on logout.

5. **visibilitychange listener never removed**  
   **File:** `gameSessionStore.ts:203-212`.  
   **Issue:** document listener added, never removed.  
   **Fix:** Store remove function and call it when store is reset or on app unmount (if ever).

6. **resolveQuestion uses quizStore.getQuestById**  
   **File:** `gameSessionStore.ts:743-746`.  
   **Issue:** If quest was deleted or not loaded, we don't award points; we only warn.  
   **Fix:** Optional: fallback to `session.quest` for question value when getQuestById is null.

---

## 6. Suggested Fixes (Concrete)

### 6.1 Handle session DELETE in realtime

- In `supabaseService.ts`, extend `subscribeToSessions(callback, onSessionDeleted?)`. On `payload.eventType === 'DELETE'` call `onSessionDeleted?.(payload.old.id)`.
- In `gameSessionStore.ts`, pass `(session) => { ... }` and `(sessionId) => { sessions.value = sessions.value.filter(s => s.id !== sessionId) }`.

### 6.2 confirmExit order

- In `QuestView.vue` confirmExit: first `await sessionStore.deleteSession(session.value.id)`, then if needed `await quizStore.resetQuestProgress(questId.value)`. Optionally skip syncSessionQuestSnapshot for the deleted session (already gone from store).

### 6.3 Optional: use payload.new for realtime

- In `supabaseService`, add `mapRowToSession(row)` (same shape as getSessionById return). On INSERT/UPDATE use `mapRowToSession(payload.new)` and callback; if mapping fails or row incomplete, fallback to getSessionById.

### 6.4 Logging for traceability

- **Session lifecycle:** Log in createSession, deleteSession, and in confirmExit (session id, code).
- **Quest updates:** Log in loadFromStorage (count), initializeSubscription (userId), and in realtime quest callback (quest id).
- **Game save:** Log before/after updateSession (session id, state, activeQuestion?.questionId) at one central place or in 1–2 key call sites.
- **Realtime:** Already logged (payload, getSessionById result). Add log when DELETE is handled and session removed from store.

---

## 7. Files and Lines Reference

| Topic | File | Lines (approx) |
|-------|------|-----------------|
| Session creation | HostSetupView.vue | 264-265 |
| createSession | gameSessionStore.ts | 292-329 |
| createSessionInDb | supabaseService.ts | 232-258 |
| Realtime subscription | supabaseService.ts | 440-537 |
| Realtime DELETE | supabaseService.ts | 480-483 |
| Session subscription callback | gameSessionStore.ts | 99-201 |
| updateSession (no rows) | supabaseService.ts | 310-318 |
| resetQuestProgress + sync | quizStore.ts | 615-640 |
| confirmExit | QuestView.vue | 841-865 |
| resolveQuestion quest lookup | gameSessionStore.ts | 743-746 |
| initializeSubscription | quizStore.ts | 146-165 |
| visibilitychange | gameSessionStore.ts | 203-212 |

---

## 8. Improvements for Stability

1. **Remove stale session on DELETE** (see 6.1).  
2. **Reorder confirmExit** (see 6.2).  
3. **Optional: map payload.new in realtime** to avoid GET and races (see 6.3).  
4. **Add tracing logs** (see 6.4) for session lifecycle, quest load/subscription, and key save events.  
5. **Consider version or updated_at** for session: only apply realtime update if `payload.new.updated_at` >= current session.updatedAt to avoid stale overwrites.  
6. **Document** that `session.quest` is a snapshot and does not change when the quest is edited in admin.

---

## 9. Редактирование квеста и загрузка медиа (доп. проверка)

### 9.1 Редактирование квеста

| Что | Где | Вывод |
|-----|-----|--------|
| Обновление квеста в БД | `supabaseService.ts:108-130` | `updateQuest(quest, userId)` пишет в колонку `data` **весь** объект `quest` (включая все раунды, категории, вопросы и **все медиа в base64**). При большом количестве картинок payload может быть очень большим (лимиты Postgres/Supabase, медленная запись/чтение). |
| Сохранение после правок | `quizStore.ts:39-57` | `saveToStorage()` в цикле по всем квестам вызывает `updateQuestInDb(quest)` или `createQuestInDb`. При ошибке одного квеста только логируем и идём дальше — часть квестов может не сохраниться. |
| updateQuestion | `quizStore.ts:455-476` | Если в `payload` есть `questionMedia` или `answerMedia`, они подменяют массив целиком; остальное — через `Object.assign(question, rest)`. Затем `await saveToStorage()`. Логика корректна. |
| appendQuestionMedia | `quizStore.ts:506-549` | Читает файлы через `FileReader.readAsDataURL` → медиа хранятся как **data URL** в объекте квеста. Лимиты: вопрос — до 3 изображений ИЛИ 1 аудио; ответ — до 3 изображений и 1 аудио. |
| removeQuestionMedia | `quizStore.ts:551-565` | Удаляет элемент по `mediaId`, затем `saveToStorage()`. Ошибки нет. |

### 9.2 Загрузка и отображение медиа

| Что | Где | Вывод |
|-----|-----|--------|
| Валидация аудио в модалке | `QuestionModal.vue` (computed `questionMediaAudio`) | Раньше для не-data URL вызывался `new URL(urlTrimmed)`; для **относительных путей** (`audio/я5.mp3`) это падало, и такие медиа **исключались** из списка → аудио из импортированного квеста не воспроизводилось. **Исправлено:** относительные пути (без `http://`/`https://`) считаем валидными. |
| Отображение | `QuestionMediaPreview.vue` | `<img :src="media.url">` и `<audio :src="media.url">`. Data URL и относительные пути (при корректной раздаче из `public/`) работают. |
| Задержка появления (delay) | `AdminQuestionRow.vue:315-340` (updateMediaDelay) | Ищет квест/раунд/категорию/вопрос в store, **мутирует** `mediaList[mediaIndex].delay`, присваивает `question[key] = mediaList`, затем вызывает `store.updateQuestion(..., { [key]: mediaList })`. Работает, но идёт прямая мутация store и повторная передача того же массива; для реактивности надёжнее создавать новый массив и передавать его в `updateQuestion`. |

### 9.3 Потенциальные риски (без правок в коде)

- **Размер payload:** много вопросов с картинками в base64 → большой JSON в `quests.data` → возможны таймауты или лимиты. Вариант: хранить медиа в Storage (Supabase Storage), в квесте держать только URL.
- **handleUpload:** `appendQuestionMedia` всегда возвращает `Promise<MediaAsset[]>`, проверка `if (!promise)` в `AdminQuestionRow.vue` никогда не срабатывает (мёртвый код).
- **Относительные пути:** для путей вида `audio/файл.mp3` воспроизведение возможно только если файлы реально лежат в `public/audio/` (или аналог) и отдаются сервером.

---

## 10. Implemented Fixes (after audit)

| Fix | Status |
|-----|--------|
| **Realtime DELETE** | `subscribeToSessions` now accepts optional `onSessionDeleted(sessionId)`. Store passes callback that removes session from `sessions.value`. |
| **confirmExit order** | In `QuestView.vue`, `deleteSession` is called first, then `resetQuestProgress`. So `syncSessionQuestSnapshot` no longer runs for the current session (it is already removed from the store). |
| **Tracing logs** | Added: `[Lifecycle] Session created`, `[Lifecycle] Session deleted`, `[Lifecycle] Session closed` (host exit), `[Quest] Loaded from storage`, `[Quest] Realtime: quest updated/added`, `[Quest] Realtime subscription initialized`, `[Realtime] game_sessions payload` / `Session deleted` / `Removed deleted session from store`, `[Save] Session updated` on successful updateSession. |
| **Медиа: относительные пути** | In `QuestionModal.vue`, validation in `questionMediaAudio` no longer rejects relative URLs (e.g. `audio/я5.mp3`). Paths that are not `data:` and not `http(s):` are now treated as valid (for imported quests). |
