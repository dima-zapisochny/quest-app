export type QuestTheme = {
  id: string
  /** CSS rgb triplet for rgb(var(--x) / α) */
  accent: string
  accent2: string
  icon: string
}

const ICONS = {
  history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>`,
  science: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="2"/><ellipse cx="12" cy="12" rx="9" ry="4"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="4" transform="rotate(120 12 12)"/></svg>`,
  cinema: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20M7 4v4M17 4v4"/></svg>`,
  sport: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55.47.98 1 .98h2c.53 0 1-.43 1-.98v-2.34"/><path d="M12 2v8"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`
} as const

const THEMES: QuestTheme[] = [
  { id: 'violet', accent: '139 92 246', accent2: '129 140 248', icon: ICONS.default },
  { id: 'cyan', accent: '34 211 238', accent2: '56 189 248', icon: ICONS.default },
  { id: 'amber', accent: '251 191 36', accent2: '249 115 22', icon: ICONS.default },
  { id: 'rose', accent: '244 63 94', accent2: '236 72 153', icon: ICONS.default }
]

const KEYWORD_THEMES: Array<{ test: RegExp } & QuestTheme> = [
  { test: /істор|истор|histor|минул|past/, id: 'history', accent: '251 191 36', accent2: '245 158 11', icon: ICONS.history },
  { test: /наук|science|косм|space|фіз|phys/, id: 'science', accent: '56 189 248', accent2: '34 211 238', icon: ICONS.science },
  { test: /кіно|кино|cinema|film|movie|фільм/, id: 'cinema', accent: '244 63 94', accent2: '236 72 153', icon: ICONS.cinema },
  { test: /спорт|sport|game|чемп/, id: 'sport', accent: '34 197 94', accent2: '16 185 129', icon: ICONS.sport }
]

/** Тема обложки по названию квеста (или палитра по индексу). */
export function getQuestTheme(title: string, index: number): QuestTheme {
  const normalized = title.replace(/^\[Тест\]\s*/i, '').trim().toLowerCase()
  for (const entry of KEYWORD_THEMES) {
    if (entry.test.test(normalized)) {
      const { test: _, ...theme } = entry
      return theme
    }
  }
  return THEMES[index % THEMES.length]!
}
