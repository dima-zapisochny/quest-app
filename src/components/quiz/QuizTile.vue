<template>
  <button
    :class="[
      'quiz-tile',
      {
        'quiz-tile--played': question?.played,
        'quiz-tile--hovered': isHovered && !placeholder,
        'quiz-tile--placeholder': placeholder
      }
    ]"
    :disabled="isDisabled"
    @click="handleClick"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <span v-if="placeholder" class="quiz-tile-placeholder">—</span>
    <template v-else>
      <span v-if="!question?.played" class="quiz-tile-value">
        {{ question?.value ?? '—' }}
      </span>
      <div v-else class="quiz-tile-played">
        <div v-if="question.answeredBy" class="quiz-tile-user-pill">
          <span class="quiz-tile-user-avatar">{{ avatarEmoji(question.answeredBy.playerAvatar) }}</span>
          <span class="quiz-tile-user-name">{{ question.answeredBy.playerName }}</span>
          <span class="quiz-tile-user-check" aria-hidden="true">✓</span>
        </div>
        <span v-else-if="question.timedOut" class="quiz-tile-cross">✕</span>
      </div>
    </template>
  </button>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Question } from '@/types'

interface Props {
  question?: Question
  placeholder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: false
})

const emit = defineEmits<{
  click: [question: Question]
}>()

const isHovered = ref(false)

const isDisabled = computed(() => props.placeholder || !props.question || props.question.played)

function onEnter() {
  if (!props.placeholder && !props.question?.played) {
    isHovered.value = true
  }
}

function onLeave() {
  isHovered.value = false
}

function handleClick() {
  if (!props.placeholder && props.question && !props.question.played) {
    emit('click', props.question)
  }
}

function avatarEmoji(avatarId: string): string {
  const map: Record<string, string> = {
    fox: '🦊',
    panda: '🐼',
    tiger: '🐯',
    owl: '🦉',
    whale: '🐳',
    parrot: '🦜',
    koala: '🐨',
    dino: '🦕',
    crocodile: '🐊',
    lion: '🦁',
    penguin: '🐧',
    elephant: '🐘',
    seal: '🦭',
    hedgehog: '🦔',
    lily: '🌸'
  }
  return map[avatarId] ?? '🙂'
}
</script>

<style scoped>
.quiz-tile {
  width: 100%;
  height: 100%;
  flex: 1 1 0;
  min-height: 66px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(99, 102, 241, 0.28) 50%, rgba(139, 92, 246, 0.3) 100%);
  border: 1px solid rgba(129, 140, 248, 0.55);
  border-radius: 12px;
  color: #e0e7ff;
  font-size: clamp(0.75rem, 1.5vw, 1.1rem);
  font-weight: 700;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0.45rem;
  box-shadow: 
    0 2px 6px rgba(15, 23, 42, 0.25),
    0 1px 4px rgba(99, 102, 241, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: perspective(1000px) rotateX(1deg);
}

.quiz-tile::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.quiz-tile:hover::before {
  opacity: 1;
}

.quiz-tile::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 45%,
    rgba(167, 139, 250, 0.06) 100%
  );
  border-radius: 12px;
  pointer-events: none;
  opacity: 0.6;
}

.quiz-tile:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.45) 0%, rgba(99, 102, 241, 0.38) 50%, rgba(139, 92, 246, 0.4) 100%);
  border-color: rgba(167, 139, 250, 0.75);
  transform: perspective(1000px) rotateX(1deg) translateY(-2px);
  box-shadow: 
    0 4px 12px rgba(15, 23, 42, 0.35),
    0 2px 8px rgba(139, 92, 246, 0.25),
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    inset 0 -1px 2px rgba(0, 0, 0, 0.22);
}

.quiz-tile--hovered {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.45) 0%, rgba(99, 102, 241, 0.38) 50%, rgba(139, 92, 246, 0.4) 100%);
  border-color: rgba(167, 139, 250, 0.75);
  transform: perspective(1000px) rotateX(1deg) translateY(-2px);
  box-shadow: 
    0 4px 12px rgba(15, 23, 42, 0.35),
    0 2px 8px rgba(139, 92, 246, 0.25),
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    inset 0 -1px 2px rgba(0, 0, 0, 0.22);
}

.quiz-tile--placeholder {
  background: rgba(30, 41, 59, 0.35);
  border: 1px dashed rgba(148, 163, 184, 0.3);
  cursor: default;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
  transform: perspective(1000px) rotateX(1deg);
  backdrop-filter: blur(10px);
}

.quiz-tile--played {
  background: rgba(15, 23, 42, 0.75);
  border-color: rgba(100, 116, 139, 0.4);
  cursor: not-allowed;
  opacity: 0.9;
  box-shadow: 
    0 1px 3px rgba(2, 6, 23, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.04),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2);
  transform: perspective(1000px) rotateX(1deg);
  backdrop-filter: blur(10px);
}

.quiz-tile--played:hover {
  transform: perspective(1000px) rotateX(1deg) !important;
  box-shadow: 
    0 1px 3px rgba(2, 6, 23, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.04),
    inset 0 -1px 2px rgba(0, 0, 0, 0.2) !important;
  border-color: rgba(100, 116, 139, 0.4) !important;
  background: rgba(15, 23, 42, 0.75) !important;
}

.quiz-tile--played:hover::before {
  opacity: 0 !important;
}

.quiz-tile--played:hover::after {
  opacity: 0.5 !important;
}

.quiz-tile-value {
  position: relative;
  z-index: 1;
  color: #e0e7ff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  line-height: 1;
}

.quiz-tile-played {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.quiz-tile-played-icon {
  color: #64748b;
  font-size: clamp(1.25rem, 2.5vw, 2rem);
  line-height: 1;
  flex-shrink: 0;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.quiz-tile-user-pill {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  flex-shrink: 0;
  max-width: 100%;
  z-index: 1;
}

.quiz-tile-user-name {
  font-size: clamp(0.95rem, 2vw, 1.15rem);
  font-weight: 600;
  color: rgba(226, 232, 240, 0.95);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  line-height: 1.2;
}

.quiz-tile-user-avatar {
  width: clamp(38px, 5vw, 44px);
  height: clamp(38px, 5vw, 44px);
  border-radius: 50%;
  border: 2px solid rgba(56, 189, 248, 0.4);
  background: rgba(2, 6, 23, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.3rem, 3vw, 1.5rem);
  color: #f8fafc;
  position: relative;
  z-index: 1;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.quiz-tile-user-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(22px, 3vw, 26px);
  height: clamp(22px, 3vw, 26px);
  border-radius: 50%;
  background: rgba(34, 197, 94, 0.9);
  color: #fff;
  font-size: clamp(0.75rem, 2vw, 0.9rem);
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.quiz-tile-cross {
  color: rgba(239, 68, 68, 0.85);
  font-size: clamp(2rem, 4vw, 2.8rem);
  line-height: 1;
  font-weight: 300;
  text-shadow: 
    0 0 16px rgba(239, 68, 68, 0.7),
    0 0 32px rgba(239, 68, 68, 0.5),
    0 0 48px rgba(239, 68, 68, 0.3);
  filter: blur(1.5px);
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quiz-tile-placeholder {
  position: relative;
  z-index: 1;
  color: rgba(148, 163, 184, 0.6);
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  letter-spacing: 0.1em;
}

@media (max-width: 768px) {
  .quiz-tile {
    min-height: 64px;
  }
}

@media (max-width: 480px) {
  .quiz-tile {
    min-height: 56px;
    padding: 0.35rem;
    border-radius: 10px;
  }
}

@media (max-width: 360px) {
  .quiz-tile {
    min-height: 48px;
    padding: 0.3rem;
    border-radius: 8px;
  }

  .quiz-tile-placeholder {
    font-size: clamp(0.9rem, 2vw, 1.25rem);
  }
}
</style>

