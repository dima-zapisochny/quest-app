import type { AppLocale } from '@/i18n'

/** Публічний origin сайту (для canonical / OG / sitemap). */
export function getSiteUrl(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://quizzes.website'
}

export type { SeoPageId, SeoPageCopy } from '@/seo/copy'
export { SEO_COPY, SEO_PAGE_IDS } from '@/seo/copy'
export {
  SEO_LOCALES,
  DEFAULT_SEO_LOCALE,
  SEO_SLUGS,
  LEGACY_SEO_PATHS,
  seoPath,
  seoUrl,
  localeFromPath,
  isSeoLocale,
  type SeoLocale
} from '@/seo/localeUrls'
export { formatSeoTitle } from '@/seo/formatTitle'

/** @deprecated Використовуйте seoPath(locale, pageId). Залишено для легасі-редirectів. */
export const SEO_PATHS = {
  home: '/',
  howto: '/how-to-play',
  'movie-night': '/quests/movie-night',
  'hit-parade': '/quests/hit-parade',
  about: '/about'
} as const

export const HREFLANG_LOCALES: { locale: AppLocale; hreflang: string }[] = [
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
