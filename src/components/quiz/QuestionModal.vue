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
            <!-- В питанні не должно быть одновременно и изображения, и аудио -->
            <AudioControls
              v-if="hasAudio && visibleImages.length === 0"
              :tracks="questionMediaAudio"
              :playing-id="playingAudioId"
              aria-label="Проиграть аудио"
              @toggle="toggleAudio"
              @ended="handleAudioEnded"
              @register="setAudioRef"
            />
          </div>
          <aside class="admin-panel">
            <div class="admin-controls-block">
              <TimerCircle
                :duration-sec="30"
                :auto-start="true"
                ref="timerRef"
                @finished="handleReveal"
              />
              <HostButtonsRow
                v-if="isHostSession"
                :can-resolve="canResolve"
                :show-answer="showAnswer"
                :is-timer-paused="isTimerPaused"
                @resolve="handleResolve"
                @toggle-pause="togglePause"
              />
            </div>
            <ResponderCard :responder="currentResponder" />
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
              <!-- В ответе не должно быть одновременно и изображения, и аудио -->
              <AudioControls
                v-if="answerMediaAudio.length && answerMediaImages.length === 0"
                :tracks="answerMediaAudio"
                :playing-id="playingAudioId"
                aria-label="Проиграть аудио ответа"
                @toggle="toggleAudio"
                @ended="handleAudioEnded"
                @register="setAudioRef"
              />
            </div>
          </section>
        </Transition>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import TimerCircle from './TimerCircle.vue'
import QuestionMediaPreview from './QuestionMediaPreview.vue'
import AudioControls from './AudioControls.vue'
import HostButtonsRow from './HostButtonsRow.vue'
import ResponderCard from './ResponderCard.vue'
import { useGameSessionStore } from '@/store/gameSessionStore'
import { useQuizStore } from '@/store/quizStore'
import type { Question, Player } from '@/types'
import { safeMediaUrl, isPlayableAudioMedia } from '@/utils/mediaUrl'
import { useAudioPlayer } from '@/composables/useAudioPlayer'
import { useElapsedTime } from '@/composables/useElapsedTime'

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

// Аудио-плеер (audioRefs/toggle/stopAll) и секундомер показа медиа с задержкой
const { playingId: playingAudioId, setRef: setAudioRef, stopAll: stopAllAudio, toggle: toggleAudio, onEnded: handleAudioEnded } = useAudioPlayer()
const { elapsed: elapsedTime, startedAt: questionOpenedAt, start: startElapsed, reset: resetElapsed } = useElapsedTime()

const session = computed(() => (props.sessionId ? gameSessionStore.getSessionById(props.sessionId) : undefined))
const activeQuestion = computed(() => session.value?.activeQuestion)
// Хост-сессия, если есть реальная сессия. В dev дополнительно считаем открытую модалку
// хост-режимом для превью без сессии.
const isHostSession = computed(() => !!session.value || (import.meta.env.DEV && props.isOpen))

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
  // Демо только в dev: без сессии возвращаем мок-участника
  if (import.meta.env.DEV && (!props.sessionId || props.sessionId === '')) {
    return mockResponder.id
  }
  return null
})

const currentResponder = computed(() => {
  if (session.value && responderId.value) {
    return session.value.players.find(player => player.id === responderId.value) ?? null
  }
  // Демо только в dev: без сессии возвращаем мок-участника
  if (import.meta.env.DEV && (!props.sessionId || props.sessionId === '') && responderId.value === mockResponder.id) {
    return mockResponder
  }
  return null
})

// Lightweight URLs (single imageUrl) or from questionMedia arrays
const questionImageUrl = computed(() => props.question?.imageUrl ?? null)

// Фильтрация медиа: только изображения (или один imageUrl)
const questionMediaImages = computed(() => {
  const safeUrl = questionImageUrl.value ? safeMediaUrl(questionImageUrl.value) : null
  if (safeUrl) {
    return [{ id: 'img0', type: 'image' as const, name: 'Image', url: safeUrl }]
  }
  // Показуємо тільки те, що реально має валідний URL для <img src="...">
  return (
    props.question?.questionMedia?.filter((m) => m.type === 'image' && !!safeMediaUrl(m.url)) ?? []
  )
})

// Видимые изображения с учетом задержки.
// questionMediaImages уже включает лёгкий imageUrl (как img0) либо изображения из questionMedia —
// поэтому берём единый источник и не дублируем imageUrl отдельно (#20).
const visibleImages = computed(() => {
  if (!questionOpenedAt.value) {
    // До старта таймера показываем только изображения без задержки
    return questionMediaImages.value.filter(media => (media.delay ?? 0) === 0)
  }
  return questionMediaImages.value.filter(media => elapsedTime.value >= (media.delay ?? 0))
})

// Аудио для вопроса: легкий audioUrl + questionMedia (только валидные URL для воспроизведения)
const questionMediaAudio = computed(() => {
  const fromUrl = props.question?.audioUrl && safeMediaUrl(props.question.audioUrl)
    ? [{ id: 'audio-url', type: 'audio' as const, name: '', url: safeMediaUrl(props.question.audioUrl)! }]
    : []
  if (!Array.isArray(props.question?.questionMedia)) return fromUrl
  const audioFiles = props.question.questionMedia.filter(isPlayableAudioMedia)
  return [...fromUrl, ...audioFiles]
})

// Изображения в ответе (включая легкий answerImageUrl)
const answerMediaImages = computed(() => {
  const safeUrl = props.question?.answerImageUrl ? safeMediaUrl(props.question.answerImageUrl) : null
  const fromUrl = safeUrl
    ? [{ id: 'ans-img-url', type: 'image' as const, name: '', url: safeUrl }]
    : []
  const fromMedia = props.question?.answerMedia?.filter((m) => m?.type === 'image' && !!safeMediaUrl(m.url)) ?? []
  return [...fromUrl, ...fromMedia]
})

// Аудио в ответе (включая легкий answerAudioUrl)
const answerMediaAudio = computed(() => {
  const answerAudioSafe = props.question?.answerAudioUrl ? safeMediaUrl(props.question.answerAudioUrl) : null
  const fromUrl = answerAudioSafe
    ? [{ id: 'ans-audio-url', type: 'audio' as const, name: '', url: answerAudioSafe }]
    : []
  const list = props.question?.answerMedia
  if (!Array.isArray(list)) return fromUrl
  const fromMedia = list.filter(isPlayableAudioMedia)
  return [...fromUrl, ...fromMedia]
})

// Аудио есть, если список воспроизводимого аудио непуст (уже отфильтрован isPlayableAudioMedia)
const hasAudio = computed(() => questionMediaAudio.value.length > 0)

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

      // Запускаем отсчёт для отображения изображений с задержкой
      startElapsed()

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
      // Питання змінилось при відкритій модалці: resetModal() зупиняє секундомір,
      // тому перезапускаємо, щоб відкладені картинки з questionMedia з’являлися.
      startElapsed()
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
  
  // Сбрасываем секундомер показа медиа
  resetElapsed()

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
    // Таймер истёк, никто не ответил — помечаем вопрос сыгранным с timedOut (крестик на карточке),
    // но НЕ закрываем вопрос: ответ остаётся виден участникам, пока ведущий не закроет модалку.
    gameSessionStore.markActiveQuestionTimedOut(props.sessionId)
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

function handleClose() {
  // Останавливаем все аудио при закрытии
  stopAllAudio()

  // closeQuestion вызывается один раз — из watch(props.isOpen) при закрытии модалки
  // (родитель ставит isOpen=false после emit('close')). Здесь не дублируем (было #13).

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

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgb(var(--c-bg) / 0.95) 0%,
    rgb(var(--c-surface) / 0.95) 50%,
    rgb(var(--c-bg) / 0.95) 100%
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
    rgb(var(--c-surface) / 0.85) 0%,
    rgb(var(--c-surface-2) / 0.8) 50%,
    rgb(var(--c-surface) / 0.85) 100%
  );
  border: 1.5px solid rgb(var(--c-text-muted) / 0.2);
  border-radius: 16px;
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  box-shadow: 
    0 4px 12px rgb(var(--c-black) / 0.2),
    inset 0 1px 0 rgb(var(--c-white) / 0.05);
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
    rgb(var(--c-surface) / 0.6) 0%,
    rgb(var(--c-bg) / 0.7) 100%
  );
  border: 1.5px solid rgb(var(--c-text-muted) / 0.2);
  color: rgb(var(--c-text-muted) / 0.8);
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
    0 4px 12px rgb(var(--c-black) / 0.2),
    inset 0 1px 0 rgb(var(--c-white) / 0.05);
}

.modal-back:hover,
.modal-close:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--c-text-muted) / 0.35);
  color: rgb(var(--c-text-muted) / 1);
  box-shadow: 
    0 6px 16px rgb(var(--c-black) / 0.25),
    inset 0 1px 0 rgb(var(--c-white) / 0.08);
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
  background: rgb(var(--c-surface) / 0.3);
  border-radius: 4px;
}

.question-body::-webkit-scrollbar-thumb,
.answer-body::-webkit-scrollbar-thumb {
  background: rgb(var(--c-violet) / 0.4);
  border-radius: 4px;
}

.question-body::-webkit-scrollbar-thumb:hover,
.answer-body::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--c-violet) / 0.6);
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

/* В режимі з картинками `question-header` і `media-grid` мають order: 1/2,
   а `.audio-controls` інакше має дефолтний order: 0 і може "підскакувати" вище.
   Тому примусово задаємо order для аудіо. */
.question-body.has-visible-images .audio-controls {
  order: 3;
  margin-top: 0.5rem;
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
    rgb(var(--c-surface) / 0.6) 0%,
    rgb(var(--c-bg) / 0.7) 100%
  );
  border: 1.5px solid rgb(var(--c-text-muted) / 0.2);
  border-radius: 16px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  backdrop-filter: blur(15px);
  box-shadow: 
    0 4px 12px rgb(var(--c-black) / 0.2),
    inset 0 1px 0 rgb(var(--c-white) / 0.05);
  box-sizing: border-box;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.admin-panel :deep(.timer-circle-container) {
  background: linear-gradient(
    135deg,
    rgb(var(--c-surface) / 0.8) 0%,
    rgb(var(--c-bg) / 0.9) 100%
  );
  border: 2px solid rgb(var(--c-text-muted) / 0.2);
  border-radius: 50%;
  padding: 1rem;
  backdrop-filter: blur(15px);
  box-shadow: 
    0 8px 24px rgb(var(--c-black) / 0.2),
    0 4px 12px rgb(var(--c-bg-deep) / 0.3),
    inset 0 1px 0 rgb(var(--c-white) / 0.1),
    inset 0 -1px 0 rgb(var(--c-black) / 0.2);
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.admin-panel :deep(.timer-warning.timer-circle-container),
.admin-panel :deep(.timer-circle-container.timer-warning) {
  border-color: rgb(var(--c-danger) / 0.7) !important;
  box-shadow: 
    0 8px 24px rgb(var(--c-danger) / 0.4),
    0 4px 12px rgb(var(--c-danger) / 0.3),
    inset 0 1px 0 rgb(var(--c-white) / 0.15),
    inset 0 -1px 0 rgb(var(--c-black) / 0.2) !important;
}


.admin-panel :deep(.timer-circle) {
  filter: drop-shadow(0 0 6px rgb(var(--c-success) / 0.4));
  transition: filter 0.3s ease;
}

.admin-panel :deep(.timer-warning .timer-circle) {
  filter: drop-shadow(0 0 6px rgb(var(--c-danger) / 0.5));
}

.admin-panel :deep(.timer-progress) {
  color: rgb(var(--c-success));
  filter: drop-shadow(0 0 4px rgb(var(--c-success) / 0.5));
  transition: color 0.3s ease, filter 0.3s ease;
}

.admin-panel :deep(.timer-bg) {
  color: rgb(var(--c-success) / 0.25);
}

.admin-panel :deep(.timer-text) {
  font-size: 2.4rem;
  color: rgb(var(--c-success-mid));
  font-weight: 700;
  text-shadow: 
    0 0 8px rgb(var(--c-success-mid) / 0.5),
    0 0 16px rgb(var(--c-success) / 0.3);
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.admin-panel :deep(.timer-warning .timer-progress) {
  color: rgb(var(--c-danger));
  filter: drop-shadow(0 0 4px rgb(var(--c-danger) / 0.6));
}

.admin-panel :deep(.timer-warning .timer-text) {
  color: rgb(var(--c-danger-light));
  text-shadow: 
    0 0 10px rgb(var(--c-danger-light) / 0.7),
    0 0 20px rgb(var(--c-danger) / 0.5);
}

.admin-panel :deep(.timer-warning .timer-circle-container) {
  background: linear-gradient(
    135deg,
    rgb(var(--c-surface) / 0.8) 0%,
    rgb(var(--c-bg) / 0.9) 100%
  );
  border-color: rgb(var(--c-danger) / 0.7);
  box-shadow: 
    0 8px 24px rgb(var(--c-danger) / 0.4),
    0 4px 12px rgb(var(--c-danger) / 0.3),
    inset 0 1px 0 rgb(var(--c-white) / 0.15),
    inset 0 -1px 0 rgb(var(--c-black) / 0.2);
}


.admin-button {
  width: 100%;
  border: 1px solid rgb(var(--c-accent-sky) / 0.3);
  border-radius: 12px;
  padding: 0.85rem 1.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background: rgb(var(--c-bg) / 0.6);
  color: rgb(var(--c-indigo-100));
  backdrop-filter: blur(10px);
  box-shadow: 
    0 3px 6px rgb(var(--c-bg-deep) / 0.2),
    0 2px 3px rgb(var(--c-bg-deep) / 0.15),
    inset 0 2px 4px rgb(var(--c-white) / 0.1),
    inset 0 -2px 4px rgb(var(--c-black) / 0.2);
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
    rgb(var(--c-white) / 0.15) 0%,
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
    rgb(var(--c-white) / 0.08) 0%,
    transparent 50%,
    rgb(var(--c-white) / 0.04) 100%
  );
  border-radius: 12px;
  pointer-events: none;
  opacity: 0.5;
}

.reveal-button {
  background: linear-gradient(135deg, rgb(var(--c-orange) / 0.7), rgb(var(--c-amber) / 0.6));
  border-color: rgb(var(--c-orange) / 0.5);
  color: rgb(var(--c-bg));
  font-weight: 700;
}

.reveal-button:hover {
  transform: perspective(1000px) rotateX(1deg) translateY(-2px);
  box-shadow: 
    0 6px 12px rgb(var(--c-orange) / 0.3),
    0 3px 6px rgb(var(--c-orange) / 0.25),
    inset 0 2px 4px rgb(var(--c-white) / 0.15),
    inset 0 -2px 4px rgb(var(--c-black) / 0.2);
  border-color: rgb(var(--c-orange) / 0.7);
}

.modal-title {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(1.75rem, 3.5vw, 2.9rem);
  margin: 0;
  line-height: 1.4;
  background: linear-gradient(
    135deg,
    rgb(var(--c-text)) 0%,
    rgb(var(--c-text-soft)) 50%,
    rgb(var(--c-slate-300)) 100%
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
    rgb(var(--c-amber)) 0%,
    rgb(var(--c-amber-500)) 50%,
    rgb(var(--c-gold)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 
    0 0 40px rgb(var(--c-gold) / 0.6),
    0 0 80px rgb(var(--c-amber) / 0.4);
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
  background: linear-gradient(135deg, rgb(var(--c-success)), rgb(var(--c-success-light)));
  border: none;
  color: rgb(var(--c-bg));
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.65rem 1.5rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.finish-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgb(var(--c-success) / 0.3);
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
  .media-grid {
    grid-template-columns: repeat(auto-fit, minmax(75px, 1fr));
    gap: 0.5rem;
  }
}
</style>

