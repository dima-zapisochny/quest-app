import { watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { AppLocale } from '@/i18n'
import {
  SEO_COPY,
  HREFLANG_LOCALES,
  getSiteUrl,
  seoUrl,
  DEFAULT_SEO_LOCALE,
  isSeoLocale,
  formatSeoTitle,
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
  const route = useRoute()

  function pageLocale(): AppLocale {
    const param = route.params.locale as string | undefined
    if (isSeoLocale(param)) return param
    return locale.value as AppLocale
  }

  function apply() {
    const loc = pageLocale()
    const copy = SEO_COPY[pageId][loc] ?? SEO_COPY[pageId].en
    const site = getSiteUrl()
    const url = seoUrl(site, loc, pageId)
    const ogImage = `${site}/og-cover.png`

    document.title = formatSeoTitle(copy.title)
    document.documentElement.lang = loc

    upsertMeta('name', 'description', copy.description)
    upsertMeta('name', 'keywords', copy.keywords)
    upsertMeta('name', 'robots', 'index,follow,max-image-preview:large')
    upsertMeta('name', 'author', 'Quiz Quest')
    upsertMeta('name', 'theme-color', '#0b1220')

    const gsc = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION as string | undefined
    if (gsc) upsertMeta('name', 'google-site-verification', gsc)

    const socialTitle = formatSeoTitle(copy.ogTitle ?? copy.title)

    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:site_name', 'Quiz Quest')
    upsertMeta('property', 'og:title', socialTitle)
    upsertMeta('property', 'og:description', copy.ogDescription ?? copy.description)
    upsertMeta('property', 'og:url', url)
    upsertMeta(
      'property',
      'og:locale',
      loc === 'uk' ? 'uk_UA' : loc === 'en' ? 'en_US' : `${loc}_${loc.toUpperCase()}`
    )
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('property', 'og:image:width', '1200')
    upsertMeta('property', 'og:image:height', '630')
    upsertMeta('property', 'og:image:type', 'image/png')

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', socialTitle)
    upsertMeta('name', 'twitter:description', copy.ogDescription ?? copy.description)
    upsertMeta('name', 'twitter:image', ogImage)

    upsertLink('canonical', url)

    clearHreflang()
    for (const { locale: hrefLocale, hreflang } of HREFLANG_LOCALES) {
      upsertLink('alternate', seoUrl(site, hrefLocale, pageId), hreflang)
    }
    upsertLink('alternate', seoUrl(site, DEFAULT_SEO_LOCALE, pageId), 'x-default')

    const organization = {
      '@type': 'Organization',
      name: 'Quiz Quest',
      url: site,
      logo: ogImage
    }

    const webApp = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Quiz Quest',
      url: site,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Web',
      description: copy.description,
      inLanguage: loc,
      image: ogImage,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: organization
    }
    upsertJsonLd('seo-jsonld-app', webApp)

    if (pageId === 'home') {
      upsertJsonLd('seo-jsonld-org', {
        '@context': 'https://schema.org',
        ...organization
      })
      upsertJsonLd('seo-jsonld-sitelinks', {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: SEO_COPY.howto[loc].title,
            url: seoUrl(site, loc, 'howto')
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: SEO_COPY['movie-night'][loc].title,
            url: seoUrl(site, loc, 'movie-night')
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: SEO_COPY['hit-parade'][loc].title,
            url: seoUrl(site, loc, 'hit-parade')
          },
          {
            '@type': 'ListItem',
            position: 4,
            name: SEO_COPY.about[loc].title,
            url: seoUrl(site, loc, 'about')
          }
        ]
      })
      document.getElementById('seo-jsonld-breadcrumb')?.remove()
    } else {
      document.getElementById('seo-jsonld-org')?.remove()
      document.getElementById('seo-jsonld-sitelinks')?.remove()
      upsertJsonLd('seo-jsonld-breadcrumb', {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Quiz Quest',
            item: seoUrl(site, loc, 'home')
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: copy.ogTitle ?? copy.title,
            item: url
          }
        ]
      })
    }

    if (pageId === 'howto') {
      const playSteps = [1, 2, 3, 4, 5].map(n => ({
        '@type': 'HowToStep',
        position: n,
        name: t(`howto.play${n}Title`),
        text: t(`howto.play${n}Text`)
      }))
      const createSteps = [1, 2, 3, 4].map(n => ({
        '@type': 'HowToStep',
        position: n + 5,
        name: t(`howto.create${n}Title`),
        text: t(`howto.create${n}Text`)
      }))
      upsertJsonLd('seo-jsonld-howto', {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: copy.h1 ?? t('seo.howtoH1'),
        description: copy.description,
        inLanguage: loc,
        step: [...playSteps, ...createSteps]
      })
    } else {
      document.getElementById('seo-jsonld-howto')?.remove()
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
    } else if (pageId === 'howto') {
      upsertJsonLd('seo-jsonld-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [1, 2, 3].map(n => ({
          '@type': 'Question',
          name: t(`seo.howtoFaq${n}Q`),
          acceptedAnswer: {
            '@type': 'Answer',
            text: t(`seo.howtoFaq${n}A`)
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
    stop = watch([locale, () => route.params.locale], apply)
  })
  onBeforeUnmount(() => stop())

  return { apply }
}
