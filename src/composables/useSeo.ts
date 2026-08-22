import { watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '@/i18n'
import {
  SEO_COPY,
  SEO_PATHS,
  HREFLANG_LOCALES,
  getSiteUrl,
  type SeoPageId
} from '@/seo/meta'

function upsertMeta(
  attr: 'name' | 'property',
  key: string,
  content: string
) {
  if (typeof document === 'undefined') return
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  if (typeof document === 'undefined') return
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`
  let el = document.head.querySelector<HTMLLinkElement>(selector)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    if (hreflang) el.hreflang = hreflang
    document.head.appendChild(el)
  }
  el.href = href
}

function upsertJsonLd(id: string, data: Record<string, unknown>) {
  if (typeof document === 'undefined') return
  let el = document.getElementById(id) as HTMLScriptElement | null
  if (!el) {
    el = document.createElement('script')
    el.type = 'application/ld+json'
    el.id = id
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function clearHreflang() {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(n => n.remove())
}

/** Оновлює title/description/OG/Twitter/hreflang/JSON-LD для SEO-сторінки. */
export function useSeo(pageId: SeoPageId) {
  const { locale, t } = useI18n()

  function apply() {
    const loc = locale.value as AppLocale
    const copy = SEO_COPY[pageId][loc] ?? SEO_COPY[pageId].en
    const site = getSiteUrl()
    const path = SEO_PATHS[pageId]
    const url = `${site}${path === '/' ? '' : path}`

    document.title = copy.title
    document.documentElement.lang = loc

    upsertMeta('name', 'description', copy.description)
    upsertMeta('name', 'keywords', copy.keywords)
    upsertMeta('name', 'robots', 'index,follow,max-image-preview:large')
    upsertMeta('name', 'author', 'Quiz Quest')
    upsertMeta('name', 'theme-color', '#0b1220')

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', 'Quiz Quest')
    upsertMeta('property', 'og:title', copy.ogTitle ?? copy.title)
    upsertMeta('property', 'og:description', copy.ogDescription ?? copy.description)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:locale', loc === 'uk' ? 'uk_UA' : loc === 'en' ? 'en_US' : `${loc}_${loc.toUpperCase()}`)
    upsertMeta('property', 'og:image', `${site}/og-cover.svg`)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', copy.ogTitle ?? copy.title)
    upsertMeta('name', 'twitter:description', copy.ogDescription ?? copy.description)
    upsertMeta('name', 'twitter:image', `${site}/og-cover.svg`)

    upsertLink('canonical', url)

    clearHreflang()
    for (const { hreflang } of HREFLANG_LOCALES) {
      upsertLink('alternate', url, hreflang)
    }
    upsertLink('alternate', url, 'x-default')

    const webApp = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Quiz Quest',
      url: site,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      description: copy.description,
      inLanguage: loc,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    }
    upsertJsonLd('seo-jsonld-app', webApp)

    if (pageId === 'home') {
      upsertJsonLd('seo-jsonld-sitelinks', {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: SEO_COPY.howto[loc].title,
            url: `${site}${SEO_PATHS.howto}`
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: SEO_COPY['movie-night'][loc].title,
            url: `${site}${SEO_PATHS['movie-night']}`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: SEO_COPY['hit-parade'][loc].title,
            url: `${site}${SEO_PATHS['hit-parade']}`
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: SEO_COPY.about[loc].title,
            url: `${site}${SEO_PATHS.about}`
          }
        ]
      })
    } else {
      document.getElementById('seo-jsonld-sitelinks')?.remove()
    }

    if (pageId === 'about') {
      upsertJsonLd('seo-jsonld-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [1, 2, 3, 4, 5].map(n => ({
          '@type': 'Question',
          name: t(`about.faq${n}Q`),
          acceptedAnswer: {
            '@type': 'Answer',
            text: t(`about.faq${n}A`)
          }
        }))
      })
    } else {
      document.getElementById('seo-jsonld-faq')?.remove()
    }
  }

  let stop = () => {}
  onMounted(() => {
    apply()
    stop = watch(locale, apply)
  })
  onBeforeUnmount(() => stop())

  return { apply }
}
