import { ref, watch, type Ref } from 'vue'
import type { MediaAsset } from '@/types'
import { safeMediaUrl } from '@/utils/mediaUrl'

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.decoding = 'async'
    const done = () => resolve()
    img.onload = done
    img.onerror = done
    img.src = url
  })
}

/** Preload зображень перед показом блоку питання — текст і картинка з’являються разом. */
export function useQuestionContentReady(
  revealKey: Ref<string | null | undefined>,
  images: Ref<MediaAsset[]>
) {
  const ready = ref(true)

  watch(
    [revealKey, () => images.value.map(m => `${m.id}:${m.url}`).join('|')],
    async ([key]) => {
      if (!key) {
        ready.value = true
        return
      }
      const urls = images.value
        .map(m => safeMediaUrl(m.url))
        .filter((u): u is string => Boolean(u))
      if (!urls.length) {
        ready.value = true
        return
      }
      ready.value = false
      await Promise.all(urls.map(preloadImage))
      if (revealKey.value === key) {
        ready.value = true
      }
    },
    { immediate: true }
  )

  return { ready }
}
