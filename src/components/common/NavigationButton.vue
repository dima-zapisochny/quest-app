<template>
  <button 
    class="nav-button" 
    :class="buttonClass"
    type="button"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span v-if="variant === 'back'" class="back-arrow">←</span>
    <span>{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'back' | 'exit'
  label?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'back',
  label: 'Назад',
  disabled: false
})

defineEmits<{
  click: []
}>()

const buttonClass = computed(() => {
  return `nav-button--${props.variant}`
})
</script>

<style scoped>
.nav-button {
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 1.05rem;
  padding: 0.55rem 1.45rem;
  min-height: 48px;
  box-sizing: border-box;
}

.nav-button--back {
  background: rgba(15, 118, 110, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.4);
  color: #f8fafc;
}

.nav-button--back:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(34, 211, 238, 0.25);
}

.nav-button--exit {
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #f8fafc;
  backdrop-filter: blur(12px);
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.3),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
}

.nav-button--exit::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
}

.nav-button--exit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 16px rgba(239, 68, 68, 0.35),
    0 3px 8px rgba(239, 68, 68, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
  background: rgba(239, 68, 68, 0.3);
}

.nav-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.back-arrow {
  font-weight: 900;
  display: inline-block;
}

@media (max-width: 768px) {
  .nav-button {
    min-height: 44px;
    padding: 0.5rem 1.2rem;
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .nav-button {
    min-height: 42px;
    padding: 0.45rem 1.05rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 360px) {
  .nav-button {
    min-height: 40px;
    padding: 0.4rem 0.9rem;
    font-size: 0.9rem;
  }
}
</style>

