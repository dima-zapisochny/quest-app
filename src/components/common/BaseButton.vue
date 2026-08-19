<template>
  <button
    class="base-button"
    :class="`base-button--${variant}`"
    :type="type"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
/**
 * Переиспользуемая pill-кнопка на токенах. Варианты:
 *  - primary       — акцентный градиент (основное действие)
 *  - secondary     — cyan-ghost (нейтральное/отмена)
 *  - danger        — красный градиент (необратимое действие)
 *  - danger-ghost  — прозрачно-красный (мягкое опасное действие, напр. сброс)
 */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'danger-ghost'
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false }
)
</script>

<style scoped>
.base-button {
  min-width: 140px;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
}

.base-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* primary */
.base-button--primary {
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  color: rgb(var(--c-bg));
}
.base-button--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgb(var(--c-accent) / 0.3);
}

/* secondary (cyan-ghost) */
.base-button--secondary {
  background: rgb(var(--c-teal) / 0.15);
  border: 1px solid rgb(var(--c-accent) / 0.45);
  color: rgb(var(--c-accent-soft));
}
.base-button--secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgb(var(--c-accent) / 0.22);
}

/* danger (solid gradient) */
.base-button--danger {
  background: linear-gradient(135deg, rgb(var(--c-danger)), rgb(var(--c-danger-strong)));
  color: rgb(var(--c-white));
  box-shadow: 0 12px 24px rgb(var(--c-danger) / 0.28);
}
.base-button--danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgb(var(--c-danger) / 0.32);
}

/* danger-ghost (прозрачно-красный) */
.base-button--danger-ghost {
  background: rgb(var(--c-danger) / 0.18);
  border: 1px solid rgb(var(--c-danger) / 0.45);
  color: rgb(var(--c-danger-soft));
}
.base-button--danger-ghost:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgb(var(--c-danger) / 0.25);
  background: rgb(var(--c-danger) / 0.25);
}
</style>
