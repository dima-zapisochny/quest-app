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
          <span class="quiz-tile-user-name">{{ question.answeredBy.playerName }}</span>
          <span class="quiz-tile-user-avatar">{{ avatarEmoji(question.answeredBy.playerAvatar) }}</span>
        </div>
        <span v-else class="quiz-tile-cross">✕</span>
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
    hedgehog: '🦔'
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
  background: linear-gradient(135deg, 
    rgba(139, 92, 246, 0.65) 0%,
    rgba(99, 102, 241, 0.6) 35%,
    rgba(59, 130, 246, 0.65) 70%,
    rgba(139, 92, 246, 0.6) 100%
  );
  border: 1px solid rgba(99, 102, 241, 0.5);
  border-radius: 0.75rem;
  color: #e9d5ff;
  font-size: clamp(0.7rem, 1.5vw, 1.15rem);
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease, background 0.22s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 0.45rem;
  box-shadow: 
    0 3px 6px rgba(15, 23, 42, 0.2),
    0 2px 3px rgba(15, 23, 42, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  transform: perspective(1000px) rotateX(2deg);
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
    rgba(255, 255, 255, 0.08) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border-radius: 0.75rem;
  pointer-events: none;
  opacity: 0.5;
}

.quiz-tile:hover {
  background: linear-gradient(135deg, 
    rgba(167, 139, 250, 0.75) 0%,
    rgba(129, 140, 248, 0.7) 35%,
    rgba(96, 165, 250, 0.75) 70%,
    rgba(167, 139, 250, 0.7) 100%
  );
  border-color: rgba(129, 140, 248, 0.7);
  transform: perspective(1000px) rotateX(2deg) translateY(-3px) scale(1.01);
  box-shadow: 
    0 6px 12px rgba(129, 140, 248, 0.3),
    0 3px 6px rgba(139, 92, 246, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.quiz-tile--hovered {
  background: linear-gradient(135deg, 
    rgba(167, 139, 250, 0.8) 0%,
    rgba(129, 140, 248, 0.75) 35%,
    rgba(96, 165, 250, 0.8) 70%,
    rgba(167, 139, 250, 0.75) 100%
  );
  border-color: rgba(129, 140, 248, 0.75);
  transform: perspective(1000px) rotateX(2deg) translateY(-3px) scale(1.01);
  box-shadow: 
    0 6px 12px rgba(129, 140, 248, 0.35),
    0 3px 6px rgba(139, 92, 246, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.quiz-tile--placeholder {
  background: rgba(30, 41, 59, 0.55);
  border: 1px dashed rgba(148, 163, 184, 0.35);
  cursor: default;
  box-shadow: inset 0 0 12px rgba(15, 23, 42, 0.45);
  transform: perspective(1000px) rotateX(2deg);
  backdrop-filter: blur(10px);
}

.quiz-tile--played {
  background: #0f172a;
  border-color: #475569;
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: 
    0 2px 4px rgba(15, 23, 42, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    inset 0 -1px 2px rgba(0, 0, 0, 0.15);
  transform: perspective(1000px) rotateX(2deg);
  backdrop-filter: blur(10px);
}

.quiz-tile--played:hover {
  transform: perspective(1000px) rotateX(2deg) !important;
  box-shadow: 
    0 2px 4px rgba(15, 23, 42, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.05),
    inset 0 -1px 2px rgba(0, 0, 0, 0.15) !important;
  border-color: #475569 !important;
  background: #0f172a !important;
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
  text-shadow: 0 0 12px rgba(139, 92, 246, 0.6), 0 0 20px rgba(99, 102, 241, 0.4);
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
</style>

