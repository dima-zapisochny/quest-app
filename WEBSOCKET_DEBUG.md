# Диагностика WebSocket синхронизации

## Проверка работы WebSocket

### 1. Проверьте, что real-time включен в Supabase

**Важно:** Real-time должен быть включен для таблицы `game_sessions`!

#### Способ 1: Через Supabase Dashboard (РЕКОМЕНДУЕТСЯ)
1. Откройте [Supabase Dashboard](https://app.supabase.com)
2. Выберите ваш проект
3. Перейдите в **Database** → **Replication**
4. Найдите таблицу `game_sessions`
5. Включите переключатель **"Enable Realtime"**
6. Сохраните изменения

#### Способ 2: Через SQL
Выполните SQL из файла `enable-realtime.sql` в Supabase SQL Editor

### 2. Проверьте консоль браузера

Откройте консоль браузера (F12) и проверьте логи:

#### При загрузке страницы должны появиться:
- `✅ Successfully subscribed to game_sessions changes via WebSocket`
- `📡 WebSocket channel: ... is now listening for changes`

#### При присоединении участника должны появиться:
- `💾 Updating session in database: ...`
- `✅ Session updated successfully, players count: ...`
- `📡 WebSocket should trigger UPDATE event for session: ...`
- `📨 WebSocket payload received: ...` (на ВСЕХ вкладках)
- `🔄 Loading session from database: ...`
- `✅ Session loaded, players count: ...`
- `📡 WebSocket update received for session: ...`
- `🔄 Session updated in array: ...`
- `👥 Players list changed: ...`

### 3. Если логи не появляются

#### Проблема: Нет логов о подписке
- **Решение:** Real-time не включен. Включите через Dashboard (см. выше)

#### Проблема: Есть логи об обновлении в БД, но нет WebSocket payload
- **Решение:** Real-time не включен или не работает. Проверьте настройки Supabase

#### Проблема: Есть WebSocket payload, но нет обновления UI
- **Решение:** Проблема с реактивностью Vue. Проверьте логи `🔄 Session updated in array` и `👥 Players list changed`

### 4. Тестирование

1. Откройте игру в одной вкладке (хост)
2. Откройте другую вкладку и присоединитесь к игре (участник)
3. В консоли хоста должны появиться логи об обновлении
4. Список участников должен обновиться автоматически

### 5. Частые проблемы

**Проблема:** Список участников не обновляется
- Проверьте, что real-time включен
- Проверьте логи в консоли
- Убедитесь, что WebSocket подписка активна

**Проблема:** WebSocket события не приходят
- Проверьте настройки Supabase
- Проверьте, что таблица `game_sessions` существует
- Проверьте права доступа (RLS policies)

**Проблема:** Vue не обновляет UI
- Проверьте логи `🔄 Session updated in array`
- Проверьте логи `👥 Players list changed`
- Убедитесь, что watch срабатывает


