import { ref, watch } from 'vue'

/**
 * Настройки игры ведущего (хранятся локально в браузере).
 * readDelaySec — сколько секунд после открытия вопроса кнопка ответа заблокирована
 * (время на чтение). 0 — без задержки. Диапазон 0..10, по умолчанию 5.
 */
const STORAGE_KEY = 'quiz-read-delay-sec'
export const READ_DELAY_MIN = 0
export const READ_DELAY_MAX = 10
export const READ_DELAY_DEFAULT = 5

function clampDelay(value: number): number {
  if (!Number.isFinite(value)) return READ_DELAY_DEFAULT
  return Math.min(READ_DELAY_MAX, Math.max(READ_DELAY_MIN, Math.round(value)))
}

function loadReadDelay(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return READ_DELAY_DEFAULT
    return clampDelay(Number(raw))
  } catch {
    return READ_DELAY_DEFAULT
  }
}

// Синглтон-состояние: слайдер на главной пишет сюда, а логика игры читает актуальное значение.
const readDelaySec = ref(loadReadDelay())

watch(readDelaySec, value => {
  try {
    localStorage.setItem(STORAGE_KEY, String(clampDelay(value)))
  } catch {
    // localStorage может быть недоступен — просто игнорируем
  }
})

/** Актуальное значение задержки на чтение (для стора/логики игры). */
export function getReadDelaySec(): number {
  return clampDelay(readDelaySec.value)
}

export function useGameSettings() {
  return { readDelaySec }
}
