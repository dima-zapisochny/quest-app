#!/usr/bin/env node
/**
 * Після vite build:
 * 1) інжектить page-specific meta в dist/.../index.html для публічних SEO-URL (×6 локалей)
 * 2) оновлює dist/sitemap.xml з hreflang alternates
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SITE_URL, HREFLANGS, initSeoPages, DEFAULT_SEO_LOCALE } from './seo-pages.mjs'
import { loadSeoBundle } from './load-seo-copy.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const templatePath = join(dist, 'index.html')

if (!existsSync(templatePath)) {
  console.error('[prerender-seo] dist/index.html not found — run vite build first')
  process.exit(1)
}

const { seoPath, seoUrl } = await loadSeoBundle()
const PUBLIC_SEO_PAGES = await initSeoPages()

const template = readFileSync(templatePath, 'utf8')
const today = new Date().toISOString().slice(0, 10)
const ogImage = `${SITE_URL}/og-cover.png`

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function absoluteUrl(path) {
  return path.endsWith('/') ? `${SITE_URL}${path}` : `${SITE_URL}${path}`
}

function hreflangLinks(page) {
  const lines = HREFLANGS.map(({ locale, hreflang }) => {
    const href = absoluteUrl(seoPath(locale, page.id))
    return `    <link rel="alternate" hreflang="${hreflang}" href="${href}" />`
  })
  lines.push(
    `    <link rel="alternate" hreflang="x-default" href="${absoluteUrl(seoPath(DEFAULT_SEO_LOCALE, page.id))}" />`
  )
  return lines.join('\n')
}

function loadAboutFaq(locale) {
  try {
    const raw = readFileSync(join(root, 'src/locales', `${locale}.json`), 'utf8')
    const about = JSON.parse(raw).about ?? {}
    return [1, 2, 3, 4, 5]
      .map(n => ({
        '@type': 'Question',
        name: about[`faq${n}Q`] ?? '',
        acceptedAnswer: {
          '@type': 'Answer',
          text: about[`faq${n}A`] ?? ''
        }
      }))
      .filter(q => q.name && q.acceptedAnswer.text)
  } catch {
    return []
  }
}

function loadHowToFaq(locale) {
  try {
    const raw = readFileSync(join(root, 'src/locales', `${locale}.json`), 'utf8')
    const seo = JSON.parse(raw).seo ?? {}
    return [1, 2, 3]
      .map(n => ({
        '@type': 'Question',
        name: seo[`howtoFaq${n}Q`] ?? '',
        acceptedAnswer: {
          '@type': 'Answer',
          text: seo[`howtoFaq${n}A`] ?? ''
        }
      }))
      .filter(q => q.name && q.acceptedAnswer.text)
  } catch {
    return []
  }
}

function loadHowToSteps(locale) {
  try {
    const raw = readFileSync(join(root, 'src/locales', `${locale}.json`), 'utf8')
    const howto = JSON.parse(raw).howto ?? {}
    const play = [1, 2, 3, 4, 5].map(n => ({
      '@type': 'HowToStep',
      position: n,
      name: howto[`play${n}Title`] ?? '',
      text: howto[`play${n}Text`] ?? ''
    }))
    const create = [1, 2, 3, 4].map(n => ({
      '@type': 'HowToStep',
      position: n + 5,
      name: howto[`create${n}Title`] ?? '',
      text: howto[`create${n}Text`] ?? ''
    }))
    return [...play, ...create].filter(s => s.name && s.text)
  } catch {
    return []
  }
}

function buildJsonLdBlocks(page) {
  const organization = {
    '@type': 'Organization',
    name: 'Quiz Quest',
    url: SITE_URL,
    logo: ogImage
  }

  const blocks = [
    {
      id: 'seo-jsonld-app',
      data: {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Quiz Quest',
        url: seoUrl(SITE_URL, page.locale, 'home'),
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        description: page.description,
        inLanguage: page.locale,
        image: ogImage,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: organization
      }
    }
  ]

  if (page.id !== 'home') {
    blocks.push({
      id: 'seo-jsonld-breadcrumb',
      data: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Quiz Quest',
            item: seoUrl(SITE_URL, page.locale, 'home')
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: page.ogTitle ?? page.title,
            item: absoluteUrl(page.path)
          }
        ]
      }
    })
  }

  if (page.id === 'about') {
    const faq = loadAboutFaq(page.locale)
    if (faq.length) {
      blocks.push({
        id: 'seo-jsonld-faq',
        data: {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq
        }
      })
    }
  }

  if (page.id === 'howto') {
    const steps = loadHowToSteps(page.locale)
    if (steps.length) {
      blocks.push({
        id: 'seo-jsonld-howto',
        data: {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: page.h1 ?? page.title,
          description: page.description,
          inLanguage: page.locale,
          step: steps
        }
      })
    }
    const faq = loadHowToFaq(page.locale)
    if (faq.length) {
      blocks.push({
        id: 'seo-jsonld-faq',
        data: {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faq
        }
      })
    }
  }

  return blocks
    .map(
      b =>
        `    <script type="application/ld+json" id="${b.id}">${JSON.stringify(b.data)}</script>`
    )
    .join('\n')
}

function injectPage(html, page) {
  const url = absoluteUrl(page.path)
  let out = html

  out = out.replace(/<html\s+lang="[^"]*"/, `<html lang="${page.locale}"`)
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)

  const replaceMeta = (attr, key, content) => {
    const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`, 'i')
    const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`
    if (re.test(out)) out = out.replace(re, tag)
    else out = out.replace('</head>', `    ${tag}\n  </head>`)
  }

  replaceMeta('name', 'description', page.description)
  replaceMeta('name', 'keywords', page.keywords)
  const ogTitle = page.ogTitle ?? page.title
  replaceMeta('property', 'og:title', ogTitle)
  replaceMeta('property', 'og:description', page.description)
  replaceMeta('property', 'og:url', url)
  replaceMeta('property', 'og:image', ogImage)
  replaceMeta('name', 'twitter:title', ogTitle)
  replaceMeta('name', 'twitter:description', page.description)
  replaceMeta('name', 'twitter:image', ogImage)
  replaceMeta('property', 'og:image:width', '1200')
  replaceMeta('property', 'og:image:height', '630')
  replaceMeta('property', 'og:image:type', 'image/png')
  replaceMeta(
    'property',
    'og:locale',
    page.locale === 'uk' ? 'uk_UA' : page.locale === 'en' ? 'en_US' : `${page.locale}_${page.locale.toUpperCase()}`
  )

  if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i.test(out)) {
    out = out.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${url}" />`
    )
  } else {
    out = out.replace('</head>', `    <link rel="canonical" href="${url}" />\n  </head>`)
  }

  out = out.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>/gi, '')
  out = out.replace('</head>', `${hreflangLinks(page)}\n  </head>`)

  const noscriptBlock = `    <noscript>
      <h1>${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.description)}</p>
      <ul>
        <li><a href="${escapeHtml(seoPath(page.locale, 'home'))}">Quiz Quest</a></li>
        <li><a href="${escapeHtml(seoPath(page.locale, 'howto'))}">${page.locale === 'uk' ? 'Як грати?' : 'How to play'}</a></li>
        <li><a href="${escapeHtml(seoPath(page.locale, 'movie-night'))}">Movie Night</a></li>
        <li><a href="${escapeHtml(seoPath(page.locale, 'hit-parade'))}">Hit Parade</a></li>
        <li><a href="${escapeHtml(seoPath(page.locale, 'about'))}">${page.locale === 'uk' ? 'Про нас' : 'About'}</a></li>
      </ul>
    </noscript>`

  const jsonLdBlock = buildJsonLdBlocks(page)

  out = out.replace(/\s*<script\s+type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/gi, '')
  out = out.replace('</head>', `${jsonLdBlock}\n  </head>`)

  const gsc = process.env.VITE_GOOGLE_SITE_VERIFICATION
  if (gsc) {
    replaceMeta('name', 'google-site-verification', gsc)
  }

  if (/<noscript>[\s\S]*?<\/noscript>/i.test(out)) {
    out = out.replace(/<noscript>[\s\S]*?<\/noscript>/i, noscriptBlock)
  } else {
    out = out.replace('<div id="app"></div>', `<div id="app"></div>\n${noscriptBlock}`)
  }

  return out
}

for (const page of PUBLIC_SEO_PAGES) {
  const html = injectPage(template, page)
  const outPath = join(dist, page.file)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, html, 'utf8')
  console.log('[prerender-seo]', page.path, '→', page.file)
}

function sitemapAlternates(page) {
  return HREFLANGS.map(({ locale, hreflang }) => {
    const href = absoluteUrl(seoPath(locale, page.id))
    return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`
  })
    .concat(
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${absoluteUrl(seoPath(DEFAULT_SEO_LOCALE, page.id))}" />`
    )
    .join('\n')
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PUBLIC_SEO_PAGES.map((p, i) => `  <url>
    <loc>${absoluteUrl(p.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.id === 'home' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p.id === 'home' ? '1.0' : (0.9 - Math.min(i % 5, 4) * 0.05).toFixed(2)}</priority>
${sitemapAlternates(p)}
  </url>`).join('\n')}
</urlset>
`

writeFileSync(join(dist, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(join(root, 'public', 'sitemap.xml'), sitemap, 'utf8')
console.log('[prerender-seo] sitemap.xml updated (dist + public), urls=', PUBLIC_SEO_PAGES.length)
console.log('[prerender-seo] done, site=', SITE_URL)
