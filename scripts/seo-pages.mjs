/**
 * Список публічних SEO-сторінок для prerender / IndexNow / sitemap.
 * Генерується з SEO_COPY × SEO_LOCALES.
 */
import { loadSeoBundle } from './load-seo-copy.mjs'

export const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || 'https://quizzes.website').replace(/\/$/, '')

export const HREFLANGS = [
  { locale: 'uk', hreflang: 'uk' },
  { locale: 'uk', hreflang: 'uk-UA' },
  { locale: 'ru', hreflang: 'ru' },
  { locale: 'ru', hreflang: 'ru-RU' },
  { locale: 'en', hreflang: 'en' },
  { locale: 'en', hreflang: 'en-US' },
  { locale: 'en', hreflang: 'en-GB' },
  { locale: 'de', hreflang: 'de' },
  { locale: 'de', hreflang: 'de-DE' },
  { locale: 'fr', hreflang: 'fr' },
  { locale: 'fr', hreflang: 'fr-FR' },
  { locale: 'es', hreflang: 'es' },
  { locale: 'es', hreflang: 'es-ES' },
  { locale: 'es', hreflang: 'es-MX' }
]

let _pagesPromise

/** @returns {Promise<Array<{ id: string, locale: string, path: string, file: string, title: string, ogTitle?: string, description: string, h1: string }>>} */
export async function getPublicSeoPages() {
  if (!_pagesPromise) {
    _pagesPromise = buildPages()
  }
  return _pagesPromise
}

/** Синхронний список після await initSeoPages(). */
export let PUBLIC_SEO_PAGES = []

export async function initSeoPages() {
  PUBLIC_SEO_PAGES = await getPublicSeoPages()
  return PUBLIC_SEO_PAGES
}

async function buildPages() {
  const { SEO_COPY, SEO_PAGE_IDS, SEO_LOCALES, seoPath, seoDistFile, formatSeoTitle } = await loadSeoBundle()
  const pages = []

  for (const locale of SEO_LOCALES) {
    for (const id of SEO_PAGE_IDS) {
      const copy = SEO_COPY[id][locale]
      const path = seoPath(locale, id)
      pages.push({
        id,
        locale,
        path,
        file: seoDistFile(locale, id),
        title: formatSeoTitle(copy.title),
        ogTitle: copy.ogTitle ? formatSeoTitle(copy.ogTitle) : undefined,
        description: copy.description,
        keywords: copy.keywords,
        h1: copy.h1 ?? copy.title.split('|')[0].trim()
      })
    }
  }

  return pages
}

/** @type {'uk'} */
export const DEFAULT_SEO_LOCALE = 'uk'

/** Легасі-редirectи (uk) для vercel / GSC. */
export const LEGACY_REDIRECTS = [
  { from: '/', to: '/uk/' },
  { from: '/how-to-play', to: '/uk/how-to-play' },
  { from: '/quests/movie-night', to: '/uk/quests/movie-night' },
  { from: '/quests/hit-parade', to: '/uk/quests/hit-parade' },
  { from: '/about', to: '/uk/about' }
]
