import { ref, watch, onBeforeUnmount, type Ref } from 'vue'
import type { ActiveQuestionState } from '@/types'

/** Секунди з activeQuestion.openedAt для відкладених картинок на екрані гравця. */
export function useQuestionElapsed(activeQuestion: Ref<ActiveQuestionState | undefined>) {
  const elapsedSec = ref(0)
  let intervalId: number | null = null

  function clear() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  function tick() {
    const openedAt = activeQuestion.value?.openedAt
    elapsedSec.value = openedAt ? (Date.now() - openedAt) / 1000 : 0
  }

  watch(
    () => activeQuestion.value?.questionId,
    () => {
      clear()
      tick()
      if (activeQuestion.value?.questionId) {
        intervalId = window.setInterval(tick, 100)
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(clear)

  return { elapsedSec }
}
