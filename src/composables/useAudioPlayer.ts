import { ref } from 'vue'
import type { MediaAsset } from '@/types'

/**
 * Плеер для набора <audio> элементов: одновременно играет только один трек.
 * Регистрируйте элементы через setRef(id, el) (ref-колбэк в шаблоне), затем
 * toggle(media) для play/pause. Вынесено из QuestionModal.
 */
export function useAudioPlayer() {
  const playingId = ref<string | null>(null)
  const audioRefs = ref<Record<string, HTMLAudioElement | null>>({})

  function setRef(id: string, el: unknown) {
    if (el instanceof HTMLAudioElement) {
      audioRefs.value[id] = el
    }
  }

  function pauseOthers(except?: HTMLAudioElement) {
    Object.values(audioRefs.value).forEach(a => {
      if (a && a !== except) {
        a.pause()
        a.currentTime = 0
      }
    })
  }

  /** Останавливает все треки и сбрасывает playingId. */
  function stopAll() {
    pauseOthers()
    playingId.value = null
  }

  /** Переключает воспроизведение трека: тот же id — стоп, иначе — играет только его. */
  function toggle(audio: MediaAsset) {
    const el = audioRefs.value[audio.id]
    if (!el) return

    if (playingId.value === audio.id) {
      el.pause()
      el.currentTime = 0
      playingId.value = null
    } else {
      pauseOthers(el)
      el.play().catch(error => console.error('Error playing audio:', error))
      playingId.value = audio.id
    }
  }

  function onEnded() {
    playingId.value = null
  }

  return { playingId, audioRefs, setRef, stopAll, toggle, onEnded }
}
