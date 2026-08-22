/** Убираем префикс [Тест] для отображения на карточке. */
export function displayQuestTitle(title: string): string {
  return title.replace(/^\[Тест\]\s*/i, '').trim() || title
}

/** Порядок у рядку: спочатку кіно, музика, книги, планета, історія. */
export const QUEST_EMOJI_ROW_ORDER = [
  '🎬', '🎵', '📚', '🌍', '🏛',
  '🎯', '🔬', '⚽', '🎮', '🍕', '✈️', '🎨', '💡', '🚀', '🐾', '🏆'
] as const

/** Усі emoji квесту (той самий набір, впорядкований для рядка). */
export const QUEST_EMOJIS = QUEST_EMOJI_ROW_ORDER

/** Додаткові emoji — у модальному пікері через «⋯». */
export const QUEST_EMOJI_EXTRA = [
  '📖', '🧪', '🎭', '🏀', '🎸', '🗺️', '💻', '🧠',
  '🎪', '🌟', '🔥', '❤️', '🍎', '🌈', '⚡', '🎁',
  '🦖', '🎲', '🏖', '🍿', '📷', '🎤', '🏔', '🌸',
  '🍔', '☕', '🚗', '✨', '🎓', '🔮', '🛸', '🎹'
] as const

export type QuestEmoji = (typeof QUEST_EMOJIS)[number] | (typeof QUEST_EMOJI_EXTRA)[number]

export const DEFAULT_QUEST_EMOJI = QUEST_EMOJI_ROW_ORDER[0]

/** Эмодзи-тема по ключевым словам в названии (fallback). */
export function questThemeEmoji(title: string): string {
  const label = displayQuestTitle(title).toLowerCase()
  if (/істор|histor|geschicht|histoire/.test(label)) return '🏛'
  if (/наук|science|wissenschaft|ciencia/.test(label)) return '🔬'
  if (/кіно|кино|film|cinema|cine/.test(label)) return '🎬'
  if (/спорт|sport/.test(label)) return '⚽'
  if (/муз|music|musik/.test(label)) return '🎵'
  if (/геог|geograph|країн|country|land/.test(label)) return '🌍'
  if (/літер|literatur|literature|книг|book/.test(label)) return '📚'
  if (/техн|tech|it|digital/.test(label)) return '💡'
  return DEFAULT_QUEST_EMOJI
}

/** Emoji для карточки: сохранённый в квесте или авто по названию. */
export function questDisplayEmoji(quest: { emoji?: string; title: string }): string {
  const saved = quest.emoji?.trim()
  if (saved) return saved
  return questThemeEmoji(quest.title)
}
