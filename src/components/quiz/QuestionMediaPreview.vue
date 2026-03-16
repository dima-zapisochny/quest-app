<template>
  <figure :class="['media-card', media.type, { 'media-error': loadError }]">
    <div v-if="media.type === 'image'" class="image-wrapper">
      <img
        v-if="mediaUrl && !loadError"
        :src="mediaUrl"
        :alt="media.name"
        loading="lazy"
        @error="loadError = true"
      />
      <div v-else-if="loadError" class="media-placeholder">Изображение не загружено</div>
      <div v-else class="media-placeholder">Нет изображения</div>
    </div>
    <div v-else class="audio-wrapper">
      <audio
        v-if="mediaUrl && !loadError"
        :src="mediaUrl"
        controls
        preload="none"
        @error="loadError = true"
      ></audio>
      <div v-else-if="loadError" class="media-placeholder">Аудио не загружено</div>
      <div v-else class="media-placeholder">Нет аудио</div>
    </div>
    <figcaption class="media-name">{{ media.name }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MediaAsset } from '@/types'
import { safeMediaUrl } from '@/utils/mediaUrl'

interface Props {
  media: MediaAsset
}

const props = defineProps<Props>()
const loadError = ref(false)

const mediaUrl = computed(() => safeMediaUrl(props.media?.url) ?? null)
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

.media-placeholder {
  padding: 1rem;
  text-align: center;
  color: #64748b;
  font-size: 0.8rem;
  background: rgba(15, 23, 42, 0.5);
  border-radius: 0.5rem;
}

.media-card.media-error .media-placeholder {
  color: #94a3b8;
}

@media (max-width: 768px) {
  .media-card {
    padding: 0.5rem;
    gap: 0.5rem;
    border-radius: 0.75rem;
  }
}

@media (max-width: 480px) {
  .media-card {
    padding: 0.35rem;
    gap: 0.35rem;
    border-radius: 0.5rem;
  }

  .media-name {
    font-size: 0.68rem;
  }
}

@media (max-width: 360px) {
  .media-card {
    padding: 0.25rem;
    gap: 0.25rem;
  }

  .media-name {
    font-size: 0.62rem;
  }
}
</style>

