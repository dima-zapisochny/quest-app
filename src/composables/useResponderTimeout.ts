import { watch, onBeforeUnmount } from 'vue'
import { useGameSessionStore } from '@/store/gameSessionStore'
import type { GameSession } from '@/types'

/**
 * Хост — авторитет по таймауту отвечающего (#12): даже если у отвечающего закрыта
 * вкладка, хост снимет право ответа через limitMs от серверного responderStartedAt.
 * Следит за активным отвечающим и ставит один отложенный timeoutResponder; при
 * смене отвечающего/показе ответа/размонтировании таймер снимается.
 */
export function useResponderTimeout(
  getSession: () => GameSession | undefined,
  limitMs = 10000
) {
  const store = useGameSessionStore()
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function clear() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  watch(
    () => {
      const aq = getSession()?.activeQuestion
      return aq && aq.currentResponderId && !aq.showAnswer ? aq.responderStartedAt ?? null : null
    },
    (startedAt) => {
      clear()
      if (!getSession() || startedAt == null) return
      const remaining = Math.max(0, limitMs - (Date.now() - startedAt))
      timeoutId = setTimeout(() => {
        const session = getSession()
        const aq = session?.activeQuestion
        if (session?.id && aq?.currentResponderId && !aq.showAnswer) {
          store.timeoutResponder(session.id)
        }
      }, remaining)
    },
    { immediate: true }
  )

  onBeforeUnmount(clear)

  return { clear }
}
