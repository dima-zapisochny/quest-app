/**
 * Единый источник аватаров (эмодзи + подписи). Раньше карта эмодзи была
 * скопирована в 4+ файлах — теперь берём отсюда.
 */
export interface AvatarOption {
  id: string
  emoji: string
  label: string
}

export const AVATARS: AvatarOption[] = [
  { id: 'fox', emoji: '🦊', label: 'Лис' },
  { id: 'panda', emoji: '🐼', label: 'Панда' },
  { id: 'tiger', emoji: '🐯', label: 'Тигр' },
  { id: 'owl', emoji: '🦉', label: 'Сова' },
  { id: 'whale', emoji: '🐳', label: 'Кит' },
  { id: 'parrot', emoji: '🦜', label: 'Попугай' },
  { id: 'koala', emoji: '🐨', label: 'Коала' },
  { id: 'dino', emoji: '🦕', label: 'Дино' },
  { id: 'crocodile', emoji: '🐊', label: 'Крокодил' },
  { id: 'lion', emoji: '🦁', label: 'Лев' },
  { id: 'penguin', emoji: '🐧', label: 'Пингвин' },
  { id: 'elephant', emoji: '🐘', label: 'Слон' },
  { id: 'seal', emoji: '🦭', label: 'Тюлень' },
  { id: 'hedgehog', emoji: '🦔', label: 'Ёж' },
  { id: 'lily', emoji: '🌸', label: 'Лілія' }
]

const emojiById: Record<string, string> = Object.fromEntries(AVATARS.map(a => [a.id, a.emoji]))

/** Эмодзи по id аватара. fallback — что вернуть для неизвестного/пустого id. */
export function avatarEmoji(id: string | null | undefined, fallback = '🦊'): string {
  return (id && emojiById[id]) || fallback
}
