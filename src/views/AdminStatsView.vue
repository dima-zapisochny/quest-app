<template>
  <div class="stats-page" data-analytics-ignore>
    <main class="stats-page__main">
      <header class="stats-page__header">
        <h1 class="stats-page__title">Site analytics</h1>
        <p v-if="!unlocked" class="stats-page__lead">{{ tUk('stats.lead') }}</p>
      </header>

      <form v-if="!unlocked" class="stats-gate" @submit.prevent="unlock">
        <label class="stats-gate__label" for="stats-token">{{ tUk('stats.tokenLabel') }}</label>
        <input
          id="stats-token"
          v-model="tokenInput"
          class="stats-gate__input"
          type="password"
          autocomplete="off"
          spellcheck="false"
          :placeholder="tUk('stats.tokenPlaceholder')"
        />
        <button class="stats-gate__btn" type="submit" :disabled="loading || tokenInput.trim().length < 16">
          {{ loading ? tUk('stats.loading') : tUk('stats.unlock') }}
        </button>
        <p v-if="error" class="stats-gate__error">{{ error }}</p>
      </form>

      <div v-else class="stats-dashboard">
        <div class="stats-toolbar">
          <button type="button" class="stats-toolbar__btn" :disabled="loading" @click="refresh">
            {{ loading ? tUk('stats.loading') : tUk('stats.refresh') }}
          </button>
          <span v-if="lastUpdatedAt" class="stats-toolbar__updated">
            {{ tUk('stats.lastUpdated') }} {{ formatUpdatedAt(lastUpdatedAt) }}
          </span>
          <transition name="save-pill">
            <span
              v-if="refreshState !== 'idle'"
              class="save-icon"
              :class="`save-icon--${refreshState}`"
              :title="refreshState === 'saving' ? tUk('stats.loading') : tUk('stats.refreshed')"
              :aria-label="refreshState === 'saving' ? tUk('stats.loading') : tUk('stats.refreshed')"
              aria-live="polite"
            >
              <span v-if="refreshState === 'saving'" class="save-icon__spinner" aria-hidden="true"></span>
              <svg v-else class="save-icon__check" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M5 12.5l4.5 4.5L19 7"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </transition>
          <p v-if="error" class="stats-gate__error stats-toolbar__error">{{ error }}</p>
        </div>

        <div class="stats-dashboard__layout">
          <div class="stats-dashboard__primary">
        <section class="stats-kpis" aria-label="KPI">
          <article class="stats-kpi">
            <p class="stats-kpi__label">{{ tUk('stats.kpiViews7d') }}</p>
            <p class="stats-kpi__value">{{ formatNum(data?.views_7d) }}</p>
          </article>
          <article class="stats-kpi">
            <p class="stats-kpi__label">{{ tUk('stats.kpiViewsTotal') }}</p>
            <p class="stats-kpi__value">{{ formatNum(data?.total_views) }}</p>
          </article>
          <article class="stats-kpi">
            <p class="stats-kpi__label">{{ tUk('stats.kpiUnique7d') }}</p>
            <p class="stats-kpi__value">{{ formatNum(data?.unique_visitors_7d) }}</p>
          </article>
          <article class="stats-kpi">
            <p class="stats-kpi__label">{{ tUk('stats.kpiUniqueTotal') }}</p>
            <p class="stats-kpi__value">{{ formatNum(data?.unique_visitors_total) }}</p>
          </article>
        </section>

        <section class="stats-panel stats-panel--chart">
          <header class="stats-panel__head">
            <h2>{{ tUk('stats.chartTitle') }}</h2>
          </header>
          <div class="stats-chart" role="img" :aria-label="tUk('stats.chartTitle')">
            <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="stats-chart__svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="statsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="#38bdf8" stop-opacity="0" />
                </linearGradient>
              </defs>
              <line
                v-for="g in gridLines"
                :key="`g-${g}`"
                :x1="padL"
                :x2="chartW - padR"
                :y1="g"
                :y2="g"
                class="stats-chart__grid"
              />
              <polygon v-if="areaPoints" :points="areaPoints" fill="url(#statsAreaGrad)" />
              <polyline
                v-if="linePoints"
                :points="linePoints"
                fill="none"
                stroke="#38bdf8"
                stroke-width="2.5"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              <g v-for="pt in chartPoints" :key="pt.day">
                <text :x="pt.x" :y="chartH - 10" class="stats-chart__label">
                  {{ pt.label }}
                </text>
                <text
                  v-if="pt.views > 0"
                  :x="pt.x"
                  :y="pt.lineY - 8"
                  class="stats-chart__value"
                >
                  {{ pt.views }}
                </text>
                <circle
                  :cx="pt.x"
                  :cy="pt.lineY"
                  r="3.5"
                  fill="#f8fafc"
                  stroke="#38bdf8"
                  stroke-width="2"
                />
              </g>
            </svg>
          </div>
        </section>

        <div class="stats-grids">
          <section class="stats-panel">
            <header class="stats-panel__head">
              <h2>{{ tUk('stats.topPages') }}</h2>
            </header>
            <ul v-if="topPaths.length" class="stats-rank">
              <li v-for="row in topPaths" :key="row.path">
                <span class="stats-rank__name">{{ row.path }}</span>
                <span class="stats-rank__bar-wrap">
                  <span class="stats-rank__bar" :style="{ width: pathBarWidth(row.views) }" />
                </span>
                <span class="stats-rank__num">{{ formatNum(row.views) }}</span>
              </li>
            </ul>
            <p v-else class="stats-empty">{{ tUk('stats.empty') }}</p>
          </section>

          <section class="stats-panel">
            <header class="stats-panel__head">
              <h2>{{ tUk('stats.topClicks') }}</h2>
            </header>
            <ul v-if="topClicks.length" class="stats-rank">
              <li v-for="row in topClicks" :key="row.name">
                <span class="stats-rank__name">{{ row.name }}</span>
                <span class="stats-rank__bar-wrap">
                  <span
                    class="stats-rank__bar stats-rank__bar--click"
                    :style="{ width: clickBarWidth(row.clicks) }"
                  />
                </span>
                <span class="stats-rank__num">{{ formatNum(row.clicks) }}</span>
              </li>
            </ul>
            <p v-else class="stats-empty">{{ tUk('stats.empty') }}</p>
          </section>
        </div>

        <div class="stats-grids stats-grids--geo">
          <section class="stats-panel">
            <header class="stats-panel__head">
              <h2>{{ tUk('stats.topCountries') }}</h2>
            </header>
            <ul v-if="topCountries.length" class="stats-rank stats-rank--geo">
              <li v-for="row in topCountries" :key="row.country_code">
                <span class="stats-rank__flag" aria-hidden="true">{{ countryFlag(row.country_code) }}</span>
                <span class="stats-rank__name">{{ countryLabel(row.country_code) }}</span>
                <span class="stats-rank__bar-wrap">
                  <span class="stats-rank__bar stats-rank__bar--geo" :style="{ width: countryBarWidth(row.views) }" />
                </span>
                <span class="stats-rank__num">{{ formatNum(row.views) }}</span>
              </li>
            </ul>
            <p v-else class="stats-empty">{{ tUk('stats.emptyGeo') }}</p>
          </section>

          <section class="stats-panel">
            <header class="stats-panel__head">
              <h2>{{ tUk('stats.topRegions') }}</h2>
            </header>
            <ul v-if="topRegions.length" class="stats-rank stats-rank--geo">
              <li v-for="row in topRegions" :key="`${row.country_code}-${row.region}`">
                <span class="stats-rank__flag" aria-hidden="true">{{ countryFlag(row.country_code) }}</span>
                <span class="stats-rank__name" :title="countryLabel(row.country_code)">{{ row.region }}</span>
                <span class="stats-rank__bar-wrap">
                  <span class="stats-rank__bar stats-rank__bar--geo" :style="{ width: regionBarWidth(row.views) }" />
                </span>
                <span class="stats-rank__num">{{ formatNum(row.views) }}</span>
              </li>
            </ul>
            <p v-else class="stats-empty">{{ tUk('stats.emptyGeo') }}</p>
          </section>
        </div>
          </div>

          <aside class="stats-visitors" :aria-label="tUk('stats.recentVisitors')">
            <section class="stats-panel stats-panel--visitors">
              <header class="stats-panel__head">
                <h2>{{ tUk('stats.recentVisitors') }}</h2>
              </header>
              <div v-if="recentVisitors.length" class="stats-visitors__scroll">
                <table class="stats-visitors-table">
                  <thead>
                    <tr>
                      <th scope="col" class="stats-visitors-table__avatar">{{ tUk('stats.colAvatar') }}</th>
                      <th scope="col">{{ tUk('stats.colName') }}</th>
                      <th scope="col">{{ tUk('stats.colTime') }}</th>
                      <th scope="col">{{ tUk('stats.colCountry') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in recentVisitors" :key="row.visitor_id">
                      <td class="stats-visitors-table__avatar" aria-hidden="true">{{ visitorAvatar(row) }}</td>
                      <td class="stats-visitors-table__name">{{ row.display_name }}</td>
                      <td class="stats-visitors-table__time">
                        <time :datetime="row.last_seen">{{ formatVisitorTime(row.last_seen) }}</time>
                      </td>
                      <td class="stats-visitors-table__country">
                        <template v-if="row.country_code">
                          <span aria-hidden="true">{{ countryFlag(row.country_code) }}</span>
                          {{ countryLabel(row.country_code) }}
                        </template>
                        <template v-else>—</template>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else class="stats-empty stats-visitors__empty">{{ tUk('stats.emptyVisitors') }}</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  fetchSiteAnalytics,
  siteAnalyticsLast7DayKeys,
  SITE_ANALYTICS_TIMEZONE,
  type SiteAnalyticsSummary
} from '@/services/api/analytics'
import { avatarEmoji } from '@/utils/avatar'

const { t } = useI18n()
const route = useRoute()

/** Сторінка статистики завжди українською; заголовок — англійський Site analytics. */
function tUk(key: string) {
  return t(key, {}, { locale: 'uk' }) as string
}

const TOKEN_STORAGE = 'quest-app:analytics-token'
const countryNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl
  ? new Intl.DisplayNames(['uk'], { type: 'region' })
  : null

const tokenInput = ref('')
const unlocked = ref(false)
const loading = ref(false)
const error = ref('')
const data = ref<SiteAnalyticsSummary | null>(null)
const lastUpdatedAt = ref<Date | null>(null)
const refreshState = ref<'idle' | 'saving' | 'saved'>('idle')
let refreshHideTimer: ReturnType<typeof setTimeout> | null = null

const chartW = 720
const chartH = 200
const padL = 28
const padR = 16
const padT = 24
const padB = 32

function applyNoIndex() {
  document.title = 'Site analytics · Quiz Quest'
  let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')
  if (!robots) {
    robots = document.createElement('meta')
    robots.setAttribute('name', 'robots')
    document.head.appendChild(robots)
  }
  robots.setAttribute('content', 'noindex,nofollow,noarchive')
}

function formatNum(n?: number) {
  return new Intl.NumberFormat('uk-UA').format(n ?? 0)
}

function formatUpdatedAt(d: Date) {
  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

function formatVisitorTime(iso: string) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('uk-UA', {
    timeZone: SITE_ANALYTICS_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function visitorAvatar(row: { avatar: string | null }) {
  return avatarEmoji(row.avatar, '👤')
}

function countryFlag(code: string) {
  const cc = (code || '').toUpperCase()
  if (!/^[A-Z]{2}$/.test(cc)) return '🌐'
  const base = 0x1f1e6
  return String.fromCodePoint(
    ...[...cc].map(ch => base + ch.charCodeAt(0) - 65)
  )
}

function countryLabel(code: string) {
  const cc = (code || '').toUpperCase()
  if (!cc) return '—'
  try {
    return countryNames?.of(cc) || cc
  } catch {
    return cc
  }
}

const weekSeries = computed(() => {
  const map = new Map((data.value?.daily ?? []).map(d => [d.day, d]))
  return siteAnalyticsLast7DayKeys().map(day => {
    const row = map.get(day)
    return {
      day,
      views: Number(row?.views ?? 0),
      clicks: Number(row?.clicks ?? 0),
      sessions: Number(row?.sessions ?? 0),
      visitors: Number(row?.visitors ?? 0)
    }
  })
})

const maxViews = computed(() => Math.max(1, ...weekSeries.value.map(d => d.views)))

const chartPoints = computed(() => {
  const n = weekSeries.value.length
  const inner = chartW - padL - padR
  const plotH = chartH - padT - padB
  const step = n > 1 ? inner / (n - 1) : 0
  return weekSeries.value.map((d, i) => {
    const x = n > 1 ? padL + i * step : padL + inner / 2
    const lineY = padT + (plotH - (d.views / maxViews.value) * plotH)
    return {
      ...d,
      x,
      lineY,
      label: d.day.slice(5).replace('-', '/')
    }
  })
})

const linePoints = computed(() =>
  chartPoints.value.map(p => `${p.x},${p.lineY}`).join(' ')
)

const areaPoints = computed(() => {
  if (!chartPoints.value.length) return ''
  const top = chartPoints.value.map(p => `${p.x},${p.lineY}`).join(' ')
  const last = chartPoints.value[chartPoints.value.length - 1]
  const first = chartPoints.value[0]
  const baseY = chartH - padB
  return `${first.x},${baseY} ${top} ${last.x},${baseY}`
})

const gridLines = computed(() => {
  const plotH = chartH - padT - padB
  return [0, 0.5, 1].map(t => padT + plotH * (1 - t))
})

const topPaths = computed(() => (data.value?.top_paths ?? []).slice(0, 8))
const topClicks = computed(() => (data.value?.top_clicks ?? []).slice(0, 8))
const topCountries = computed(() => (data.value?.top_countries ?? []).slice(0, 8))
const topRegions = computed(() => (data.value?.top_regions ?? []).slice(0, 8))
const recentVisitors = computed(() => data.value?.recent_visitors ?? [])

function pathBarWidth(views: number) {
  const max = Math.max(1, ...topPaths.value.map(p => p.views))
  return `${Math.round((views / max) * 100)}%`
}

function clickBarWidth(clicks: number) {
  const max = Math.max(1, ...topClicks.value.map(p => p.clicks))
  return `${Math.round((clicks / max) * 100)}%`
}

function countryBarWidth(views: number) {
  const max = Math.max(1, ...topCountries.value.map(p => p.views))
  return `${Math.round((views / max) * 100)}%`
}

function regionBarWidth(views: number) {
  const max = Math.max(1, ...topRegions.value.map(p => p.views))
  return `${Math.round((views / max) * 100)}%`
}

async function load(token: string, fromRefresh = false) {
  loading.value = true
  error.value = ''
  if (fromRefresh) {
    if (refreshHideTimer) clearTimeout(refreshHideTimer)
    refreshState.value = 'saving'
  }
  try {
    data.value = await fetchSiteAnalytics(token)
    unlocked.value = true
    lastUpdatedAt.value = new Date()
    try {
      sessionStorage.setItem(TOKEN_STORAGE, token)
    } catch {
      /* ignore */
    }
    if (fromRefresh) {
      refreshState.value = 'saved'
      refreshHideTimer = setTimeout(() => {
        refreshState.value = 'idle'
      }, 1600)
    }
  } catch {
    unlocked.value = false
    data.value = null
    error.value = tUk('stats.error')
    if (fromRefresh) refreshState.value = 'idle'
  } finally {
    loading.value = false
  }
}

function unlock() {
  const token = tokenInput.value.trim()
  if (token.length < 16) return
  void load(token)
}

function refresh() {
  const token = tokenInput.value.trim()
  if (token) void load(token, true)
}

onMounted(() => {
  applyNoIndex()
  const fromQuery = typeof route.query.t === 'string' ? route.query.t : ''
  let stored = ''
  try {
    stored = sessionStorage.getItem(TOKEN_STORAGE) || ''
  } catch {
    stored = ''
  }
  const token = fromQuery || stored
  if (token) {
    tokenInput.value = token
    void load(token)
  }
})

onBeforeUnmount(() => {
  if (refreshHideTimer) clearTimeout(refreshHideTimer)
})
</script>

<style scoped>
.stats-page {
  min-height: 100dvh;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow-x: clip;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background:
    radial-gradient(ellipse 70% 45% at 18% -8%, rgb(var(--c-accent-sky) / 0.2), transparent 55%),
    radial-gradient(ellipse 55% 40% at 92% 8%, rgb(var(--c-accent) / 0.12), transparent 50%),
    radial-gradient(ellipse 40% 30% at 70% 100%, rgb(var(--c-violet) / 0.08), transparent 45%),
    rgb(var(--c-bg-deep));
  color: rgb(var(--c-text));
}

.stats-page :is(h1, h2, h3) {
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: normal;
}

.stats-page__main {
  width: 100%;
  max-width: min(90rem, 100%);
  margin: 0 auto;
  padding: clamp(1.5rem, 4vh, 2.75rem) clamp(1.15rem, 3vw, 2rem) clamp(1.75rem, 5vh, 3rem);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  min-width: 0;
  overflow-x: clip;
}

.stats-page__header {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.stats-page__title {
  margin: 0;
  font-family: 'Press Start 2P', 'Nunito', cursive !important;
  font-size: clamp(1.2rem, 2.6vw, 1.65rem);
  font-weight: 400;
  letter-spacing: 0.06em !important;
  line-height: 1.45;
  color: rgb(var(--c-text));
  text-shadow: 0 0 28px rgb(var(--c-accent-sky) / 0.22);
}

.stats-page__lead {
  margin: 0;
  max-width: 40rem;
  color: rgb(var(--c-text-soft) / 0.9);
  line-height: 1.45;
  font-size: 1rem;
}

.stats-dashboard {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.stats-dashboard__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(22rem, 30rem);
  gap: 0.75rem;
  align-items: stretch;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
}

.stats-dashboard__primary {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
}

.stats-visitors {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  min-width: 0;
  max-width: 100%;
  align-self: stretch;
}

.stats-panel--visitors {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.stats-visitors__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.stats-visitors__empty {
  flex: 1 1 auto;
  min-height: 0;
}

.stats-visitors-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
  line-height: 1.35;
}

.stats-visitors-table th,
.stats-visitors-table td {
  padding: 0.4rem 0.35rem;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid rgb(var(--c-accent-sky) / 0.12);
  white-space: nowrap;
}

.stats-visitors-table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: rgb(var(--c-surface) / 0.96);
  color: rgb(var(--c-text-muted));
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stats-visitors-table__avatar {
  width: 1.5rem;
  padding-right: 0.15rem;
  font-size: 0.95rem;
  line-height: 1;
  text-align: center;
}

.stats-visitors-table__name {
  font-weight: 750;
  color: rgb(var(--c-text));
  max-width: 7rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats-visitors-table__time {
  color: rgb(var(--c-text-muted));
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.stats-visitors-table__country {
  color: rgb(var(--c-text-soft) / 0.9);
  font-weight: 650;
  min-width: 9rem;
  white-space: normal;
}

.stats-gate {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  width: min(100%, 26rem);
  padding: 1.25rem;
  border-radius: 1.1rem;
  background: rgb(var(--c-surface) / 0.55);
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  box-shadow: 0 18px 40px rgb(var(--c-bg-deep) / 0.35);
}

.stats-gate__label {
  font-weight: 700;
  font-size: 0.92rem;
}

.stats-gate__input {
  width: 100%;
  padding: 0.75rem 0.9rem;
  border-radius: 0.75rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg-deep) / 0.85);
  color: rgb(var(--c-text));
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.stats-gate__btn {
  align-self: flex-start;
  padding: 0.65rem 1.2rem;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  color: rgb(var(--c-bg-deep));
  font-weight: 800;
  cursor: pointer;
}

.stats-gate__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.stats-gate__error {
  margin: 0;
  color: rgb(var(--c-danger-soft));
  font-size: 0.92rem;
}

.stats-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.85rem;
}

.stats-toolbar__btn {
  padding: 0.55rem 1.25rem;
  min-height: 2.4rem;
  border-radius: 999px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.4);
  background: linear-gradient(135deg, rgb(var(--c-accent) / 0.22), rgb(var(--c-accent-sky) / 0.16));
  color: rgb(var(--c-accent-soft));
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 6px 18px rgb(var(--c-bg-deep) / 0.28);
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.stats-toolbar__btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgb(var(--c-accent) / 0.22);
  background: linear-gradient(135deg, rgb(var(--c-accent) / 0.3), rgb(var(--c-accent-sky) / 0.22));
}

.stats-toolbar__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-toolbar__updated {
  font-size: 0.92rem;
  color: rgb(var(--c-text-muted));
  font-weight: 600;
}

.stats-toolbar__error {
  flex-basis: 100%;
  margin: 0;
}

.save-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.save-icon--saving {
  background: rgb(var(--c-text-muted) / 0.14);
}

.save-icon--saved {
  background: rgb(var(--c-success));
  color: rgb(var(--c-white));
  box-shadow: 0 2px 10px rgb(var(--c-success) / 0.45);
  animation: save-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.save-icon__spinner {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  border: 2px solid rgb(var(--c-text-muted) / 0.35);
  border-top-color: rgb(var(--c-text-muted));
  animation: save-spin 0.7s linear infinite;
}

.save-icon__check {
  width: 1rem;
  height: 1rem;
}

.save-icon__check path {
  stroke-dasharray: 26;
  stroke-dashoffset: 26;
  animation: save-draw 0.4s ease 0.1s forwards;
}

@keyframes save-spin {
  to { transform: rotate(360deg); }
}

@keyframes save-pop {
  0% { transform: scale(0.4); }
  100% { transform: scale(1); }
}

@keyframes save-draw {
  to { stroke-dashoffset: 0; }
}

.save-pill-enter-active,
.save-pill-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.save-pill-enter-from,
.save-pill-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

.stats-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.stats-kpi {
  padding: 0.75rem 0.9rem;
  border-radius: 0.9rem;
  background: rgb(var(--c-surface) / 0.5);
  border: 1px solid rgb(var(--c-accent-sky) / 0.16);
  box-shadow: 0 8px 22px rgb(var(--c-bg-deep) / 0.2);
}

.stats-kpi__label {
  margin: 0 0 0.25rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: rgb(var(--c-text-muted));
}

.stats-kpi__value {
  margin: 0;
  font-size: clamp(1.25rem, 2.2vw, 1.7rem);
  font-weight: 800;
  color: rgb(var(--c-accent-soft));
  letter-spacing: -0.02em;
}

.stats-panel {
  margin: 0;
  padding: 0.75rem 0.9rem 0.8rem;
  border-radius: 0.9rem;
  background: rgb(var(--c-surface) / 0.42);
  border: 1px solid rgb(var(--c-accent-sky) / 0.14);
  box-shadow: 0 10px 28px rgb(var(--c-bg-deep) / 0.18);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.stats-grids .stats-panel {
  min-height: 100%;
}

.stats-panel__head h2 {
  margin: 0 0 0.55rem;
  font-size: 0.98rem;
  font-weight: 800;
}

.stats-panel--chart {
  flex: 0 0 auto;
  min-height: 0;
  padding-bottom: 0.7rem;
}

.stats-chart {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.stats-chart__svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 13rem;
}

.stats-chart__grid {
  stroke: rgb(var(--c-accent-sky) / 0.12);
  stroke-width: 1;
}

.stats-chart__label {
  fill: rgb(var(--c-text-muted));
  font-size: 11px;
  text-anchor: middle;
}

.stats-chart__value {
  fill: rgb(var(--c-accent-soft));
  font-size: 11px;
  font-weight: 700;
  text-anchor: middle;
}

.stats-grids {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: stretch;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.stats-grids--geo {
  /* однакова висота пари країни/регіони */
  grid-auto-rows: 1fr;
}

.stats-rank {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.stats-rank li {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(3rem, 1fr) auto;
  gap: 0.45rem;
  align-items: center;
  min-height: 1.35rem;
}

.stats-rank--geo li {
  grid-template-columns: auto minmax(0, 1.4fr) minmax(3rem, 1fr) auto;
}

.stats-rank__flag {
  font-size: 1rem;
  line-height: 1;
  width: 1.25rem;
  text-align: center;
}

.stats-rank__name {
  font-size: 0.86rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.stats-rank__bar-wrap {
  height: 0.38rem;
  border-radius: 999px;
  background: rgb(var(--c-bg-deep) / 0.65);
  overflow: hidden;
}

.stats-rank__bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
}

.stats-rank__bar--click {
  background: linear-gradient(90deg, rgb(var(--c-violet-light)), rgb(var(--c-accent-sky)));
}

.stats-rank__bar--geo {
  background: linear-gradient(90deg, rgb(var(--c-teal)), rgb(var(--c-accent)));
}

.stats-rank__num {
  font-weight: 800;
  font-size: 0.84rem;
  color: rgb(var(--c-accent-soft));
  min-width: 2rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.stats-empty {
  margin: 0;
  color: rgb(var(--c-text-muted));
  font-size: 0.84rem;
  line-height: 1.35;
  flex: 1;
}

@media (max-width: 1200px) {
  .stats-dashboard__layout {
    grid-template-columns: 1fr;
  }

  .stats-visitors {
    min-height: auto;
  }

  .stats-panel--visitors {
    max-height: 22rem;
    min-height: auto;
  }

  .stats-visitors__empty {
    flex: 0 0 auto;
  }
}

@media (max-width: 900px) {
  .stats-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stats-grids {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .stats-kpis {
    grid-template-columns: 1fr;
  }

  .stats-rank li,
  .stats-rank--geo li {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .stats-rank__bar-wrap,
  .stats-rank__flag {
    display: none;
  }
}
</style>
