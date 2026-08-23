<template>
  <div class="seo-page seo-page--about">
    <AppHeader
      button-variant="back"
      :button-label="t('common.back')"
      @button-click="goHome"
    />

    <main class="seo-page__main seo-page__main--wide">
      <p class="seo-page__brand">Quiz Quest</p>
      <h1 class="seo-page__title">{{ t('about.h1') }}</h1>
      <p class="seo-page__lead">{{ t('about.lead') }}</p>

      <figure class="about-hero about-hero--animated" aria-hidden="true">
        <svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" role="img">
          <defs>
            <linearGradient id="aboutBoard" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#1e293b" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>
            <linearGradient id="aboutTile" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" />
              <stop offset="100%" stop-color="#22d3ee" />
            </linearGradient>
          </defs>
          <rect width="640" height="220" rx="24" fill="url(#aboutBoard)" />
          <circle cx="520" cy="48" r="56" fill="#38bdf8" opacity="0.12" />
          <circle cx="90" cy="180" r="70" fill="#22d3ee" opacity="0.1" />
          <g transform="translate(48 46)">
            <rect width="280" height="128" rx="14" fill="#020617" stroke="#38bdf8" stroke-opacity="0.35" />
            <template v-for="row in 3" :key="`r-${row}`">
              <rect
                v-for="col in 5"
                :key="`t-${row}-${col}`"
                :x="14 + (col - 1) * 52"
                :y="14 + (row - 1) * 36"
                width="44"
                height="28"
                rx="6"
                fill="url(#aboutTile)"
                opacity="0.9"
              />
            </template>
          </g>
          <g transform="translate(370 52)">
            <rect x="0" y="8" width="52" height="96" rx="10" fill="#0b1220" stroke="#bae6fd" stroke-width="2" />
            <rect x="8" y="20" width="36" height="58" rx="4" fill="#22d3ee" opacity="0.85" />
            <circle cx="26" cy="90" r="4" fill="#94a3b8" />
            <rect x="70" y="0" width="52" height="96" rx="10" fill="#0b1220" stroke="#bae6fd" stroke-width="2" />
            <rect x="78" y="12" width="36" height="58" rx="4" fill="#38bdf8" opacity="0.85" />
            <circle cx="96" cy="82" r="4" fill="#94a3b8" />
            <rect x="140" y="16" width="52" height="96" rx="10" fill="#0b1220" stroke="#bae6fd" stroke-width="2" />
            <rect x="148" y="28" width="36" height="58" rx="4" fill="#a78bfa" opacity="0.85" />
            <circle cx="166" cy="98" r="4" fill="#94a3b8" />
          </g>
        </svg>
        <figcaption class="about-hero__caption">{{ t('about.heroCaption') }}</figcaption>
      </figure>

      <section class="seo-page__section">
        <h2>{{ t('about.whatTitle') }}</h2>
        <p class="about-prose">{{ t('about.whatText') }}</p>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('about.forWhomTitle') }}</h2>
        <div class="about-cards about-cards--animated">
          <article class="about-card">
            <div class="about-card__art" aria-hidden="true">
              <svg viewBox="0 0 72 56" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="22" r="10" fill="#38bdf8" />
                <circle cx="48" cy="22" r="10" fill="#22d3ee" />
                <path d="M8 48c2-12 14-16 24-16s22 4 24 16" fill="#1e293b" stroke="#bae6fd" stroke-width="2" />
                <path d="M36 8l2 6h6l-5 4 2 6-5-3-5 3 2-6-5-4h6z" fill="#facc15" />
              </svg>
            </div>
            <h3>{{ t('about.audiencePartyTitle') }}</h3>
            <p>{{ t('about.audiencePartyText') }}</p>
          </article>
          <article class="about-card">
            <div class="about-card__art" aria-hidden="true">
              <svg viewBox="0 0 72 56" xmlns="http://www.w3.org/2000/svg">
                <rect x="10" y="18" width="52" height="30" rx="6" fill="#0f172a" stroke="#38bdf8" />
                <rect x="18" y="24" width="14" height="10" rx="2" fill="#22d3ee" />
                <rect x="40" y="24" width="14" height="10" rx="2" fill="#a78bfa" />
                <circle cx="25" cy="12" r="6" fill="#bae6fd" />
                <circle cx="47" cy="12" r="6" fill="#bae6fd" />
                <circle cx="36" cy="14" r="5" fill="#38bdf8" />
              </svg>
            </div>
            <h3>{{ t('about.audienceFamilyTitle') }}</h3>
            <p>{{ t('about.audienceFamilyText') }}</p>
          </article>
          <article class="about-card">
            <div class="about-card__art" aria-hidden="true">
              <svg viewBox="0 0 72 56" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="14" width="56" height="34" rx="8" fill="#1e293b" />
                <rect x="16" y="22" width="40" height="6" rx="2" fill="#38bdf8" opacity=".7" />
                <rect x="16" y="32" width="28" height="6" rx="2" fill="#22d3ee" opacity=".55" />
                <circle cx="54" cy="35" r="7" fill="#facc15" />
              </svg>
            </div>
            <h3>{{ t('about.audienceTeamTitle') }}</h3>
            <p>{{ t('about.audienceTeamText') }}</p>
          </article>
          <article class="about-card">
            <div class="about-card__art" aria-hidden="true">
              <svg viewBox="0 0 72 56" xmlns="http://www.w3.org/2000/svg">
                <rect x="18" y="8" width="36" height="28" rx="4" fill="#0b1220" stroke="#bae6fd" />
                <rect x="24" y="14" width="24" height="14" fill="#22d3ee" opacity=".8" />
                <rect x="28" y="38" width="16" height="4" rx="1" fill="#64748b" />
                <rect x="22" y="44" width="28" height="6" rx="2" fill="#334155" />
              </svg>
            </div>
            <h3>{{ t('about.audienceHostTitle') }}</h3>
            <p>{{ t('about.audienceHostText') }}</p>
          </article>
        </div>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('about.rulesTitle') }}</h2>
        <ol class="about-rules">
          <li v-for="n in 5" :key="`rule-${n}`">{{ t(`about.rule${n}Text`) }}</li>
        </ol>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('about.howtoTitle') }}</h2>
        <p class="about-prose about-prose--tight">{{ t('about.howtoLead') }}</p>
        <ol class="about-steps about-steps--animated">
          <li v-for="n in 5" :key="`step-${n}`" class="about-step">
            <span class="about-step__num">{{ n }}</span>
            <div>
              <strong>{{ t(`howto.play${n}Title`) }}</strong>
              <p>{{ t(`howto.play${n}Text`) }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('about.packsTitle') }}</h2>
        <p class="about-prose">{{ t('about.packsText') }}</p>
        <ul class="seo-page__bullets">
          <li>
            <RouterLink to="/quests/movie-night">{{ t('seo.linkMovieNight') }}</RouterLink>
            — {{ t('about.packsMovie') }}
          </li>
          <li>
            <RouterLink to="/quests/hit-parade">{{ t('seo.linkHitParade') }}</RouterLink>
            — {{ t('about.packsMusic') }}
          </li>
        </ul>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('about.faqTitle') }}</h2>
        <div class="about-faq">
          <details v-for="n in 5" :key="`faq-${n}`" class="about-faq__item">
            <summary>{{ t(`about.faq${n}Q`) }}</summary>
            <p>{{ t(`about.faq${n}A`) }}</p>
          </details>
        </div>
      </section>

      <section class="about-cta-block" aria-labelledby="about-cta-title">
        <h2 id="about-cta-title">{{ t('about.ctaTitle') }}</h2>
        <p>{{ t('about.ctaText') }}</p>
        <p class="seo-page__cta-wrap">
          <RouterLink class="seo-page__cta" to="/" data-track="cta:create-game-about">{{ t('landing.createGame') }}</RouterLink>
        </p>
      </section>

      <nav class="seo-page__nav" :aria-label="t('seo.relatedNav')">
        <RouterLink to="/how-to-play">{{ t('seo.linkHowTo') }}</RouterLink>
        <RouterLink to="/quests/movie-night">{{ t('seo.linkMovieNight') }}</RouterLink>
        <RouterLink to="/quests/hit-parade">{{ t('seo.linkHitParade') }}</RouterLink>
        <RouterLink to="/">{{ t('seo.linkPlay') }}</RouterLink>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import { useSeo } from '@/composables/useSeo'

const { t } = useI18n()
const router = useRouter()
useSeo('about')

function goHome() {
  router.push('/')
}
</script>
