import { supabase, isSupabaseConfigured } from '@/config/supabase'
import { i18n } from '@/i18n'

const SESSION_KEY = 'quest-app:analytics-sid'
const LAST_VIEW_KEY = 'quest-app:analytics-last-view'
const GEO_KEY = 'quest-app:analytics-geo'

export type AnalyticsDailyPoint = {
  day: string
  views: number
  clicks: number
  sessions: number
}

export type AnalyticsCountryRow = {
  country_code: string
  views: number
}

export type AnalyticsRegionRow = {
  country_code: string
  region: string
  views: number
}

export type SiteAnalyticsSummary = {
  total_views: number
  total_clicks: number
  views_7d: number
  clicks_7d: number
  unique_sessions_7d: number
  daily: AnalyticsDailyPoint[]
  top_paths: { path: string; views: number }[]
  top_clicks: { name: string; clicks: number }[]
  top_countries: AnalyticsCountryRow[]
  top_regions: AnalyticsRegionRow[]
}

type GeoInfo = {
  country_code: string
  region: string | null
}

let geoPromise: Promise<GeoInfo | null> | null = null

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID?.() ?? `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id.slice(0, 64)
  } catch {
    return `s-${Date.now()}`
  }
}

function normalizePath(path: string): string {
  const clean = (path || '/').split('?')[0].split('#')[0] || '/'
  return clean.length > 300 ? clean.slice(0, 300) : clean
}

/** Приватна аналітика — не пишемо ні перегляди, ні кліки. */
function isExcludedAnalyticsPath(path: string): boolean {
  const p = normalizePath(path).toLowerCase()
  return p === '/admin/stats' || p.startsWith('/admin/stats/')
}

function shouldSkipTracking(path?: string): boolean {
  if (typeof navigator !== 'undefined' && (navigator as Navigator & { webdriver?: boolean }).webdriver) {
    return true
  }
  if (path && isExcludedAnalyticsPath(path)) return true
  if (typeof window !== 'undefined' && isExcludedAnalyticsPath(window.location.pathname)) {
    return true
  }
  return false
}

/** Країна/регіон за IP (geojs), кеш на сесію. IP не зберігаємо. */
function resolveGeo(): Promise<GeoInfo | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (geoPromise) return geoPromise

  geoPromise = (async () => {
    try {
      const cached = sessionStorage.getItem(GEO_KEY)
      if (cached) {
        const parsed = JSON.parse(cached) as GeoInfo
        if (parsed?.country_code) return parsed
      }
    } catch {
      /* ignore */
    }

    try {
      const ctrl = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
        ? AbortSignal.timeout(2800)
        : undefined
      const res = await fetch('https://get.geojs.io/v1/ip/geo.json', {
        signal: ctrl,
        credentials: 'omit'
      })
      if (!res.ok) return null
      const raw = (await res.json()) as {
        country_code?: string
        region?: string
        city?: string
      }
      const code = String(raw.country_code || '')
        .trim()
        .toUpperCase()
        .slice(0, 8)
      if (code.length < 2) return null
      const region = String(raw.region || raw.city || '')
        .trim()
        .slice(0, 120)
      const info: GeoInfo = {
        country_code: code,
        region: region || null
      }
      try {
        sessionStorage.setItem(GEO_KEY, JSON.stringify(info))
      } catch {
        /* ignore */
      }
      return info
    } catch {
      return null
    }
  })()

  return geoPromise
}

async function insertEvent(
  eventType: 'page_view' | 'click',
  path: string,
  name?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  if (!isSupabaseConfigured) return
  const normalized = normalizePath(path)
  if (shouldSkipTracking(normalized)) return

  try {
    const locale =
      typeof i18n.global.locale === 'object'
        ? String(i18n.global.locale.value)
        : String(i18n.global.locale)

    const geo = await resolveGeo()

    await supabase.from('site_analytics_events').insert({
      event_type: eventType,
      path: normalized,
      name: name ? name.slice(0, 120) : null,
      locale: locale.slice(0, 16),
      referrer: typeof document !== 'undefined' ? (document.referrer || '').slice(0, 300) || null : null,
      session_id: getSessionId(),
      country_code: geo?.country_code ?? null,
      region: geo?.region ?? null,
      meta: meta ?? {}
    })
  } catch {
    // телеметрія не повинна ламати UX
  }
}

/** Перегляд сторінки (дедуп однакового path протягом 2 с). */
export function trackPageView(path: string): void {
  const normalized = normalizePath(path)
  if (shouldSkipTracking(normalized)) return

  try {
    const stamp = `${normalized}|${Date.now()}`
    const prev = sessionStorage.getItem(LAST_VIEW_KEY)
    if (prev) {
      const [prevPath, prevTs] = prev.split('|')
      if (prevPath === normalized && Date.now() - Number(prevTs) < 2000) return
    }
    sessionStorage.setItem(LAST_VIEW_KEY, stamp)
  } catch {
    /* ignore */
  }

  void insertEvent('page_view', normalized)
}

/** Клік по CTA / посиланню. */
export function trackClick(name: string, path?: string, meta?: Record<string, unknown>): void {
  if (shouldSkipTracking()) return
  const href = typeof meta?.href === 'string' ? meta.href : ''
  if (href && isExcludedAnalyticsPath(href)) return

  const current =
    path ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  if (shouldSkipTracking(current)) return
  void insertEvent('click', current, name || 'click', meta)
}

export async function fetchSiteAnalytics(token: string): Promise<SiteAnalyticsSummary> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured')
  }
  const { data, error } = await supabase.rpc('get_site_analytics', { p_token: token })
  if (error) throw error
  const raw = (data ?? {}) as Partial<SiteAnalyticsSummary>
  return {
    total_views: Number(raw.total_views ?? 0),
    total_clicks: Number(raw.total_clicks ?? 0),
    views_7d: Number(raw.views_7d ?? 0),
    clicks_7d: Number(raw.clicks_7d ?? 0),
    unique_sessions_7d: Number(raw.unique_sessions_7d ?? 0),
    daily: Array.isArray(raw.daily) ? raw.daily : [],
    top_paths: Array.isArray(raw.top_paths) ? raw.top_paths : [],
    top_clicks: Array.isArray(raw.top_clicks) ? raw.top_clicks : [],
    top_countries: Array.isArray(raw.top_countries) ? raw.top_countries : [],
    top_regions: Array.isArray(raw.top_regions) ? raw.top_regions : []
  }
}

/** Глобальний делегований трекінг кліків по data-track / важливих CTA. */
export function installClickTracking(): () => void {
  if (typeof document === 'undefined') return () => {}

  const onClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    if (!target) return
    if (shouldSkipTracking()) return
    const el = target.closest<HTMLElement>('a, button, [data-track], [role="button"]')
    if (!el) return
    if (el.closest('[data-analytics-ignore]')) return

    const explicit = el.getAttribute('data-track')
    if (explicit) {
      trackClick(explicit)
      return
    }

    // Лише явні data-track на інтерактивних елементах SEO/landing, щоб не шуміти
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || ''
      if (isExcludedAnalyticsPath(href)) return
      if (
        href === '/' ||
        href.startsWith('/how-to-play') ||
        href.startsWith('/about') ||
        href.startsWith('/quests/')
      ) {
        trackClick(`nav:${href}`, undefined, { href })
      }
    }
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
