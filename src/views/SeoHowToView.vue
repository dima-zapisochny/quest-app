<template>
  <div class="seo-page seo-page--howto">
    <main class="seo-page__main seo-page__main--wide">
      <h1 class="seo-page__title">{{ t('seo.howtoH1') }}</h1>
      <p class="seo-page__lead">{{ t('seo.howtoLead') }}</p>
      <p class="howto-prose">{{ t('seo.howtoIntro') }}</p>

      <section class="seo-page__section">
        <h2>{{ t('howto.tabPlay') }}</h2>
        <p class="howto-prose howto-prose--tight">{{ t('seo.howtoPlayIntro') }}</p>
        <div class="howto-seo-steps howto-seo-steps--animated">
          <article
            v-for="(step, idx) in playSteps"
            :key="step.scene"
            class="howto-seo-step"
            :class="{ 'howto-seo-step--reverse': idx % 2 === 1 }"
            :style="{ '--step-delay': `${0.04 + idx * 0.06}s` }"
          >
            <figure class="howto-seo-step__illu" aria-hidden="true">
              <HowToIllustration :scene="step.scene" />
            </figure>
            <div class="howto-seo-step__body">
              <span class="howto-seo-step__num">{{ step.n }}</span>
              <h3>{{ t(`howto.play${step.n}Title`) }}</h3>
              <p>{{ t(`howto.play${step.n}Text`) }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('howto.tabCreate') }}</h2>
        <p class="howto-prose howto-prose--tight">{{ t('seo.howtoCreateIntro') }}</p>
        <div class="howto-seo-steps howto-seo-steps--animated">
          <article
            v-for="(step, idx) in createSteps"
            :key="step.scene"
            class="howto-seo-step"
            :class="{ 'howto-seo-step--reverse': idx % 2 === 1 }"
            :style="{ '--step-delay': `${0.04 + idx * 0.06}s` }"
          >
            <figure class="howto-seo-step__illu" aria-hidden="true">
              <HowToIllustration :scene="step.scene" />
            </figure>
            <div class="howto-seo-step__body">
              <span class="howto-seo-step__num">{{ step.n }}</span>
              <h3>{{ t(`howto.create${step.n}Title`) }}</h3>
              <p>{{ t(`howto.create${step.n}Text`) }}</p>
            </div>
          </article>
        </div>
      </section>

      <section class="seo-page__section">
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
import HowToIllustration from '@/components/common/howto/HowToIllustration.vue'
import { useSeo } from '@/composables/useSeo'
import { useSeoLinks } from '@/composables/useSeoLinks'

const { t } = useI18n()
const { to: link, home } = useSeoLinks()
useSeo('howto')

const playSteps = [
  { scene: 'start', n: 1 },
  { scene: 'join', n: 2 },
  { scene: 'open', n: 3 },
  { scene: 'buzz', n: 4 },
  { scene: 'score', n: 5 }
] as const

const createSteps = [
  { scene: 'new', n: 1 },
  { scene: 'board', n: 2 },
  { scene: 'fill', n: 3 },
  { scene: 'done', n: 4 }
] as const
</script>
