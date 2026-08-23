<template>
  <div
    class="howto-slider"
    :class="{ 'howto-slider--embedded': embedded }"
    :aria-label="embedded ? t('howto.title') : undefined"
  >
    <div class="howto-slider__tabs" role="tablist">
      <button
        type="button"
        class="howto-slider__tab"
        :class="{ 'howto-slider__tab--active': tab === 'play' }"
        role="tab"
        :aria-selected="tab === 'play'"
        @click="switchTab('play')"
      >{{ t('howto.tabPlay') }}</button>
      <button
        type="button"
        class="howto-slider__tab"
        :class="{ 'howto-slider__tab--active': tab === 'create' }"
        role="tab"
        :aria-selected="tab === 'create'"
        @click="switchTab('create')"
      >{{ t('howto.tabCreate') }}</button>
    </div>

    <div class="howto-slider__stage">
      <transition :name="dir === 1 ? 'howto-stage-next' : 'howto-stage-prev'" mode="out-in">
        <HowToIllustration :key="current.scene" :scene="current.scene" :compact="embedded" class="howto-slider__illu" />
      </transition>
    </div>

    <div class="howto-slider__content">
      <transition :name="dir === 1 ? 'howto-text-next' : 'howto-text-prev'" mode="out-in">
        <div :key="current.scene" class="howto-slider__text">
          <span class="howto-slider__step-num">{{ step + 1 }} / {{ steps.length }}</span>
          <h3 class="howto-slider__step-title">{{ t(current.title) }}</h3>
          <p class="howto-slider__step-desc">{{ t(current.text) }}</p>
        </div>
      </transition>
    </div>

    <footer class="howto-slider__nav">
      <button
        type="button"
        class="howto-slider__prev"
        :class="{ 'howto-slider__prev--hidden': isFirstStep }"
        @click="prev"
      >{{ t('howto.prev') }}</button>

      <div class="howto-slider__dots" role="tablist">
        <button
          v-for="(s, i) in steps"
          :key="s.scene"
          type="button"
          class="howto-slider__dot"
          :class="{ 'howto-slider__dot--active': i === step }"
          :aria-label="`${i + 1}`"
          @click="goTo(i)"
        ></button>
      </div>

      <button type="button" class="howto-slider__next" @click="next">
        {{ isFinal ? finalLabel : t('howto.next') }}
      </button>
    </footer>

    <ol v-if="embedded" class="howto-slider__seo-steps">
      <li v-for="s in [...HOWTO_PLAY_STEPS, ...HOWTO_CREATE_STEPS]" :key="s.scene">
        <strong>{{ t(s.title) }}</strong> - {{ t(s.text) }}
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import HowToIllustration from './HowToIllustration.vue'
import { HOWTO_PLAY_STEPS, HOWTO_CREATE_STEPS } from './howtoSteps'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    embedded?: boolean
  }>(),
  { embedded: false }
)

const emit = defineEmits<{ complete: [] }>()

const tab = ref<'play' | 'create'>('play')
const step = ref(0)
const dir = ref<1 | -1>(1)

const steps = computed(() => (tab.value === 'play' ? HOWTO_PLAY_STEPS : HOWTO_CREATE_STEPS))
const current = computed(() => steps.value[step.value])
const isLast = computed(() => step.value === steps.value.length - 1)
const isFinal = computed(() => tab.value === 'create' && isLast.value)
const isFirstStep = computed(() => tab.value === 'play' && step.value === 0)
const finalLabel = computed(() =>
  props.embedded ? t('seo.howtoSliderDone') : t('howto.gotIt')
)

function switchTab(value: 'play' | 'create') {
  if (tab.value === value) return
  dir.value = 1
  tab.value = value
  step.value = 0
}

function prev() {
  if (step.value > 0) {
    dir.value = -1
    step.value--
    return
  }
  if (tab.value === 'create') {
    dir.value = -1
    tab.value = 'play'
    step.value = HOWTO_PLAY_STEPS.length - 1
  }
}

function next() {
  if (isFinal.value) {
    emit('complete')
    return
  }
  if (isLast.value && tab.value === 'play') {
    dir.value = 1
    tab.value = 'create'
    step.value = 0
    return
  }
  dir.value = 1
  step.value++
}

function goTo(i: number) {
  dir.value = i > step.value ? 1 : -1
  step.value = i
}

function reset() {
  tab.value = 'play'
  step.value = 0
  dir.value = 1
}

defineExpose({ reset })

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.howto-slider {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: linear-gradient(150deg, rgb(var(--c-bg) / 0.98), rgba(8, 22, 43, 0.98));
  box-shadow: 0 24px 60px rgb(var(--c-bg-deep) / 0.45);
}

.howto-slider--embedded {
  width: 100%;
  max-width: 920px;
  margin: 0 auto;
  min-height: 580px;
}

.howto-slider--embedded .howto-slider__stage {
  min-height: 340px;
  flex: 1 1 340px;
}

.howto-slider__tabs {
  display: inline-flex;
  gap: 0.4rem;
  align-self: center;
  margin: 1rem auto 0.35rem;
  padding: 0.4rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.2);
  background: rgb(var(--c-bg) / 0.55);
}

.howto-slider__tab {
  border: none;
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.75);
  padding: 0.6rem 1.9rem;
  border-radius: var(--radius-pill);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;
}

.howto-slider__tab:hover:not(.howto-slider__tab--active) {
  color: rgb(var(--c-text));
}

.howto-slider__tab--active {
  background: rgb(var(--c-accent-sky) / 0.18);
  color: rgb(var(--c-accent-soft));
}

.howto-slider__stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 280px;
  margin: 0.75rem 1.5rem 0;
  border-radius: 20px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.14);
  background: rgb(var(--c-bg-deep) / 0.3);
  overflow: hidden;
  display: flex;
}

.howto-slider__illu {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem;
}

.howto-slider__content {
  flex-shrink: 0;
  min-height: 128px;
  padding: 0.5rem 1.6rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.howto-slider__step-num {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: rgb(var(--c-accent-soft) / 0.8);
  text-transform: uppercase;
}

.howto-slider__step-title {
  margin: 0.25rem 0 0.35rem;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: rgb(var(--c-text));
}

.howto-slider__step-desc {
  margin: 0 auto;
  max-width: 46ch;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgb(var(--c-text-soft) / 0.85);
}

.howto-slider__nav {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1.6rem 1.3rem;
}

.howto-slider__prev {
  min-width: 110px;
  padding: 0.7rem 1.5rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.3);
  background: rgb(var(--c-accent-sky) / 0.08);
  color: rgb(var(--c-accent-soft));
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.howto-slider__prev:hover:not(:disabled) {
  background: rgb(var(--c-accent-sky) / 0.16);
  border-color: rgb(var(--c-accent-sky) / 0.55);
}

.howto-slider__prev--hidden {
  visibility: hidden;
  pointer-events: none;
}

.howto-slider__dots {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.howto-slider__dot {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: rgb(var(--c-text-soft) / 0.25);
  cursor: pointer;
  transition: background 0.2s ease, width 0.2s ease;
}

.howto-slider__dot--active {
  background: rgb(var(--c-accent-sky));
  width: 1.5rem;
  border-radius: 4px;
}

.howto-slider__next {
  min-width: 130px;
  padding: 0.7rem 1.7rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent) / 0.5);
  background: rgb(var(--c-accent) / 0.18);
  color: rgb(var(--c-accent-soft));
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.howto-slider__next:hover {
  background: rgb(var(--c-accent) / 0.3);
  border-color: rgb(var(--c-accent) / 0.7);
}

.howto-slider__tab:focus,
.howto-slider__next:focus,
.howto-slider__prev:focus,
.howto-slider__dot:focus {
  outline: none;
}

.howto-slider__tab:focus-visible,
.howto-slider__next:focus-visible,
.howto-slider__prev:focus-visible,
.howto-slider__dot:focus-visible {
  outline: 2px solid rgb(var(--c-accent-sky) / 0.6);
  outline-offset: 2px;
}

.howto-stage-next-enter-active,
.howto-stage-next-leave-active,
.howto-stage-prev-enter-active,
.howto-stage-prev-leave-active,
.howto-text-next-enter-active,
.howto-text-next-leave-active,
.howto-text-prev-enter-active,
.howto-text-prev-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.howto-stage-next-enter-from,
.howto-text-next-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.howto-stage-next-leave-to,
.howto-text-next-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.howto-stage-prev-enter-from,
.howto-text-prev-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}

.howto-stage-prev-leave-to,
.howto-text-prev-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

.howto-slider__seo-steps {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .howto-slider--embedded {
    min-height: 520px;
  }

  .howto-slider--embedded .howto-slider__stage {
    min-height: 280px;
    flex-basis: 280px;
  }

  .howto-slider__stage {
    margin: 0.55rem 0.85rem 0;
    min-height: 220px;
  }

  .howto-slider__content {
    min-height: 108px;
    padding: 0.45rem 1rem;
  }

  .howto-slider__step-title {
    font-size: 1.15rem;
  }

  .howto-slider__nav {
    padding: 0.65rem 0.85rem 1rem;
  }
}

@media (max-width: 560px) {
  .howto-slider {
    border-radius: 20px;
  }

  .howto-slider__stage {
    min-height: 200px;
    margin: 0.5rem 0.65rem 0;
  }

  .howto-slider__tab {
    padding: 0.5rem 0.85rem;
    font-size: 0.82rem;
  }

  .howto-slider__prev,
  .howto-slider__next {
    min-width: 84px;
    padding: 0.6rem 0.9rem;
    font-size: 0.9rem;
  }
}
</style>
