<template>
  <div class="seo-pack-showcase" aria-hidden="true">
    <article v-if="focus === 'movie'" class="seo-pack-card seo-pack-card--active">
      <div class="seo-pack-card__cover seo-pack-card__cover--movie">
        <span class="seo-pack-card__emoji">🎬</span>
      </div>
      <div class="seo-pack-card__body">
        <strong class="seo-pack-card__title">Movie Night</strong>
        <p class="seo-pack-card__meta">{{ t('seo.packMovieMeta') }}</p>
      </div>
    </article>

    <article v-else class="seo-pack-card seo-pack-card--active">
      <div class="seo-pack-card__cover seo-pack-card__cover--music">
        <span class="seo-pack-card__emoji">🎵</span>
        <div class="seo-pack-card__notes">
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
  display: flex;
  justify-content: center;
  margin: 0 0 1.75rem;
}

.seo-pack-card {
  width: min(100%, 15.5rem);
  display: flex;
  flex-direction: column;
  border-radius: 1rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: rgb(var(--c-surface) / 0.55);
  overflow: hidden;
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
  font-size: clamp(2.6rem, 9vw, 3.4rem);
  line-height: 1;
  filter: drop-shadow(0 6px 16px rgb(0 0 0 / 0.4));
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
  text-align: center;
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

@media (prefers-reduced-motion: reduce) {
  .seo-pack-card__notes span {
    animation: none;
  }
}
</style>
