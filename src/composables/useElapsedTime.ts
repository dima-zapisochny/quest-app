import { ref, onBeforeUnmount } from 'vue'

/**
 * Секундомер с шагом 100мс. `elapsed` — секунды с момента start(); `startedAt` —
 * метка старта (ms) или null. Используется для показа медиа с задержкой в
 * QuestionModal. Интервал автоматически очищается при размонтировании.
 */
export function useElapsedTime() {
  const elapsed = ref(0)
  const startedAt = ref<number | null>(null)
  let interval: number | null = null

  function clear() {
    if (interval !== null) {
      clearInterval(interval)
      interval = null
    }
  }

  /** Запускает отсчёт с нуля (перезапуская интервал, если он уже шёл). */
  function start() {
    clear()
    startedAt.value = Date.now()
    elapsed.value = 0
    interval = window.setInterval(() => {
      if (startedAt.value !== null) {
        elapsed.value = (Date.now() - startedAt.value) / 1000
      }
    }, 100)
  }

  /** Останавливает и полностью сбрасывает секундомер. */
  function reset() {
    clear()
    startedAt.value = null
    elapsed.value = 0
  }

  onBeforeUnmount(clear)

  return { elapsed, startedAt, start, reset }
}
