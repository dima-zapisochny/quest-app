<template>
  <div class="avatar-picker" role="group" aria-label="Выбор аватара">
    <div class="avatar-preview">
      <span class="avatar-emoji">{{ currentAvatar.emoji }}</span>
      <button class="avatar-refresh" type="button" @click="randomize" aria-label="Обновить аватар">
        ↻
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

interface AvatarOption {
  id: string
  emoji: string
  label: string
}

const avatars: AvatarOption[] = [
  { id: 'fox', emoji: '🦊', label: 'Лис' },
  { id: 'panda', emoji: '🐼', label: 'Панда' },
  { id: 'tiger', emoji: '🐯', label: 'Тигр' },
  { id: 'owl', emoji: '🦉', label: 'Сова' },
  { id: 'whale', emoji: '🐳', label: 'Кит' },
  { id: 'parrot', emoji: '🦜', label: 'Попугай' },
  { id: 'koala', emoji: '🐨', label: 'Коала' },
  { id: 'dino', emoji: '🦕', label: 'Дино' },
  { id: 'crocodile', emoji: '🐊', label: 'Крокодил' },
  { id: 'lion', emoji: '🦁', label: 'Лев' },
  { id: 'penguin', emoji: '🐧', label: 'Пингвин' },
  { id: 'elephant', emoji: '🐘', label: 'Слон' },
  { id: 'seal', emoji: '🦭', label: 'Тюлень' },
  { id: 'hedgehog', emoji: '🦔', label: 'Ёж' },
  { id: 'lily', emoji: '🌸', label: 'Лілія' }
]

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const currentAvatar = computed(() => avatars.find(avatar => avatar.id === props.modelValue) ?? avatars[0])

function randomize() {
  let next = avatars[Math.floor(Math.random() * avatars.length)]
  if (props.modelValue) {
    const available = avatars.filter(avatar => avatar.id !== props.modelValue)
    if (available.length) {
      next = available[Math.floor(Math.random() * available.length)]
    }
  }
  emit('update:modelValue', next.id)
}

onMounted(() => {
  if (!props.modelValue) {
    randomize()
  }
})

defineExpose({ randomize })
</script>

<style scoped>
.avatar-picker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 25%, rgba(59, 130, 246, 0.2), rgba(15, 118, 110, 0.45));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 16px 30px rgba(59, 130, 246, 0.25);
  border: 2px solid rgba(14, 165, 233, 0.5);
  animation: pulse 4s ease-in-out infinite;
}

.avatar-emoji {
  font-size: 3rem;
  animation: float 3s ease-in-out infinite;
}

.avatar-refresh {
  position: absolute;
  bottom: -6px;
  right: -6px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #22d3ee, #38bdf8);
  color: #0f172a;
  font-size: 1.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 10px 18px rgba(34, 211, 238, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.avatar-refresh:hover {
  transform: rotate(18deg) scale(1.05);
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(-2deg);
  }
  50% {
    transform: translateY(-6px) rotate(2deg);
  }
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 16px 30px rgba(59, 130, 246, 0.25);
  }
  50% {
    box-shadow: 0 20px 40px rgba(14, 165, 233, 0.32);
  }
}

@media (max-width: 768px) {
  .avatar-preview {
    width: 80px;
    height: 80px;
  }

  .avatar-emoji {
    font-size: 2.5rem;
  }

  .avatar-refresh {
    width: 34px;
    height: 34px;
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .avatar-preview {
    width: 68px;
    height: 68px;
  }

  .avatar-emoji {
    font-size: 2.2rem;
  }

  .avatar-refresh {
    width: 30px;
    height: 30px;
    font-size: 1.3rem;
    bottom: -4px;
    right: -4px;
  }
}

@media (max-width: 360px) {
  .avatar-preview {
    width: 60px;
    height: 60px;
  }

  .avatar-emoji {
    font-size: 2rem;
  }

  .avatar-refresh {
    width: 28px;
    height: 28px;
    font-size: 1.2rem;
    bottom: -3px;
    right: -3px;
  }
}
</style>
