<template>
  <div class="quest-emoji-picker" role="group" :aria-label="ariaLabel">
    <button
      v-for="item in QUEST_EMOJIS"
      :key="item"
      type="button"
      class="quest-emoji-picker__btn"
      :class="{ 'quest-emoji-picker__btn--active': modelValue === item }"
      :aria-label="item"
      :aria-pressed="modelValue === item"
      @click="emit('update:modelValue', item)"
    >
      {{ item }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { QUEST_EMOJIS } from '@/utils/questCardTheme'

defineProps<{
  modelValue: string
  ariaLabel?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
.quest-emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.quest-emoji-picker__btn {
  width: 2.65rem;
  height: 2.65rem;
  border-radius: 0.65rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.22);
  background: rgb(var(--c-bg-deep) / 0.45);
  font-size: 1.35rem;
  line-height: 1;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, transform 0.18s ease;
}

.quest-emoji-picker__btn:hover {
  border-color: rgb(var(--c-accent-sky) / 0.45);
  background: rgb(var(--c-accent-sky) / 0.1);
  transform: translateY(-1px);
}

.quest-emoji-picker__btn--active {
  border-color: rgb(var(--c-accent) / 0.65);
  background: rgb(var(--c-accent-sky) / 0.15);
  box-shadow: 0 0 0 1px rgb(var(--c-accent) / 0.25);
}
</style>
