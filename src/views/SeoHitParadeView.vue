<template>
  <div class="seo-page">
    <AppHeader
      button-variant="back"
      :button-label="t('common.back')"
      @button-click="goHome"
    />

    <main class="seo-page__main">
      <p class="seo-page__brand">Quiz Quest · 🎵</p>
      <h1 class="seo-page__title">{{ t('seo.musicH1') }}</h1>
      <p class="seo-page__lead">{{ t('seo.musicLead') }}</p>

      <ul class="seo-page__bullets">
        <li>{{ t('seo.musicBullet1') }}</li>
        <li>{{ t('seo.musicBullet2') }}</li>
        <li>{{ t('seo.musicBullet3') }}</li>
      </ul>

      <p class="seo-page__cta-wrap">
        <RouterLink class="seo-page__cta" to="/">{{ t('seo.linkPlay') }}</RouterLink>
      </p>

      <nav class="seo-page__nav" :aria-label="t('seo.relatedNav')">
        <RouterLink to="/how-to-play">{{ t('seo.linkHowTo') }}</RouterLink>
        <RouterLink to="/quests/movie-night">{{ t('seo.linkMovieNight') }}</RouterLink>
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
useSeo('hit-parade')

function goHome() {
  router.push('/')
}
</script>
