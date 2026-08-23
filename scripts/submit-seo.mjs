#!/usr/bin/env node
/**
 * Після деплою: пінгує sitemap (Google, Bing), надсилає URL в IndexNow,
 * друкує чекліст Google Search Console і топ-10 запитів для моніторингу.
 *
 *   npm run seo:submit
 *   SITE_URL=https://quizzes.website npm run seo:submit
 */
import { SITE_URL, initSeoPages } from './seo-pages.mjs'
import { printPriorityQueries } from './seo-priority-queries.mjs'

const site = (process.env.SITE_URL || SITE_URL).replace(/\/$/, '')
const sitemapUrl = `${site}/sitemap.xml`
const indexNowKey = process.env.INDEXNOW_KEY || 'quizquestindexnow2026'

function absoluteUrl(path) {
  return path.endsWith('/') ? `${site}${path}` : `${site}${path}`
}

async function ping(url, label) {
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' })
    const ok = res.ok || res.status === 204
    console.log(`[ping] ${label}: ${ok ? 'OK' : 'skipped'} (${res.status})`)
    return ok
  } catch (err) {
    console.error(`[ping] ${label}: ERROR —`, err.message)
    return false
  }
}

async function submitIndexNow(pages) {
  const urlList = pages.map(p => absoluteUrl(p.path))
  const host = new URL(site).host

  const body = {
    host,
    key: indexNowKey,
    keyLocation: `${site}/${indexNowKey}.txt`,
    urlList
  }

  const endpoints = [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow'
  ]

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(body)
      })
      const ok = res.ok || res.status === 202 || res.status === 204
      console.log(`[indexnow] ${endpoint}: ${ok ? 'OK' : 'FAIL'} (${res.status})`)
    } catch (err) {
      console.error(`[indexnow] ${endpoint}: ERROR —`, err.message)
    }
  }
}

function printGscChecklist() {
  console.log('\n=== Google Search Console — покроково ===\n')
  console.log('1. Відкрийте https://search.google.com/search-console')
  console.log(`2. Додайте ресурс «URL prefix»: ${site}/`)
  console.log('3. Підтвердіть власність одним із способів:')
  console.log(`   • HTML-файл (вже на сайті): ${site}/google440af4eaf84d23ae.html`)
  console.log('   • АБО meta-тег: задайте VITE_GOOGLE_SITE_VERIFICATION у .env і перебілдіть')
  console.log('4. Sitemap → «Додати нову карту сайту» → вставте:')
  console.log(`   ${sitemapUrl}`)
  console.log('5. Перевірка URL → запросіть індексування для /uk/, /en/, /ru/, … (див. sitemap.xml)')
  console.log('   Приклад: /uk/how-to-play, /en/about, /de/quests/movie-night')
  console.log('6. Через 3–7 днів: Ефективність → перевірте запити зі списку нижче')
  console.log('7. Індекс → «Сторінки» — скільки URL проіндексовано')
  console.log('\nДодатково (Bing): https://www.bing.com/webmasters → додати сайт + sitemap\n')
}

async function main() {
  const pages = await initSeoPages()
  console.log('[seo:submit] site =', site)
  console.log('[seo:submit] sitemap =', sitemapUrl)
  console.log('[seo:submit] urls =', pages.length)
  console.log('[seo:submit] Google/Bing sitemap ping deprecated — use GSC / Bing Webmaster (see checklist)\n')

  await ping(
    `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    'Google sitemap ping (legacy)'
  )
  await ping(
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`,
    'Bing sitemap ping (legacy)'
  )

  // Перевірка ключа IndexNow на live-сайті
  try {
    const keyRes = await fetch(`${site}/${indexNowKey}.txt`)
    if (keyRes.ok) {
      const text = (await keyRes.text()).trim()
      if (text === indexNowKey) {
        console.log('[indexnow] key file on site: OK')
        await submitIndexNow(pages)
      } else {
        console.warn('[indexnow] key file mismatch — deploy public/*.txt first, then re-run')
      }
    } else {
      console.warn(`[indexnow] key file missing (${keyRes.status}) — deploy first, then re-run`)
    }
  } catch (err) {
    console.warn('[indexnow] could not verify key file:', err.message)
  }

  printGscChecklist()
  printPriorityQueries(site)
}

main()
