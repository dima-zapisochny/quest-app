<template>
  <button
    type="button"
    class="sound-toggle"
    :class="{ 'sound-toggle--off': !soundEnabled }"
    :aria-label="soundEnabled ? t('common.soundOff') : t('common.soundOn')"
    :title="soundEnabled ? t('common.soundOff') : t('common.soundOn')"
    @click="onToggle"
  >
    <svg
      v-if="soundEnabled"
      class="sound-toggle__icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
    <svg
      v-else
      class="sound-toggle__icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="m22 9-6 6" />
      <path d="m16 9 6 6" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUiSound } from '@/composables/useUiSound'
import { playQuestSelectSound } from '@/utils/uiSound'

const { t } = useI18n()
const { soundEnabled, toggleSound } = useUiSound()

function onToggle() {
  const willEnable = !soundEnabled.value
  toggleSound()
  if (willEnable) {
    void playQuestSelectSound({ force: true })
  }
}
</script>

<style scoped>
.sound-toggle {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 9999px;
  border: 1px solid rgb(var(--c-text-muted) / 0.2);
  background: rgb(var(--c-bg) / 0.25);
  backdrop-filter: blur(12px);
  color: rgb(var(--c-text-soft));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    background 0.2s ease;
}

.sound-toggle:hover {
  transform: translateY(-1px);
  border-color: rgb(var(--c-accent-sky) / 0.35);
  color: rgb(var(--c-text));
}

.sound-toggle--off {
  color: rgb(var(--c-text-muted) / 0.65);
}

.sound-toggle__icon {
  display: block;
}

@media (max-width: 480px) {
  .sound-toggle {
    width: 2.45rem;
    height: 2.45rem;
  }

  .sound-toggle__icon {
    width: 18px;
    height: 18px;
  }
}
</style>
