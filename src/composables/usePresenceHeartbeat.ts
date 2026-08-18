import { onBeforeUnmount, type Ref } from 'vue'
import { useGameSessionStore } from '@/store/gameSessionStore'

/**
 * Presence-пинг (#5/#10): пока компонент смонтирован, шлём heartbeat каждые
 * intervalMs и дополнительно сразу при возврате вкладки в фокус (после фонового
 * троттлинга). Уход со страницы НЕ ловим — heartbeat просто прекращается, и хост
 * убирает игрока по TTL (prune_stale_players). Вызовите start() после инициализации
 * сессии; остановка и снятие слушателя — автоматически при размонтировании.
 */
export function usePresenceHeartbeat(
  sessionId: string,
  playerId: Ref<string | null>,
  intervalMs = 15000
) {
  const store = useGameSessionStore()
  let timer: ReturnType<typeof setInterval> | null = null
  let onVisibility: (() => void) | null = null

  function ping() {
    if (sessionId && playerId.value) {
      store.heartbeat(sessionId, playerId.value)
    }
  }

  function start() {
    stop()
    ping()
    timer = setInterval(ping, intervalMs)
    onVisibility = () => {
      if (document.visibilityState === 'visible') ping()
    }
    document.addEventListener('visibilitychange', onVisibility)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    if (onVisibility) {
      document.removeEventListener('visibilitychange', onVisibility)
      onVisibility = null
    }
  }

  onBeforeUnmount(stop)

  return { start, stop, ping }
}
