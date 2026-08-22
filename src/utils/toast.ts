import { ref } from 'vue'

export const toastVisible = ref(false)
export const toastMessage = ref('')

let hideTimer: ReturnType<typeof setTimeout> | null = null

/** Спливаюче сповіщення зверху екрана. */
export function showToast(message: string, durationMs = 2400) {
  toastMessage.value = message
  toastVisible.value = true
  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    toastVisible.value = false
  }, durationMs)
}
