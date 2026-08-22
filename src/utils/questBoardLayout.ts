import type { Quest } from '@/types'

export type BoardLayout = { cols: number; rows: number }

const PRESETS: Array<[number, number]> = [
  [2, 2], [3, 2], [2, 3], [3, 3], [4, 2], [2, 4], [4, 3], [3, 4], [5, 3], [3, 5], [4, 4], [5, 4], [4, 5], [5, 5]
]

/** Оценивает сетку категорий×вопросов для превью карточки. */
export function getQuestBoardLayout(
  quest: Pick<Quest, 'rounds' | 'questionsCount'>,
  totalQuestions?: number
): BoardLayout {
  const round = quest.rounds?.[0]
  if (round?.categories?.length) {
    const cols = Math.min(round.categories.length, 5)
    const rows = Math.min(round.categories[0]?.questions?.length ?? 1, 5)
    return { cols: Math.max(1, cols), rows: Math.max(1, rows) }
  }
  return estimateBoardLayout(totalQuestions ?? quest.questionsCount ?? 4)
}

function estimateBoardLayout(total: number): BoardLayout {
  if (total <= 0) return { cols: 2, rows: 2 }
  for (const [cols, rows] of PRESETS) {
    if (cols * rows === total) return { cols, rows }
  }
  for (let cols = 5; cols >= 2; cols--) {
    if (total % cols === 0) {
      const rows = total / cols
      if (rows <= 5) return { cols, rows }
    }
  }
  const cols = Math.min(5, Math.max(2, Math.round(Math.sqrt(total))))
  return { cols, rows: Math.min(5, Math.max(1, Math.ceil(total / cols))) }
}

/** Баллы для ячейки (row, col) — как на реальной доске. */
export function tileValue(row: number): number {
  return (row + 1) * 100
}
