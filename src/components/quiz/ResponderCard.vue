<template>
  <div class="responder-info-card">
    <div v-if="responder" class="responder-card-content">
      <div class="responder-avatar">{{ avatarEmoji(responder.avatar) }}</div>
      <div class="responder-details">
        <div class="responder-name">{{ responder.name }}</div>
        <div class="responder-label">Отвечает</div>
      </div>
    </div>
    <div v-else class="responder-empty">
      <span>Ожидание ответа</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '@/types'
import { avatarEmoji } from '@/utils/avatar'

defineProps<{
  responder: Player | null
}>()
</script>

<style scoped>
.responder-info-card {
  width: 100%;
  max-width: 100%;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.responder-card-content {
  width: 100%;
  max-width: 100%;
  min-height: 80px;
  height: 80px;
  background: linear-gradient(
    135deg,
    rgb(var(--c-surface) / 0.8) 0%,
    rgb(var(--c-bg) / 0.9) 100%
  );
  border: 1.5px solid rgb(var(--c-violet) / 0.4);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  backdrop-filter: blur(15px);
  box-shadow:
    0 8px 24px rgb(var(--c-violet) / 0.2),
    0 4px 12px rgb(var(--c-bg-deep) / 0.3),
    inset 0 1px 0 rgb(var(--c-white) / 0.1),
    inset 0 -1px 0 rgb(var(--c-black) / 0.2);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

.responder-card-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgb(var(--c-violet) / 0.1) 0%,
    transparent 50%,
    rgb(var(--c-blue) / 0.1) 100%
  );
  pointer-events: none;
}

.responder-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgb(var(--c-violet) / 0.2);
  border: 2px solid rgb(var(--c-violet) / 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.responder-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.responder-name {
  font-size: 1rem;
  font-weight: 600;
  color: rgb(var(--c-text));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.responder-label {
  font-size: 0.75rem;
  color: rgb(var(--c-accent-soft) / 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.responder-empty {
  width: 100%;
  max-width: 100%;
  min-height: 80px;
  height: 80px;
  background: linear-gradient(
    135deg,
    rgb(var(--c-surface) / 0.6) 0%,
    rgb(var(--c-bg) / 0.7) 100%
  );
  border: 1.5px solid rgb(var(--c-text-muted) / 0.2);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(15px);
  box-shadow:
    0 4px 12px rgb(var(--c-black) / 0.2),
    inset 0 1px 0 rgb(var(--c-white) / 0.05);
  box-sizing: border-box;
}

.responder-empty span {
  font-size: 0.875rem;
  color: rgb(var(--c-text-muted) / 0.7);
  font-style: italic;
}
</style>
