/** Убираем префикс [Тест] для отображения на карточке. */
export function displayQuestTitle(title: string): string {
  return title.replace(/^\[Тест\]\s*/i, '').trim() || title
}

/** Стабильный hue (0–359) для акцентного цвета карточки по названию. */
export function questAccentHue(title: string): number {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

/** Эмодзи-тема по ключевым словам в названии (для обложки карточки). */
export function questThemeEmoji(title: string): string {
  const label = displayQuestTitle(title).toLowerCase()
  if (/істор|histor|geschicht|histoire/.test(label)) return '🏛'
  if (/наук|science|wissenschaft|ciencia/.test(label)) return '🔬'
  if (/кіно|кино|film|cinema|cine/.test(label)) return '🎬'
  if (/спорт|sport/.test(label)) return '⚽'
  if (/муз|music|musik/.test(label)) return '🎵'
  if (/геог|geograph|країн|country|land/.test(label)) return '🌍'
  return '🎯'
}

type QuestGridSource = {
  roundsCount?: number
  rounds?: Array<{ categories?: unknown[] }>
}

/** Размер мини-сетки доски на обложке карточки. */
export function questBoardGrid(quest: QuestGridSource): { cols: number; rows: number; cells: number } {
  const rows = Math.min(Math.max(quest.roundsCount ?? quest.rounds?.length ?? 1, 1), 3)
  const cols = Math.min(Math.max(quest.rounds?.[0]?.categories?.length ?? 3, 2), 4)
  return { cols, rows, cells: cols * rows }
}
