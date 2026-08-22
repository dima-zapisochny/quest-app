/** Убираем префикс [Тест] для отображения на карточке. */
export function displayQuestTitle(title: string): string {
  return title.replace(/^\[Тест\]\s*/i, '').trim() || title
}

/** Доступные emoji при создании квеста. */
export const QUEST_EMOJIS = [
  '🎯', '🏛', '🔬', '🎬', '⚽', '🎵', '🌍', '📚',
  '🎮', '🍕', '✈️', '🎨', '💡', '🚀', '🐾', '🏆'
] as const

export const DEFAULT_QUEST_EMOJI = QUEST_EMOJIS[0]

/** Эмодзи-тема по ключевым словам в названии (fallback). */
export function questThemeEmoji(title: string): string {
  const label = displayQuestTitle(title).toLowerCase()
  if (/істор|histor|geschicht|histoire/.test(label)) return '🏛'
  if (/наук|science|wissenschaft|ciencia/.test(label)) return '🔬'
  if (/кіно|кино|film|cinema|cine/.test(label)) return '🎬'
  if (/спорт|sport/.test(label)) return '⚽'
  if (/муз|music|musik/.test(label)) return '🎵'
  if (/геог|geograph|країн|country|land/.test(label)) return '🌍'
  return DEFAULT_QUEST_EMOJI
}

/** Emoji для карточки: сохранённый в квесте или авто по названию. */
export function questDisplayEmoji(quest: { emoji?: string; title: string }): string {
  const saved = quest.emoji?.trim()
  if (saved) return saved
  return questThemeEmoji(quest.title)
}
