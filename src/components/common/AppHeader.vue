<template>
  <header class="app-header">
    <div class="app-header-left">
      <NavigationButton
        :variant="buttonVariant"
        :label="buttonLabel ?? t('common.back')"
        :disabled="buttonDisabled"
        @click="$emit('button-click')"
      />
    </div>
    <div class="app-header-right">
      <SoundToggleButton v-if="showSoundToggle" />
      <button
        v-if="showSessionCode && sessionCode"
        type="button"
        class="session-chip"
        :class="{ 'session-chip--copied': copied }"
        :title="t('common.copyCodeHint')"
        :aria-label="`${t('common.gameCode')}: ${sessionCode}. ${t('common.copyCodeHint')}`"
        @click="copyCode"
      >
        <span class="session-chip__label">{{ t('common.gameCode') }}:</span>
        <strong class="session-chip__code">{{ sessionCode }}</strong>
        <span class="session-chip__action" aria-hidden="true">
          <svg v-if="!copied" class="session-chip__icon" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg v-else class="session-chip__icon" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </button>
      <UserPill v-if="userName || userAvatar" :name="userName" :avatar="userAvatar" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NavigationButton from './NavigationButton.vue'
import SoundToggleButton from './SoundToggleButton.vue'
import UserPill from './UserPill.vue'
import { showToast } from '@/utils/toast'

const { t } = useI18n()

interface Props {
  buttonVariant?: 'back' | 'exit' | 'home'
  buttonLabel?: string
  buttonDisabled?: boolean
  showSessionCode?: boolean
  sessionCode?: string | null
  userName?: string | null
  userAvatar?: string | null
  showSoundToggle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  buttonVariant: 'back',
  buttonLabel: undefined,
  buttonDisabled: false,
  showSessionCode: false,
  sessionCode: null,
  userName: null,
  userAvatar: null,
  showSoundToggle: true
})

defineEmits<{
  'button-click': []
}>()

const copied = ref(false)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

async function copyCode() {
  const code = props.sessionCode?.trim()
  if (!code) return

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code)
    } else {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    showToast(t('common.codeCopied'))
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    showToast(t('common.copyFailed'))
  }
}

onBeforeUnmount(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
})
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.2rem 1.5rem 0.75rem;
  margin: 0;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  box-sizing: border-box;
}

.app-header-left {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  flex-shrink: 0;
}

.app-header-right {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.session-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgb(var(--c-accent) / 0.15);
  border: 1px solid rgb(var(--c-accent) / 0.4);
  padding: 0.6rem 1.1rem;
  border-radius: 9999px;
  font-weight: 600;
  color: rgb(var(--c-text));
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.session-chip:hover {
  background: rgb(var(--c-accent) / 0.24);
  border-color: rgb(var(--c-accent) / 0.55);
}

.session-chip:active {
  transform: scale(0.98);
}

.session-chip--copied {
  background: rgb(var(--c-success) / 0.2);
  border-color: rgb(var(--c-success) / 0.55);
}

.session-chip__code {
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
}

.session-chip__action {
  margin-left: 0.1rem;
  display: inline-flex;
  line-height: 1;
  opacity: 0.8;
}

.session-chip__icon {
  width: 0.95em;
  height: 0.95em;
}

.session-chip--copied .session-chip__action {
  opacity: 1;
  color: rgb(var(--c-success-light));
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem 1rem 0.5rem;
    gap: 0.5rem;
  }

  .app-header-right {
    gap: 0.5rem;
  }

  .session-chip {
    padding: 0.4rem 0.85rem;
    font-size: 0.78rem;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0.85rem 0.75rem 0.4rem;
    gap: 0.4rem;
  }

  .session-chip {
    padding: 0.35rem 0.7rem;
    font-size: 0.72rem;
  }

  .session-chip__label {
    display: none;
  }
}

@media (max-width: 360px) {
  .app-header {
    padding: 0.75rem 0.5rem 0.35rem;
    gap: 0.35rem;
  }

  .session-chip {
    padding: 0.3rem 0.6rem;
    font-size: 0.68rem;
  }
}
</style>
