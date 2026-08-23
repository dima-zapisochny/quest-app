import { ref, onMounted, onBeforeUnmount } from 'vue'

const DESKTOP_MIN_WIDTH = 1024
const PHONE_MAX_WIDTH = 768

/**
 * Returns a ref that is true when viewport width is below DESKTOP_MIN_WIDTH (mobile/tablet).
 * Use to disable desktop-only actions (create game, start game, game board).
 */
export function useIsMobileViewport() {
  const isMobileViewport = ref(
    typeof window !== 'undefined' && window.innerWidth < DESKTOP_MIN_WIDTH
  )
  let media: MediaQueryList | null = null
  let handler: (() => void) | null = null

  onMounted(() => {
    if (typeof window === 'undefined') return
    isMobileViewport.value = window.innerWidth < DESKTOP_MIN_WIDTH
    media = window.matchMedia(`(max-width: ${DESKTOP_MIN_WIDTH - 1}px)`)
    handler = () => {
      isMobileViewport.value = media!.matches
    }
    media.addEventListener('change', handler)
  })

  onBeforeUnmount(() => {
    if (media && handler) {
      media.removeEventListener('change', handler)
    }
  })

  return { isMobileViewport }
}

/**
 * True on phones (≤768px). Tablets and desktop are excluded.
 */
export function useIsPhoneViewport() {
  const isPhoneViewport = ref(
    typeof window !== 'undefined' && window.innerWidth <= PHONE_MAX_WIDTH
  )
  let media: MediaQueryList | null = null
  let handler: (() => void) | null = null

  onMounted(() => {
    if (typeof window === 'undefined') return
    isPhoneViewport.value = window.innerWidth <= PHONE_MAX_WIDTH
    media = window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH}px)`)
    handler = () => {
      isPhoneViewport.value = media!.matches
    }
    media.addEventListener('change', handler)
  })

  onBeforeUnmount(() => {
    if (media && handler) {
      media.removeEventListener('change', handler)
    }
  })

  return { isPhoneViewport }
}
