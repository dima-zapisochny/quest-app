<template>
  <teleport to="body">
    <transition name="howto">
      <div v-if="show" class="howto-overlay" @click.self="close">
        <div class="howto" role="dialog" aria-modal="true" :aria-label="t('howto.title')">
          <div class="howto__glow" aria-hidden="true"></div>

          <header class="howto__head">
            <div class="howto__title-wrap">
              <span class="howto__badge" aria-hidden="true">🎮</span>
              <div>
                <h2 class="howto__title">{{ t('howto.title') }}</h2>
                <p class="howto__subtitle">{{ t('howto.subtitle') }}</p>
              </div>
            </div>
            <button type="button" class="howto__close" :aria-label="t('common.close')" @click="close">✕</button>
          </header>

          <div class="howto__tabs" role="tablist">
            <button
              type="button"
              class="howto__tab"
              :class="{ 'howto__tab--active': tab === 'play' }"
              role="tab"
              :aria-selected="tab === 'play'"
              @click="tab = 'play'"
            >🕹️ {{ t('howto.tabPlay') }}</button>
            <button
              type="button"
              class="howto__tab"
              :class="{ 'howto__tab--active': tab === 'create' }"
              role="tab"
              :aria-selected="tab === 'create'"
              @click="tab = 'create'"
            >✏️ {{ t('howto.tabCreate') }}</button>
          </div>

          <div class="howto__body">
            <ol :key="tab" class="howto__steps">
              <li
                v-for="(step, i) in steps"
                :key="step.icon"
                class="howto-step"
                :style="{ '--i': i, '--accent': step.accent }"
              >
                <span class="howto-step__icon" :class="{ 'howto-step__icon--pulse': step.pulse }" aria-hidden="true">
                  {{ step.icon }}
                </span>
                <div class="howto-step__body">
                  <span class="howto-step__num" aria-hidden="true">{{ i + 1 }}</span>
                  <h3 class="howto-step__title">{{ t(step.title) }}</h3>
                  <p class="howto-step__text">{{ t(step.text) }}</p>
                </div>
              </li>
            </ol>
          </div>

          <footer class="howto__foot">
            <button type="button" class="howto__done" @click="close">{{ t('howto.gotIt') }}</button>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const tab = ref<'play' | 'create'>('play')

interface Step {
  icon: string
  title: string
  text: string
  accent: string
  pulse?: boolean
}

const playSteps: Step[] = [
  { icon: '🕹️', title: 'howto.play1Title', text: 'howto.play1Text', accent: 'var(--c-accent-sky)' },
  { icon: '📱', title: 'howto.play2Title', text: 'howto.play2Text', accent: 'var(--c-violet)' },
  { icon: '🎯', title: 'howto.play3Title', text: 'howto.play3Text', accent: 'var(--c-accent)' },
  { icon: '⚡', title: 'howto.play4Title', text: 'howto.play4Text', accent: 'var(--c-blue)', pulse: true },
  { icon: '🏆', title: 'howto.play5Title', text: 'howto.play5Text', accent: 'var(--c-success)' }
]

const createSteps: Step[] = [
  { icon: '➕', title: 'howto.create1Title', text: 'howto.create1Text', accent: 'var(--c-accent-sky)' },
  { icon: '📐', title: 'howto.create2Title', text: 'howto.create2Text', accent: 'var(--c-violet)' },
  { icon: '✏️', title: 'howto.create3Title', text: 'howto.create3Text', accent: 'var(--c-accent)' },
  { icon: '✅', title: 'howto.create4Title', text: 'howto.create4Text', accent: 'var(--c-success)' }
]

const steps = computed(() => (tab.value === 'play' ? playSteps : createSteps))

function close() {
  emit('close')
}
</script>

<style scoped>
.howto-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vh, 2.5rem) 1rem;
  overflow-y: auto;
  background: rgb(var(--c-bg-deep) / 0.78);
  backdrop-filter: blur(8px);
}

.howto {
  position: relative;
  width: min(680px, 100%);
  margin: auto;
  overflow: hidden;
  border-radius: 26px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: linear-gradient(150deg, rgb(var(--c-bg) / 0.98), rgba(8, 22, 43, 0.98));
  box-shadow: 0 40px 90px rgb(var(--c-bg-deep) / 0.7);
  display: flex;
  flex-direction: column;
  max-height: min(90vh, 100%);
}
.howto__glow {
  position: absolute;
  top: -35%;
  left: 50%;
  width: 120%;
  height: 240px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgb(var(--c-accent-sky) / 0.35), transparent 62%);
  opacity: 0.5;
  pointer-events: none;
}

.howto__head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.4rem 1.6rem 1rem;
}
.howto__title-wrap {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.howto__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 16px;
  font-size: 1.6rem;
  background: linear-gradient(135deg, rgb(var(--c-accent-sky) / 0.25), rgb(var(--c-violet) / 0.25));
  border: 1px solid rgb(var(--c-accent-sky) / 0.3);
  animation: howto-float 3s ease-in-out infinite;
}
.howto__title {
  margin: 0;
  font-size: 1.3rem;
  color: rgb(var(--c-text));
}
.howto__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.88rem;
  color: rgb(var(--c-text-soft) / 0.7);
}
.howto__close {
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 12px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg) / 0.5);
  color: rgb(var(--c-text-soft));
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.howto__close:hover {
  background: rgb(var(--c-danger) / 0.16);
  color: rgb(var(--c-danger-soft));
}

.howto__tabs {
  display: inline-flex;
  gap: 0.35rem;
  align-self: center;
  margin: 0.25rem auto 0.5rem;
  padding: 0.35rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.2);
  background: rgb(var(--c-bg) / 0.5);
}
.howto__tab {
  border: none;
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.8);
  padding: 0.5rem 1.2rem;
  border-radius: var(--radius-pill);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.howto__tab--active {
  background: linear-gradient(135deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent)));
  color: rgb(var(--c-bg));
}

.howto__body {
  padding: 0.5rem 1.6rem 0.75rem;
  overflow-y: auto;
}
.howto__steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
.howto-step {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.9rem 1rem;
  border-radius: 16px;
  border: 1px solid rgb(var(--accent) / 0.28);
  background: rgb(var(--accent) / 0.08);
  opacity: 0;
  transform: translateY(10px);
  animation: howto-in 0.4s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
  animation-delay: calc(var(--i) * 70ms);
}
.howto-step__icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.9rem;
  height: 2.9rem;
  border-radius: 14px;
  font-size: 1.5rem;
  background: rgb(var(--accent) / 0.18);
  border: 1px solid rgb(var(--accent) / 0.4);
}
.howto-step__icon--pulse {
  animation: howto-pulse 1.4s ease-in-out infinite;
}
.howto-step__body {
  position: relative;
  min-width: 0;
}
.howto-step__num {
  position: absolute;
  top: -0.2rem;
  right: 0;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(var(--accent) / 0.85);
}
.howto-step__title {
  margin: 0 0 0.15rem;
  font-size: 1rem;
  color: rgb(var(--c-text));
}
.howto-step__text {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.4;
  color: rgb(var(--c-text-soft) / 0.85);
}

.howto__foot {
  display: flex;
  justify-content: center;
  padding: 0.9rem 1.6rem 1.4rem;
}
.howto__done {
  min-width: 180px;
  padding: 0.75rem 2rem;
  border-radius: var(--radius-pill);
  border: none;
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  color: rgb(var(--c-bg));
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.howto__done:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgb(var(--c-accent) / 0.35);
}

@keyframes howto-in {
  to { opacity: 1; transform: translateY(0); }
}
@keyframes howto-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes howto-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgb(var(--accent) / 0.5); }
  50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgb(var(--accent) / 0); }
}

/* Появление модалки */
.howto-enter-active,
.howto-leave-active {
  transition: opacity 0.25s ease;
}
.howto-enter-active .howto,
.howto-leave-active .howto {
  transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.25s ease;
}
.howto-enter-from,
.howto-leave-to {
  opacity: 0;
}
.howto-enter-from .howto,
.howto-leave-to .howto {
  opacity: 0;
  transform: translateY(16px) scale(0.95);
}

@media (max-width: 480px) {
  .howto-step {
    gap: 0.75rem;
    padding: 0.75rem;
  }
  .howto-step__icon {
    width: 2.4rem;
    height: 2.4rem;
    font-size: 1.25rem;
  }
}
</style>
