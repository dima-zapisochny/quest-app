import { computed, type Ref } from 'vue'
import type { Question } from '@/types'
import { safeMediaUrl, isPlayableAudioMedia } from '@/utils/mediaUrl'

/**
 * Медіа питання/відповіді — та сама логіка, що в QuestionModal (imageUrl, delay, audio).
 */
export function useQuestionMedia(
  question: Ref<Question | undefined>,
  elapsedSec: Ref<number>
) {
  const questionMediaImages = computed(() => {
    const q = question.value
    const safeUrl = q?.imageUrl ? safeMediaUrl(q.imageUrl) : null
    if (safeUrl) {
      return [{ id: 'img0', type: 'image' as const, name: 'Image', url: safeUrl }]
    }
    return q?.questionMedia?.filter((m) => m.type === 'image' && !!safeMediaUrl(m.url)) ?? []
  })

  const visibleQuestionImages = computed(() => {
    const opened = question.value && elapsedSec.value >= 0
    if (!opened) {
      return questionMediaImages.value.filter((m) => (m.delay ?? 0) === 0)
    }
    return questionMediaImages.value.filter((m) => elapsedSec.value >= (m.delay ?? 0))
  })

  const questionMediaAudio = computed(() => {
    const q = question.value
    const fromUrl =
      q?.audioUrl && safeMediaUrl(q.audioUrl)
        ? [{ id: 'audio-url', type: 'audio' as const, name: '', url: safeMediaUrl(q.audioUrl)! }]
        : []
    if (!Array.isArray(q?.questionMedia)) return fromUrl
    return [...fromUrl, ...q.questionMedia.filter(isPlayableAudioMedia)]
  })

  const answerMediaImages = computed(() => {
    const q = question.value
    const safeUrl = q?.answerImageUrl ? safeMediaUrl(q.answerImageUrl) : null
    const fromUrl = safeUrl
      ? [{ id: 'ans-img-url', type: 'image' as const, name: '', url: safeUrl }]
      : []
    const fromMedia =
      q?.answerMedia?.filter((m) => m?.type === 'image' && !!safeMediaUrl(m.url)) ?? []
    return [...fromUrl, ...fromMedia]
  })

  const answerMediaAudio = computed(() => {
    const q = question.value
    const answerAudioSafe = q?.answerAudioUrl ? safeMediaUrl(q.answerAudioUrl) : null
    const fromUrl = answerAudioSafe
      ? [{ id: 'ans-audio-url', type: 'audio' as const, name: '', url: answerAudioSafe }]
      : []
    const list = q?.answerMedia
    if (!Array.isArray(list)) return fromUrl
    return [...fromUrl, ...list.filter(isPlayableAudioMedia)]
  })

  const hasQuestionAudio = computed(() => questionMediaAudio.value.length > 0)

  return {
    visibleQuestionImages,
    questionMediaAudio,
    answerMediaImages,
    answerMediaAudio,
    hasQuestionAudio
  }
}
