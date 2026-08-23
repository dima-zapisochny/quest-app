<template>
  <div class="user-pill" spellcheck="false" translate="no">
    <span class="user-name" spellcheck="false" translate="no" autocorrect="off" autocapitalize="off">{{ displayName }}</span>
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
import { avatarEmoji as emojiOf } from '@/utils/avatar'

interface Props {
  name?: string | null
  avatar?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  name: null,
  avatar: null
})

const displayName = computed(() => {
  const name = props.name?.trim()
  return name && name.length ? name : 'Гость'
})

const avatarEmoji = computed(() => emojiOf(props.avatar, ''))

const hasAvatar = computed(() => Boolean(avatarEmoji.value))

const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase())
</script>

<style scoped>
.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 1.1rem;
  padding: 0.75rem 1.75rem;
  border-radius: 9999px;
  border: 1px solid rgb(var(--c-text-muted) / 0.2);
  background: rgb(var(--c-bg) / 0.25);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: visible;
  transform: perspective(1000px) rotateY(-5deg) rotateX(2deg);
  box-shadow: 
    0 4px 12px rgb(var(--c-bg-deep) / 0.3),
    0 2px 6px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.15),
    inset 0 -2px 4px rgb(var(--c-black) / 0.25);
  height: 72px;
  min-height: 72px;
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
    rgb(var(--c-white) / 0.1) 0%,
    transparent 50%,
    rgb(var(--c-white) / 0.05) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
}

.user-name {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-decoration: none !important;
  -webkit-text-decoration: none !important;
  -webkit-text-decoration-line: none !important;
  text-decoration-line: none !important;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgb(var(--c-accent-sky) / 0.45);
  background: rgb(var(--c-sky-deep) / 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.65rem;
  color: rgb(var(--c-text-soft));
  flex-shrink: 0;
}

.user-avatar--placeholder {
  border-style: dashed;
  color: rgb(var(--c-accent-soft));
}

@media (max-width: 768px) {
  .user-pill {
    height: 60px;
    min-height: 60px;
    padding: 0.55rem 1.35rem;
    gap: 0.85rem;
  }

  .user-avatar {
    width: 42px;
    height: 42px;
    font-size: 1.45rem;
  }

  .user-name {
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .user-pill {
    height: 56px;
    min-height: 56px;
    padding: 0.5rem 1.1rem;
    gap: 0.65rem;
  }

  .user-avatar {
    width: 38px;
    height: 38px;
    font-size: 1.3rem;
  }

  .user-name {
    font-size: 0.9rem;
  }
}

@media (max-width: 360px) {
  .user-pill {
    height: 52px;
    min-height: 52px;
    padding: 0.45rem 0.95rem;
    gap: 0.55rem;
  }

  .user-avatar {
    width: 34px;
    height: 34px;
    font-size: 1.15rem;
  }

  .user-name {
    font-size: 0.85rem;
  }
}
</style>


