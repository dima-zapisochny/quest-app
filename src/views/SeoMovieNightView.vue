<template>
  <div class="seo-page seo-page--pack seo-page--movie">
    <main class="seo-page__main seo-page__main--wide">
      <p class="seo-page__brand">Quiz Quest · 🎬</p>
      <h1 class="seo-page__title">{{ t('seo.movieH1') }}</h1>
      <p class="seo-page__lead">{{ t('seo.movieLead') }}</p>

      <SeoPackShowcase focus="movie" />
      <p class="seo-pack-caption">{{ t('seo.packCaption') }}</p>

      <section class="seo-page__section">
        <h2>{{ t('seo.movieInsideTitle') }}</h2>
        <p class="seo-page__prose">{{ t('seo.movieBody') }}</p>
        <ul class="seo-page__bullets">
          <li>{{ t('seo.movieBullet1') }}</li>
          <li>{{ t('seo.movieBullet2') }}</li>
          <li>{{ t('seo.movieBullet3') }}</li>
        </ul>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('seo.movieHowTitle') }}</h2>
        <p class="seo-page__prose">{{ t('seo.movieHowText') }}</p>
      </section>

      <section class="about-cta-block" aria-labelledby="movie-cta-title">
        <h2 id="movie-cta-title">{{ t('seo.movieCtaTitle') }}</h2>
        <p>{{ t('seo.movieCtaText') }}</p>
        <p class="seo-page__cta-wrap">
          <RouterLink class="seo-page__cta" :to="home()" data-track="cta:play-movie-night">
            {{ t('seo.linkPlay') }}
          </RouterLink>
        </p>
      </section>

      <nav class="seo-page__nav" :aria-label="t('seo.relatedNav')">
        <RouterLink :to="link('howto')">{{ t('seo.linkHowTo') }}</RouterLink>
        <RouterLink :to="link('hit-parade')">{{ t('seo.linkHitParade') }}</RouterLink>
        <RouterLink :to="link('about')">{{ t('seo.linkAbout') }}</RouterLink>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import SeoPackShowcase from '@/components/seo/SeoPackShowcase.vue'
import { useSeo } from '@/composables/useSeo'
import { useSeoLinks } from '@/composables/useSeoLinks'

const { t } = useI18n()
const { to: link, home } = useSeoLinks()
useSeo('movie-night')
</script>
