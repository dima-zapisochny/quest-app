<template>
  <div class="lang" ref="rootRef">
    <button
      type="button"
      class="lang__toggle"
      :aria-label="t('language.label')"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="lang__globe" aria-hidden="true">🌐</span>
      <span class="lang__current">{{ currentName }}</span>
      <span class="lang__chevron" :class="{ 'lang__chevron--open': open }" aria-hidden="true">▾</span>
    </button>

    <transition name="lang-menu">
      <ul v-if="open" class="lang__menu" role="listbox">
        <li
          v-for="loc in locales"
          :key="loc"
          class="lang__item"
          :class="{ 'lang__item--active': loc === current }"
          role="option"
          :aria-selected="loc === current"
          @click="choose(loc)"
        >
          <span>{{ names[loc] }}</span>
          <span v-if="loc === current" class="lang__check" aria-hidden="true">✓</span>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, LOCALE_NAMES, setLocale, type AppLocale } from '@/i18n'

const { t, locale } = useI18n()

const locales = SUPPORTED_LOCALES
const names = LOCALE_NAMES
const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)

const current = computed(() => locale.value as AppLocale)
const currentName = computed(() => LOCALE_NAMES[current.value] ?? current.value)

function choose(loc: AppLocale) {
  setLocale(loc)
  open.value = false
}

function onClickOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) {
    open.value = false
  }
}

onMounted(() => window.addEventListener('click', onClickOutside))
onBeforeUnmount(() => window.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.lang {
  position: relative;
  display: inline-block;
}
.lang__toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.6rem;
  padding: 0 0.95rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: linear-gradient(135deg, rgb(var(--c-surface) / 0.75), rgb(var(--c-bg) / 0.55));
  color: rgb(var(--c-text));
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 22px rgb(var(--c-bg-deep) / 0.4), inset 0 1px 0 rgb(var(--c-white) / 0.05);
  transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}
.lang__toggle:hover {
  border-color: rgb(var(--c-accent-sky) / 0.6);
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgb(var(--c-accent-sky) / 0.25), inset 0 1px 0 rgb(var(--c-white) / 0.06);
}
.lang__toggle:focus { outline: none; }
.lang__toggle:focus-visible {
  outline: 2px solid rgb(var(--c-accent-sky) / 0.6);
  outline-offset: 2px;
}
.lang__globe {
  font-size: 1rem;
  line-height: 1;
}
.lang__chevron {
  font-size: 0.7rem;
  opacity: 0.7;
  transition: transform 0.2s ease;
}
.lang__chevron--open {
  transform: rotate(180deg);
}

.lang__menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 50;
  min-width: 11rem;
  margin: 0;
  padding: 0.35rem;
  list-style: none;
  border-radius: 14px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg) / 0.96);
  box-shadow: 0 20px 44px rgb(var(--c-bg-deep) / 0.6);
  backdrop-filter: blur(12px);
}
.lang__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  border-radius: 10px;
  color: rgb(var(--c-text-soft) / 0.85);
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.lang__item:hover {
  background: rgb(var(--c-accent-sky) / 0.12);
  color: rgb(var(--c-text));
}
.lang__item--active {
  color: rgb(var(--c-accent-soft));
}
.lang__check {
  color: rgb(var(--c-success));
}

.lang-menu-enter-active,
.lang-menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.lang-menu-enter-from,
.lang-menu-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
