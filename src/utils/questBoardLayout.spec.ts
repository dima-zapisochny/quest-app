import { describe, it, expect } from 'vitest'
import { getQuestBoardLayout, tileValue } from './questBoardLayout'

describe('questBoardLayout', () => {
  it('uses first round structure when loaded', () => {
    expect(
      getQuestBoardLayout({
        rounds: [{
          id: 'r1',
          title: 'R1',
          categories: [
            { id: 'c1', title: 'A', questions: [{ id: 'q1', value: 100, question: '', answer: '' }, { id: 'q2', value: 200, question: '', answer: '' }] },
            { id: 'c2', title: 'B', questions: [{ id: 'q3', value: 100, question: '', answer: '' }, { id: 'q4', value: 200, question: '', answer: '' }] }
          ]
        }]
      })
    ).toEqual({ cols: 2, rows: 2 })
  })

  it('estimates grid from question count', () => {
    expect(getQuestBoardLayout({ questionsCount: 9 })).toEqual({ cols: 3, rows: 3 })
    expect(getQuestBoardLayout({ questionsCount: 8 })).toEqual({ cols: 4, rows: 2 })
  })

  it('tile values follow jeopardy steps', () => {
    expect(tileValue(0)).toBe(100)
    expect(tileValue(2)).toBe(300)
  })
})
