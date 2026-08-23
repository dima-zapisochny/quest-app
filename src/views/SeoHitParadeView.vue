<template>
  <div class="seo-page seo-page--pack seo-page--music">
    <main class="seo-page__main seo-page__main--wide">
      <h1 class="seo-page__title">{{ t('seo.musicH1') }}</h1>
      <p class="seo-page__lead">{{ t('seo.musicLead') }}</p>

      <SeoPackShowcase focus="music" />
      <p class="seo-pack-caption">{{ t('seo.packCaption') }}</p>

      <section class="seo-page__section">
        <h2>{{ t('seo.musicInsideTitle') }}</h2>
        <p class="seo-page__prose">{{ t('seo.musicBody') }}</p>
        <ul class="seo-page__bullets">
          <li>{{ t('seo.musicBullet1') }}</li>
          <li>{{ t('seo.musicBullet2') }}</li>
          <li>{{ t('seo.musicBullet3') }}</li>
        </ul>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('seo.musicHowTitle') }}</h2>
        <p class="seo-page__prose">{{ t('seo.musicHowText') }}</p>
      </section>

      <section class="about-cta-block" aria-labelledby="music-cta-title">
        <h2 id="music-cta-title">{{ t('seo.musicCtaTitle') }}</h2>
        <p>{{ t('seo.musicCtaText') }}</p>
        <p class="seo-page__cta-wrap">
          <RouterLink class="seo-page__cta" :to="home()" data-track="cta:play-hit-parade">
            {{ t('seo.linkPlay') }}
          </RouterLink>
        </p>
      </section>

      <nav class="seo-page__nav" :aria-label="t('seo.relatedNav')">
        <RouterLink :to="home()">{{ t('seo.linkHome') }}</RouterLink>
        <RouterLink :to="link('howto')">{{ t('seo.linkHowTo') }}</RouterLink>
        <RouterLink :to="link('movie-night')">{{ t('seo.linkMovieNight') }}</RouterLink>
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
useSeo('hit-parade')
</script>
