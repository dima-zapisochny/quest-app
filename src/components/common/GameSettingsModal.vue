<template>
  <teleport to="body">
    <transition name="gs-fade">
      <div v-if="show" class="gs-overlay" @click.self="emit('close')">
        <div class="gs" role="dialog" aria-modal="true">
          <header class="gs__head">
            <h2 class="gs__title">{{ t('settings.title') }}</h2>
            <button type="button" class="gs__close" :aria-label="t('common.close')" @click="emit('close')">✕</button>
          </header>

          <div class="gs__body">
            <div class="gs__row-head">
              <span class="gs__label">{{ t('settings.readDelayTitle') }}</span>
              <span class="gs__value">
                {{ readDelaySec === 0 ? t('settings.instant') : `${readDelaySec} ${t('settings.secShort')}` }}
              </span>
            </div>
            <input
              class="gs__slider"
              type="range"
              :min="READ_DELAY_MIN"
              :max="READ_DELAY_MAX"
              step="1"
              v-model.number="readDelaySec"
              :aria-label="t('settings.readDelayTitle')"
            />
            <div class="gs__ticks" aria-hidden="true">
              <span>0</span><span>5</span><span>10</span>
            </div>
            <p class="gs__desc">{{ t('settings.readDelayDesc') }}</p>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useGameSettings, READ_DELAY_MIN, READ_DELAY_MAX } from '@/composables/useGameSettings'

defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const { readDelaySec } = useGameSettings()
</script>

<style scoped>
.gs-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: rgb(var(--c-bg) / 0.65);
  backdrop-filter: blur(12px);
}
.gs {
  width: min(440px, 100%);
  border-radius: 22px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: linear-gradient(150deg, rgb(var(--c-bg) / 0.98), rgba(8, 22, 43, 0.98));
  box-shadow: 0 40px 90px rgb(var(--c-bg-deep) / 0.7);
  padding: 1.5rem 1.6rem 1.7rem;
}
.gs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}
.gs__title {
  margin: 0;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: rgb(var(--c-text));
}
.gs__close {
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 12px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg) / 0.5);
  color: rgb(var(--c-text-soft));
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s ease, color 0.2s ease;
}
.gs__close:hover {
  background: rgb(var(--c-danger) / 0.16);
  color: rgb(var(--c-danger-soft));
}

.gs__row-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.7rem;
}
.gs__label {
  font-size: 1rem;
  font-weight: 700;
  color: rgb(var(--c-text));
}
.gs__value {
  font-size: 1rem;
  font-weight: 800;
  color: rgb(var(--c-accent-soft));
  white-space: nowrap;
}

.gs__slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgb(var(--c-accent-sky) / 0.18);
  outline: none;
  cursor: pointer;
}
.gs__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent)));
  border: 2px solid rgb(var(--c-bg));
  box-shadow: 0 4px 12px rgb(var(--c-accent-sky) / 0.5);
  cursor: pointer;
}
.gs__slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent)));
  border: 2px solid rgb(var(--c-bg));
  box-shadow: 0 4px 12px rgb(var(--c-accent-sky) / 0.5);
  cursor: pointer;
}
.gs__slider:focus-visible {
  outline: 2px solid rgb(var(--c-accent-sky) / 0.6);
  outline-offset: 4px;
}

.gs__ticks {
  display: flex;
  justify-content: space-between;
  margin-top: 0.4rem;
  font-size: 0.75rem;
  color: rgb(var(--c-text-muted) / 0.7);
}
.gs__desc {
  margin: 0.9rem 0 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: rgb(var(--c-text-soft) / 0.8);
}

.gs-fade-enter-active,
.gs-fade-leave-active {
  transition: opacity 0.2s ease;
}
.gs-fade-enter-from,
.gs-fade-leave-to {
  opacity: 0;
}
</style>
