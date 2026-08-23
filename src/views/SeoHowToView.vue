<template>
  <div class="seo-page seo-page--howto">
    <main class="seo-page__main seo-page__main--wide">
      <header class="howto-header">
        <h1 class="seo-page__title">{{ t('seo.howtoH1') }}</h1>
        <p class="seo-page__lead">{{ t('seo.howtoLead') }}</p>
      </header>

      <section class="seo-page__section howto-slider-section">
        <HowToPlaySlider embedded @complete="scrollToTips" />
      </section>

      <section id="howto-tips" class="seo-page__section">
        <h2>{{ t('seo.howtoTipsTitle') }}</h2>
        <div class="howto-tips">
          <article class="howto-tip">
            <h3>{{ t('seo.howtoHostTitle') }}</h3>
            <p>{{ t('seo.howtoHostText') }}</p>
          </article>
          <article class="howto-tip">
            <h3>{{ t('seo.howtoPlayerTitle') }}</h3>
            <p>{{ t('seo.howtoPlayerText') }}</p>
          </article>
        </div>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('seo.howtoFaqTitle') }}</h2>
        <div class="about-faq">
          <details v-for="n in 3" :key="`faq-${n}`" class="about-faq__item">
            <summary>{{ t(`seo.howtoFaq${n}Q`) }}</summary>
            <p>{{ t(`seo.howtoFaq${n}A`) }}</p>
          </details>
        </div>
      </section>

      <section class="about-cta-block" aria-labelledby="howto-cta-title">
        <h2 id="howto-cta-title">{{ t('seo.howtoCtaTitle') }}</h2>
        <p>{{ t('seo.howtoCtaText') }}</p>
        <p class="seo-page__cta-wrap">
          <RouterLink class="seo-page__cta" :to="home()" data-track="cta:create-game-howto">{{ t('landing.createGame') }}</RouterLink>
        </p>
      </section>

      <nav class="seo-page__nav" :aria-label="t('seo.relatedNav')">
        <RouterLink :to="link('about')">{{ t('seo.linkAbout') }}</RouterLink>
        <RouterLink :to="link('movie-night')">{{ t('seo.linkMovieNight') }}</RouterLink>
        <RouterLink :to="link('hit-parade')">{{ t('seo.linkHitParade') }}</RouterLink>
        <RouterLink :to="home()">{{ t('seo.linkPlay') }}</RouterLink>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import HowToPlaySlider from '@/components/common/howto/HowToPlaySlider.vue'
import { useSeo } from '@/composables/useSeo'
import { useSeoLinks } from '@/composables/useSeoLinks'

const { t } = useI18n()
const { to: link, home } = useSeoLinks()
useSeo('howto')

function scrollToTips() {
  document.getElementById('howto-tips')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>
