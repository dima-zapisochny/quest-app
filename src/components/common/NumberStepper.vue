<template>
  <div class="stepper" :class="{ 'stepper--block': block }">
    <span v-if="label" class="stepper__label">{{ label }}</span>
    <div class="stepper__control">
      <button
        type="button"
        class="stepper__btn"
        :disabled="modelValue <= min"
        :aria-label="`Уменьшить ${label ?? ''}`.trim()"
        @click="step(-1)"
      >−</button>
      <span class="stepper__value" aria-live="polite">{{ modelValue }}</span>
      <button
        type="button"
        class="stepper__btn"
        :disabled="modelValue >= max"
        :aria-label="`Увеличить ${label ?? ''}`.trim()"
        @click="step(1)"
      >+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: number
  min?: number
  max?: number
  label?: string
  /** Вертикальная раскладка: подпись сверху, контрол снизу. */
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  min: 1,
  max: 99,
  block: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function step(delta: number) {
  const next = Math.min(props.max, Math.max(props.min, props.modelValue + delta))
  if (next !== props.modelValue) emit('update:modelValue', next)
}
</script>

<style scoped>
.stepper {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}
.stepper--block {
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}

.stepper__label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--c-text-muted) / 0.75);
  text-align: center;
}

.stepper__control {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: rgb(var(--c-bg) / 0.5);
}
.stepper--block .stepper__control {
  justify-content: space-between;
}

.stepper__btn {
  width: 2.1rem;
  height: 2.1rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid rgb(var(--c-accent-sky) / 0.35);
  background: rgb(var(--c-accent-sky) / 0.14);
  color: rgb(var(--c-accent-soft));
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
}
.stepper__btn:hover:not(:disabled) {
  background: rgb(var(--c-accent) / 0.28);
  border-color: rgb(var(--c-accent) / 0.55);
  transform: translateY(-1px);
}
.stepper__btn:active:not(:disabled) {
  transform: translateY(0);
}
.stepper__btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.stepper__value {
  min-width: 2.2rem;
  text-align: center;
  font-size: 1.35rem;
  font-weight: 700;
  color: rgb(var(--c-text));
  font-variant-numeric: tabular-nums;
}
</style>
