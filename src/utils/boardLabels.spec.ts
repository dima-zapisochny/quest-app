import { describe, it, expect } from 'vitest'
import {
  defaultRoundTitle,
  defaultCategoryTitle,
  displayRoundTitle,
  displayCategoryTitle
} from './boardLabels'

const t = (key: string, params?: Record<string, unknown>) => {
  if (key === 'editor.round') return `Round ${params?.n}`
  if (key === 'editor.category') return `Category ${params?.n}`
  return key
}

describe('boardLabels', () => {
  it('stores empty defaults for creation', () => {
    expect(defaultRoundTitle(0)).toBe('')
    expect(defaultCategoryTitle(2)).toBe('')
  })

  it('falls back to i18n when title is empty', () => {
    expect(displayRoundTitle('', 1, t)).toBe('Round 2')
    expect(displayRoundTitle('  ', 0, t)).toBe('Round 1')
    expect(displayCategoryTitle(undefined, 0, t)).toBe('Category 1')
  })

  it('treats legacy English/localized defaults as placeholders', () => {
    expect(displayRoundTitle('Round 1', 0, t)).toBe('Round 1')
    expect(displayRoundTitle('Раунд 2', 1, t)).toBe('Round 2')
    expect(displayCategoryTitle('Category 3', 2, t)).toBe('Category 3')
    expect(displayCategoryTitle('Категория 1', 0, t)).toBe('Category 1')
  })

  it('keeps custom stored titles', () => {
    expect(displayRoundTitle('Final', 0, t)).toBe('Final')
    expect(displayCategoryTitle('History', 2, t)).toBe('History')
  })
})
