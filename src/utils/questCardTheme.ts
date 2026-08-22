/** Убираем префикс [Тест] для отображения на карточке. */
export function displayQuestTitle(title: string): string {
  return title.replace(/^\[Тест\]\s*/i, '').trim() || title
}

/** Стабильный hue (0–359) для акцентного свечения preview по названию квеста. */
export function questAccentHue(title: string): number {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}
