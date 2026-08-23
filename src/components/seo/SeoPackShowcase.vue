<template>
  <div class="seo-pack-showcase" :class="`seo-pack-showcase--focus-${focus}`">
    <RouterLink
      class="seo-pack-card"
      :class="{ 'seo-pack-card--active': focus === 'movie' }"
      :to="link('movie-night')"
      :aria-current="focus === 'movie' ? 'page' : undefined"
      :aria-label="t('seo.linkMovieNight')"
      data-track="nav:pack-movie-night"
    >
      <div class="seo-pack-card__cover seo-pack-card__cover--movie">
        <span class="seo-pack-card__emoji" aria-hidden="true">🎬</span>
        <div class="seo-pack-card__stars seo-pack-card__stars--warm" aria-hidden="true">
          <span
            v-for="(star, i) in movieStars"
            :key="`m-${i}`"
            class="seo-pack-card__star"
            :style="starStyle(star)"
          />
        </div>
      </div>
      <div class="seo-pack-card__body">
        <strong class="seo-pack-card__title">Movie Night</strong>
        <p class="seo-pack-card__meta">{{ t('seo.packMovieMeta') }}</p>
      </div>
    </RouterLink>

    <RouterLink
      class="seo-pack-card"
      :class="{ 'seo-pack-card--active': focus === 'music' }"
      :to="link('hit-parade')"
      :aria-current="focus === 'music' ? 'page' : undefined"
      :aria-label="t('seo.linkHitParade')"
      data-track="nav:pack-hit-parade"
    >
      <div class="seo-pack-card__cover seo-pack-card__cover--music">
        <span class="seo-pack-card__emoji" aria-hidden="true">🎵</span>
        <div class="seo-pack-card__stars" aria-hidden="true">
          <span
            v-for="(star, i) in musicStars"
            :key="`h-${i}`"
            class="seo-pack-card__star"
            :style="starStyle(star)"
          />
        </div>
      </div>
      <div class="seo-pack-card__body">
        <strong class="seo-pack-card__title">Hit Parade</strong>
        <p class="seo-pack-card__meta">{{ t('seo.packMusicMeta') }}</p>
      </div>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSeoLinks } from '@/composables/useSeoLinks'

withDefaults(
  defineProps<{
    focus?: 'movie' | 'music'
  }>(),
  { focus: 'movie' }
)

const { t } = useI18n()
const { to: link } = useSeoLinks()

type Star = {
  top: string
  left: string
  size: string
  delay: string
  duration: string
  opacity: number
}

const musicStars: Star[] = [
  { top: '8%', left: '12%', size: '2px', delay: '0s', duration: '2.4s', opacity: 0.95 },
  { top: '14%', left: '78%', size: '3px', delay: '0.35s', duration: '3.1s', opacity: 0.85 },
  { top: '22%', left: '41%', size: '2px', delay: '0.7s', duration: '2.7s', opacity: 1 },
  { top: '31%', left: '88%', size: '2px', delay: '0.15s', duration: '3.4s', opacity: 0.75 },
  { top: '36%', left: '18%', size: '3px', delay: '1.1s', duration: '2.9s', opacity: 0.9 },
  { top: '48%', left: '63%', size: '2px', delay: '0.55s', duration: '2.2s', opacity: 0.8 },
  { top: '55%', left: '9%', size: '2px', delay: '1.4s', duration: '3.6s', opacity: 0.7 },
  { top: '61%', left: '52%', size: '3px', delay: '0.9s', duration: '2.5s', opacity: 0.95 },
  { top: '68%', left: '83%', size: '2px', delay: '1.7s', duration: '3s', opacity: 0.85 },
  { top: '74%', left: '27%', size: '2px', delay: '0.25s', duration: '2.8s', opacity: 0.75 },
  { top: '81%', left: '71%', size: '3px', delay: '1.2s', duration: '3.3s', opacity: 0.9 },
  { top: '87%', left: '44%', size: '2px', delay: '0.45s', duration: '2.6s', opacity: 0.8 },
  { top: '19%', left: '58%', size: '2px', delay: '1.55s', duration: '3.5s', opacity: 1 },
  { top: '42%', left: '34%', size: '2px', delay: '0.8s', duration: '2.3s', opacity: 0.7 },
  { top: '11%', left: '29%', size: '3px', delay: '1.9s', duration: '3.2s', opacity: 0.85 }
]

const movieStars: Star[] = [
  { top: '7%', left: '71%', size: '2px', delay: '0.2s', duration: '2.6s', opacity: 0.95 },
  { top: '12%', left: '22%', size: '3px', delay: '0.6s', duration: '3.2s', opacity: 0.85 },
  { top: '18%', left: '86%', size: '2px', delay: '1.1s', duration: '2.4s', opacity: 1 },
  { top: '25%', left: '48%', size: '2px', delay: '0.4s', duration: '3.5s', opacity: 0.8 },
  { top: '33%', left: '11%', size: '3px', delay: '1.5s', duration: '2.8s', opacity: 0.9 },
  { top: '39%', left: '66%', size: '2px', delay: '0.05s', duration: '3s', opacity: 0.75 },
  { top: '46%', left: '31%', size: '2px', delay: '0.95s', duration: '2.3s', opacity: 0.95 },
  { top: '53%', left: '82%', size: '3px', delay: '1.3s', duration: '3.4s', opacity: 0.85 },
  { top: '59%', left: '17%', size: '2px', delay: '0.75s', duration: '2.7s', opacity: 0.7 },
  { top: '67%', left: '55%', size: '2px', delay: '1.8s', duration: '3.1s', opacity: 0.9 },
  { top: '73%', left: '39%', size: '3px', delay: '0.3s', duration: '2.5s', opacity: 0.8 },
  { top: '79%', left: '74%', size: '2px', delay: '1.05s', duration: '3.6s', opacity: 1 },
  { top: '85%', left: '24%', size: '2px', delay: '0.5s', duration: '2.9s', opacity: 0.75 },
  { top: '16%', left: '61%', size: '2px', delay: '1.65s', duration: '2.2s', opacity: 0.85 },
  { top: '44%', left: '91%', size: '3px', delay: '0.85s', duration: '3.3s', opacity: 0.9 }
]

function starStyle(star: Star) {
  return {
    top: star.top,
    left: star.left,
    width: star.size,
    height: star.size,
    opacity: star.opacity,
    animationDelay: star.delay,
    animationDuration: star.duration
  }
}
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
  opacity: 0.62;
  transform: scale(0.96);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: opacity 0.25s ease, transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.seo-pack-card:hover {
  opacity: 0.88;
  transform: scale(0.98) translateY(-2px);
  border-color: rgb(var(--c-accent-sky) / 0.3);
}

.seo-pack-card--active,
.seo-pack-card--active:hover {
  opacity: 1;
  transform: scale(1);
  border-color: rgb(var(--c-accent-sky) / 0.38);
  box-shadow: 0 14px 32px rgb(var(--c-bg-deep) / 0.38);
}

.seo-pack-card:focus {
  outline: none;
}

.seo-pack-card:focus-visible {
  outline: 2px solid rgb(var(--c-accent-sky) / 0.65);
  outline-offset: 3px;
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
  font-size: clamp(3.6rem, 12vw, 5rem);
  line-height: 1;
  filter: drop-shadow(0 8px 18px rgb(0 0 0 / 0.45));
}

.seo-pack-card__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.seo-pack-card__star {
  position: absolute;
  border-radius: 50%;
  background: #f0f9ff;
  box-shadow:
    0 0 4px rgb(255 255 255 / 0.95),
    0 0 8px rgb(125 211 252 / 0.85);
  animation: seo-star-twinkle ease-in-out infinite;
}

.seo-pack-card__stars--warm .seo-pack-card__star {
  background: #fff7ed;
  box-shadow:
    0 0 4px rgb(255 251 235 / 0.95),
    0 0 8px rgb(250 204 21 / 0.75);
}

@keyframes seo-star-twinkle {
  0%,
  100% {
    transform: scale(0.7);
    filter: brightness(0.85);
  }
  50% {
    transform: scale(1.25);
    filter: brightness(1.35);
  }
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

  .seo-pack-card__emoji {
    font-size: clamp(3rem, 16vw, 3.8rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .seo-pack-card__star {
    animation: none;
  }
}
</style>
