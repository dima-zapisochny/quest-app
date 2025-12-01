<template>
  <figure :class="['media-card', media.type]">
    <div v-if="media.type === 'image'" class="image-wrapper">
      <img :src="media.url" :alt="media.name" loading="lazy" />
    </div>
    <div v-else class="audio-wrapper">
      <audio :src="media.url" controls preload="metadata"></audio>
    </div>
    <figcaption class="media-name">{{ media.name }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import type { MediaAsset } from '@/types'

interface Props {
  media: MediaAsset
}

defineProps<Props>()
</script>

<style scoped>
.media-card {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 1rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  color: #e2e8f0;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.45);
}

.image-wrapper {
  width: 100%;
  overflow: hidden;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-wrapper img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

audio {
  width: 100%;
}

.media-name {
  font-size: 0.75rem;
  text-align: center;
  color: #94a3b8;
  word-break: break-word;
}
</style>

