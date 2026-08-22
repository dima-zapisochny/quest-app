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
  it('returns default titles for store creation', () => {
    expect(defaultRoundTitle(0)).toBe('Раунд 1')
    expect(defaultCategoryTitle(2)).toBe('Категория 3')
  })

  it('falls back to i18n when title is empty', () => {
    expect(displayRoundTitle('', 1, t)).toBe('Round 2')
    expect(displayRoundTitle('  ', 0, t)).toBe('Round 1')
    expect(displayCategoryTitle(undefined, 0, t)).toBe('Category 1')
  })

  it('keeps non-empty stored titles', () => {
    expect(displayRoundTitle('Final', 0, t)).toBe('Final')
    expect(displayCategoryTitle('History', 2, t)).toBe('History')
  })
})
