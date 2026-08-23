import { supabase, isSupabaseConfigured } from '@/config/supabase'
import { i18n } from '@/i18n'

/** Календарні дні на діаграмі та в RPC — по Києву, не UTC. */
export const SITE_ANALYTICS_TIMEZONE = 'Europe/Kyiv'

const SESSION_KEY = 'quest-app:analytics-sid'
const VISITOR_KEY = 'quest-app:analytics-vid'
const LAST_VIEW_KEY = 'quest-app:analytics-last-view'
const GEO_KEY = 'quest-app:analytics-geo'

export type AnalyticsDailyPoint = {
  day: string
  views: number
  clicks: number
  sessions: number
  visitors: number
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

export type AnalyticsRecentVisitor = {
  visitor_id: string
  display_name: string
  avatar: string | null
  country_code: string | null
  last_seen: string
}

export type SiteAnalyticsSummary = {
  total_views: number
  total_clicks: number
  views_7d: number
  clicks_7d: number
  unique_sessions_7d: number
  unique_visitors_7d: number
  unique_visitors_total: number
  daily: AnalyticsDailyPoint[]
  top_paths: { path: string; views: number }[]
  top_clicks: { name: string; clicks: number }[]
  top_countries: AnalyticsCountryRow[]
  top_regions: AnalyticsRegionRow[]
  recent_visitors: AnalyticsRecentVisitor[]
}

type GeoInfo = {
  country_code: string
  region: string | null
}

let geoPromise: Promise<GeoInfo | null> | null = null

function newId(prefix: string): string {
  return (
    crypto.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  ).slice(0, 64)
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = newId('s')
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id.slice(0, 64)
  } catch {
    return newId('s')
  }
}

/** Стійкий ID браузера/пристрою (localStorage) для унікальних відвідувачів. */
function getVisitorId(): string {
  if (typeof window === 'undefined') return 'ssr'
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = newId('v')
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id.slice(0, 64)
  } catch {
    return getSessionId()
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

const PROFILE_KEY = 'quiz-app-user-profile'

function readVisitorProfile(): { display_name?: string; avatar?: string } {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (!raw) return {}
    const profile = JSON.parse(raw) as { name?: string; avatar?: string | null }
    const display_name = String(profile?.name ?? '').trim().slice(0, 120)
    const avatar = String(profile?.avatar ?? '').trim().slice(0, 32)
    return {
      ...(display_name ? { display_name } : {}),
      ...(avatar ? { avatar } : {})
    }
  } catch {
    return {}
  }
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
    const profileMeta = eventType === 'page_view' ? readVisitorProfile() : {}
    const eventMeta = { ...(meta ?? {}), ...profileMeta }

    await supabase.from('site_analytics_events').insert({
      event_type: eventType,
      path: normalized,
      name: name ? name.slice(0, 120) : null,
      locale: locale.slice(0, 16),
      referrer: typeof document !== 'undefined' ? (document.referrer || '').slice(0, 300) || null : null,
      session_id: getSessionId(),
      visitor_id: getVisitorId(),
      country_code: geo?.country_code ?? null,
      region: geo?.region ?? null,
      meta: eventMeta
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

/** Ключі YYYY-MM-DD для 7 календарних днів (сьогодні + 6 назад) у SITE_ANALYTICS_TIMEZONE. */
export function siteAnalyticsLast7DayKeys(): string[] {
  const tz = SITE_ANALYTICS_TIMEZONE
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now)
  const year = Number(parts.find(p => p.type === 'year')!.value)
  const month = Number(parts.find(p => p.type === 'month')!.value)
  const day = Number(parts.find(p => p.type === 'day')!.value)
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz })
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const noon = new Date(Date.UTC(year, month - 1, day - i, 12, 0, 0))
    days.push(fmt.format(noon))
  }
  return days
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
    unique_visitors_7d: Number(raw.unique_visitors_7d ?? 0),
    unique_visitors_total: Number(raw.unique_visitors_total ?? 0),
    daily: Array.isArray(raw.daily) ? raw.daily : [],
    top_paths: Array.isArray(raw.top_paths) ? raw.top_paths : [],
    top_clicks: Array.isArray(raw.top_clicks) ? raw.top_clicks : [],
    top_countries: Array.isArray(raw.top_countries) ? raw.top_countries : [],
    top_regions: Array.isArray(raw.top_regions) ? raw.top_regions : [],
    recent_visitors: Array.isArray(raw.recent_visitors)
      ? raw.recent_visitors.map(row => ({
          visitor_id: String(row.visitor_id ?? ''),
          display_name: String(row.display_name ?? 'Гість'),
          avatar: row.avatar ? String(row.avatar) : null,
          country_code: row.country_code ? String(row.country_code) : null,
          last_seen: String(row.last_seen ?? '')
        }))
      : []
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
        /^\/(uk|en|ru|de|fr|es)(\/|$)/.test(href) &&
        (/\/how-to-play(\/|$)/.test(href) ||
          /\/about(\/|$)/.test(href) ||
          /\/quests\//.test(href) ||
          /^\/(uk|en|ru|de|fr|es)\/?$/.test(href))
      ) {
        trackClick(`nav:${href}`, undefined, { href })
      }
    }
  }

  document.addEventListener('click', onClick, true)
  return () => document.removeEventListener('click', onClick, true)
}
