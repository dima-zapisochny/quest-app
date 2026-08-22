<template>
  <div class="quest-emoji-picker" role="group" :aria-label="ariaLabel">
    <div ref="rowRef" class="quest-emoji-picker__row">
      <button
        v-for="item in rowEmojis"
        :key="item"
        type="button"
        class="quest-emoji-picker__btn"
        :class="{ 'quest-emoji-picker__btn--active': modelValue === item }"
        :aria-label="item"
        :aria-pressed="modelValue === item"
        @click="select(item)"
      >
        {{ item }}
      </button>

      <button
        type="button"
        class="quest-emoji-picker__more"
        :class="{ 'quest-emoji-picker__more--active': isMoreSelected }"
        :aria-label="t('create.emojiMoreAria')"
        :title="t('create.emojiMore')"
        @click="showPicker = true"
      >
        <span v-if="isMoreSelected" class="quest-emoji-picker__more-emoji">{{ modelValue }}</span>
        <span v-else class="quest-emoji-picker__more-dots" aria-hidden="true">⋯</span>
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="showPicker"
        class="quest-emoji-picker__overlay"
        @click.self="closePicker"
      >
        <div
          class="quest-emoji-picker__panel"
          role="dialog"
          aria-modal="true"
          :aria-label="t('create.emojiPickerTitle')"
        >
          <p class="quest-emoji-picker__panel-title">{{ t('create.emojiPickerTitle') }}</p>
          <div class="quest-emoji-picker__grid">
            <button
              v-for="item in pickerEmojis"
              :key="item"
              type="button"
              class="quest-emoji-picker__btn"
              :class="{ 'quest-emoji-picker__btn--active': modelValue === item }"
              :aria-label="item"
              :aria-pressed="modelValue === item"
              @click="selectFromPanel(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { QUEST_EMOJI_EXTRA, QUEST_EMOJI_ROW_ORDER } from '@/utils/questCardTheme'

const BTN_REM = 2.65
const GAP_REM = 0.45

const { t } = useI18n()

const props = defineProps<{
  modelValue: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const showPicker = ref(false)
const rowRef = ref<HTMLElement | null>(null)
const visibleCount = ref(QUEST_EMOJI_ROW_ORDER.length)

let rowObserver: ResizeObserver | null = null

const rowEmojis = computed(() => QUEST_EMOJI_ROW_ORDER.slice(0, visibleCount.value))

const pickerEmojis = computed(() => {
  const seen = new Set<string>()
  const list: string[] = []
  for (const emoji of [...QUEST_EMOJI_ROW_ORDER.slice(visibleCount.value), ...QUEST_EMOJI_EXTRA]) {
    if (seen.has(emoji)) continue
    seen.add(emoji)
    list.push(emoji)
  }
  return list
})

const isMoreSelected = computed(
  () => Boolean(props.modelValue) && !rowEmojis.value.includes(props.modelValue as (typeof QUEST_EMOJI_ROW_ORDER)[number])
)

function remPx(rem: number): number {
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  return rem * root
}

function updateVisibleCount() {
  const row = rowRef.value
  if (!row) return

  const btn = remPx(BTN_REM)
  const gap = remPx(GAP_REM)
  const slots = Math.floor((row.clientWidth + gap) / (btn + gap))
  const count = Math.max(1, Math.min(QUEST_EMOJI_ROW_ORDER.length, slots - 1))

  visibleCount.value = count
}

function select(value: string) {
  emit('update:modelValue', value)
}

function selectFromPanel(value: string) {
  emit('update:modelValue', value)
  showPicker.value = false
}

function closePicker() {
  showPicker.value = false
}

onMounted(() => {
  updateVisibleCount()
  rowObserver = new ResizeObserver(updateVisibleCount)
  if (rowRef.value) rowObserver.observe(rowRef.value)
  window.addEventListener('resize', updateVisibleCount)
})

onBeforeUnmount(() => {
  rowObserver?.disconnect()
  window.removeEventListener('resize', updateVisibleCount)
})
</script>

<style scoped>
.quest-emoji-picker {
  width: 100%;
  overflow: visible;
}

.quest-emoji-picker__row {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding-top: 3px;
  margin-top: -3px;
  overflow: visible;
}

.quest-emoji-picker__btn,
.quest-emoji-picker__more {
  flex-shrink: 0;
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 0.65rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.22);
  background: rgb(var(--c-bg-deep) / 0.45);
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.quest-emoji-picker__btn {
  font-size: 1.35rem;
  line-height: 1;
}

.quest-emoji-picker__btn:hover,
.quest-emoji-picker__more:hover {
  border-color: rgb(var(--c-accent-sky) / 0.45);
  background: rgb(var(--c-accent-sky) / 0.1);
  transform: translateY(-1px);
}

.quest-emoji-picker__btn--active,
.quest-emoji-picker__more--active {
  border-color: rgb(var(--c-accent) / 0.65);
  background: rgb(var(--c-accent-sky) / 0.15);
  box-shadow: 0 0 0 1px rgb(var(--c-accent) / 0.25);
}

.quest-emoji-picker__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
}

.quest-emoji-picker__more-dots {
  font-size: 1.35rem;
  line-height: 1;
  color: rgb(var(--c-accent-soft));
  letter-spacing: 0.05em;
}

.quest-emoji-picker__more-emoji {
  font-size: 1.35rem;
  line-height: 1;
}

.quest-emoji-picker__overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgb(var(--c-bg-deep) / 0.72);
  backdrop-filter: blur(6px);
}

.quest-emoji-picker__panel {
  width: min(100%, 22rem);
  max-height: min(70vh, 24rem);
  overflow: auto;
  padding: 1rem 1rem 1.1rem;
  border-radius: 1rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: linear-gradient(165deg, rgb(var(--c-surface)), rgb(var(--c-bg)));
  box-shadow: 0 24px 48px rgb(var(--c-bg-deep) / 0.55);
}

.quest-emoji-picker__panel-title {
  margin: 0 0 0.85rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(var(--c-accent-soft));
}

.quest-emoji-picker__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.quest-emoji-picker__grid .quest-emoji-picker__btn {
  width: 2.65rem;
  height: 2.65rem;
}
</style>
