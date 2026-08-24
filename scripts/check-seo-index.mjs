#!/usr/bin/env node
/**
 * Швидка перевірка SEO-інфраструктури live-сайту (без доступу до GSC API).
 *
 *   npm run seo:check
 */
import { PUBLIC_SEO_PAGES, SITE_URL } from './seo-pages.mjs'
import { SEO_PRIORITY_QUERIES } from './seo-priority-queries.mjs'

const site = (process.env.SITE_URL || SITE_URL).replace(/\/$/, '')

function absoluteUrl(path) {
  return path === '/' ? `${site}/` : `${site}${path}`
}

async function checkUrl(url, label) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    const ok = res.ok
    const ct = res.headers.get('content-type') || ''
    console.log(`${ok ? '✓' : '✗'} ${label}: HTTP ${res.status}${ct ? ` (${ct.split(';')[0]})` : ''}`)
    return ok
  } catch (err) {
    console.log(`✗ ${label}: ${err.message}`)
    return false
  }
}

async function checkTextFile(url, label, expectedSnippet) {
  try {
    const res = await fetch(url, { redirect: 'follow' })
    const text = await res.text()
    const ct = res.headers.get('content-type') || ''
    const looksHtml = text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')
    const contentOk = !looksHtml && text.includes(expectedSnippet)
    const ok = res.ok && contentOk
    console.log(
      `${ok ? '✓' : '✗'} ${label}: HTTP ${res.status}${looksHtml ? ' (SPA fallback — deploy static file)' : ''}`
    )
    return ok
  } catch (err) {
    console.log(`✗ ${label}: ${err.message}`)
    return false
  }
}

async function checkPageSeo(url, expectedTitlePart) {
  try {
    const res = await fetch(url)
    if (!res.ok) return { ok: false, issues: [`HTTP ${res.status}`] }
    const html = await res.text()
    const issues = []
    if (!html.includes('<title>') || !html.toLowerCase().includes(expectedTitlePart.toLowerCase())) {
      issues.push(`title missing or no «${expectedTitlePart}»`)
    }
    if (!html.includes('name="description"')) issues.push('meta description missing')
    if (!html.includes('rel="canonical"')) issues.push('canonical missing')
    if (!html.includes('application/ld+json') && !html.includes('<noscript>')) {
      issues.push('no JSON-LD and no noscript fallback')
    }
    const ok = issues.length === 0
    console.log(`${ok ? '✓' : '⚠'} SEO ${url}: ${ok ? 'OK' : issues.join('; ')}`)
    return { ok, issues }
  } catch (err) {
    console.log(`✗ SEO ${url}: ${err.message}`)
    return { ok: false, issues: [err.message] }
  }
}

async function main() {
  console.log(`\n=== SEO check: ${site} ===\n`)

  await checkUrl(`${site}/robots.txt`, 'robots.txt')
  await checkUrl(`${site}/sitemap.xml`, 'sitemap.xml')
  await checkTextFile(`${site}/google440af4eaf84d23ae.html`, 'GSC verification file', 'google-site-verification')
  await checkTextFile(`${site}/quizquestindexnow2026.txt`, 'IndexNow key file', 'quizquestindexnow2026')

  console.log('\n--- Public pages ---\n')
  for (const page of PUBLIC_SEO_PAGES) {
    const url = absoluteUrl(page.path)
    await checkUrl(url, page.path)
    await checkPageSeo(url, page.id === 'home' ? 'Quiz Quest' : page.h1.split(' - ')[0].trim())
  }

  console.log('\n--- Індексація (ручна перевірка в браузері) ---\n')
  console.log(`Google: site:${site.replace(/^https:\/\//, '')}`)
  console.log(`Google: "${site.replace(/^https:\/\//, '')}"`)
  console.log('\nЯкщо 0 результатів — сайт ще не в індексі; виконайте npm run seo:submit і кроки GSC.\n')

  console.log('--- Цільові запити для GSC ---\n')
  for (const q of SEO_PRIORITY_QUERIES) {
    console.log(`${q.rank}. [${q.locale}] «${q.query}» → ${q.page}`)
  }
  console.log('')
}

main()
