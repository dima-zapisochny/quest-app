<template>
  <div class="user-pill">
    <span class="user-name">{{ displayName }}</span>
    <div 
      class="user-avatar" 
      :class="{ 'user-avatar--placeholder': !hasAvatar }" 
      aria-hidden="true"
    >
      <span v-if="hasAvatar">{{ avatarEmoji }}</span>
      <span v-else>{{ avatarInitial }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  name?: string | null
  avatar?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  name: null,
  avatar: null
})

const avatarEmojiMap: Record<string, string> = {
  fox: '🦊', panda: '🐼', tiger: '🐯', owl: '🦉', whale: '🐳', parrot: '🦜',
  koala: '🐨', dino: '🦕', crocodile: '🐊', lion: '🦁', penguin: '🐧',
  elephant: '🐘', seal: '🦭', hedgehog: '🦔', lily: '🌸'
}

const displayName = computed(() => {
  const name = props.name?.trim()
  return name && name.length ? name : 'Гость'
})

const avatarEmoji = computed(() => {
  const avatarId = props.avatar ?? ''
  return avatarEmojiMap[avatarId] ?? ''
})

const hasAvatar = computed(() => Boolean(avatarEmoji.value))

const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase())
</script>

<style scoped>
.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 0.625rem 1.45rem;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: visible;
  transform: perspective(1000px) rotateY(-5deg) rotateX(2deg);
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.3),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
  height: 60px;
  min-height: 60px;
  box-sizing: border-box;
}

.user-pill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(56, 189, 248, 0.45);
  background: rgba(8, 47, 73, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #e2e8f0;
  flex-shrink: 0;
}

.user-avatar--placeholder {
  border-style: dashed;
  color: #bae6fd;
}

@media (max-width: 768px) {
  .user-pill {
    height: 48px;
    min-height: 48px;
    padding: 0.45rem 1.1rem;
    gap: 0.7rem;
  }

  .user-avatar {
    width: 34px;
    height: 34px;
    font-size: 1.2rem;
  }

  .user-name {
    font-size: 0.82rem;
  }
}

@media (max-width: 480px) {
  .user-pill {
    height: 42px;
    min-height: 42px;
    padding: 0.35rem 0.85rem;
    gap: 0.5rem;
  }

  .user-avatar {
    width: 30px;
    height: 30px;
    font-size: 1.05rem;
  }

  .user-name {
    font-size: 0.78rem;
  }
}

@media (max-width: 360px) {
  .user-pill {
    height: 38px;
    min-height: 38px;
    padding: 0.3rem 0.7rem;
    gap: 0.4rem;
  }

  .user-avatar {
    width: 26px;
    height: 26px;
    font-size: 0.95rem;
  }

  .user-name {
    font-size: 0.72rem;
  }
}
</style>


