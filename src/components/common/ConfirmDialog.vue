<template>
  <teleport to="body">
    <Transition name="confirm-dialog">
      <div v-if="show" class="confirm-dialog-backdrop" @click="emit('cancel')">
        <div class="confirm-dialog" role="dialog" aria-modal="true" @click.stop>
          <header class="confirm-dialog__header">
            <h2>{{ title }}</h2>
            <button type="button" class="confirm-dialog__close" :aria-label="t('common.close')" @click="emit('cancel')">✕</button>
          </header>
          <div class="confirm-dialog__body">
            <slot><p>{{ message }}</p></slot>
          </div>
          <div class="confirm-dialog__actions">
            <BaseButton v-if="!hideCancel" variant="secondary" :disabled="busy" @click="emit('cancel')">{{ cancelLabel ?? t('common.cancel') }}</BaseButton>
            <BaseButton :variant="confirmVariant" :disabled="busy" @click="emit('confirm')">
              {{ busy ? (busyLabel ?? confirmText) : confirmText }}
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseButton from './BaseButton.vue'

const { t } = useI18n()

interface Props {
  show: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Пока идёт действие: блокирует кнопки и показывает busyLabel на «подтвердить». */
  busy?: boolean
  busyLabel?: string
  /** Вариант кнопки подтверждения: danger (по умолч.), primary или secondary. */
  confirmVariant?: 'danger' | 'primary' | 'secondary'
  /** Скрыть кнопку «Отмена» — для info/acknowledge-диалогов с одной кнопкой. */
  hideCancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  confirmLabel: undefined,
  cancelLabel: undefined,
  busy: false,
  busyLabel: undefined,
  confirmVariant: 'danger',
  hideCancel: false
})

const confirmText = computed(() => props.confirmLabel ?? t('common.confirm'))

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.confirm-dialog-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(var(--c-bg) / 0.65);
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
  background: rgb(var(--c-bg) / 0.95);
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  box-shadow: 0 30px 60px rgb(var(--c-sky-deep) / 0.45);
  color: rgb(var(--c-text));
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
  color: rgb(var(--c-text));
}

.confirm-dialog__close {
  background: rgb(var(--c-bg) / 0.5);
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  color: rgb(var(--c-text-soft));
  border-radius: 50%;
  width: 34px;
  height: 34px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
}

.confirm-dialog__close:hover {
  background: rgb(var(--c-danger) / 0.16);
  color: rgb(var(--c-danger-soft));
}

/* Кнопка подтверждения-danger — приглушённая, как в остальном приложении */
.confirm-dialog__actions :deep(.base-button--danger) {
  background: rgb(var(--c-danger) / 0.16);
  border: 1px solid rgb(var(--c-danger) / 0.5);
  color: rgb(var(--c-danger-soft));
  box-shadow: none;
}
.confirm-dialog__actions :deep(.base-button--danger:hover:not(:disabled)) {
  background: rgb(var(--c-danger) / 0.26);
  border-color: rgb(var(--c-danger) / 0.7);
  box-shadow: none;
  transform: none;
}

.confirm-dialog__body {
  color: rgb(var(--c-text-soft) / 0.9);
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

/* Кнопки — BaseButton (variant secondary/danger) */

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

  .confirm-dialog__actions :deep(.base-button) {
    width: 100%;
  }
}
</style>
