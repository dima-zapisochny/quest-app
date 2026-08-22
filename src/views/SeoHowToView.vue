<template>
  <div class="seo-page">
    <AppHeader
      button-variant="back"
      :button-label="t('common.back')"
      @button-click="goHome"
    />

    <main class="seo-page__main">
      <p class="seo-page__brand">Quiz Quest</p>
      <h1 class="seo-page__title">{{ t('seo.howtoH1') }}</h1>
      <p class="seo-page__lead">{{ t('seo.howtoLead') }}</p>

      <section class="seo-page__section">
        <h2>{{ t('howto.tabPlay') }}</h2>
        <ol class="seo-page__list">
          <li v-for="n in 5" :key="`p-${n}`">
            <strong>{{ t(`howto.play${n}Title`) }}</strong>
            — {{ t(`howto.play${n}Text`) }}
          </li>
        </ol>
      </section>

      <section class="seo-page__section">
        <h2>{{ t('howto.tabCreate') }}</h2>
        <ol class="seo-page__list">
          <li v-for="n in 4" :key="`c-${n}`">
            <strong>{{ t(`howto.create${n}Title`) }}</strong>
            — {{ t(`howto.create${n}Text`) }}
          </li>
        </ol>
      </section>

      <nav class="seo-page__nav" :aria-label="t('seo.relatedNav')">
        <RouterLink to="/quests/movie-night">{{ t('seo.linkMovieNight') }}</RouterLink>
        <RouterLink to="/quests/hit-parade">{{ t('seo.linkHitParade') }}</RouterLink>
        <RouterLink to="/about">{{ t('seo.linkAbout') }}</RouterLink>
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
useSeo('howto')

function goHome() {
  router.push('/')
}
</script>
