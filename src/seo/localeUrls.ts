import type { AppLocale } from '@/i18n'
import type { SeoPageId } from '@/seo/copy'

/** Локалі з окремими SEO-URL (відповідають SUPPORTED_LOCALES). */
export const SEO_LOCALES = ['uk', 'en', 'ru', 'de', 'fr', 'es'] as const
export type SeoLocale = (typeof SEO_LOCALES)[number]

export const DEFAULT_SEO_LOCALE: SeoLocale = 'uk'

const LOCALE_SET = new Set<string>(SEO_LOCALES)

export function isSeoLocale(value: string | null | undefined): value is SeoLocale {
  return !!value && LOCALE_SET.has(value)
}

/** Шлях сторінки без префікса локалі (home → порожній рядок). */
export const SEO_SLUGS: Record<SeoPageId, string> = {
  home: '',
  howto: 'how-to-play',
  'movie-night': 'quests/movie-night',
  'hit-parade': 'quests/hit-parade',
  about: 'about'
}

/** Легасі-шляхи (301 → /uk/…). */
export const LEGACY_SEO_PATHS: Record<SeoPageId, string> = {
  home: '/',
  howto: '/how-to-play',
  'movie-night': '/quests/movie-night',
  'hit-parade': '/quests/hit-parade',
  about: '/about'
}

export const SEO_ROUTE_NAMES: Record<SeoPageId, string> = {
  home: 'landing-locale',
  howto: 'seo-howto',
  'movie-night': 'seo-movie-night',
  'hit-parade': 'seo-hit-parade',
  about: 'seo-about'
}

const ROUTE_TO_PAGE = Object.fromEntries(
  Object.entries(SEO_ROUTE_NAMES).map(([pageId, name]) => [name, pageId])
) as Record<string, SeoPageId>

export function seoPageIdFromRouteName(name: string | symbol | null | undefined): SeoPageId | null {
  if (typeof name !== 'string') return null
  return ROUTE_TO_PAGE[name] ?? null
}

export function isSeoRouteName(name: string | symbol | null | undefined): boolean {
  return seoPageIdFromRouteName(name) !== null
}

/** Локаль з префікса URL, напр. `/en/about` → `en`. */
export function localeFromPath(pathname: string): SeoLocale | null {
  const match = pathname.match(/^\/(uk|en|ru|de|fr|es)(?:\/|$)/)
  return match && isSeoLocale(match[1]) ? match[1] : null
}

/** Внутрішній шлях SPA з префіксом локалі. */
export function seoPath(locale: SeoLocale | AppLocale, pageId: SeoPageId): string {
  const slug = SEO_SLUGS[pageId]
  if (!slug) return `/${locale}/`
  return `/${locale}/${slug}`
}

/** Абсолютний canonical/hreflang URL. */
export function seoUrl(site: string, locale: SeoLocale | AppLocale, pageId: SeoPageId): string {
  const path = seoPath(locale, pageId)
  return path.endsWith('/') ? `${site}${path}` : `${site}${path}`
}

/** Відносний шлях dist для prerender (uk/index.html, uk/about/index.html, …). */
export function seoDistFile(locale: SeoLocale, pageId: SeoPageId): string {
  const slug = SEO_SLUGS[pageId]
  if (!slug) return `${locale}/index.html`
  return `${locale}/${slug}/index.html`
}

export { SEO_COPY, SEO_PAGE_IDS } from '@/seo/copy'
export { formatSeoTitle } from '@/seo/formatTitle'
