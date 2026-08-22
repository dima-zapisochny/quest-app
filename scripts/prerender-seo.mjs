#!/usr/bin/env node
/**
 * Після vite build:
 * 1) інжектить page-specific meta в dist/.../index.html для публічних SEO-URL
 * 2) оновлює dist/sitemap.xml з lastmod
 *
 * Боти й соцмережі бачать title/description/OG без виконання JS.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PUBLIC_SEO_PAGES, SITE_URL, HREFLANGS } from './seo-pages.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dist = join(root, 'dist')
const templatePath = join(dist, 'index.html')

if (!existsSync(templatePath)) {
  console.error('[prerender-seo] dist/index.html not found — run vite build first')
  process.exit(1)
}

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
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`
}

function hreflangLinks(url) {
  return HREFLANGS.map(
    h => `    <link rel="alternate" hreflang="${h}" href="${url}" />`
  ).join('\n')
}

function injectPage(html, page) {
  const url = absoluteUrl(page.path)
  let out = html

  out = out.replace(/<html\s+lang="[^"]*"/, '<html lang="uk"')
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`)

  const replaceMeta = (attr, key, content) => {
    const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`, 'i')
    const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`
    if (re.test(out)) out = out.replace(re, tag)
    else out = out.replace('</head>', `    ${tag}\n  </head>`)
  }

  replaceMeta('name', 'description', page.description)
  replaceMeta('property', 'og:title', page.title)
  replaceMeta('property', 'og:description', page.description)
  replaceMeta('property', 'og:url', url)
  replaceMeta('property', 'og:image', ogImage)
  replaceMeta('name', 'twitter:title', page.title)
  replaceMeta('name', 'twitter:description', page.description)
  replaceMeta('name', 'twitter:image', ogImage)
  replaceMeta('property', 'og:image:width', '1200')
  replaceMeta('property', 'og:image:height', '630')
  replaceMeta('property', 'og:image:type', 'image/png')

  // canonical
  if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i.test(out)) {
    out = out.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${url}" />`
    )
  } else {
    out = out.replace('</head>', `    <link rel="canonical" href="${url}" />\n  </head>`)
  }

  // wipe existing hreflang then inject
  out = out.replace(/\s*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*\/?>/gi, '')
  out = out.replace('</head>', `${hreflangLinks(url)}\n  </head>`)

  // noscript H1 hint for crawlers
  const noscriptBlock = `    <noscript>
      <h1>${escapeHtml(page.h1)}</h1>
      <p>${escapeHtml(page.description)}</p>
      <ul>
        <li><a href="/">Quiz Quest — створити гру</a></li>
        <li><a href="/how-to-play">Як грати?</a></li>
        <li><a href="/quests/movie-night">Movie Night</a></li>
        <li><a href="/quests/hit-parade">Hit Parade</a></li>
        <li><a href="/about">Про нас</a></li>
      </ul>
    </noscript>`

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

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_SEO_PAGES.map(
  (p, i) => `  <url>
    <loc>${absoluteUrl(p.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.id === 'home' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${p.id === 'home' ? '1.0' : (0.9 - Math.min(i, 4) * 0.05).toFixed(2)}</priority>
  </url>`
).join('\n')}
</urlset>
`

writeFileSync(join(dist, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(join(root, 'public', 'sitemap.xml'), sitemap, 'utf8')
console.log('[prerender-seo] sitemap.xml updated (dist + public)')
console.log('[prerender-seo] done, site=', SITE_URL)
