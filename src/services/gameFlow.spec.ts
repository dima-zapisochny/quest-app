import { describe, it, expect } from 'vitest'
import {
  findQuestion,
  resetPlayersStatuses,
  buildActiveQuestion,
  applyBuzzFallback,
  applyWrongAnswer,
  applyTimeoutResponderFallback,
  mergeSessionQuestSnapshot,
  reopenQuestionForRebuzz
} from './gameFlow'
import type { GameSession, Quest, Player } from '@/types'

function makeQuest(): Quest {
  return {
    id: 'quest-1',
    title: 'Q',
    rounds: [
      {
        id: 'r1',
        title: 'Round 1',
        categories: [
          {
            id: 'c1',
            title: 'Cat 1',
            questions: [
              { id: 'q1', value: 100, question: 'A?', answer: 'a' },
              { id: 'q2', value: 200, question: 'B?', answer: 'b' }
            ]
          }
        ]
      }
    ]
  }
}

function player(id: string, over: Partial<Player> = {}): Player {
  return { id, name: id, avatar: '🦊', joinedAt: 0, status: 'idle', score: 0, ...over }
}

function makeSession(players: Player[]): GameSession {
  return {
    id: 's1',
    code: 'ABCD',
    questId: 'quest-1',
    quest: makeQuest(),
    hostId: 'h',
    hostName: 'host',
    hostAvatar: '🦊',
    state: 'active',
    players,
    activeQuestion: buildActiveQuestion({ roundId: 'r1', categoryId: 'c1', questionId: 'q1' }, 1000),
    createdAt: 0,
    updatedAt: 0
  }
}

describe('findQuestion', () => {
  it('находит вопрос по round/category/question id', () => {
    const q = findQuestion(makeQuest(), 'r1', 'c1', 'q2')
    expect(q?.id).toBe('q2')
    expect(q?.value).toBe(200)
  })

  it('возвращает undefined при отсутствии квеста или неверных id', () => {
    expect(findQuestion(undefined, 'r1', 'c1', 'q1')).toBeUndefined()
    expect(findQuestion(makeQuest(), 'rX', 'c1', 'q1')).toBeUndefined()
    expect(findQuestion(makeQuest(), 'r1', 'cX', 'q1')).toBeUndefined()
    expect(findQuestion(makeQuest(), 'r1', 'c1', 'qX')).toBeUndefined()
  })

  it('не падает на квесте-заглушке из списка (rounds отсутствуют)', () => {
    expect(findQuestion({ id: 'x', title: 't' }, 'r1', 'c1', 'q1')).toBeUndefined()
  })
})

describe('mergeSessionQuestSnapshot', () => {
  const full = makeQuest()
  const stub = { id: 'quest-1', title: 't' }

  it('берёт серверный снимок, если в нём есть rounds', () => {
    expect(mergeSessionQuestSnapshot(full, stub as Quest)).toBe(full)
  })

  it('сохраняет локальный снимок, если incoming без rounds', () => {
    expect(mergeSessionQuestSnapshot(undefined, full)).toBe(full)
    expect(mergeSessionQuestSnapshot(stub as Quest, full)).toBe(full)
  })

  it('возвращает undefined, если ни один снимок полный', () => {
    expect(mergeSessionQuestSnapshot(undefined, undefined)).toBeUndefined()
    expect(mergeSessionQuestSnapshot(stub as Quest, undefined)).toBeUndefined()
  })
})

describe('buildActiveQuestion', () => {
  it('строит свежее состояние вопроса', () => {
    const aq = buildActiveQuestion({ roundId: 'r1', categoryId: 'c1', questionId: 'q1' }, 5000)
    expect(aq).toMatchObject({
      roundId: 'r1', categoryId: 'c1', questionId: 'q1',
      openedAt: 5000, showAnswer: false, timerPaused: false,
      buzzedOrder: [], currentResponderId: null, responderStartedAt: null
    })
  })
})

describe('resetPlayersStatuses', () => {
  it('сбрасывает статусы и buzzedAt', () => {
    const s = makeSession([player('p1', { status: 'buzzed', buzzedAt: 10 }), player('p2', { status: 'locked' })])
    resetPlayersStatuses(s)
    expect(s.players.every(p => p.status === 'idle' && p.buzzedAt === undefined)).toBe(true)
  })

  it('принимает целевой статус', () => {
    const s = makeSession([player('p1')])
    resetPlayersStatuses(s, 'locked')
    expect(s.players[0].status).toBe('locked')
  })
})

describe('applyBuzzFallback', () => {
  it('первый нажавший становится отвечающим и ставит таймер на паузу', () => {
    const s = makeSession([player('p1'), player('p2')])
    applyBuzzFallback(s, 'p1', 2000)
    const aq = s.activeQuestion!
    expect(aq.currentResponderId).toBe('p1')
    expect(aq.buzzedOrder).toEqual(['p1'])
    expect(aq.timerPaused).toBe(true)
    expect(aq.responderStartedAt).toBe(2000)
    expect(s.players.find(p => p.id === 'p1')!.status).toBe('buzzed')
  })

  it('второй нажавший встаёт в очередь', () => {
    const s = makeSession([player('p1'), player('p2')])
    applyBuzzFallback(s, 'p1', 2000)
    applyBuzzFallback(s, 'p2', 2100)
    const aq = s.activeQuestion!
    expect(aq.currentResponderId).toBe('p1')
    expect(aq.buzzedOrder).toEqual(['p1', 'p2'])
    expect(s.players.find(p => p.id === 'p2')!.status).toBe('queued')
  })

  it('игнорирует неизвестного игрока', () => {
    const s = makeSession([player('p1')])
    applyBuzzFallback(s, 'ghost', 2000)
    expect(s.activeQuestion!.currentResponderId).toBeNull()
  })
})

describe('applyWrongAnswer', () => {
  it('блокирует отвечающего, очищает очередь, разблокирует остальных', () => {
    const s = makeSession([player('p1', { status: 'buzzed' }), player('p2', { status: 'queued' })])
    s.activeQuestion!.currentResponderId = 'p1'
    s.activeQuestion!.buzzedOrder = ['p1', 'p2']
    s.activeQuestion!.timerPaused = true

    applyWrongAnswer(s)
    const aq = s.activeQuestion!
    expect(s.players.find(p => p.id === 'p1')!.status).toBe('locked')
    expect(s.players.find(p => p.id === 'p2')!.status).toBe('idle')
    expect(aq.currentResponderId).toBeNull()
    expect(aq.buzzedOrder).toEqual([])
    expect(aq.timerPaused).toBe(false)
  })
})

describe('applyTimeoutResponderFallback', () => {
  it('блокирует отвечающего и возобновляет таймер для остальных', () => {
    const s = makeSession([player('p1', { status: 'buzzed' }), player('p2', { status: 'idle' })])
    s.activeQuestion!.currentResponderId = 'p1'
    s.activeQuestion!.responderStartedAt = 500
    s.activeQuestion!.timerPaused = true

    applyTimeoutResponderFallback(s, 'p1')
    const aq = s.activeQuestion!
    expect(s.players.find(p => p.id === 'p1')!.status).toBe('locked')
    expect(aq.currentResponderId).toBeNull()
    expect(aq.responderStartedAt).toBeNull()
    expect(aq.timerPaused).toBe(false)
    expect(aq.buzzedOrder).toEqual([])
  })
})

describe('reopenQuestionForRebuzz', () => {
  it('очищает buzzedOrder и timerPaused после таймаута без текущего отвечающего', () => {
    const s = makeSession([
      player('p1', { status: 'locked' }),
      player('p2', { status: 'queued' })
    ])
    s.activeQuestion!.currentResponderId = null
    s.activeQuestion!.buzzedOrder = ['p1', 'p2']
    s.activeQuestion!.timerPaused = true
    s.activeQuestion!.responderStartedAt = 123

    expect(reopenQuestionForRebuzz(s)).toBe(true)
    expect(s.activeQuestion!.buzzedOrder).toEqual([])
    expect(s.activeQuestion!.timerPaused).toBe(false)
    expect(s.activeQuestion!.responderStartedAt).toBeNull()
    expect(s.players.find(p => p.id === 'p2')!.status).toBe('idle')
    expect(s.players.find(p => p.id === 'p1')!.status).toBe('locked')
  })

  it('не трогает сессию, если уже есть отвечающий', () => {
    const s = makeSession([player('p1', { status: 'buzzed' })])
    s.activeQuestion!.currentResponderId = 'p1'
    s.activeQuestion!.buzzedOrder = ['p1']
    expect(reopenQuestionForRebuzz(s)).toBe(false)
    expect(s.activeQuestion!.buzzedOrder).toEqual(['p1'])
  })
})
