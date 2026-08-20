<template>
  <div class="gp">
    <!-- Схематичные категории сверху -->
    <div class="gp__headers" :style="colsStyle" aria-hidden="true">
      <span
        v-for="c in maxCategories"
        :key="`h-${c}`"
        class="gp__header"
        :class="{ 'gp__header--active': c <= selCols }"
      ></span>
    </div>

    <!-- Сетка плиток: колонки = категории, ряды = вопросы -->
    <div class="gp__grid" :style="colsStyle" @mouseleave="hover = null">
      <button
        v-for="cell in cells"
        :key="cell.key"
        type="button"
        class="gp__cell"
        :class="{ 'gp__cell--active': cell.c <= selCols && cell.r <= selRows }"
        :aria-label="`${cell.c} категорий на ${cell.r} вопросов`"
        @mouseenter="hover = { c: cell.c, r: cell.r }"
        @focus="hover = { c: cell.c, r: cell.r }"
        @click="apply(cell.c, cell.r)"
      ></button>
    </div>

    <p class="gp__label">
      <b>{{ selCols }} × {{ selRows }}</b>
      <span class="gp__label-soft">· {{ selCols * selRows }} {{ tilesWord }}</span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  categories: number
  questions: number
  maxCategories?: number
  maxQuestions?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxCategories: 8,
  maxQuestions: 10
})

const emit = defineEmits<{
  'update:categories': [value: number]
  'update:questions': [value: number]
}>()

const hover = ref<{ c: number; r: number } | null>(null)

// Пока курсор над сеткой — показываем предпросмотр наведённого размера,
// иначе — текущий выбор.
const selCols = computed(() => hover.value?.c ?? props.categories)
const selRows = computed(() => hover.value?.r ?? props.questions)

const colsStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.maxCategories}, 1fr)`
}))

const cells = computed(() => {
  const list: { key: string; c: number; r: number }[] = []
  for (let r = 1; r <= props.maxQuestions; r++) {
    for (let c = 1; c <= props.maxCategories; c++) {
      list.push({ key: `${r}-${c}`, c, r })
    }
  }
  return list
})

const tilesWord = computed(() => {
  const n = selCols.value * selRows.value
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'плитка'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'плитки'
  return 'плиток'
})

function apply(c: number, r: number) {
  emit('update:categories', c)
  emit('update:questions', r)
}
</script>

<style scoped>
.gp {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  width: fit-content;
}

.gp__headers {
  display: grid;
  gap: 4px;
}
.gp__header {
  height: 8px;
  border-radius: 3px 3px 1px 1px;
  background: rgb(var(--c-accent-sky) / 0.12);
  transition: background 0.12s ease;
}
.gp__header--active {
  background: linear-gradient(135deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent)));
}

.gp__grid {
  display: grid;
  gap: 4px;
}
.gp__cell {
  width: clamp(18px, 3.4vw, 26px);
  aspect-ratio: 1;
  padding: 0;
  border: 1px solid rgb(var(--c-accent-sky) / 0.22);
  border-radius: 4px;
  background: rgb(var(--c-bg) / 0.5);
  cursor: pointer;
  transition: background 0.1s ease, border-color 0.1s ease, transform 0.1s ease;
}
.gp__cell:hover {
  transform: translateY(-1px);
}
.gp__cell--active {
  border-color: rgb(var(--c-accent) / 0.6);
  background: linear-gradient(135deg, rgb(var(--c-accent-sky) / 0.7), rgb(var(--c-accent) / 0.6));
  box-shadow: 0 2px 6px rgb(var(--c-accent) / 0.25);
}

.gp__label {
  margin: 0.2rem 0 0;
  font-size: 0.9rem;
  color: rgb(var(--c-text));
  text-align: center;
}
.gp__label b {
  font-size: 1.05rem;
}
.gp__label-soft {
  color: rgb(var(--c-accent-soft));
  margin-left: 0.35rem;
  font-size: 0.82rem;
}
</style>
