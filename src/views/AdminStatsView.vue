<template>
  <div class="stats-page" data-analytics-ignore>
    <main class="stats-page__main">
      <h1 class="stats-page__title">Site analytics</h1>
      <p v-if="!unlocked" class="stats-page__lead">{{ tUk('stats.lead') }}</p>

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

      <template v-else>
        <div class="stats-dashboard">
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

        <section class="stats-kpis" aria-label="KPI">
          <article class="stats-kpi">
            <p class="stats-kpi__label">{{ tUk('stats.kpiViews7d') }}</p>
            <p class="stats-kpi__value">{{ formatNum(data?.views_7d) }}</p>
          </article>
          <article class="stats-kpi">
            <p class="stats-kpi__label">{{ tUk('stats.kpiSessions7d') }}</p>
            <p class="stats-kpi__value">{{ formatNum(data?.unique_sessions_7d) }}</p>
          </article>
          <article class="stats-kpi">
            <p class="stats-kpi__label">{{ tUk('stats.kpiClicks7d') }}</p>
            <p class="stats-kpi__value">{{ formatNum(data?.clicks_7d) }}</p>
          </article>
          <article class="stats-kpi">
            <p class="stats-kpi__label">{{ tUk('stats.kpiViewsTotal') }}</p>
            <p class="stats-kpi__value">{{ formatNum(data?.total_views) }}</p>
          </article>
        </section>

        <section class="stats-panel stats-panel--chart">
          <header class="stats-panel__head">
            <h2>{{ tUk('stats.chartTitle') }}</h2>
          </header>
          <div class="stats-chart" role="img" :aria-label="tUk('stats.chartTitle')">
            <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="stats-chart__svg" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="statsBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#38bdf8" />
                  <stop offset="100%" stop-color="#22d3ee" />
                </linearGradient>
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
                stroke="#bae6fd"
                stroke-width="2.5"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
              <g v-for="bar in bars" :key="bar.day">
                <rect
                  :x="bar.x"
                  :y="bar.y"
                  :width="bar.w"
                  :height="bar.h"
                  rx="6"
                  fill="url(#statsBarGrad)"
                  opacity="0.92"
                />
                <text :x="bar.x + bar.w / 2" :y="chartH - 10" class="stats-chart__label">
                  {{ bar.label }}
                </text>
                <text
                  v-if="bar.views > 0"
                  :x="bar.x + bar.w / 2"
                  :y="bar.y - 6"
                  class="stats-chart__value"
                >
                  {{ bar.views }}
                </text>
                <circle
                  :cx="bar.x + bar.w / 2"
                  :cy="bar.lineY"
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
          <section class="stats-panel stats-panel--rank">
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

          <section class="stats-panel stats-panel--rank">
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
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import {
  fetchSiteAnalytics,
  type SiteAnalyticsSummary
} from '@/services/api/analytics'

const { t } = useI18n()
const route = useRoute()

/** Сторінка статистики завжди українською; заголовок — англійський Site analytics. */
function tUk(key: string) {
  return t(key, {}, { locale: 'uk' }) as string
}

const TOKEN_STORAGE = 'quest-app:analytics-token'

const tokenInput = ref('')
const unlocked = ref(false)
const loading = ref(false)
const error = ref('')
const data = ref<SiteAnalyticsSummary | null>(null)
const lastUpdatedAt = ref<Date | null>(null)
const refreshState = ref<'idle' | 'saving' | 'saved'>('idle')
let refreshHideTimer: ReturnType<typeof setTimeout> | null = null

const chartW = 640
const chartH = 168
const padL = 28
const padR = 16
const padT = 22
const padB = 30

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

function last7Days(): string[] {
  const days: string[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i))
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

const weekSeries = computed(() => {
  const map = new Map((data.value?.daily ?? []).map(d => [d.day, d]))
  return last7Days().map(day => {
    const row = map.get(day)
    return {
      day,
      views: Number(row?.views ?? 0),
      clicks: Number(row?.clicks ?? 0),
      sessions: Number(row?.sessions ?? 0)
    }
  })
})

const maxViews = computed(() => Math.max(1, ...weekSeries.value.map(d => d.views)))

const bars = computed(() => {
  const n = weekSeries.value.length
  const inner = chartW - padL - padR
  const gap = 12
  const w = (inner - gap * (n - 1)) / n
  const plotH = chartH - padT - padB
  return weekSeries.value.map((d, i) => {
    const h = (d.views / maxViews.value) * plotH
    const x = padL + i * (w + gap)
    const y = padT + (plotH - h)
    const lineY = padT + (plotH - (d.views / maxViews.value) * plotH)
    return {
      ...d,
      x,
      y,
      w,
      h: Math.max(h, d.views > 0 ? 4 : 0),
      lineY,
      label: d.day.slice(5).replace('-', '/')
    }
  })
})

const linePoints = computed(() =>
  bars.value.map(b => `${b.x + b.w / 2},${b.lineY}`).join(' ')
)

const areaPoints = computed(() => {
  if (!bars.value.length) return ''
  const top = bars.value.map(b => `${b.x + b.w / 2},${b.lineY}`).join(' ')
  const last = bars.value[bars.value.length - 1]
  const first = bars.value[0]
  const baseY = chartH - padB
  return `${first.x + first.w / 2},${baseY} ${top} ${last.x + last.w / 2},${baseY}`
})

const gridLines = computed(() => {
  const plotH = chartH - padT - padB
  return [0, 0.5, 1].map(t => padT + plotH * (1 - t))
})

const topPaths = computed(() => (data.value?.top_paths ?? []).slice(0, 5))
const topClicks = computed(() => (data.value?.top_clicks ?? []).slice(0, 5))

function pathBarWidth(views: number) {
  const max = Math.max(1, ...topPaths.value.map(p => p.views))
  return `${Math.round((views / max) * 100)}%`
}

function clickBarWidth(clicks: number) {
  const max = Math.max(1, ...topClicks.value.map(p => p.clicks))
  return `${Math.round((clicks / max) * 100)}%`
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
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background:
    radial-gradient(ellipse 70% 45% at 20% -10%, rgb(var(--c-accent-sky) / 0.18), transparent),
    radial-gradient(ellipse 50% 40% at 90% 10%, rgb(var(--c-accent) / 0.1), transparent),
    rgb(var(--c-bg-deep));
  color: rgb(var(--c-text));
}

.stats-page :is(h1, h2, h3) {
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: normal;
}

.stats-page__main {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
  padding: 1rem 1.15rem 0.75rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stats-page__title {
  margin: 0 0 0.35rem;
  font-family: 'Press Start 2P', 'Nunito', cursive !important;
  font-size: clamp(1.15rem, 2.8vw, 1.55rem);
  font-weight: 400;
  letter-spacing: 0.06em !important;
  line-height: 1.4;
  color: rgb(var(--c-text));
  flex-shrink: 0;
}

.stats-page__lead {
  margin: 0 0 0.85rem;
  color: rgb(var(--c-text-soft) / 0.9);
  line-height: 1.4;
  font-size: 0.98rem;
  flex-shrink: 0;
}

.stats-dashboard {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1.15fr) minmax(0, 0.95fr);
  gap: 0.55rem;
  overflow: hidden;
}

.stats-gate {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-width: 26rem;
  padding: 1.15rem;
  border-radius: 1rem;
  background: rgb(var(--c-surface) / 0.55);
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
}

.stats-gate__label {
  font-weight: 700;
  font-size: 0.92rem;
}

.stats-gate__input {
  width: 100%;
  padding: 0.7rem 0.85rem;
  border-radius: 0.7rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg-deep) / 0.85);
  color: rgb(var(--c-text));
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.9rem;
}

.stats-gate__btn {
  align-self: flex-start;
  padding: 0.65rem 1.15rem;
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
  gap: 0.5rem 0.75rem;
  margin: 0;
  flex-shrink: 0;
}

.stats-toolbar__btn {
  padding: 0.5rem 1.15rem;
  min-height: 2.35rem;
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
  font-size: 0.9rem;
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
  gap: 0.5rem;
  margin: 0;
  flex-shrink: 0;
}

.stats-kpi {
  padding: 0.55rem 0.7rem;
  border-radius: 0.75rem;
  background: rgb(var(--c-surface) / 0.55);
  border: 1px solid rgb(var(--c-accent-sky) / 0.16);
}

.stats-kpi__label {
  margin: 0 0 0.2rem;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: none;
  color: rgb(var(--c-text-muted));
}

.stats-kpi__value {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.55rem);
  font-weight: 800;
  color: rgb(var(--c-accent-soft));
}

.stats-panel {
  margin: 0;
  padding: 0.55rem 0.75rem 0.65rem;
  border-radius: 0.85rem;
  background: rgb(var(--c-surface) / 0.45);
  border: 1px solid rgb(var(--c-accent-sky) / 0.14);
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.stats-panel__head {
  flex-shrink: 0;
}

.stats-panel__head h2 {
  margin: 0 0 0.35rem;
  font-size: 1.02rem;
  font-weight: 800;
}

.stats-chart {
  flex: 1;
  min-height: 0;
  display: flex;
}

.stats-chart__svg {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 100%;
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
  gap: 0.55rem;
  min-height: 0;
  overflow: hidden;
}

.stats-rank {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 0;
  overflow: hidden;
}

.stats-rank li {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  gap: 0.45rem;
  align-items: center;
}

.stats-rank__name {
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats-rank__bar-wrap {
  height: 0.4rem;
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

.stats-rank__num {
  font-weight: 800;
  font-size: 0.82rem;
  color: rgb(var(--c-accent-soft));
  min-width: 2.2rem;
  text-align: right;
}

.stats-empty {
  margin: 0;
  color: rgb(var(--c-text-muted));
  font-size: 0.88rem;
}

@media (max-width: 800px) {
  .stats-page {
    overflow-y: auto;
    height: auto;
    min-height: 100dvh;
    max-height: none;
  }

  .stats-dashboard {
    display: flex;
    flex-direction: column;
    overflow: visible;
  }

  .stats-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stats-grids {
    grid-template-columns: 1fr;
    overflow: visible;
  }

  .stats-chart__svg {
    height: auto;
    max-height: 12rem;
  }
}
</style>

