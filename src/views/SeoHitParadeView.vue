<template>
  <div class="seo-page">
    <AppHeader
      button-variant="back"
      :button-label="t('common.back')"
      @button-click="goHome"
    />

    <main class="seo-page__main">
      <p class="seo-page__brand">Quiz Quest · 🎵</p>
      <h1 class="seo-page__title">{{ t('seo.hitH1') }}</h1>
      <p class="seo-page__lead">{{ t('seo.hitLead') }}</p>

      <ul class="seo-page__bullets">
        <li>{{ t('seo.hitBullet1') }}</li>
        <li>{{ t('seo.hitBullet2') }}</li>
        <li>{{ t('seo.hitBullet3') }}</li>
      </ul>

      <p class="seo-page__cta-wrap">
        <RouterLink class="seo-page__cta" :to="home()" data-track="cta:play-hit-parade">{{ t('seo.linkPlay') }}</RouterLink>
      </p>

      <nav class="seo-page__nav" :aria-label="t('seo.relatedNav')">
        <RouterLink :to="link('howto')">{{ t('seo.linkHowTo') }}</RouterLink>
        <RouterLink :to="link('movie-night')">{{ t('seo.linkMovieNight') }}</RouterLink>
        <RouterLink :to="link('about')">{{ t('seo.linkAbout') }}</RouterLink>
      </nav>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import { useSeo } from '@/composables/useSeo'
import { useSeoLinks } from '@/composables/useSeoLinks'

const { t } = useI18n()
const router = useRouter()
const { to: link, home } = useSeoLinks()
useSeo('hit-parade')

function goHome() {
  router.push(home())
}
</script>
