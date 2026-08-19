<template>
  <div class="audio-controls">
    <div
      v-for="audio in tracks"
      :key="audio.id"
      class="audio-control-block"
      :class="{ 'is-playing': playingId === audio.id }"
    >
      <button
        class="audio-play-button"
        :class="{ 'is-playing': playingId === audio.id }"
        type="button"
        :aria-label="ariaLabel"
        @click="emit('toggle', audio)"
      >
        <svg v-if="playingId !== audio.id" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        </svg>
      </button>
      <div class="audio-equalizer">
        <div
          v-for="i in 17"
          :key="i"
          class="equalizer-bar"
          :style="{ animationDelay: `${((i - 1) * 0.08).toFixed(2)}s` }"
        ></div>
      </div>
    </div>
    <audio
      v-for="audio in tracks"
      :key="audio.id"
      :ref="el => emit('register', audio.id, el)"
      :src="audio.url"
      preload="none"
      @ended="emit('ended')"
    ></audio>
  </div>
</template>

<script setup lang="ts">
import type { MediaAsset } from '@/types'

withDefaults(
  defineProps<{
    tracks: MediaAsset[]
    playingId: string | null
    ariaLabel?: string
  }>(),
  { ariaLabel: 'Проиграть аудио' }
)

const emit = defineEmits<{
  toggle: [audio: MediaAsset]
  ended: []
  register: [id: string, el: unknown]
}>()
</script>

<style scoped>
.audio-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
  align-items: center;
}

.audio-control-block {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(
    135deg,
    rgb(var(--c-surface) / 0.6) 0%,
    rgb(var(--c-bg) / 0.7) 100%
  );
  border: 1.5px solid rgb(var(--c-text-muted) / 0.2);
  border-radius: 16px;
  padding: 1rem 1.25rem;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow:
    0 4px 12px rgb(var(--c-black) / 0.2),
    inset 0 1px 0 rgb(var(--c-white) / 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  width: fit-content;
}

.audio-control-block.is-playing {
  background: linear-gradient(
    135deg,
    rgb(var(--c-surface) / 0.6) 0%,
    rgb(var(--c-bg) / 0.7) 100%
  );
  border-color: rgb(var(--c-text-muted) / 0.2);
  box-shadow:
    0 4px 12px rgb(var(--c-black) / 0.2),
    inset 0 1px 0 rgb(var(--c-white) / 0.05);
}

.audio-play-button {
  background: rgb(var(--c-text-muted) / 0.15);
  border: 1px solid rgb(var(--c-text-muted) / 0.3);
  color: rgb(var(--c-text-muted) / 0.8);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
  flex-shrink: 0;
  flex-grow: 0;
  position: relative;
  overflow: hidden;
}

.audio-play-button:hover {
  background: rgb(var(--c-text-muted) / 0.25);
  border-color: rgb(var(--c-text-muted) / 0.4);
  color: rgb(var(--c-text-muted) / 1);
}

.audio-play-button.is-playing {
  background: rgb(var(--c-text-muted) / 0.2);
  border-color: rgb(var(--c-text-muted) / 0.35);
  color: rgb(var(--c-text-muted) / 0.9);
}

.audio-play-button svg {
  width: 18px;
  height: 18px;
  position: relative;
  z-index: 1;
}

.audio-equalizer {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 24px;
  flex: 1 1 0;
  min-width: 0;
  max-width: 100%;
}

.equalizer-bar {
  width: 4px;
  background: linear-gradient(
    to top,
    rgb(var(--c-text-muted) / 0.5) 0%,
    rgb(var(--c-text-muted) / 0.3) 100%
  );
  border-radius: 2px;
  animation: equalizer-idle 1.5s ease-in-out infinite;
}

.audio-control-block.is-playing .equalizer-bar {
  background: linear-gradient(
    to top,
    rgb(var(--c-text-muted) / 0.7) 0%,
    rgb(var(--c-text-muted) / 0.5) 100%
  );
  animation: equalizer-active 1.2s ease-in-out infinite;
}

.equalizer-bar:nth-child(1) { height: 50%; }
.equalizer-bar:nth-child(2) { height: 80%; }
.equalizer-bar:nth-child(3) { height: 100%; }
.equalizer-bar:nth-child(4) { height: 70%; }
.equalizer-bar:nth-child(5) { height: 90%; }
.equalizer-bar:nth-child(6) { height: 100%; }
.equalizer-bar:nth-child(7) { height: 60%; }
.equalizer-bar:nth-child(8) { height: 85%; }
.equalizer-bar:nth-child(9) { height: 100%; }
.equalizer-bar:nth-child(10) { height: 75%; }
.equalizer-bar:nth-child(11) { height: 95%; }
.equalizer-bar:nth-child(12) { height: 65%; }
.equalizer-bar:nth-child(13) { height: 90%; }
.equalizer-bar:nth-child(14) { height: 55%; }
.equalizer-bar:nth-child(15) { height: 100%; }
.equalizer-bar:nth-child(16) { height: 80%; }
.equalizer-bar:nth-child(17) { height: 70%; }

@keyframes equalizer-idle {
  0%, 100% {
    transform: scaleY(0.4);
    opacity: 0.5;
  }
  50% {
    transform: scaleY(0.6);
    opacity: 0.7;
  }
}

@keyframes equalizer-active {
  0%, 100% {
    transform: scaleY(0.3);
    opacity: 0.7;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
</style>
