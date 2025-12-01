import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QuizTile from './QuizTile.vue'
import type { Question } from '@/types'

describe('QuizTile', () => {
  const mockQuestion: Question = {
    id: '1',
    value: 100,
    question: 'Test question?',
    answer: 'Test answer',
    played: false
  }

  it('renders question value when not played', () => {
    const wrapper = mount(QuizTile, {
      props: {
        question: mockQuestion
      }
    })

    expect(wrapper.text()).toContain('100')
    expect(wrapper.find('.quiz-tile-value').exists()).toBe(true)
  })

  it('renders played icon when question is played', () => {
    const playedQuestion: Question = {
      ...mockQuestion,
      played: true
    }

    const wrapper = mount(QuizTile, {
      props: {
        question: playedQuestion
      }
    })

    expect(wrapper.find('.quiz-tile-played-icon').exists()).toBe(true)
    expect(wrapper.find('.quiz-tile-value').exists()).toBe(false)
  })

  it('emits click event when clicked and not played', async () => {
    const wrapper = mount(QuizTile, {
      props: {
        question: mockQuestion
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')?.[0]).toEqual([mockQuestion])
  })

  it('does not emit click when question is played', async () => {
    const playedQuestion: Question = {
      ...mockQuestion,
      played: true
    }

    const wrapper = mount(QuizTile, {
      props: {
        question: playedQuestion
      }
    })

    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeFalsy()
  })

  it('has correct classes when played', () => {
    const playedQuestion: Question = {
      ...mockQuestion,
      played: true
    }

    const wrapper = mount(QuizTile, {
      props: {
        question: playedQuestion
      }
    })

    expect(wrapper.classes()).toContain('quiz-tile--played')
  })
})



