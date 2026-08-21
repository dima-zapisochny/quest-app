<template>
  <teleport to="body">
    <transition name="howto">
      <div v-if="show" class="howto-overlay" @click.self="close">
        <div class="howto" role="dialog" aria-modal="true" :aria-label="t('howto.title')">
          <header class="howto__head">
            <div class="howto__title-wrap">
              <h2 class="howto__title">{{ t('howto.title') }}</h2>
              <p class="howto__subtitle">{{ t('howto.subtitle') }}</p>
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
              @click="switchTab('play')"
            >{{ t('howto.tabPlay') }}</button>
            <button
              type="button"
              class="howto__tab"
              :class="{ 'howto__tab--active': tab === 'create' }"
              role="tab"
              :aria-selected="tab === 'create'"
              @click="switchTab('create')"
            >{{ t('howto.tabCreate') }}</button>
          </div>

          <!-- Верх: анимированный пример -->
          <div class="howto__stage">
            <transition :name="dir === 1 ? 'stage-next' : 'stage-prev'" mode="out-in">
              <HowToIllustration :key="current.scene" :scene="current.scene" class="howto__illu" />
            </transition>
          </div>

          <!-- Низ: текст и описание -->
          <div class="howto__content">
            <transition :name="dir === 1 ? 'text-next' : 'text-prev'" mode="out-in">
              <div :key="current.scene" class="howto__text">
                <span class="howto__step-num">{{ step + 1 }} / {{ steps.length }}</span>
                <h3 class="howto__step-title">{{ t(current.title) }}</h3>
                <p class="howto__step-desc">{{ t(current.text) }}</p>
              </div>
            </transition>
          </div>

          <!-- Пошаговый переключатель -->
          <footer class="howto__nav">
            <button
              type="button"
              class="howto__prev"
              :disabled="step === 0"
              @click="prev"
            >{{ t('howto.prev') }}</button>

            <div class="howto__dots" role="tablist">
              <button
                v-for="(s, i) in steps"
                :key="s.scene"
                type="button"
                class="howto__dot"
                :class="{ 'howto__dot--active': i === step }"
                :aria-label="`${i + 1}`"
                @click="goTo(i)"
              ></button>
            </div>

            <button
              type="button"
              class="howto__next"
              @click="next"
            >{{ isLast ? t('howto.gotIt') : t('howto.next') }}</button>
          </footer>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import HowToIllustration from './howto/HowToIllustration.vue'

const { t } = useI18n()

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

interface Step { scene: string; title: string; text: string }

const playSteps: Step[] = [
  { scene: 'start', title: 'howto.play1Title', text: 'howto.play1Text' },
  { scene: 'join', title: 'howto.play2Title', text: 'howto.play2Text' },
  { scene: 'open', title: 'howto.play3Title', text: 'howto.play3Text' },
  { scene: 'buzz', title: 'howto.play4Title', text: 'howto.play4Text' },
  { scene: 'score', title: 'howto.play5Title', text: 'howto.play5Text' }
]
const createSteps: Step[] = [
  { scene: 'new', title: 'howto.create1Title', text: 'howto.create1Text' },
  { scene: 'board', title: 'howto.create2Title', text: 'howto.create2Text' },
  { scene: 'fill', title: 'howto.create3Title', text: 'howto.create3Text' },
  { scene: 'done', title: 'howto.create4Title', text: 'howto.create4Text' }
]

const tab = ref<'play' | 'create'>('play')
const step = ref(0)
const dir = ref<1 | -1>(1)

const steps = computed(() => (tab.value === 'play' ? playSteps : createSteps))
const current = computed(() => steps.value[step.value])
const isLast = computed(() => step.value === steps.value.length - 1)

function switchTab(value: 'play' | 'create') {
  if (tab.value === value) return
  dir.value = 1
  tab.value = value
  step.value = 0
}
function prev() {
  if (step.value > 0) { dir.value = -1; step.value-- }
}
function next() {
  if (isLast.value) { close(); return }
  dir.value = 1
  step.value++
}
function goTo(i: number) {
  dir.value = i > step.value ? 1 : -1
  step.value = i
}
function close() {
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (!props.show) return
  if (e.key === 'Escape') close()
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}

// Сброс при каждом открытии
watch(() => props.show, open => {
  if (open) { tab.value = 'play'; step.value = 0; dir.value = 1 }
})

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.howto-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.75rem, 3vh, 2rem) 1rem;
  overflow-y: auto;
  background: rgb(var(--c-bg-deep) / 0.8);
  backdrop-filter: blur(10px);
}
.howto {
  position: relative;
  width: min(920px, 96vw);
  height: min(88vh, 760px);
  margin: auto;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: linear-gradient(150deg, rgb(var(--c-bg) / 0.98), rgba(8, 22, 43, 0.98));
  box-shadow: 0 45px 100px rgb(var(--c-bg-deep) / 0.7);
  display: flex;
  flex-direction: column;
}

.howto__head {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.6rem 1.8rem 0.9rem;
}
.howto__title-wrap { display: flex; flex-direction: column; gap: 0.2rem; }
.howto__title {
  margin: 0;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: rgb(var(--c-text));
}
.howto__subtitle { margin: 0; font-size: 0.92rem; color: rgb(var(--c-text-soft) / 0.7); }
.howto__close {
  flex-shrink: 0; width: 2.3rem; height: 2.3rem; border-radius: 12px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg) / 0.5); color: rgb(var(--c-text-soft));
  cursor: pointer; transition: background 0.2s ease, color 0.2s ease;
}
.howto__close:hover { background: rgb(var(--c-danger) / 0.16); color: rgb(var(--c-danger-soft)); }

.howto__tabs {
  display: inline-flex; gap: 0.4rem; align-self: center;
  margin: 0.9rem auto 0.35rem; padding: 0.4rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.2);
  background: rgb(var(--c-bg) / 0.55);
}
.howto__tab {
  border: none; background: transparent; color: rgb(var(--c-text-soft) / 0.75);
  padding: 0.6rem 1.9rem; border-radius: var(--radius-pill);
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}
.howto__tab:hover:not(.howto__tab--active) { color: rgb(var(--c-text)); }
.howto__tab--active {
  background: rgb(var(--c-accent-sky) / 0.18);
  color: rgb(var(--c-accent-soft));
}

/* Сцена с анимацией — верхняя, большая */
.howto__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  margin: 0.75rem 1.5rem 0;
  border-radius: 20px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.14);
  background: rgb(var(--c-bg-deep) / 0.3);
  overflow: hidden;
  display: flex;
}
.howto__illu { padding: 0.6rem; }

/* Текст снизу */
.howto__content {
  flex-shrink: 0;
  padding: 1rem 1.6rem 0.5rem;
  text-align: center;
  min-height: 92px;
}
.howto__step-num {
  font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em;
  color: rgb(var(--c-accent-soft) / 0.8); text-transform: uppercase;
}
.howto__step-title {
  margin: 0.25rem 0 0.35rem;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: rgb(var(--c-text));
}
.howto__step-desc {
  margin: 0 auto; max-width: 46ch;
  font-size: 0.95rem; line-height: 1.5; color: rgb(var(--c-text-soft) / 0.85);
}

/* Навигация */
.howto__nav {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  gap: 1rem; padding: 0.75rem 1.6rem 1.3rem;
}
.howto__prev {
  min-width: 110px; padding: 0.7rem 1.5rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.3);
  background: rgb(var(--c-accent-sky) / 0.08);
  color: rgb(var(--c-accent-soft));
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}
.howto__prev:hover:not(:disabled) {
  background: rgb(var(--c-accent-sky) / 0.16);
  border-color: rgb(var(--c-accent-sky) / 0.55);
}
.howto__prev:disabled { opacity: 0.3; cursor: not-allowed; }
.howto__dots { display: flex; gap: 0.5rem; align-items: center; }
.howto__dot {
  width: 0.55rem; height: 0.55rem; border-radius: 50%; border: none; padding: 0;
  background: rgb(var(--c-text-soft) / 0.25); cursor: pointer;
  transition: background 0.2s ease, width 0.2s ease;
}
.howto__dot--active { background: rgb(var(--c-accent-sky)); width: 1.5rem; border-radius: 4px; }
.howto__next {
  min-width: 130px; padding: 0.7rem 1.7rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent) / 0.5);
  background: rgb(var(--c-accent) / 0.18);
  color: rgb(var(--c-accent-soft));
  font-size: 0.95rem; font-weight: 600; cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.howto__next:hover { background: rgb(var(--c-accent) / 0.3); border-color: rgb(var(--c-accent) / 0.7); }


/* Переходы между шагами */
.stage-next-enter-active, .stage-next-leave-active,
.stage-prev-enter-active, .stage-prev-leave-active,
.text-next-enter-active, .text-next-leave-active,
.text-prev-enter-active, .text-prev-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.stage-next-enter-from, .text-next-enter-from { opacity: 0; transform: translateX(40px); }
.stage-next-leave-to, .text-next-leave-to { opacity: 0; transform: translateX(-40px); }
.stage-prev-enter-from, .text-prev-enter-from { opacity: 0; transform: translateX(-40px); }
.stage-prev-leave-to, .text-prev-leave-to { opacity: 0; transform: translateX(40px); }

/* Появление модалки */
.howto-enter-active, .howto-leave-active { transition: opacity 0.25s ease; }
.howto-enter-active .howto, .howto-leave-active .howto {
  transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.25s ease;
}
.howto-enter-from, .howto-leave-to { opacity: 0; }
.howto-enter-from .howto, .howto-leave-to .howto { opacity: 0; transform: translateY(16px) scale(0.96); }

@media (max-width: 560px) {
  .howto { height: min(92vh, 100%); }
  .howto__stage { margin: 0.5rem 1rem 0; }
  .howto__next { min-width: 100px; padding: 0.6rem 1.1rem; }
}
</style>
