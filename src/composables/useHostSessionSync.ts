import { onBeforeUnmount } from 'vue'
import { useGameSessionStore } from '@/store/gameSessionStore'

interface HostSyncOptions {
  /** Период резервного поллинга сессии (Realtime — основной канал). По умолчанию 15с (#18). */
  pollMs?: number
  /** Период проверки протухших игроков. По умолчанию 20с. */
  pruneCheckMs?: number
  /** TTL heartbeat: с запасом на фоновый троттлинг вкладки игрока. По умолчанию 90с (#5). */
  pruneTtlMs?: number
}

/**
 * Хостовая синхронизация сессии: резервный поллинг с сервера (на случай обрыва
 * WebSocket) и prune протухших игроков по TTL heartbeat. Идентификатор сессии
 * читается на каждом тике через getSessionId, так что переживает позднюю загрузку.
 * Интервалы снимаются автоматически при размонтировании.
 */
export function useHostSessionSync(
  getSessionId: () => string | undefined,
  options: HostSyncOptions = {}
) {
  const store = useGameSessionStore()
  const pollMs = options.pollMs ?? 15000
  const pruneCheckMs = options.pruneCheckMs ?? 20000
  const pruneTtlMs = options.pruneTtlMs ?? 90000

  let pollTimer: ReturnType<typeof setInterval> | null = null
  let pruneTimer: ReturnType<typeof setInterval> | null = null

  function start() {
    stop()
    pollTimer = setInterval(() => {
      const id = getSessionId()
      if (id) store.refreshSessionFromServer(id)
    }, pollMs)
    pruneTimer = setInterval(() => {
      const id = getSessionId()
      if (id) store.pruneStalePlayers(id, pruneTtlMs)
    }, pruneCheckMs)
  }

  function stop() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
    if (pruneTimer) {
      clearInterval(pruneTimer)
      pruneTimer = null
    }
  }

  onBeforeUnmount(stop)

  return { start, stop }
}
