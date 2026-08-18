<template>
  <teleport to="body">
    <Transition name="confirm-dialog">
      <div v-if="show" class="confirm-dialog-backdrop" @click="emit('cancel')">
        <div class="confirm-dialog" role="dialog" aria-modal="true" @click.stop>
          <header class="confirm-dialog__header">
            <h2>{{ title }}</h2>
            <button type="button" class="confirm-dialog__close" aria-label="Закрыть" @click="emit('cancel')">✕</button>
          </header>
          <div class="confirm-dialog__body">
            <slot><p>{{ message }}</p></slot>
          </div>
          <div class="confirm-dialog__actions">
            <button type="button" class="secondary" :disabled="busy" @click="emit('cancel')">{{ cancelLabel }}</button>
            <button type="button" class="danger" :disabled="busy" @click="emit('confirm')">
              {{ busy ? (busyLabel ?? confirmLabel) : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Пока идёт действие: блокирует кнопки и показывает busyLabel на «подтвердить». */
  busy?: boolean
  busyLabel?: string
}

withDefaults(defineProps<Props>(), {
  message: '',
  confirmLabel: 'Подтвердить',
  cancelLabel: 'Отмена',
  busy: false,
  busyLabel: undefined
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.confirm-dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 2000;
}

.confirm-dialog {
  width: min(500px, 100%);
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(56, 189, 248, 0.28);
  box-shadow: 0 30px 60px rgba(8, 47, 73, 0.45);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.9rem;
}

.confirm-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.confirm-dialog__header h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #22d3ee;
}

.confirm-dialog__close {
  background: rgba(15, 118, 110, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.45);
  color: #bae6fd;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
}

.confirm-dialog__close:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(34, 211, 238, 0.3);
}

.confirm-dialog__body {
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.6;
}

.confirm-dialog__body :deep(p) {
  margin: 0;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.confirm-dialog__actions .secondary,
.confirm-dialog__actions .danger {
  min-width: 140px;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
}

.confirm-dialog__actions .secondary {
  background: rgba(15, 118, 110, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.45);
  color: #bae6fd;
}

.confirm-dialog__actions .secondary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(34, 211, 238, 0.22);
}

.confirm-dialog__actions .danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.28);
}

.confirm-dialog__actions .danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgba(239, 68, 68, 0.32);
}

.confirm-dialog__actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.confirm-dialog-enter-active,
.confirm-dialog-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-dialog-enter-from,
.confirm-dialog-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .confirm-dialog {
    padding: 1.25rem;
  }

  .confirm-dialog__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .confirm-dialog__actions .secondary,
  .confirm-dialog__actions .danger {
    width: 100%;
  }
}
</style>
