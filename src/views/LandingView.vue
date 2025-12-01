<template>
  <div v-if="isCheckingAuth" class="landing landing--loading">
    <div class="loading-state">
      <div class="loader"></div>
      <p>Проверка авторизации…</p>
    </div>
  </div>
  <div v-else-if="!shouldRedirect" class="landing">
    <div class="landing-card">
      <div class="landing-brand">
        <h1 class="brand-title" :class="{ 'brand-title--animated': animateTitle }">
          <span
            v-for="(word, wIndex) in titleWords"
            :key="wIndex"
            class="brand-word"
          >
            <span
              v-for="(char, cIndex) in word"
              :key="cIndex"
              class="brand-letter"
              :style="{ '--i': wIndex * 10 + cIndex }"
            >
              {{ char }}
            </span>
            <span v-if="wIndex !== titleWords.length - 1" class="brand-space"> </span>
          </span>
        </h1>
        <p class="brand-subtitle" :class="{ 'brand-subtitle--visible': subtitleVisible }">
          Командные викторины<br class="brand-subtitle-break"> с атмосферой шоу.
        </p>
      </div>

      <div class="identity-row">
        <input
          v-model="playerName"
          type="text"
          placeholder="Введите имя"
          autocomplete="off"
        />
        <AvatarPicker v-model="selectedAvatar" />
      </div>

      <div class="actions">
        <button class="primary" type="button" @click="handleCreateGame">
          <span class="btn-glow"></span>
          <span class="btn-text">Создать игру</span>
        </button>

        <div class="divider">или</div>

        <div class="join-block">
          <input
            v-model="joinCode"
            type="text"
            maxlength="4"
            placeholder="КОД"
            class="join-input"
          />
          <button class="secondary" type="button" @click="handleJoinGame">
            <span class="btn-glow"></span>
            <span class="btn-text">Присоединиться</span>
          </button>
        </div>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AvatarPicker from '@/components/common/AvatarPicker.vue'
import { useGameSessionStore } from '@/store/gameSessionStore'

const router = useRouter()
const route = useRoute()
const sessionStore = useGameSessionStore()

const titleWords = computed(() => 'Quiz Quest'.split(' '))
const titleLetters = computed(() => Array.from('Quiz Quest'))
const animateTitle = ref(false)
const subtitleVisible = ref(false)

const playerName = ref(sessionStore.userProfile?.name ?? '')
const selectedAvatar = ref(sessionStore.userProfile?.avatar ?? null)
const joinCode = ref('')
const errorMessage = ref('')
const shouldRedirect = ref(false)
const isCheckingAuth = ref(true)

// Быстрая проверка localStorage перед рендерингом
async function checkLocalStorageProfile() {
  try {
    // Сначала проверяем активную сессию игрока
    const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
    if (storedActiveSession) {
      // Ждем загрузки store, если он еще загружается
      if (sessionStore.isLoading) {
        // Ждем максимум 2 секунды
        let attempts = 0
        const maxAttempts = 20
        while (sessionStore.isLoading && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
      }
      
      // Проверяем активную сессию
      const activeSession = await sessionStore.checkActivePlayerSession()
      if (activeSession) {
        shouldRedirect.value = true
        router.replace({ 
          name: 'player-session', 
          params: { sessionId: activeSession.session.id } 
        })
        return true
      }
    }
    
    const storedProfile = localStorage.getItem('quiz-app-user-profile')
    if (storedProfile) {
      const profile = JSON.parse(storedProfile)
      if (profile?.name && profile?.avatar) {
        // Заполняем поля данными пользователя, но не редиректим автоматически
        // Пользователь может присоединиться к игре или создать новую
        playerName.value = profile.name
        selectedAvatar.value = profile.avatar
        return false
      }
    }
  } catch (e) {
    // Игнорируем ошибки парсинга
  }
  return false
}

// Проверяем localStorage сразу при инициализации
// Используем nextTick для гарантии, что DOM обновился
nextTick(async () => {
  // Добавляем небольшую задержку, чтобы лоадер был виден
  setTimeout(async () => {
    const redirected = await checkLocalStorageProfile()
    if (redirected) {
      // Если редирект произошел, не продолжаем инициализацию
      isCheckingAuth.value = false
    } else {
      // Если профиля нет в localStorage, проверяем store
      if (sessionStore.userProfile?.name && sessionStore.userProfile?.avatar) {
        // Заполняем поля данными пользователя
        playerName.value = sessionStore.userProfile.name
        selectedAvatar.value = sessionStore.userProfile.avatar
        // Не редиректим автоматически, чтобы пользователь мог присоединиться к игре
      }
      // Показываем форму авторизации
      isCheckingAuth.value = false
    }
  }, 500) // Задержка для показа лоадера
})

// Синхронизация полей формы с профилем из store
watch(() => sessionStore.userProfile, (profile) => {
  if (profile) {
    playerName.value = profile.name ?? ''
    selectedAvatar.value = profile.avatar ?? null
  }
}, { immediate: true })

// Автоматическое перенаправление, если пользователь уже авторизован
onMounted(async () => {
  // Сбрасываем флаги при монтировании компонента
  hasPlayedIntro = false
  subtitleVisible.value = false
  animateTitle.value = false
  
  // Если уже редиректили, не проверяем дальше
  if (shouldRedirect.value) return
  
  // Ждем загрузки данных из store
  if (sessionStore.isLoading) {
    isCheckingAuth.value = true
    // Ждем завершения загрузки
    const checkProfile = setInterval(() => {
      if (!sessionStore.isLoading) {
        clearInterval(checkProfile)
        checkAndRedirect()
        isCheckingAuth.value = false
        setupMusic() // Настраиваем музыку после проверки авторизации
      }
    }, 100)
    
    // Таймаут на случай, если загрузка зависнет
    setTimeout(() => {
      clearInterval(checkProfile)
      checkAndRedirect()
      isCheckingAuth.value = false
      setupMusic() // Настраиваем музыку после проверки авторизации
    }, 2000)
  } else {
    checkAndRedirect()
    isCheckingAuth.value = false
    setupMusic() // Настраиваем музыку после проверки авторизации
  }
})

async function checkAndRedirect() {
  // Если уже редиректили, не проверяем дальше
  if (shouldRedirect.value) return
  
  // Сначала проверяем активную сессию игрока
  const activeSession = await sessionStore.checkActivePlayerSession()
  if (activeSession) {
    // Если есть активная сессия, редиректим на страницу игрока
    shouldRedirect.value = true
    router.replace({ 
      name: 'player-session', 
      params: { sessionId: activeSession.session.id } 
    })
    return
  }
  
  // Если активной сессии нет, но есть профиль, заполняем поля и остаемся на странице
  if (sessionStore.userProfile?.name && sessionStore.userProfile?.avatar) {
    // Заполняем поля данными пользователя
    playerName.value = sessionStore.userProfile.name
    selectedAvatar.value = sessionStore.userProfile.avatar
    
    // Если пользователь хочет создать игру, редиректим на страницу квестов
    // Но не делаем автоматический редирект, чтобы пользователь мог присоединиться к игре
  }
}

const isThemePlaying = ref(false)
let audioCtx: AudioContext | null = null
let gainNode: GainNode | null = null
let cleanupTimeout: number | null = null
let fallbackTimeout: number | null = null
let hasPlayedIntro = false

watch(joinCode, value => {
  joinCode.value = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
})

async function ensureProfile(): Promise<boolean> {
  errorMessage.value = ''
  if (!playerName.value.trim()) {
    errorMessage.value = 'Введите имя участника'
    return false
  }
  if (!selectedAvatar.value) {
    errorMessage.value = 'Выберите аватар'
    return false
  }
  // Ждем сохранения профиля перед перенаправлением
  await sessionStore.setUserProfile({ name: playerName.value.trim(), avatar: selectedAvatar.value })
  return true
}

async function handleCreateGame() {
  if (!(await ensureProfile())) return
  router.push({ path: '/host/setup' })
}

async function handleJoinGame() {
  if (!(await ensureProfile())) return
  if (!joinCode.value || joinCode.value.length < 4) {
    errorMessage.value = 'Введите код игры (4 символа)'
    return
  }
  try {
    const result = await sessionStore.joinSessionByCode(joinCode.value)
    if (!result || !result.session) {
      errorMessage.value = 'Сессия с таким кодом не найдена'
      return
    }
    const { session } = result
    // setActivePlayer уже вызывается в processJoin
    router.push({ name: 'player-session', params: { sessionId: session.id } })
  } catch (error: any) {
    errorMessage.value = error?.message ?? 'Не удалось присоединиться к игре'
  }
}

function schedulePattern(startTime: number) {
  if (!audioCtx || !gainNode) return startTime
  const pattern = [
    { freq: 261.63, duration: 0.16 },
    { freq: 392, duration: 0.16 },
    { freq: 523.25, duration: 0.16 },
    { freq: 349.23, duration: 0.18 },
    { freq: 466.16, duration: 0.22 },
    { freq: 293.66, duration: 0.18 },
    { freq: 440, duration: 0.22 },
    { freq: 659.25, duration: 0.28 },
    { freq: 392, duration: 0.2 },
    { freq: 523.25, duration: 0.4 }
  ]
  let cursor = startTime
  for (const note of pattern) {
    const osc = audioCtx.createOscillator()
    const env = audioCtx.createGain()

    env.gain.setValueAtTime(0, cursor)
    env.gain.linearRampToValueAtTime(0.9, cursor + 0.04)
    env.gain.exponentialRampToValueAtTime(0.0001, cursor + note.duration)

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(note.freq, cursor)
    osc.detune.setValueAtTime(osc.frequency.value * 0.03, cursor)
    osc.connect(env)
    env.connect(gainNode!)
    osc.start(cursor)
    osc.stop(cursor + note.duration)
    cursor += note.duration
  }
  return cursor
}

function playIntro() {
  if (hasPlayedIntro) return
  hasPlayedIntro = true
  animateTitle.value = true
  subtitleVisible.value = false
  isThemePlaying.value = true
  
  // Очищаем fallback таймаут, так как музыка запустилась
  if (fallbackTimeout) {
    window.clearTimeout(fallbackTimeout)
    fallbackTimeout = null
  }

  // Пересоздаем audioCtx, если его нет или он закрыт
  if (!audioCtx || audioCtx.state === 'closed') {
    if (audioCtx && audioCtx.state === 'closed') {
      audioCtx = null
    }
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  
  // Пересоздаем gainNode для нового контекста
  if (gainNode) {
    gainNode.disconnect()
    gainNode = null
  }
  gainNode = audioCtx.createGain()
  gainNode.gain.value = 0.06
  gainNode.connect(audioCtx.destination)

  const start = audioCtx.currentTime + 0.05
  let cursor = start
  cursor = schedulePattern(cursor)

  const animationDuration = 0.15 * (titleLetters.value.length - 1) + 1.2
  const totalDuration = Math.max(animationDuration, cursor - start)

  cleanupTimeout = window.setTimeout(() => {
    stopIntro()
  }, totalDuration * 1000)

  window.setTimeout(() => {
    subtitleVisible.value = true
  }, animationDuration * 1000)
}

function stopIntro() {
  subtitleVisible.value = true
  isThemePlaying.value = false
  if (cleanupTimeout) {
    window.clearTimeout(cleanupTimeout)
    cleanupTimeout = null
  }
  if (gainNode && audioCtx) {
    gainNode.gain.cancelScheduledValues(audioCtx.currentTime)
    gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2)
    window.setTimeout(() => {
      gainNode?.disconnect()
      gainNode = null
    }, 1250)
  }
  if (audioCtx) {
    window.setTimeout(() => {
      audioCtx?.close()
      audioCtx = null
    }, 1300)
  }
}

// Настраиваем музыку только если пользователь действительно на странице авторизации
function setupMusic() {
  // Если уже редиректили, не запускаем музыку
  if (shouldRedirect.value) return
  
  // Fallback: показываем subtitle через 3 секунды, даже если музыка не запустилась
  fallbackTimeout = window.setTimeout(() => {
    if (!subtitleVisible.value && !shouldRedirect.value) {
      subtitleVisible.value = true
      animateTitle.value = true
    }
    fallbackTimeout = null
  }, 3000)
  
  const interactionHandler = () => {
    if (!shouldRedirect.value) {
      playIntro()
    }
    window.removeEventListener('pointerdown', interactionHandler)
  }
  window.addEventListener('pointerdown', interactionHandler, { once: true })

  const tryAutoPlay = () => {
    if (!shouldRedirect.value) {
      playIntro()
    }
  }

  if (document.readyState === 'complete') {
    window.setTimeout(tryAutoPlay, 150)
  } else {
    window.addEventListener('load', () => {
      if (!shouldRedirect.value) {
        window.setTimeout(tryAutoPlay, 150)
      }
    }, { once: true })
  }
}

onBeforeUnmount(() => {
  // Останавливаем музыку при уходе со страницы
  stopIntro()
  
  // Принудительно останавливаем все осцилляторы и закрываем контекст
  if (audioCtx && audioCtx.state !== 'closed') {
    try {
      // Отключаем все узлы
      if (gainNode) {
        gainNode.disconnect()
        gainNode = null
      }
      // Закрываем контекст немедленно
      audioCtx.close().catch(() => {
        // Игнорируем ошибки при закрытии
      })
      audioCtx = null
    } catch (e) {
      // Игнорируем ошибки
    }
  }
  
  // Очищаем таймауты
  if (cleanupTimeout) {
    window.clearTimeout(cleanupTimeout)
    cleanupTimeout = null
  }
  if (fallbackTimeout) {
    window.clearTimeout(fallbackTimeout)
    fallbackTimeout = null
  }
  
  // Сбрасываем флаги
  isThemePlaying.value = false
  hasPlayedIntro = false
})

// Отслеживаем изменение маршрута и останавливаем музыку при уходе со страницы
watch(() => route.path, (newPath) => {
  if (newPath !== '/') {
    // Если ушли со страницы авторизации, останавливаем музыку
    stopIntro()
    if (audioCtx && audioCtx.state !== 'closed') {
      try {
        if (gainNode) {
          gainNode.disconnect()
          gainNode = null
        }
        audioCtx.close().catch(() => {})
        audioCtx = null
      } catch (e) {
        // Игнорируем ошибки
      }
    }
    if (cleanupTimeout) {
      window.clearTimeout(cleanupTimeout)
      cleanupTimeout = null
    }
    isThemePlaying.value = false
  }
})
</script>

<style scoped>
.landing {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #0f172a;
  overflow: hidden;
}

.landing-card {
  width: min(700px, 100%);
  background: rgba(12, 19, 36, 0.65);
  backdrop-filter: blur(24px) saturate(160%);
  border-radius: 2rem;
  padding: 3.5rem 2.75rem;
  box-shadow: 0 45px 90px rgba(5, 12, 28, 0.65);
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #f8fafc;
  transform: translateY(-8%);
}

.landing-brand h1 {
  margin: 0;
  font-size: clamp(2.4rem, 5vw, 3.4rem);
  color: #f8fafc;
  text-shadow: 0 6px 24px rgba(15, 23, 42, 0.6);
}

.landing-brand p {
  margin: 0.5rem 0 0;
  color: rgba(226, 232, 240, 0.9);
  font-family: 'Kalam', 'Nunito', cursive;
  font-size: clamp(1.1rem, 2.2vw, 1.35rem);
}

.brand-title {
  display: block;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  color: #f8fafc;
  text-shadow: 0 6px 24px rgba(15, 23, 42, 0.6);
  white-space: normal;
}

.brand-title--animated .brand-letter {
  animation: titleChain 1.2s ease-out forwards;
  animation-delay: calc(var(--i) * 0.15s);
  animation-iteration-count: 1;
  animation-fill-mode: forwards;
}

.brand-letter {
  display: inline-block;
  transform: translateY(0);
  opacity: 1;
  filter: drop-shadow(0 0 0 rgba(56, 189, 248, 0));
}

@keyframes titleChain {
  0% {
    transform: translateY(40px) scale(0.9);
    opacity: 0;
    filter: drop-shadow(0 0 0 rgba(56, 189, 248, 0));
  }
  40% {
    transform: translateY(-12px) scale(1.05);
    opacity: 1;
    filter: drop-shadow(0 18px 25px rgba(56, 189, 248, 0.55));
  }
  75% {
    transform: translateY(4px) scale(0.98);
    filter: drop-shadow(0 6px 12px rgba(34, 211, 238, 0.35));
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
    filter: drop-shadow(0 0 0 rgba(56, 189, 248, 0));
  }
}

.brand-word {
  display: inline-flex;
  margin-right: 0.55rem;
}

.brand-space {
  display: inline-block;
  width: 0.3rem;
}

.brand-subtitle {
  margin: 0.85rem 0 0;
  color: rgba(226, 232, 240, 0.9);
  font-family: 'Kalam', 'Nunito', cursive;
  font-size: clamp(1.1rem, 2.2vw, 1.35rem);
  font-weight: 500;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.brand-subtitle-break {
  display: none;
}

.brand-subtitle--visible {
  opacity: 1;
  transform: translateY(0);
}

@keyframes titleSnake {
  0%, 100% {
    transform: translateY(0px) rotate(-1deg);
  }
  50% {
    transform: translateY(-10px) rotate(1.5deg);
  }
}

.theme-button {
  align-self: flex-start;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(96, 165, 250, 0.45);
  color: #e0f2fe;
  border-radius: 9999px;
  padding: 0.55rem 1.4rem;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease, color 0.25s ease;
}

.theme-button:hover {
  transform: translateY(-2px);
  color: #22d3ee;
  box-shadow: 0 18px 32px rgba(56, 189, 248, 0.28);
}

.theme-button:active {
  transform: translateY(0);
}

.identity-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  justify-content: space-between;
}

.identity-row input {
  flex: 1;
  border: none;
  border-radius: 1.25rem;
  padding: 1.05rem 1.8rem;
  font-size: 1.05rem;
  font-weight: 600;
  background: rgba(2, 6, 23, 0.85);
  color: #f8fafc;
  box-shadow: inset 0 0 0 2px rgba(148, 163, 184, 0.45), 0 8px 20px rgba(5, 25, 45, 0.6);
  transition: transform 0.35s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.35s ease;
  width: -webkit-fill-available;
}

.identity-row input::placeholder {
  color: rgba(248, 250, 252, 0.5);
}

.identity-row input:focus {
  outline: none;
  transform: translateY(-3px) scale(1.01);
  box-shadow: inset 0 0 0 2px rgba(96, 165, 250, 0.7), 0 22px 40px rgba(56, 189, 248, 0.4);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.actions .divider {
  text-align: center;
  font-family: 'Kalam', 'Nunito', cursive;
  color: rgba(226, 232, 240, 0.85);
  letter-spacing: 0.12em;
}

.primary,
.secondary {
  position: relative;
  border: none;
  border-radius: 1.25rem;
  padding: 1.05rem 1.8rem;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  color: #0f172a;
  letter-spacing: 0.08em;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease;
}

.primary {
  background: radial-gradient(circle at 25% 25%, rgba(253, 224, 71, 0.6), transparent 55%),
    linear-gradient(135deg, #f97316, #facc15);
  box-shadow: 0 20px 42px rgba(249, 115, 22, 0.45);
}

.secondary {
  background: radial-gradient(circle at 20% 25%, rgba(244, 114, 182, 0.6), transparent 55%),
    linear-gradient(135deg, #ec4899, #6366f1);
  box-shadow: 0 18px 40px rgba(99, 102, 241, 0.45);
  color: #0f172a;
}

.primary:hover,
.secondary:hover {
  transform: translateY(-3px) scale(1.01);
  box-shadow: 0 26px 52px rgba(76, 29, 149, 0.25);
}

.primary:active,
.secondary:active {
  transform: translateY(0) scale(0.98);
}

.buzzer-button {
  width: min(420px, 100%);
  border: none;
  border-radius: 9999px;
  padding: 1.5rem 2rem;
  font-size: 1.5rem;
  font-weight: 700;
  cursor: pointer;
  color: #0f172a;
  background: linear-gradient(135deg, #22d3ee, #38bdf8);
  transition: transform 0.3s cubic-bezier(0.19, 1, 0.22, 1), box-shadow 0.35s ease;
  position: relative;
  overflow: hidden;
}

.buzzer-button::before {
  content: '';
  position: absolute;
  inset: -25%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.35), transparent 60%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.buzzer-button.ready {
  background: linear-gradient(135deg, #38bdf8, #a855f7);
  box-shadow: 0 18px 46px rgba(168, 85, 247, 0.4);
}

.buzzer-button.ready:hover {
  transform: translateY(-4px) scale(1.03);
  box-shadow: 0 26px 55px rgba(168, 85, 247, 0.5);
}

.buzzer-button:hover::before {
  opacity: 1;
}

.buzzer-button:not(:disabled):active {
  transform: translateY(0px) scale(0.97);
}

.btn-glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-text {
  position: relative;
  z-index: 1;
}

.primary:hover .btn-glow,
.secondary:hover .btn-glow {
  opacity: 1;
}

.primary:hover,
.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(56, 189, 248, 0.35);
}

.join-block {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.join-input {
  flex: 1 1;
  text-transform: uppercase;
  letter-spacing: 0.35em;
  text-align: center;
  font-weight: 700;
  border-radius: 1.25rem;
  border: none;
  padding: 1.05rem 1.8rem;
  background: rgba(11, 23, 42, 0.85);
  color: #f9fafb;
  box-shadow: inset 0 0 0 2px rgba(148, 163, 184, 0.45);
}

.join-input::placeholder {
  color: rgba(248, 250, 252, 0.55);
}

.error-message {
  margin: 0;
  color: #fca5a5;
  font-weight: 600;
  text-align: center;
}

.landing--loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  text-align: center;
}

.loader {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(56, 189, 248, 0.15));
  border: 3px solid rgba(56, 189, 248, 0.3);
  position: relative;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 
    0 0 0 0 rgba(34, 211, 238, 0.4),
    0 8px 24px rgba(15, 23, 42, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
}

.loader::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #22d3ee;
  border-right-color: #38bdf8;
  animation: spin 1s linear infinite;
}

.loader::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.6), transparent);
  animation: pulse-inner 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 
      0 0 0 0 rgba(34, 211, 238, 0.4),
      0 8px 24px rgba(15, 23, 42, 0.3),
      inset 0 2px 4px rgba(255, 255, 255, 0.1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 
      0 0 0 8px rgba(34, 211, 238, 0),
      0 12px 32px rgba(15, 23, 42, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.15);
  }
}

@keyframes pulse-inner {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

.loading-state p {
  color: rgba(226, 232, 240, 0.9);
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 8px rgba(15, 23, 42, 0.3);
}

@media (max-width: 720px) {
  .landing-card {
    padding: 2rem 1.5rem;
  }

  .landing-brand {
    padding: 0 0.5rem;
  }

  .brand-subtitle {
    margin-top: 1rem;
    font-weight: 600;
  }

  .brand-subtitle-break {
    display: block;
  }

  .identity-row {
    flex-direction: column-reverse;
    align-items: center;
    padding: 0 0.5rem;
  }

  .identity-row input {
    width: 100%;
    width: -webkit-fill-available;
  }

  .actions {
    padding: 0 0.5rem;
  }

  .join-block {
    flex-direction: column;
    align-items: stretch;
  }

  .secondary {
    width: 100%;
  }
}
</style>
