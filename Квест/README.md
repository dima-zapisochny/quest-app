# Імпорт квеста з Структура.html

Скрипт `scripts/import-quest-from-struktura.mjs` парсить квест з файлу **Структура.html**, завантажує аудіо/зображення в Supabase Storage і генерує JSON у форматі quest-app із **посиланнями** на медіа (без base64).

## Як запустити

З кореня проєкту:

```bash
node scripts/import-quest-from-struktura.mjs
```

## Що потрібно

1. **Файли медіа** — у цій папці (Квест) або в підпапках:
   - Шляхи з HTML типу `audio/Р1К1_100.mp3` шукаються як `Квест/audio/Р1К1_100.mp3` або **Квест/Р1К1_100.mp3** (без префікса).
   - Шляхи типу `images/ал100.jpg` шукаються як `Квест/images/...` або **Квест/ФОТО/...**.

2. **Для завантаження в Supabase** у `.env`:
   - `VITE_SUPABASE_URL` (або `SUPABASE_URL`)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase Dashboard → Settings → API)
   - `USER_ID=uuid` — id користувача, для якого створюється квест

3. **Bucket** `quest-media` у Supabase Storage і політики RLS (див. `SUPABASE_SETUP.md` та `scripts/create-quest-media-storage-policy.sql`).

## Результат

- **Квест/quest-generated.json** — квест у форматі додатку з полями `questionMedia` / `answerMedia`, де кожен елемент має `url` (посилання на Storage). Якщо скрипт запускали без Supabase або частини файлів не знайдено, масиви медіа будуть порожні або частково заповнені.
- Якщо задано `USER_ID`, квест також створюється в таблиці `quests` у Supabase.

## Чому «Uploaded 0 media files» і квест не створився?

Скрипт використовує **SUPABASE_SERVICE_ROLE_KEY** (не anon key). Якщо в `.env` його немає, клієнт Supabase не створюється, завантаження в Storage не відбувається і квест у БД не додається. Додай у `.env` ключ **service_role** з Supabase Dashboard → Settings → API → Project API keys.

## Тільки структура (без завантаження)

Щоб лише перевірити парсинг і згенерувати JSON без медіа:

```bash
DRY_RUN=1 node scripts/import-quest-from-struktura.mjs
```

У такому випадку медіа не завантажуються, у JSON будуть порожні `questionMedia`/`answerMedia`.
