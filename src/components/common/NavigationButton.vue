<template>
  <button 
    class="nav-button" 
    :class="buttonClass"
    type="button"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <svg
      v-if="variant === 'back'"
      class="nav-button__arrow"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
    <span spellcheck="false" translate="no">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'back' | 'exit' | 'home'
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

.nav-button--back,
.nav-button--home {
  background: rgb(var(--c-teal) / 0.12);
  border: 1px solid rgb(var(--c-accent) / 0.4);
  color: rgb(var(--c-text));
  min-width: 9rem;
  padding-left: 1.35rem;
  padding-right: 1.6rem;
}

.nav-button--back:hover:not(:disabled),
.nav-button--home:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgb(var(--c-accent) / 0.25);
}

.nav-button--exit {
  background: rgb(var(--c-danger) / 0.25);
  border: 1px solid rgb(var(--c-text-muted) / 0.2);
  color: rgb(var(--c-text));
  backdrop-filter: blur(12px);
  box-shadow: 
    0 4px 12px rgb(var(--c-bg-deep) / 0.3),
    0 2px 6px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.15),
    inset 0 -2px 4px rgb(var(--c-black) / 0.25);
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
    rgb(var(--c-white) / 0.1) 0%,
    transparent 50%,
    rgb(var(--c-white) / 0.05) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
}

.nav-button--exit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 16px rgb(var(--c-danger) / 0.35),
    0 3px 8px rgb(var(--c-danger) / 0.25),
    inset 0 2px 4px rgb(var(--c-white) / 0.2),
    inset 0 -2px 4px rgb(var(--c-black) / 0.25);
  background: rgb(var(--c-danger) / 0.3);
}

.nav-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.nav-button__arrow {
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.nav-button--back:hover:not(:disabled) .nav-button__arrow {
  transform: translateX(-3px);
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
