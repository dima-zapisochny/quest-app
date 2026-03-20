<template>
  <Transition name="modal">
    <div v-if="isOpen && question" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <header class="modal-header">
          <button class="modal-close" @click="handleClose" aria-label="Закрыть">✕</button>
        </header>

        <section v-if="!showAnswer" class="question-pane">
          <div class="question-body" :class="{ 'has-visible-images': visibleImages.length > 0 }">
            <div class="question-header">
            <h2 class="modal-title" v-html="question.question"></h2>
            </div>
            <div 
              v-if="visibleImages.length" 
              class="media-grid"
              :class="{ 
                'media-grid--multiple': visibleImages.length > 1,
                'media-grid--three': visibleImages.length === 3
              }"
            >
              <TransitionGroup name="fade">
                <QuestionMediaPreview
                  v-for="media in visibleImages"
                  :key="media.id"
                  :media="media"
                />
              </TransitionGroup>
            </div>
            <div v-if="hasAudio" class="audio-controls">
              <div
                v-for="audio in questionMediaAudio"
                :key="audio.id"
                class="audio-control-block"
                :class="{ 'is-playing': playingAudioId === audio.id }"
              >
                <button
                  class="audio-play-button"
                  :class="{ 'is-playing': playingAudioId === audio.id }"
                  @click="toggleAudio(audio)"
                  type="button"
                  aria-label="Проиграть аудио"
                >
                  <svg v-if="playingAudioId !== audio.id" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                </button>
                <div class="audio-equalizer">
                  <div class="equalizer-bar" style="animation-delay: 0s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.08s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.16s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.24s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.32s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.4s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.48s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.56s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.64s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.72s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.8s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.88s"></div>
                  <div class="equalizer-bar" style="animation-delay: 0.96s"></div>
                  <div class="equalizer-bar" style="animation-delay: 1.04s"></div>
                  <div class="equalizer-bar" style="animation-delay: 1.12s"></div>
                  <div class="equalizer-bar" style="animation-delay: 1.2s"></div>
                  <div class="equalizer-bar" style="animation-delay: 1.28s"></div>
                </div>
              </div>
              <audio
                v-for="audio in questionMediaAudio"
                :key="audio.id"
                :ref="el => setAudioRef(audio.id, el)"
                :src="audio.url"
                preload="none"
                @ended="handleAudioEnded"
              ></audio>
            </div>
          </div>
          <aside class="admin-panel">
            <div class="admin-controls-block">
              <TimerCircle
                :duration-sec="30"
                :auto-start="true"
                ref="timerRef"
                @finished="handleReveal"
              />
              <div v-if="isHostSession" class="host-buttons-row">
                <button 
                  class="host-button host-button-success" 
                  type="button" 
                  :disabled="!canResolve" 
                  @click="handleResolve(true)"
                  aria-label="Правильно"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                <button
                  v-if="!showAnswer"
                  type="button"
                  class="host-button host-button-pause"
                  :aria-label="isTimerPaused ? 'Продолжить' : 'Пауза'"
                  @click="togglePause"
                >
                  <svg v-if="!isTimerPaused" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </button>
                <button 
                  class="host-button host-button-danger" 
                  type="button" 
                  :disabled="!canResolve" 
                  @click="handleResolve(false)"
                  aria-label="Неправильно"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div class="responder-info-card">
              <div v-if="currentResponder" class="responder-card-content">
                <div class="responder-avatar">{{ avatarEmoji(currentResponder.avatar) }}</div>
                <div class="responder-details">
                  <div class="responder-name">{{ currentResponder.name }}</div>
                  <div class="responder-label">Отвечает</div>
                </div>
              </div>
              <div v-else class="responder-empty">
                <span>Ожидание ответа</span>
              </div>
            </div>
          </aside>
        </section>

        <Transition name="fade">
          <section v-if="showAnswer" key="answer" class="answer-pane">
            <div class="answer-body">
              <h2 class="modal-title answer" v-html="question.answer"></h2>
              <div v-if="answerMediaImages.length" class="media-grid">
                <QuestionMediaPreview
                  v-for="media in answerMediaImages"
                  :key="media.id"
                  :media="media"
                />
              </div>
              <div v-if="answerMediaAudio.length" class="audio-controls">
                <div
                  v-for="audio in answerMediaAudio"
                  :key="audio.id"
                  class="audio-control-block"
                  :class="{ 'is-playing': playingAudioId === audio.id }"
                >
                  <button
                    class="audio-play-button"
                    :class="{ 'is-playing': playingAudioId === audio.id }"
                    @click="toggleAudio(audio)"
                    type="button"
                    aria-label="Проиграть аудио ответа"
                  >
                    <svg v-if="playingAudioId !== audio.id" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="6" y="4" width="4" height="16"></rect>
                      <rect x="14" y="4" width="4" height="16"></rect>
                    </svg>
                  </button>
                  <div class="audio-equalizer">
                    <div class="equalizer-bar" style="animation-delay: 0s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.08s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.16s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.24s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.32s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.4s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.48s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.56s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.64s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.72s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.8s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.88s"></div>
                    <div class="equalizer-bar" style="animation-delay: 0.96s"></div>
                    <div class="equalizer-bar" style="animation-delay: 1.04s"></div>
                    <div class="equalizer-bar" style="animation-delay: 1.12s"></div>
                    <div class="equalizer-bar" style="animation-delay: 1.2s"></div>
                    <div class="equalizer-bar" style="animation-delay: 1.28s"></div>
                  </div>
                </div>
                <audio
                  v-for="audio in answerMediaAudio"
                  :key="audio.id"
                  :ref="el => setAudioRef(audio.id, el)"
                  :src="audio.url"
                  preload="none"
                  @ended="handleAudioEnded"
                ></audio>
              </div>
            </div>
          </section>
        </Transition>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onBeforeUnmount, TransitionGroup } from 'vue'
import TimerCircle from './TimerCircle.vue'
import QuestionMediaPreview from './QuestionMediaPreview.vue'
import { useGameSessionStore } from '@/store/gameSessionStore'
import { useQuizStore } from '@/store/quizStore'
import type { Question, Player } from '@/types'
import { safeMediaUrl } from '@/utils/mediaUrl'

interface Props {
  isOpen: boolean
  question: Question | null
  sessionId?: string
  questId?: string
  roundId?: string
  categoryId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  finished: []
}>()

const gameSessionStore = useGameSessionStore()
const quizStore = useQuizStore()

const showAnswer = ref(false)
const timerRef = ref<InstanceType<typeof TimerCircle> | null>(null)
const playingAudioId = ref<string | null>(null)
const audioRefs = ref<Record<string, HTMLAudioElement | null>>({})
const questionOpenedAt = ref<number | null>(null)
const elapsedTime = ref(0)
let elapsedTimeInterval: number | null = null

const session = computed(() => (props.sessionId ? gameSessionStore.getSessionById(props.sessionId) : undefined))
const activeQuestion = computed(() => session.value?.activeQuestion)
// Мок: для тестирования считаем, что это хост-сессия, если попап открыт
const isHostSession = computed(() => !!session.value || props.isOpen)

// Мок-данные для тестирования (если нет реальной сессии)
const mockResponder: Player = {
  id: 'mock-responder-1',
  name: 'Алексей',
  avatar: 'fox',
  score: 0,
  joinedAt: Date.now(),
  status: 'buzzed'
}

// Отвечает только первый нажавший
const responderId = computed(() => {
  if (activeQuestion.value?.currentResponderId) {
    return activeQuestion.value.currentResponderId
  }
  // Мок: если нет сессии (sessionId пустой или undefined), всегда возвращаем мок-участника
  if (!props.sessionId || props.sessionId === '') {
    console.log('Мок: responderId возвращает мок-участника', mockResponder.id)
    return mockResponder.id
  }
  console.log('responderId: нет участника', { sessionId: props.sessionId })
  return null
})

const currentResponder = computed(() => {
  if (session.value && responderId.value) {
    return session.value.players.find(player => player.id === responderId.value) ?? null
  }
  // Мок: если нет сессии и есть responderId, возвращаем мок-участника
  if ((!props.sessionId || props.sessionId === '') && responderId.value === mockResponder.id) {
    console.log('Мок: currentResponder возвращает мок-участника', mockResponder)
    return mockResponder
  }
  console.log('currentResponder: нет участника', { sessionId: props.sessionId, responderId: responderId.value, mockId: mockResponder.id })
  return null
})

// Lightweight URLs (single imageUrl/audioUrl) or from questionMedia arrays
const questionImageUrl = computed(() => props.question?.imageUrl ?? null)
const questionAudioUrl = computed(() => props.question?.audioUrl ?? null)

// Проверка наличия картинки в медиа вопроса
const hasQuestionImage = computed(() => {
  return !!questionImageUrl.value || (props.question?.questionMedia?.some(media => media.type === 'image') ?? false)
})

// Фильтрация медиа: только изображения (или один imageUrl)
const questionMediaImages = computed(() => {
  if (questionImageUrl.value) {
    return [{ id: 'img0', type: 'image' as const, name: 'Image', url: questionImageUrl.value }]
  }
  return props.question?.questionMedia?.filter(media => media.type === 'image') ?? []
})

// Видимые изображения с учетом задержки (включая легкий imageUrl)
const visibleImages = computed(() => {
  const fromUrl = props.question?.imageUrl
    ? [{ id: 'img-url', type: 'image' as const, name: '', url: props.question.imageUrl!, delay: 0 }]
    : []
  if (!questionOpenedAt.value) return fromUrl
  const fromMedia = questionMediaImages.value.filter(media => {
    const delay = media.delay ?? 0
    return elapsedTime.value >= delay
  })
  return [...fromUrl, ...fromMedia]
})

// Аудио для вопроса: легкий audioUrl + questionMedia (только валидные URL для воспроизведения)
const questionMediaAudio = computed(() => {
  const fromUrl = props.question?.audioUrl && safeMediaUrl(props.question.audioUrl)
    ? [{ id: 'audio-url', type: 'audio' as const, name: '', url: safeMediaUrl(props.question.audioUrl)! }]
    : []
  if (!props.question?.questionMedia) return fromUrl
  if (!Array.isArray(props.question.questionMedia)) return fromUrl
  const audioFiles = props.question.questionMedia.filter(media => {
    // Проверяем существование объекта
    if (!media || typeof media !== 'object') {
      return false
    }
    
    // Проверяем тип
    if (!media.type || media.type !== 'audio') {
      return false
    }
    
    // Проверяем URL - должен быть непустой строкой
    if (!media.url) {
      return false
    }
    
    if (typeof media.url !== 'string') {
      return false
    }
    
    const urlTrimmed = media.url.trim()
    if (urlTrimmed === '') {
      return false
    }
    
    // Проверяем, что URL не является пустым data URL
    if (urlTrimmed === 'data:' || urlTrimmed.startsWith('data:,') || urlTrimmed === 'data:audio/') {
      return false
    }
    
    // Проверяем, что это валидный data URL или обычный URL
    if (urlTrimmed.startsWith('data:')) {
      // Для data URL проверяем, что есть данные после типа
      const dataUrlMatch = urlTrimmed.match(/^data:([^;]+);base64,(.+)$/)
      if (!dataUrlMatch || !dataUrlMatch[2] || dataUrlMatch[2].trim() === '') {
        return false
      }
    } else {
      // Относительные пути (audio/файл.mp3, images/фото.jpg) — допускаем для импортированных квестов
      if (!urlTrimmed.startsWith('http://') && !urlTrimmed.startsWith('https://')) {
        return true
      }
      // Для абсолютных URL проверяем, что это не placeholder
      const placeholderPatterns = [
        /^https?:\/\/example\.(com|org|net)/i,
        /^https?:\/\/placeholder/i,
        /^https?:\/\/test\./i,
        /^https?:\/\/dummy/i,
        /^https?:\/\/fake/i
      ]
      if (placeholderPatterns.some(pattern => pattern.test(urlTrimmed))) {
        return false
      }
      try {
        const urlObj = new URL(urlTrimmed)
        if (urlObj.hostname.includes('example.com') || urlObj.hostname.includes('example.org') || urlObj.hostname.includes('example.net')) {
          return false
        }
      } catch {
        return false
      }
    }
    return true
  })
  return [...fromUrl, ...audioFiles]
})

// Изображения в ответе (включая легкий answerImageUrl)
const answerMediaImages = computed(() => {
  const fromUrl = props.question?.answerImageUrl
    ? [{ id: 'ans-img-url', type: 'image' as const, name: '', url: props.question.answerImageUrl! }]
    : []
  const fromMedia = props.question?.answerMedia?.filter(m => m?.type === 'image') ?? []
  return [...fromUrl, ...fromMedia]
})

// Аудио в ответе (включая легкий answerAudioUrl)
const answerMediaAudio = computed(() => {
  const fromUrl = props.question?.answerAudioUrl && safeMediaUrl(props.question.answerAudioUrl)
    ? [{ id: 'ans-audio-url', type: 'audio' as const, name: '', url: props.question.answerAudioUrl }]
    : []
  const list = props.question?.answerMedia ?? []
  if (!Array.isArray(list)) return fromUrl
  const fromMedia = list.filter((media): media is import('@/types').MediaAsset => {
    if (!media || media.type !== 'audio' || !media.url || typeof media.url !== 'string') return false
    const url = media.url.trim()
    if (!url || url === 'data:' || url.startsWith('data:,')) return false
    if (url.startsWith('data:')) {
      const m = url.match(/^data:([^;]+);base64,(.+)$/)
      return !!(m && m[2]?.trim())
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) return true
    if (/^https?:\/\/example\.(com|org|net)|placeholder|dummy|fake/i.test(url)) return false
    try {
      const u = new URL(url)
      return !['example.com', 'example.org', 'example.net'].includes(u.hostname)
    } catch {
      return false
    }
  })
  return [...fromUrl, ...fromMedia]
})

// Проверка наличия валидного аудио
const hasAudio = computed(() => {
  const audioList = questionMediaAudio.value
  const count = audioList.length
  
  if (count === 0) {
    return false
  }
  
  // Дополнительная проверка - убеждаемся, что все аудио имеют валидные URL
  const allValid = audioList.every(audio => {
    if (!audio) return false
    if (!audio.url) return false
    if (typeof audio.url !== 'string') return false
    
    const urlTrimmed = audio.url.trim()
    if (urlTrimmed === '') return false
    if (urlTrimmed === 'data:') return false
    if (urlTrimmed.startsWith('data:,')) return false
    
    // Для data URL проверяем наличие данных
    if (urlTrimmed.startsWith('data:')) {
      const parts = urlTrimmed.split(',')
      if (parts.length < 2 || parts[1].trim() === '') {
        return false
      }
    }
    
    return true
  })
  
  return allValid
})

function setAudioRef(id: string, el: HTMLAudioElement | null) {
  if (el) {
    audioRefs.value[id] = el
  }
}

function toggleAudio(audio: MediaAsset) {
  const audioElement = audioRefs.value[audio.id]
  if (!audioElement) return

  if (playingAudioId.value === audio.id) {
    // Останавливаем текущее аудио
    audioElement.pause()
    audioElement.currentTime = 0
    playingAudioId.value = null
  } else {
    // Останавливаем все другие аудио
    Object.values(audioRefs.value).forEach(a => {
      if (a && a !== audioElement) {
        a.pause()
        a.currentTime = 0
      }
    })
    // Воспроизводим выбранное аудио
    audioElement.play().catch(error => {
      console.error('Error playing audio:', error)
    })
    playingAudioId.value = audio.id
  }
}

function handleAudioEnded() {
  playingAudioId.value = null
}

// Кнопки доступны только когда есть отвечающий и время установлено
const canResolve = computed(() => {
  // Мок: если нет сессии, кнопки всегда доступны
  if (!props.sessionId) {
    return responderId.value !== null
  }
  return responderId.value !== null && timerRef.value !== null
})

const isTimerPaused = computed(() => activeQuestion.value?.timerPaused ?? false)

function togglePause() {
  if (!props.sessionId) return
  if (isTimerPaused.value) {
    gameSessionStore.resumeTimer(props.sessionId)
  } else {
    gameSessionStore.pauseTimer(props.sessionId)
  }
}

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      resetModal()
      
      // Сбрасываем время открытия вопроса
      questionOpenedAt.value = Date.now()
      elapsedTime.value = 0
      
      // Запускаем отсчет времени для отображения изображений с задержкой
      if (elapsedTimeInterval) {
        clearInterval(elapsedTimeInterval)
      }
      elapsedTimeInterval = window.setInterval(() => {
        if (questionOpenedAt.value) {
          elapsedTime.value = (Date.now() - questionOpenedAt.value) / 1000
        }
      }, 100) // Обновляем каждые 100мс для плавности
      
      // Если есть сессия, открываем вопрос в store для синхронизации с участниками
      if (props.sessionId && props.question && props.roundId && props.categoryId) {
        console.log('📤 Opening question in session:', {
          sessionId: props.sessionId,
          roundId: props.roundId,
          categoryId: props.categoryId,
          questionId: props.question.id
        })
        try {
          await gameSessionStore.openQuestion(props.sessionId, {
            roundId: props.roundId,
            categoryId: props.categoryId,
            questionId: props.question.id
          })
          console.log('✅ Question opened in session')
        } catch (error) {
          console.error('❌ Error opening question in session:', error)
        }
      }
      
      // Мок: если нет сессии, останавливаем таймер через задержку после инициализации
      if (!props.sessionId) {
        setTimeout(() => {
          if (timerRef.value && responderId.value) {
            timerRef.value.pause()
          }
        }, 2000) // Увеличиваем задержку до 2 секунд для надежности
      }
    } else {
      timerRef.value?.stop()
      
      // Если есть сессия, закрываем вопрос в store
      if (props.sessionId) {
        console.log('📤 Closing question in session:', props.sessionId)
        try {
          await gameSessionStore.closeQuestion(props.sessionId)
          console.log('✅ Question closed in session')
        } catch (error) {
          console.error('❌ Error closing question in session:', error)
        }
      }
    }
  }
)

watch(
  () => props.question?.id,
  () => {
    if (props.isOpen) {
      resetModal()
      // Якщо питання змінюється, коли модалка вже відкрита,
      // resetModal() скидає questionOpenedAt та зупиняє interval,
      // тому відкладені картинки з questionMedia можуть не з’являтися.
      questionOpenedAt.value = Date.now()
      elapsedTime.value = 0
      if (elapsedTimeInterval) {
        clearInterval(elapsedTimeInterval)
      }
      elapsedTimeInterval = window.setInterval(() => {
        if (questionOpenedAt.value) {
          elapsedTime.value = (Date.now() - questionOpenedAt.value) / 1000
        }
      }, 100) // Обновляем каждые 100мс для плавности
    }
  }
)

watch(
  () => activeQuestion.value?.timerPaused,
  paused => {
    if (!timerRef.value) return
    if (paused) {
      timerRef.value.pause()
    } else {
      timerRef.value.resume()
    }
  }
)

// Приостанавливаем таймер когда кто-то отвечает
// Таймер уже приостанавливается в store через timerPaused, но убедимся что UI синхронизирован
watch(
  () => responderId.value,
  (newResponderId) => {
    if (newResponderId) {
      // Мок: если нет сессии, останавливаем таймер через небольшую задержку (имитация нажатия кнопки)
      if (!props.sessionId) {
        // Используем более надежный способ - проверяем через nextTick
        nextTick(() => {
          setTimeout(() => {
            if (timerRef.value) {
              console.log('Мок: останавливаем таймер')
              timerRef.value.pause()
            }
          }, 1500) // Останавливаем через 1.5 секунды после открытия
        })
      } else if (timerRef.value && activeQuestion.value && !activeQuestion.value.timerPaused) {
        // Кто-то нажал кнопку - приостанавливаем таймер
        timerRef.value.pause()
      }
    }
  },
  { immediate: true }
)

watch(
  () => activeQuestion.value?.showAnswer,
  value => {
    if (value) {
      showAnswer.value = true
    }
  }
)

function resetModal() {
  // Показывать ответ только если в сессии активен именно этот вопрос и ответ уже раскрыт (таймер истёк)
  showAnswer.value = !!(
    props.question &&
    activeQuestion.value &&
    activeQuestion.value.questionId === props.question.id &&
    activeQuestion.value.showAnswer
  )
  
  // Очищаем интервал отсчета времени
  if (elapsedTimeInterval) {
    clearInterval(elapsedTimeInterval)
    elapsedTimeInterval = null
  }
  questionOpenedAt.value = null
  elapsedTime.value = 0
  
  nextTick(() => {
    timerRef.value?.reset()
    if (activeQuestion.value?.timerPaused) {
      timerRef.value?.pause()
    }
    // Мок: если нет сессии, останавливаем таймер через небольшую задержку (имитация нажатия кнопки)
    if (!props.sessionId && timerRef.value) {
      console.log('Мок: resetModal - планируем остановку таймера')
      setTimeout(() => {
        if (timerRef.value) {
          console.log('Мок: resetModal - останавливаем таймер')
          timerRef.value.pause()
        }
      }, 1500) // Останавливаем через 1.5 секунды после открытия
    }
  })
}

function handleReveal() {
  if (showAnswer.value) return
  showAnswer.value = true
  if (props.sessionId) {
    gameSessionStore.revealAnswer(props.sessionId)
    // Таймер истёк, никто не ответил — помечаем вопрос сыгранным с timedOut (крестик на карточке)
    gameSessionStore.closeQuestion(props.sessionId, { byTimeout: true })
  }
  timerRef.value?.pause()
}

function handleResolve(correct: boolean) {
  if (!props.sessionId) {
    // Для не-сессии кнопки "правильно/неправильно" не используются
    return
  }
  gameSessionStore.resolveQuestion(props.sessionId, correct)
  if (correct) {
    showAnswer.value = true
    emit('finished')
  } else {
    // При неправильном ответе возобновляем таймер для нового раунда
    nextTick(() => {
      if (timerRef.value && !activeQuestion.value?.timerPaused) {
        timerRef.value.resume()
      }
    })
  }
}

function handleFinish() {
  // Для режима без сессии: завершаем вопрос после показа ответа
  if (!props.sessionId && showAnswer.value) {
    emit('finished')
    emit('close')
  }
}

function handleClose() {
  // Останавливаем все аудио при закрытии
  Object.values(audioRefs.value).forEach(audio => {
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  })
  playingAudioId.value = null
  
  if (props.sessionId) {
    // Закрытие по кнопке «Закрыть» — не по таймеру, крестик не показываем
    gameSessionStore.closeQuestion(props.sessionId, { byTimeout: false })
  }
  
  // Если ответ был показан (таймер закончился), но никто не ответил правильно,
  // помечаем вопрос как сыгранный без информации о том, кто ответил
  if (showAnswer.value && props.question && props.questId && props.roundId && props.categoryId) {
    const question = props.question
    // Проверяем, был ли кто-то отмечен как правильно ответивший и не помечен ли вопрос уже как сыгранный
    if (!question.answeredBy && !question.played) {
      quizStore.markQuestionAsPlayed(
        props.questId,
        props.roundId,
        props.categoryId,
        question.id
      )
    }
  }
  
  emit('close')
}

function avatarEmoji(avatarId: string): string {
  const map: Record<string, string> = {
    fox: '🦊',
    panda: '🐼',
    tiger: '🐯',
    owl: '🦉',
    whale: '🐳',
    parrot: '🦜',
    koala: '🐨',
    dino: '🦕',
    crocodile: '🐊',
    lion: '🦁',
    penguin: '🐧',
    elephant: '🐘',
    seal: '🦭',
    hedgehog: '🦔',
    lily: '🌸'
  }
  return map[avatarId] ?? '🙂'
}

onBeforeUnmount(() => {
  if (elapsedTimeInterval) {
    clearInterval(elapsedTimeInterval)
    elapsedTimeInterval = null
  }
})

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 41, 59, 0.95) 50%,
    rgba(15, 23, 42, 0.95) 100%
  );
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
  animation: overlayFadeIn 0.3s ease-out;
}

@keyframes overlayFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  width: min(75vw, 1200px);
  height: min(75vh, 800px);
  min-height: 480px;
  background: linear-gradient(
    145deg,
    rgba(30, 41, 59, 0.85) 0%,
    rgba(51, 65, 85, 0.8) 50%,
    rgba(30, 41, 59, 0.85) 100%
  );
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-sizing: border-box;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}


.modal-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 1rem;
  position: relative;
  z-index: 2;
}

.modal-back,
.modal-close {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.6) 0%,
    rgba(15, 23, 42, 0.7) 100%
  );
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  color: rgba(148, 163, 184, 0.8);
  border-radius: 50%;
  width: 34px;
  height: 34px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.modal-back:hover,
.modal-close:hover {
  transform: translateY(-2px);
  border-color: rgba(148, 163, 184, 0.35);
  color: rgba(148, 163, 184, 1);
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.modal-back:active,
.modal-close:active {
  transform: translateY(0);
}

.question-pane,
.answer-pane {
  flex: 1;
  display: flex;
  gap: 1.5rem;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.question-body,
.answer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
  padding-right: 0.5rem;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
}

.question-body::-webkit-scrollbar,
.answer-body::-webkit-scrollbar {
  width: 8px;
}

.question-body::-webkit-scrollbar-track,
.answer-body::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
  border-radius: 4px;
}

.question-body::-webkit-scrollbar-thumb,
.answer-body::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.4);
  border-radius: 4px;
}

.question-body::-webkit-scrollbar-thumb:hover,
.answer-body::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.6);
}

.question-body.has-visible-images {
  justify-content: flex-start;
  align-items: stretch;
  text-align: left;
  overflow: visible;
  max-height: 100%;
  gap: 0.75rem;
  flex-direction: column;
}

.question-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  text-align: center;
  min-height: 0;
}

.question-body.has-visible-images .question-header {
  flex: 0 0 auto;
  order: 1;
  justify-content: flex-start;
  padding-bottom: 0.5rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.question-body.has-visible-images .media-grid {
  flex: 1 1 0;
  order: 2;
  min-height: 0;
  max-height: 100%;
  display: flex;
  flex-direction: row;
  gap: 1rem;
  overflow: visible;
  align-items: stretch;
  justify-content: center;
}

.question-body.has-visible-images .media-grid--multiple {
  justify-content: center;
  gap: 1rem;
}

.question-body.has-visible-images .media-grid--three {
  gap: 0.4rem;
  justify-content: space-between;
}

.question-body.has-visible-images .media-grid :deep(.media-card) {
  flex: 1;
  min-width: 0;
  min-height: 0;
  max-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: visible;
  background: transparent;
  border: none;
  box-shadow: none;
}

.question-body.has-visible-images .media-grid--three :deep(.media-card) {
  flex: 1 1 0;
  min-width: 0;
}

.question-body.has-visible-images .media-grid :deep(.image-wrapper) {
  flex: 1;
  min-height: 0;
  max-height: 100%;
  aspect-ratio: unset;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-body.has-visible-images .media-grid :deep(.image-wrapper img) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.75rem;
  display: block;
}

.question-body.has-visible-images .media-grid :deep(.media-name) {
  display: none;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 0;
}

.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  align-items: center;
}

.audio-control-block {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.6) 0%,
    rgba(15, 23, 42, 0.7) 100%
  );
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  width: fit-content;
}

.audio-control-block.is-playing {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.6) 0%,
    rgba(15, 23, 42, 0.7) 100%
  );
  border-color: rgba(148, 163, 184, 0.2);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.audio-play-button {
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: rgba(148, 163, 184, 0.8);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  flex-shrink: 0;
  flex-grow: 0;
  position: relative;
  overflow: hidden;
}

.audio-play-button:hover {
  background: rgba(148, 163, 184, 0.25);
  border-color: rgba(148, 163, 184, 0.4);
  color: rgba(148, 163, 184, 1);
}

.audio-play-button.is-playing {
  background: rgba(148, 163, 184, 0.2);
  border-color: rgba(148, 163, 184, 0.35);
  color: rgba(148, 163, 184, 0.9);
}

.audio-play-button svg {
  width: 18px;
  height: 18px;
  position: relative;
  z-index: 1;
}

.audio-equalizer {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 24px;
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
}

.equalizer-bar {
  width: 4px;
  background: linear-gradient(
    to top,
    rgba(148, 163, 184, 0.5) 0%,
    rgba(148, 163, 184, 0.3) 100%
  );
  border-radius: 2px;
  animation: equalizer-idle 1.5s ease-in-out infinite;
}

.audio-control-block.is-playing .equalizer-bar {
  background: linear-gradient(
    to top,
    rgba(148, 163, 184, 0.7) 0%,
    rgba(148, 163, 184, 0.5) 100%
  );
  animation: equalizer-active 1.2s ease-in-out infinite;
}

.equalizer-bar:nth-child(1) {
  height: 50%;
}

.equalizer-bar:nth-child(2) {
  height: 80%;
}

.equalizer-bar:nth-child(3) {
  height: 100%;
}

.equalizer-bar:nth-child(4) {
  height: 70%;
}

.equalizer-bar:nth-child(5) {
  height: 90%;
}

.equalizer-bar:nth-child(6) {
  height: 100%;
}

.equalizer-bar:nth-child(7) {
  height: 60%;
}

.equalizer-bar:nth-child(8) {
  height: 85%;
}

.equalizer-bar:nth-child(9) {
  height: 100%;
}

.equalizer-bar:nth-child(10) {
  height: 75%;
}

.equalizer-bar:nth-child(11) {
  height: 95%;
}

.equalizer-bar:nth-child(12) {
  height: 65%;
}

.equalizer-bar:nth-child(13) {
  height: 90%;
}

.equalizer-bar:nth-child(14) {
  height: 55%;
}

.equalizer-bar:nth-child(15) {
  height: 100%;
}

.equalizer-bar:nth-child(16) {
  height: 80%;
}

.equalizer-bar:nth-child(17) {
  height: 70%;
}

@keyframes equalizer-idle {
  0%, 100% {
    transform: scaleY(0.4);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(0.6);
    opacity: 0.7;
  }
}

@keyframes equalizer-active {
  0%, 100% {
    transform: scaleY(0.3);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

.responder-banner {
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.2) 0%,
    rgba(59, 130, 246, 0.15) 100%
  );
  border: 1.5px solid rgba(139, 92, 246, 0.5);
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  color: #e9d5ff;
  font-size: 0.95rem;
  text-align: center;
  font-weight: 600;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 12px rgba(139, 92, 246, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  animation: bannerPulse 2s ease-in-out infinite;
}

@keyframes bannerPulse {
  0%, 100% {
    box-shadow: 
      0 4px 12px rgba(139, 92, 246, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  50% {
    box-shadow: 
      0 6px 16px rgba(139, 92, 246, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
}

.admin-panel {
  width: 220px;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  flex-shrink: 0;
  overflow: visible;
  box-sizing: border-box;
}

.admin-controls-block {
  width: 100%;
  max-width: 100%;
  min-height: 320px;
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.6) 0%,
    rgba(15, 23, 42, 0.7) 100%
  );
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  backdrop-filter: blur(15px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  box-sizing: border-box;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.admin-panel :deep(.timer-circle-container) {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.8) 0%,
    rgba(15, 23, 42, 0.9) 100%
  );
  border: 2px solid rgba(148, 163, 184, 0.2);
  border-radius: 50%;
  padding: 1rem;
  backdrop-filter: blur(15px);
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.2),
    0 4px 12px rgba(2, 6, 23, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.admin-panel :deep(.timer-warning.timer-circle-container),
.admin-panel :deep(.timer-circle-container.timer-warning) {
  border-color: rgba(239, 68, 68, 0.7) !important;
  box-shadow: 
    0 8px 24px rgba(239, 68, 68, 0.4),
    0 4px 12px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2) !important;
}


.admin-panel :deep(.timer-circle) {
  filter: drop-shadow(0 0 6px rgba(34, 197, 94, 0.4));
  transition: filter 0.3s ease;
}

.admin-panel :deep(.timer-warning .timer-circle) {
  filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.5));
}

.admin-panel :deep(.timer-progress) {
  color: #22c55e;
  filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.5));
  transition: color 0.3s ease, filter 0.3s ease;
}

.admin-panel :deep(.timer-bg) {
  color: rgba(34, 197, 94, 0.25);
}

.admin-panel :deep(.timer-text) {
  font-size: 2.4rem;
  color: #4ade80;
  font-weight: 700;
  text-shadow: 
    0 0 8px rgba(74, 222, 128, 0.5),
    0 0 16px rgba(34, 197, 94, 0.3);
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.admin-panel :deep(.timer-warning .timer-progress) {
  color: #ef4444;
  filter: drop-shadow(0 0 4px rgba(239, 68, 68, 0.6));
}

.admin-panel :deep(.timer-warning .timer-text) {
  color: #f87171;
  text-shadow: 
    0 0 10px rgba(248, 113, 113, 0.7),
    0 0 20px rgba(239, 68, 68, 0.5);
}

.admin-panel :deep(.timer-warning .timer-circle-container) {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.8) 0%,
    rgba(15, 23, 42, 0.9) 100%
  );
  border-color: rgba(239, 68, 68, 0.7);
  box-shadow: 
    0 8px 24px rgba(239, 68, 68, 0.4),
    0 4px 12px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
}


.admin-button {
  width: 100%;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 0.85rem 1.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background: rgba(15, 23, 42, 0.6);
  color: #e0e7ff;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 3px 6px rgba(2, 6, 23, 0.2),
    0 2px 3px rgba(2, 6, 23, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  transform: perspective(1000px) rotateX(1deg);
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.admin-button > * {
  position: relative;
  z-index: 1;
}

.admin-button::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.admin-button:hover::before {
  opacity: 1;
}

.admin-button::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border-radius: 12px;
  pointer-events: none;
  opacity: 0.5;
}

.reveal-button {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.7), rgba(251, 191, 36, 0.6));
  border-color: rgba(251, 146, 60, 0.5);
  color: #0f172a;
  font-weight: 700;
}

.reveal-button:hover {
  transform: perspective(1000px) rotateX(1deg) translateY(-2px);
  box-shadow: 
    0 6px 12px rgba(251, 146, 60, 0.3),
    0 3px 6px rgba(251, 146, 60, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  border-color: rgba(251, 146, 60, 0.7);
}

.host-buttons-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
}

.host-actions {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  width: 100%;
  justify-content: center;
}

.host-button {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  padding: 0;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.host-button svg {
  width: 28px;
  height: 28px;
  stroke: currentColor;
  stroke-width: 2.5;
  transition: transform 0.2s ease;
}

.host-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s ease;
}

.host-button:hover::before {
  left: 100%;
}

.host-button-success {
  background: rgba(34, 197, 94, 0.25);
  color: rgba(34, 197, 94, 0.9);
  box-shadow: 
    0 2px 8px rgba(34, 197, 94, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  border: 1.5px solid rgba(34, 197, 94, 0.4);
}

.host-button-success:not(:disabled):hover {
  background: rgba(34, 197, 94, 0.35);
  color: rgba(34, 197, 94, 1);
  box-shadow: 
    0 4px 12px rgba(34, 197, 94, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  border-color: rgba(34, 197, 94, 0.6);
}

.host-button-success:not(:disabled):hover svg {
  transform: scale(1.1);
}

.host-button-success:disabled:hover {
  transform: none;
}

.host-button-success:disabled:hover svg {
  transform: none;
}

.host-button-danger {
  background: rgba(239, 68, 68, 0.25);
  color: rgba(239, 68, 68, 0.9);
  box-shadow: 
    0 2px 8px rgba(239, 68, 68, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  border: 1.5px solid rgba(239, 68, 68, 0.4);
}

.host-button-danger:not(:disabled):hover {
  background: rgba(239, 68, 68, 0.35);
  color: rgba(239, 68, 68, 1);
  box-shadow: 
    0 4px 12px rgba(239, 68, 68, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
  border-color: rgba(239, 68, 68, 0.6);
}

.host-button-danger:not(:disabled):hover svg {
  transform: scale(1.1);
}

.host-button-danger:disabled:hover {
  transform: none;
}

.host-button-danger:disabled:hover svg {
  transform: none;
}

.host-button-pause {
  background: rgba(56, 189, 248, 0.25);
  color: rgba(56, 189, 248, 0.95);
  box-shadow: 0 2px 8px rgba(56, 189, 248, 0.2);
}

.host-button-pause:hover {
  background: rgba(56, 189, 248, 0.35);
  color: #22d3ee;
  box-shadow: 0 2px 10px rgba(56, 189, 248, 0.3);
}

.host-button-pause:hover svg {
  transform: scale(1.1);
}

.host-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

.responder-info-card {
  width: 100%;
  max-width: 100%;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.responder-card-content {
  width: 100%;
  max-width: 100%;
  min-height: 80px;
  height: 80px;
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.8) 0%,
    rgba(15, 23, 42, 0.9) 100%
  );
  border: 1.5px solid rgba(139, 92, 246, 0.4);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  backdrop-filter: blur(15px);
  box-shadow: 
    0 8px 24px rgba(139, 92, 246, 0.2),
    0 4px 12px rgba(2, 6, 23, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.responder-card-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.1) 0%,
    transparent 50%,
    rgba(59, 130, 246, 0.1) 100%
  );
  pointer-events: none;
}

.responder-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.2);
  border: 2px solid rgba(139, 92, 246, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.responder-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.responder-name {
  font-size: 1rem;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.responder-label {
  font-size: 0.75rem;
  color: rgba(186, 230, 253, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.responder-empty {
  width: 100%;
  max-width: 100%;
  min-height: 80px;
  height: 80px;
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.6) 0%,
    rgba(15, 23, 42, 0.7) 100%
  );
  border: 1.5px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(15px);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  box-sizing: border-box;
}

.responder-empty span {
  font-size: 0.875rem;
  color: rgba(148, 163, 184, 0.7);
  font-style: italic;
}

.responder-card {
  width: 100%;
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.8) 0%,
    rgba(15, 23, 42, 0.9) 100%
  );
  border: 1.5px solid rgba(139, 92, 246, 0.4);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  backdrop-filter: blur(15px);
  box-shadow: 
    0 8px 24px rgba(139, 92, 246, 0.2),
    0 4px 12px rgba(2, 6, 23, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
}

.responder-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.1) 0%,
    transparent 50%,
    rgba(59, 130, 246, 0.1) 100%
  );
  pointer-events: none;
}

.responder-card-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.3) 0%,
    rgba(59, 130, 246, 0.2) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
  border: 2px solid rgba(139, 92, 246, 0.5);
  box-shadow: 
    0 4px 12px rgba(139, 92, 246, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.responder-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.responder-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.responder-card-label {
  font-size: 0.7rem;
  color: rgba(148, 163, 184, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-title {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(1.75rem, 3.5vw, 2.9rem);
  margin: 0;
  line-height: 1.4;
  background: linear-gradient(
    135deg,
    #f8fafc 0%,
    #e2e8f0 50%,
    #cbd5e1 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  font-weight: 700;
  letter-spacing: -0.02em;
  position: relative;
  z-index: 1;
}

.modal-title.answer {
  background: linear-gradient(
    135deg,
    #fbbf24 0%,
    #f59e0b 50%,
    #facc15 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 
    0 0 40px rgba(250, 204, 21, 0.6),
    0 0 80px rgba(251, 191, 36, 0.4);
  animation: answerGlow 2s ease-in-out infinite;
}

@keyframes answerGlow {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.2);
  }
}

.finish-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.finish-button {
  background: linear-gradient(135deg, #22c55e, #86efac);
  border: none;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.65rem 1.5rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.finish-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(34, 197, 94, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-move {
  transition: transform 0.3s ease;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .modal-content {
    width: min(90vw, 720px);
    height: min(80vh, 640px);
    padding: 1.75rem 2rem;
  }

  .question-pane,
  .answer-pane {
    flex-direction: column;
    align-items: center;
  }

  .admin-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .admin-button {
    flex: 1;
    min-width: 140px;
    max-width: 200px;
  }
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    width: 100%;
    height: 100%;
    border-radius: 16px;
    padding: 1.5rem 1.25rem;
  }

  .modal-title {
    font-size: clamp(1.45rem, 4vw, 2rem);
  }

  .admin-controls-block {
    min-height: 280px;
    padding: 1.5rem 1rem;
    gap: 1rem;
  }

  .host-buttons-row,
  .host-actions {
    gap: 0.6rem;
  }

  .host-button {
    width: 48px;
    height: 48px;
  }

  .host-button svg {
    width: 24px;
    height: 24px;
  }

  .responder-info-card {
    padding: 0.75rem 1rem;
  }

  .responder-card-content,
  .responder-empty {
    min-height: 70px;
    height: 70px;
    padding: 0.65rem 0.85rem;
  }

  .audio-control-block {
    padding: 0.75rem 1rem;
    min-width: 280px;
  }

  .audio-play-button {
    width: 36px;
    height: 36px;
  }

  .audio-play-button svg {
    width: 16px;
    height: 16px;
  }

  .audio-equalizer {
    height: 20px;
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }
  
  .question-body.has-visible-images .media-grid {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
  }

  .admin-panel {
    flex-direction: column;
  }

  .admin-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 0.75rem;
  }

  .modal-content {
    padding: 1.25rem 1rem;
    border-radius: 14px;
  }

  .modal-title {
    font-size: clamp(1.3rem, 4vw, 1.75rem);
  }

  .admin-controls-block {
    min-height: 260px;
    padding: 1.25rem 0.875rem;
    gap: 0.875rem;
  }

  .host-button {
    width: 44px;
    height: 44px;
  }

  .host-button svg {
    width: 22px;
    height: 22px;
  }

  .responder-card-content,
  .responder-empty {
    min-height: 65px;
    height: 65px;
    padding: 0.6rem 0.75rem;
  }

  .audio-control-block {
    padding: 0.65rem 0.875rem;
    min-width: 260px;
  }

  .audio-play-button {
    width: 34px;
    height: 34px;
  }

  .audio-play-button svg {
    width: 15px;
    height: 15px;
  }

  .audio-equalizer {
    height: 18px;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.75rem;
  }
}

@media (max-width: 360px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-content {
    padding: 1rem 0.875rem;
    border-radius: 12px;
  }

  .modal-title {
    font-size: clamp(1.15rem, 4vw, 1.5rem);
  }

  .admin-controls-block {
    min-height: 240px;
    padding: 1rem 0.75rem;
    gap: 0.75rem;
  }

  .host-button {
    width: 40px;
    height: 40px;
  }

  .host-button svg {
    width: 20px;
    height: 20px;
  }

  .responder-card-content,
  .responder-empty {
    min-height: 60px;
    height: 60px;
    padding: 0.55rem 0.65rem;
  }

  .audio-control-block {
    padding: 0.6rem 0.75rem;
    min-width: 240px;
  }

  .audio-play-button {
    width: 32px;
    height: 32px;
  }

  .audio-play-button svg {
    width: 14px;
    height: 14px;
  }

  .audio-equalizer {
    height: 16px;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fit, minmax(85px, 1fr));
    gap: 0.6rem;
  }
}

@media (max-width: 320px) {
  .modal-overlay {
    padding: 0.375rem;
  }

  .modal-content {
    padding: 0.875rem 0.75rem;
    border-radius: 10px;
  }

  .modal-title {
    font-size: clamp(1.1rem, 4vw, 1.4rem);
  }

  .admin-controls-block {
    min-height: 220px;
    padding: 0.875rem 0.65rem;
    gap: 0.65rem;
  }

  .host-button {
    width: 36px;
    height: 36px;
  }

  .host-button svg {
    width: 18px;
    height: 18px;
  }

  .responder-card-content,
  .responder-empty {
    min-height: 55px;
    height: 55px;
    padding: 0.5rem 0.6rem;
  }

  .audio-control-block {
    padding: 0.55rem 0.65rem;
    min-width: 220px;
  }

  .audio-play-button {
    width: 30px;
    height: 30px;
  }

  .audio-play-button svg {
    width: 13px;
    height: 13px;
  }

  .audio-equalizer {
    height: 14px;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fit, minmax(75px, 1fr));
    gap: 0.5rem;
  }
}
</style>

