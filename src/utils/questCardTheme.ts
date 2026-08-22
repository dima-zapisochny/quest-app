/** RGB-triplets для акцентной полоски карточки квеста. */
export type QuestAccent = {
  id: string
  a: string
  b: string
}

const PALETTE: QuestAccent[] = [
  { id: 'violet', a: '139 92 246', b: '129 140 248' },
  { id: 'cyan', a: '34 211 238', b: '56 189 248' },
  { id: 'amber', a: '251 191 36', b: '249 115 22' },
  { id: 'emerald', a: '52 211 153', b: '16 185 129' },
  { id: 'rose', a: '244 63 94', b: '236 72 153' }
]

const KEYWORDS: Array<{ test: RegExp; accent: QuestAccent }> = [
  { test: /істор|истор|histor|минул|past/, accent: { id: 'history', a: '251 191 36', b: '245 158 11' } },
  { test: /наук|science|косм|space|фіз|phys/, accent: { id: 'science', a: '56 189 248', b: '34 211 238' } },
  { test: /кіно|кино|cinema|film|movie|фільм/, accent: { id: 'cinema', a: '244 63 94', b: '236 72 153' } },
  { test: /спорт|sport|чемп/, accent: { id: 'sport', a: '52 211 153', b: '34 197 94' } }
]

export function getQuestAccent(title: string, index: number): QuestAccent {
  const normalized = title.replace(/^\[Тест\]\s*/i, '').trim().toLowerCase()
  for (const { test, accent } of KEYWORDS) {
    if (test.test(normalized)) return accent
  }
  return PALETTE[index % PALETTE.length]!
}

/** Убираем префикс [Тест] для отображения на карточке. */
export function displayQuestTitle(title: string): string {
  return title.replace(/^\[Тест\]\s*/i, '').trim() || title
}
