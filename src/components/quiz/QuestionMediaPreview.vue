<template>
  <!-- Якщо URL не валідний (safeMediaUrl повернув null), не рендеримо картку — так не лишається порожнього "квадратика". -->
  <figure v-if="mediaUrl" :class="['media-card', media.type, { 'media-error': loadError }]">
    <div v-if="media.type === 'image'" class="image-wrapper">
      <img
        v-if="mediaUrl && !loadError"
        :src="mediaUrl"
        :alt="media.name"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        @error="onMediaError"
        @load="loadError = false"
      />
      <div v-else-if="loadError" class="media-placeholder">{{ t('game.imageNotLoaded') }}</div>
      <div v-else class="media-placeholder"></div>
    </div>
    <div v-else class="audio-wrapper">
      <audio
        v-if="mediaUrl && !loadError"
        :src="mediaUrl"
        controls
        preload="none"
        referrerpolicy="no-referrer"
        @error="onMediaError"
      ></audio>
      <div v-else-if="loadError" class="media-placeholder">{{ t('game.audioNotLoaded') }}</div>
      <div v-else class="media-placeholder">{{ t('game.noAudio') }}</div>
    </div>
    <!-- Якщо медіа не має валідного URL (safeMediaUrl повернув null), не показуємо підпис,
         щоб "нет изображения"/ім'я не з'являлось як зайвий текст. -->
    <figcaption v-if="mediaUrl || loadError" class="media-name">{{ media.name }}</figcaption>
  </figure>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, watch } from 'vue'
import type { MediaAsset } from '@/types'
import { safeMediaUrl } from '@/utils/mediaUrl'

const { t } = useI18n()

interface Props {
  media: MediaAsset
}

const props = defineProps<Props>()
const loadError = ref(false)

const mediaUrl = computed(() => safeMediaUrl(props.media?.url) ?? null)

watch(mediaUrl, () => {
  loadError.value = false
})

function onMediaError() {
  loadError.value = true
}
</script>

<style scoped>
.media-card {
  background: rgb(var(--c-bg) / 0.65);
  border: 1px solid rgb(var(--c-text-muted) / 0.25);
  border-radius: 1rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  justify-content: center;
  color: rgb(var(--c-text-soft));
  box-shadow: 0 12px 24px rgb(var(--c-bg) / 0.45);
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
  color: rgb(var(--c-text-muted));
  word-break: break-word;
}

.media-placeholder {
  padding: 1rem;
  text-align: center;
  color: rgb(var(--c-slate-500));
  font-size: 0.8rem;
  background: rgb(var(--c-bg) / 0.5);
  border-radius: 0.5rem;
}

.media-card.media-error .media-placeholder {
  color: rgb(var(--c-text-muted));
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
