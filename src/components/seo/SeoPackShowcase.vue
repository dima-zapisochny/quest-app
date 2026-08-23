<template>
  <div class="seo-pack-showcase" :class="`seo-pack-showcase--focus-${focus}`" aria-hidden="true">
    <article
      class="seo-pack-card"
      :class="{ 'seo-pack-card--active': focus === 'movie' }"
    >
      <div class="seo-pack-card__cover seo-pack-card__cover--movie">
        <span class="seo-pack-card__emoji">🎬</span>
        <div class="seo-pack-card__tiles" aria-hidden="true">
          <span v-for="n in 9" :key="`m-${n}`" class="seo-pack-card__tile" />
        </div>
      </div>
      <div class="seo-pack-card__body">
        <strong class="seo-pack-card__title">Movie Night</strong>
        <p class="seo-pack-card__meta">{{ t('seo.packMovieMeta') }}</p>
      </div>
    </article>

    <article
      class="seo-pack-card"
      :class="{ 'seo-pack-card--active': focus === 'music' }"
    >
      <div class="seo-pack-card__cover seo-pack-card__cover--music">
        <span class="seo-pack-card__emoji">🎵</span>
        <div class="seo-pack-card__notes" aria-hidden="true">
          <span /><span /><span /><span />
        </div>
      </div>
      <div class="seo-pack-card__body">
        <strong class="seo-pack-card__title">Hit Parade</strong>
        <p class="seo-pack-card__meta">{{ t('seo.packMusicMeta') }}</p>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

withDefaults(
  defineProps<{
    focus?: 'movie' | 'music'
  }>(),
  { focus: 'movie' }
)

const { t } = useI18n()
</script>

<style scoped>
.seo-pack-showcase {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
  margin: 0 0 1.75rem;
}

.seo-pack-card {
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.16);
  background: rgb(var(--c-surface) / 0.55);
  overflow: hidden;
  opacity: 0.72;
  transform: scale(0.97);
  transition: opacity 0.25s ease, transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.seo-pack-card--active {
  opacity: 1;
  transform: scale(1);
  border-color: rgb(var(--c-accent-sky) / 0.35);
  box-shadow: 0 14px 32px rgb(var(--c-bg-deep) / 0.35);
}

.seo-pack-card__cover {
  position: relative;
  aspect-ratio: 1.15;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.seo-pack-card__cover--movie {
  background:
    radial-gradient(circle at 30% 25%, rgb(250 204 21 / 0.22), transparent 55%),
    linear-gradient(145deg, #1e3a5f, #0f172a 60%, #1a1040);
}

.seo-pack-card__cover--music {
  background:
    radial-gradient(circle at 70% 30%, rgb(56 189 248 / 0.28), transparent 50%),
    linear-gradient(145deg, #312e81, #0f172a 55%, #134e4a);
}

.seo-pack-card__emoji {
  position: relative;
  z-index: 2;
  font-size: clamp(2.4rem, 8vw, 3.1rem);
  line-height: 1;
  filter: drop-shadow(0 6px 16px rgb(0 0 0 / 0.4));
}

.seo-pack-card__tiles {
  position: absolute;
  inset: 18% 14% 22%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.28rem;
  opacity: 0.35;
}

.seo-pack-card__tile {
  border-radius: 0.28rem;
  background: linear-gradient(180deg, #38bdf8, #22d3ee);
}

.seo-pack-card__notes {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.seo-pack-card__notes span {
  position: absolute;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: rgb(186 230 253 / 0.55);
  box-shadow: 0 0 0 2px rgb(56 189 248 / 0.15);
  animation: seo-note-float 3.2s ease-in-out infinite;
}

.seo-pack-card__notes span:nth-child(1) { top: 18%; left: 16%; animation-delay: 0s; }
.seo-pack-card__notes span:nth-child(2) { top: 28%; right: 18%; animation-delay: 0.4s; }
.seo-pack-card__notes span:nth-child(3) { bottom: 26%; left: 22%; animation-delay: 0.8s; }
.seo-pack-card__notes span:nth-child(4) { bottom: 18%; right: 24%; animation-delay: 1.2s; }

@keyframes seo-note-float {
  0%,
  100% { transform: translateY(0); opacity: 0.45; }
  50% { transform: translateY(-6px); opacity: 0.9; }
}

.seo-pack-card__body {
  padding: 0.75rem 0.8rem 0.85rem;
}

.seo-pack-card__title {
  display: block;
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: rgb(var(--c-text));
}

.seo-pack-card__meta {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: rgb(var(--c-text-soft) / 0.85);
}

@media (max-width: 520px) {
  .seo-pack-showcase {
    gap: 0.65rem;
  }

  .seo-pack-card__body {
    padding: 0.6rem 0.65rem 0.7rem;
  }

  .seo-pack-card__title {
    font-size: 0.85rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .seo-pack-card__notes span {
    animation: none;
  }
}
</style>
