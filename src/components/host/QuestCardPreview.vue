<template>
  <div
    class="q-preview"
    :class="[`q-preview--${theme.id}`, { 'q-preview--cta': variant !== 'board' }]"
    :style="{
      '--qa': theme.accent,
      '--qa2': theme.accent2
    }"
  >
    <div class="q-preview__glow" aria-hidden="true" />

    <template v-if="variant === 'board'">
      <div class="q-preview__board">
        <div v-if="layout.cols > 0" class="q-preview__cats" :style="{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }">
          <span v-for="c in layout.cols" :key="c" class="q-preview__cat" />
        </div>
        <div
          class="q-preview__grid"
          :style="{ gridTemplateColumns: `repeat(${layout.cols}, 1fr)` }"
        >
          <div
            v-for="(_, i) in tileCount"
            :key="i"
            class="q-preview__tile"
          >
            <span>{{ tileValue(Math.floor(i / layout.cols)) }}</span>
          </div>
        </div>
      </div>
      <div class="q-preview__icon" v-html="theme.icon" aria-hidden="true" />
    </template>

    <template v-else-if="variant === 'create'">
      <div class="q-preview__board q-preview__board--empty">
        <div class="q-preview__grid q-preview__grid--empty">
          <span v-for="n in 4" :key="n" class="q-preview__tile q-preview__tile--ghost" />
        </div>
        <span class="q-preview__cta-mark">+</span>
      </div>
    </template>

    <template v-else>
      <div class="q-preview__board q-preview__board--empty">
        <div class="q-preview__grid q-preview__grid--empty">
          <span v-for="n in 4" :key="n" class="q-preview__tile q-preview__tile--ghost" />
        </div>
        <span class="q-preview__cta-mark q-preview__cta-mark--icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>
          </svg>
        </span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Quest } from '@/types'
import { getQuestBoardLayout, tileValue } from '@/utils/questBoardLayout'
import { getQuestTheme } from '@/utils/questCardTheme'

const props = withDefaults(
  defineProps<{
    quest?: Pick<Quest, 'title' | 'rounds' | 'questionsCount'>
    index?: number
    totalQuestions?: number
    variant?: 'board' | 'create' | 'import'
  }>(),
  {
    index: 0,
    variant: 'board'
  }
)

const theme = computed(() =>
  props.variant === 'board' && props.quest
    ? getQuestTheme(props.quest.title, props.index)
    : { id: 'cta', accent: '56 189 248', accent2: '34 211 238', icon: '' }
)

const layout = computed(() =>
  props.quest ? getQuestBoardLayout(props.quest, props.totalQuestions) : { cols: 2, rows: 2 }
)

const tileCount = computed(() => layout.value.cols * layout.value.rows)
</script>

<style scoped>
.q-preview {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--c-bg-deep) / 0.85);
  overflow: hidden;
}

.q-preview__glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(
    circle at 50% 80%,
    rgb(var(--qa) / 0.35) 0%,
    rgb(var(--qa2) / 0.12) 40%,
    transparent 70%
  );
  pointer-events: none;
}

.q-preview--cta .q-preview__glow {
  background: radial-gradient(circle at 50% 50%, rgb(var(--c-accent-sky) / 0.12), transparent 65%);
}

.q-preview__board {
  position: relative;
  z-index: 1;
  width: 78%;
  padding: 0.35rem;
  border-radius: 0.55rem;
  border: 1px solid rgb(var(--qa) / 0.35);
  background: rgb(var(--c-surface) / 0.55);
  box-shadow:
    0 8px 20px rgb(var(--c-bg-deep) / 0.5),
    inset 0 1px 0 rgb(var(--c-white) / 0.08);
  transform: perspective(400px) rotateX(8deg);
}

.q-preview__board--empty {
  border-style: dashed;
  border-color: rgb(var(--c-accent-sky) / 0.35);
  background: rgb(var(--c-bg) / 0.4);
  transform: none;
}

.q-preview__cats {
  display: grid;
  gap: 0.15rem;
  margin-bottom: 0.15rem;
}

.q-preview__cat {
  height: 0.35rem;
  border-radius: 0.2rem;
  background: linear-gradient(90deg, rgb(var(--qa) / 0.5), rgb(var(--qa2) / 0.35));
  opacity: 0.85;
}

.q-preview__grid {
  display: grid;
  gap: 0.15rem;
}

.q-preview__grid--empty {
  grid-template-columns: repeat(2, 1fr);
  gap: 0.2rem;
}

.q-preview__tile {
  aspect-ratio: 1.15;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  border: 1px solid rgb(var(--c-indigo) / 0.45);
  background: linear-gradient(
    145deg,
    rgb(var(--qa) / 0.28) 0%,
    rgb(var(--c-indigo) / 0.22) 55%,
    rgb(var(--qa2) / 0.2) 100%
  );
  box-shadow: inset 0 1px 2px rgb(var(--c-white) / 0.12);
}

.q-preview__tile span {
  font-family: 'Press Start 2P', monospace;
  font-size: clamp(0.28rem, 2.2vw, 0.42rem);
  color: rgb(var(--c-accent-soft) / 0.95);
  text-shadow: 0 1px 2px rgb(var(--c-bg-deep) / 0.8);
  line-height: 1;
}

.q-preview__tile--ghost {
  background: rgb(var(--c-bg) / 0.35);
  border: 1px dashed rgb(var(--c-accent-sky) / 0.25);
  aspect-ratio: 1;
}

.q-preview__icon {
  position: absolute;
  right: 0.5rem;
  bottom: 0.45rem;
  z-index: 2;
  width: 1.75rem;
  height: 1.75rem;
  color: rgb(var(--qa) / 0.55);
  opacity: 0.9;
  filter: drop-shadow(0 2px 6px rgb(var(--c-bg-deep) / 0.6));
}

.q-preview__icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.q-preview__cta-mark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  font-weight: 300;
  color: rgb(var(--c-accent-soft) / 0.85);
  text-shadow: 0 0 12px rgb(var(--c-accent-sky) / 0.35);
}

.q-preview__cta-mark--icon {
  color: rgb(var(--c-accent-sky) / 0.75);
}
</style>
