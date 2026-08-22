import { ref } from 'vue'

const STORAGE_KEY = 'quiz-app-ui-sound-enabled'

function loadSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === null) return true
  return stored === 'true'
}

const soundEnabled = ref(loadSoundEnabled())

export function isUiSoundEnabled(): boolean {
  return soundEnabled.value
}

export function useUiSound() {
  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem(STORAGE_KEY, String(soundEnabled.value))
  }

  return {
    soundEnabled,
    toggleSound
  }
}
