<template>
  <div class="timer-circle-container" :class="{ 'timer-warning': timeLeft <= 5 }">
    <svg
      class="timer-circle"
      :width="size"
      :height="size"
      :viewBox="`0 0 ${size} ${size}`"
    >
      <circle
        class="timer-bg"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="rgba(255, 255, 255, 0.2)"
        :stroke-width="strokeWidth"
      />
      <circle
        class="timer-progress"
        :cx="center"
        :cy="center"
        :r="radius"
        fill="none"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="strokeDashoffset"
        :class="{ 'timer-animate': autoStart }"
      />
    </svg>
    <div class="timer-text">{{ timeLeft }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

interface Props {
  durationSec?: number
  autoStart?: boolean
  /**
   * Epoch ms старта отсчёта. Если задан — остаток вычисляется от серверного
   * времени (duration - (now - startedAt)), поэтому переживает перезагрузку и
   * троттлинг фоновой вкладки и одинаков на всех устройствах (#11).
   * Если null/undefined — работает старый локальный счётчик (с паузой).
   */
  startedAt?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  durationSec: 20,
  autoStart: true,
  startedAt: null
})

const emit = defineEmits<{
  finished: []
}>()

const size = 120
const center = size / 2
const radius = center - 10
const strokeWidth = 8
const circumference = 2 * Math.PI * radius

const timeLeft = ref(props.durationSec)
const elapsed = ref(0)
const intervalId = ref<number | null>(null)
const isRunning = ref(false)
const isPaused = ref(false)

const strokeDashoffset = computed(() => {
  const progress = elapsed.value / props.durationSec
  return circumference * (1 - progress)
})

function tick() {
  if (props.startedAt != null) {
    // Авторитетный режим: остаток от серверного времени старта
    elapsed.value = (Date.now() - props.startedAt) / 1000
  } else {
    elapsed.value += 0.1
  }
  timeLeft.value = Math.max(0, Math.ceil(props.durationSec - elapsed.value))

  if (elapsed.value >= props.durationSec) {
    stopTimer()
    emit('finished')
  }
}

function startInterval() {
  intervalId.value = window.setInterval(tick, 100)
}

function startTimer() {
  if (intervalId.value) return
  isRunning.value = true
  isPaused.value = false
  // В авторитетном режиме начальный elapsed берём от timestamp, иначе — с нуля
  elapsed.value = props.startedAt != null ? (Date.now() - props.startedAt) / 1000 : 0
  timeLeft.value = Math.max(0, Math.ceil(props.durationSec - elapsed.value))
  startInterval()
}

function stopTimer() {
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  isRunning.value = false
  isPaused.value = false
}

function pauseTimer() {
  if (!intervalId.value) return
  clearInterval(intervalId.value)
  intervalId.value = null
  isRunning.value = false
  isPaused.value = true
}

function resumeTimer() {
  if (intervalId.value || elapsed.value >= props.durationSec) return
  isRunning.value = true
  isPaused.value = false
  startInterval()
}

function resetTimer() {
  stopTimer()
  elapsed.value = props.startedAt != null ? (Date.now() - props.startedAt) / 1000 : 0
  timeLeft.value = Math.max(0, Math.ceil(props.durationSec - elapsed.value))
  if (props.autoStart) {
    startTimer()
  }
}

// В авторитетном режиме перезапускаем отсчёт при смене точки старта (новый отвечающий)
watch(() => props.startedAt, (val) => {
  if (val != null && props.autoStart) {
    resetTimer()
  }
})

watch(() => props.autoStart, newVal => {
  if (newVal && !isRunning.value) {
    startTimer()
  } else if (!newVal) {
    pauseTimer()
  }
})

onMounted(() => {
  if (props.autoStart) {
    startTimer()
  }
})

onUnmounted(() => {
  stopTimer()
})

defineExpose({
  start: startTimer,
  stop: stopTimer,
  reset: resetTimer,
  pause: pauseTimer,
  resume: resumeTimer
})
</script>

<style scoped>
.timer-circle-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-circle {
  transform: rotate(-90deg);
}

.timer-progress {
  transition: stroke-dashoffset 0.1s linear;
  color: #22d3ee;
}

.timer-bg {
  color: rgba(255, 255, 255, 0.2);
}

.timer-text {
  position: absolute;
  font-size: 2rem;
  font-weight: bold;
  color: #22d3ee;
  text-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.timer-warning .timer-progress {
  color: #ef4444;
}

.timer-warning .timer-text {
  color: #f87171;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
}

</style>

