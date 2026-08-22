import { ref, computed, watch, nextTick } from 'vue'
import { useGameSessionStore } from '@/store/gameSessionStore'
import { avatarEmoji } from '@/utils/avatar'
import type { GameSession } from '@/types'

export interface LeaderboardEntry {
  id: string
  name: string
  avatar: string
  score: number
}

/** Плаваючий +/− над карткою учасника після зміни рахунку. */
export interface ScoreFloat {
  id: string
  delta: number
  key: number
}

const FLOAT_MS = 1400

/** Шаги ручной корректировки очков ведущим. */
export const STEP_OPTIONS = [5, 10, 15, 20] as const

/** Демо-таблица для превью доски вне игры (только в dev). */
const fallbackLeaderboard: LeaderboardEntry[] = [
  { id: 'mock-player-1', name: 'Арина', avatar: '🦊', score: 3200 },
  { id: 'mock-player-2', name: 'Борис', avatar: '🐻', score: 3050 },
  { id: 'mock-player-3', name: 'София', avatar: '🦉', score: 2890 },
  { id: 'mock-player-4', name: 'Даниил', avatar: '🐯', score: 2760 },
  { id: 'mock-player-5', name: 'Ева', avatar: '🐼', score: 2620 },
  { id: 'mock-player-6', name: 'Леон', avatar: '🦁', score: 2480 },
  { id: 'mock-player-7', name: 'Ника', avatar: '🦋', score: 2340 },
  { id: 'mock-player-8', name: 'Игорь', avatar: '🦕', score: 2200 },
  { id: 'mock-player-9', name: 'Кира', avatar: '🐧', score: 2070 },
  { id: 'mock-player-10', name: 'Максим', avatar: '🐊', score: 1960 },
  { id: 'mock-player-11', name: 'Оля', avatar: '🦜', score: 1850 },
  { id: 'mock-player-12', name: 'Павел', avatar: '🦭', score: 1740 },
  { id: 'mock-player-13', name: 'Рита', avatar: '🦔', score: 1620 },
  { id: 'mock-player-14', name: 'Слава', avatar: '🐸', score: 1510 },
  { id: 'mock-player-15', name: 'Таня', avatar: '🦢', score: 1390 },
  { id: 'mock-player-16', name: 'Ульяна', avatar: '🌸', score: 1280 },
  { id: 'mock-player-17', name: 'Федор', avatar: '🐺', score: 1170 },
  { id: 'mock-player-18', name: 'Хлоя', avatar: '🐱', score: 1060 },
  { id: 'mock-player-19', name: 'Цветан', avatar: '🦎', score: 950 },
  { id: 'mock-player-20', name: 'Юлия', avatar: '🐰', score: 840 }
]

/**
 * Таблица лидеров ведущего: строит список из участников сессии, ведёт hover-поповер
 * и ручную корректировку очков (setPlayerScore), плюс демо-«болтанку» очков для
 * превью доски в dev. Вынесено из QuestView. Демо-интервал снимается автоматически
 * через onCleanup у watch при смене режима/размонтировании.
 */
export function useLeaderboard(getSession: () => GameSession | undefined) {
  const store = useGameSessionStore()

  const leaderboardState = ref<LeaderboardEntry[]>([])
  const scoreFloats = ref<ScoreFloat[]>([])
  const hoveredPlayerId = ref<string | null>(null)
  const manualScoreInput = ref(0)
  const selectedStep = ref(5)
  const popoverAnchor = ref<{ left: number; top: number } | null>(null)
  let leavePopoverTimeout: ReturnType<typeof setTimeout> | null = null
  let floatKey = 0
  const prevScores = new Map<string, number>()
  let scoresReady = false

  function pushScoreFloat(playerId: string, delta: number) {
    if (!delta) return
    const key = ++floatKey
    scoreFloats.value = [...scoreFloats.value, { id: playerId, delta, key }]
    window.setTimeout(() => {
      scoreFloats.value = scoreFloats.value.filter(f => f.key !== key)
    }, FLOAT_MS)
  }

  /** Порівнює новий стан зі старим: з’являються плаваючі дельти, без анімації на першому завантаженні. */
  function syncScoreFloats(entries: LeaderboardEntry[]) {
    const seen = new Set<string>()
    for (const entry of entries) {
      seen.add(entry.id)
      const prev = prevScores.get(entry.id)
      if (scoresReady && prev !== undefined && prev !== entry.score) {
        pushScoreFloat(entry.id, entry.score - prev)
      }
      prevScores.set(entry.id, entry.score)
    }
    for (const id of [...prevScores.keys()]) {
      if (!seen.has(id)) prevScores.delete(id)
    }
    scoresReady = true
  }

  // Участники (без ведущего) и признак «нет реальной сессии» (превью доски)
  const sessionParticipants = computed(() => {
    const s = getSession()
    return s ? s.players.filter(p => p.id !== s.hostId) : []
  })
  const isMockSession = computed(() => !getSession())

  const leaderboardEntries = computed<LeaderboardEntry[]>(() =>
    [...leaderboardState.value].sort((a, b) => b.score - a.score)
  )

  const hoveredPlayer = computed(() =>
    hoveredPlayerId.value
      ? leaderboardEntries.value.find(p => p.id === hoveredPlayerId.value) ?? null
      : null
  )

  function build() {
    // Реальная сессия: настоящие участники (пусто = ждём игроков, а не фейки — #8)
    const s = getSession()
    if (s) {
      leaderboardState.value = sessionParticipants.value.map((player, index) => ({
        id: player.id,
        name: player.name?.trim() || `Игрок ${index + 1}`,
        avatar: avatarEmoji(player.avatar, ''),
        score: player.score ?? 0
      }))
      return
    }
    // Нет сессии (превью доски вне игры): демо-таблица только в dev, в проде — пусто
    leaderboardState.value = import.meta.env.DEV
      ? fallbackLeaderboard.map(entry => ({ ...entry }))
      : []
  }

  // --- Поповер участника ---
  function setPopoverAnchor(playerId: string, el: HTMLElement) {
    if (leavePopoverTimeout) {
      clearTimeout(leavePopoverTimeout)
      leavePopoverTimeout = null
    }
    hoveredPlayerId.value = playerId
    const rect = el.getBoundingClientRect()
    popoverAnchor.value = { left: rect.left + rect.width / 2, top: rect.top }
  }

  function clearPopoverAnchor() {
    leavePopoverTimeout = setTimeout(() => {
      hoveredPlayerId.value = null
      popoverAnchor.value = null
      leavePopoverTimeout = null
    }, 120)
  }

  function cancelClearPopoverAnchor() {
    if (leavePopoverTimeout) {
      clearTimeout(leavePopoverTimeout)
      leavePopoverTimeout = null
    }
  }

  // При наведении на участника — подставляем его текущий счёт в поле ручного ввода
  watch(hoveredPlayerId, (id) => {
    if (id) {
      const entry = leaderboardEntries.value.find(e => e.id === id)
      manualScoreInput.value = entry ? entry.score : 0
    }
  })

  // --- Корректировка очков ---
  function updateLeaderboardScore(playerId: string, newScore: number) {
    // Новый массив (и объекты) для гарантированной реактивности Vue
    leaderboardState.value = leaderboardState.value.map(p =>
      p.id === playerId ? { ...p, score: newScore } : { ...p }
    )
  }

  /** Оптимистично правит карточку и, если игрок в реальной сессии, пишет счёт на сервер. */
  async function persistScore(playerId: string, newScore: number) {
    updateLeaderboardScore(playerId, newScore)
    const s = getSession()
    if (s && s.players.some(p => p.id === playerId)) {
      await store.setPlayerScore(s.id, playerId, newScore)
      await nextTick()
      build()
    }
    // В мок-режиме (fallback-список) build() не зовём — иначе перезапишет ручные правки
  }

  async function subtractScore(playerId: string, amount?: number) {
    const entry = leaderboardEntries.value.find(e => e.id === playerId)
    if (!entry) return
    await persistScore(playerId, Math.max(0, entry.score - (amount ?? selectedStep.value)))
  }

  async function addScore(playerId: string, amount?: number) {
    const entry = leaderboardEntries.value.find(e => e.id === playerId)
    if (!entry) return
    await persistScore(playerId, entry.score + (amount ?? selectedStep.value))
  }

  /** «Применить»: задаёт введённое число. Если не менялось — ничего не делаем
   *  (раньше это молча отнимало шаг — #27; для вычитания есть кнопка «Отнять»). */
  function handleApplyClick() {
    if (!hoveredPlayer.value) return
    const manualScore = Math.max(0, Math.round(manualScoreInput.value))
    if (manualScore !== hoveredPlayer.value.score) {
      persistScore(hoveredPlayer.value.id, manualScore)
    }
  }

  // --- Реактивная пересборка из сессии ---
  // Не перезаписываем лидерборд в мок-режиме, если там уже есть данные (ручные правки/демо)
  const skipMockRebuild = () => isMockSession.value && leaderboardState.value.length > 0

  watch(
    leaderboardState,
    (entries) => { syncScoreFloats(entries) },
    { deep: true }
  )

  watch(
    () => getSession()?.players ?? [],
    () => { if (!skipMockRebuild()) build() },
    { immediate: true, deep: true }
  )

  watch(
    () => getSession()?.players?.map(p => ({ id: p.id, score: p.score ?? 0 })) ?? [],
    (newScores, oldScores) => {
      if (skipMockRebuild()) return
      const changed = newScores.some((s, i) => !oldScores?.[i] || oldScores[i].score !== s.score)
      if (changed) build()
    },
    { deep: true }
  )

  watch(
    () => getSession(),
    () => { if (!skipMockRebuild()) build() },
    { immediate: true, deep: true }
  )

  // Демо-«болтанка» очков — только для превью доски в dev, не в проде
  watch(
    isMockSession,
    (mocking, _prev, onCleanup) => {
      let timer: number | undefined
      const tick = () => {
        if (!isMockSession.value || leaderboardState.value.length === 0) return
        const next = leaderboardState.value.map(entry => ({ ...entry }))
        const i = Math.floor(Math.random() * next.length)
        const delta = (Math.floor(Math.random() * 160) + 40) * (Math.random() > 0.25 ? 1 : -1)
        next[i].score = Math.max(0, next[i].score + delta)
        leaderboardState.value = next
      }
      if (mocking && import.meta.env.DEV) {
        tick()
        timer = window.setInterval(tick, 3000)
      }
      onCleanup(() => {
        if (timer) window.clearInterval(timer)
      })
    },
    { immediate: true }
  )

  return {
    leaderboardEntries,
    scoreFloats,
    hoveredPlayer,
    popoverAnchor,
    manualScoreInput,
    selectedStep,
    STEP_OPTIONS,
    build,
    setPopoverAnchor,
    clearPopoverAnchor,
    cancelClearPopoverAnchor,
    subtractScore,
    addScore,
    handleApplyClick
  }
}
