<template>
  <teleport to="body">
    <transition name="howto">
      <div v-if="show" class="howto-overlay" @click.self="close">
        <div class="howto" role="dialog" aria-modal="true" :aria-label="headerTitle">
          <header class="howto__head">
            <div class="howto__title-wrap">
              <h2 class="howto__title">{{ headerTitle }}</h2>
              <p class="howto__subtitle">{{ t('howto.subtitle') }}</p>
            </div>
            <button type="button" class="howto__close" :aria-label="t('common.close')" @click="close">✕</button>
          </header>

          <HowToPlaySlider ref="sliderRef" class="howto__slider" @complete="close" />
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import HowToPlaySlider from './howto/HowToPlaySlider.vue'

const { t } = useI18n()

const props = defineProps<{ show: boolean }>()
const emit = defineEmits<{ close: [] }>()

const sliderRef = ref<InstanceType<typeof HowToPlaySlider> | null>(null)

const headerTitle = computed(() => t('howto.title'))

function close() {
  emit('close')
}

function onKey(e: KeyboardEvent) {
  if (!props.show) return
  if (e.key === 'Escape') close()
}

watch(
  () => props.show,
  async open => {
    if (open) {
      await nextTick()
      sliderRef.value?.reset()
    }
  }
)

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
  height: min(90vh, 820px);
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
  padding: 1.6rem 1.8rem 0.4rem;
  flex-shrink: 0;
}

.howto__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.howto__title {
  margin: 0;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: rgb(var(--c-text));
}

.howto__subtitle {
  margin: 0;
  font-size: 0.92rem;
  color: rgb(var(--c-text-soft) / 0.7);
}

.howto__close {
  flex-shrink: 0;
  width: 2.3rem;
  height: 2.3rem;
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

.howto__close:focus {
  outline: none;
}

.howto__close:focus-visible {
  outline: 2px solid rgb(var(--c-accent-sky) / 0.6);
  outline-offset: 2px;
}

.howto__slider {
  flex: 1 1 auto;
  min-height: 0;
  border: none;
  box-shadow: none;
  border-radius: 0;
  background: transparent;
}

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
  transform: translateY(16px) scale(0.96);
}

@media (max-width: 768px) {
  .howto-overlay {
    padding: 0.5rem;
    align-items: flex-start;
  }

  .howto {
    width: 100%;
    height: min(94vh, 100%);
    margin-top: 0.25rem;
    border-radius: 20px;
  }

  .howto__head {
    padding: 1.15rem 1.15rem 0.35rem;
  }

  .howto__title {
    font-size: 1.45rem;
  }
}

@media (max-width: 560px) {
  .howto {
    height: min(92vh, 100%);
  }

  .howto__head {
    padding: 1rem 0.9rem 0.3rem;
  }

  .howto__title {
    font-size: 1.28rem;
  }
}
</style>
