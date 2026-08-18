<template>
  <div class="host-buttons-row">
    <button
      class="host-button host-button-success"
      type="button"
      :disabled="!canResolve"
      aria-label="Правильно"
      @click="emit('resolve', true)"
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
      @click="emit('toggle-pause')"
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
      aria-label="Неправильно"
      @click="emit('resolve', false)"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canResolve: boolean
  showAnswer: boolean
  isTimerPaused: boolean
}>()

const emit = defineEmits<{
  resolve: [correct: boolean]
  'toggle-pause': []
}>()
</script>

<style scoped>
.host-buttons-row {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
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
</style>
