import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QuestBoardEditor from './QuestBoardEditor.vue'
import { useQuizStore } from '@/store/quizStore'
import { i18n } from '@/i18n'
import type { Quest } from '@/types'

const questTemplate: Quest = {
  id: 'quest-test',
  title: 'Test Quest',
  description: '',
  rounds: [
    {
      id: 'round-test',
      title: 'Round 1',
      categories: [
        {
          id: 'category-test',
          title: 'Test Category',
          questions: [
            {
              id: 'question-1',
              value: 100,
              question: 'Test question?',
              answer: 'Test answer',
              played: false,
              questionMedia: [],
              answerMedia: []
            },
            {
              id: 'question-2',
              value: 200,
              question: '',
              answer: '',
              played: false,
              questionMedia: [],
              answerMedia: []
            }
          ]
        }
      ]
    }
  ]
}

const globalStubs = {
  plugins: [i18n],
  stubs: {
    AdminQuestionRow: {
      template: '<div class="question-row-stub"></div>',
      props: ['questId', 'roundId', 'categoryId', 'question']
    },
    teleport: true
  }
}

function mountWithStore() {
  const store = useQuizStore()
  const quest = store.getQuestById('quest-test')!
  const round = quest.rounds![0]
  return {
    wrapper: mount(QuestBoardEditor, {
      props: { questId: quest.id, round },
      global: globalStubs
    }),
    store,
    quest,
    round
  }
}

describe('QuestBoardEditor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Фиксируем язык, чтобы проверки текста не зависели от локали окружения.
    i18n.global.locale.value = 'ru'
    const store = useQuizStore()
    store.quests = JSON.parse(JSON.stringify([questTemplate]))
  })

  it('renders a column per category with a tile per question', () => {
    const { wrapper } = mountWithStore()
    expect(wrapper.findAll('.board-col').length).toBeGreaterThanOrEqual(1)
    expect(wrapper.findAll('.board-tile:not(.board-tile--add)').length).toBe(2)
  })

  it('marks filled vs empty tiles', () => {
    const { wrapper } = mountWithStore()
    const tiles = wrapper.findAll('.board-tile:not(.board-tile--add)')
    // первый вопрос заполнен, второй пустой
    expect(tiles[0].classes()).toContain('board-tile--filled')
    expect(tiles[1].classes()).not.toContain('board-tile--filled')
  })

  it('updates category title in store when input changes', async () => {
    const { wrapper, round } = mountWithStore()
    const input = wrapper.find('.board-col__title')
    await input.setValue('Новая категория')
    expect(round.categories[0].title).toBe('Новая категория')
  })

  it('opens the edit modal when a tile is clicked', async () => {
    const { wrapper } = mountWithStore()
    await wrapper.find('.board-tile:not(.board-tile--add)').trigger('click')
    expect(wrapper.find('.q-modal').exists()).toBe(true)
    expect(wrapper.find('.question-row-stub').exists()).toBe(true)
  })

  it('adds a question and opens it', async () => {
    const { wrapper, round } = mountWithStore()
    const before = round.categories[0].questions.length
    await wrapper.find('.board-tile--add').trigger('click')
    await wrapper.vm.$nextTick()
    expect(round.categories[0].questions.length).toBe(before + 1)
    expect(wrapper.find('.q-modal').exists()).toBe(true)
  })

  it('asks for confirmation before deleting a category', async () => {
    const { wrapper } = mountWithStore()
    await wrapper.find('.board-col__del').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Удалить категорию')
  })

  it('shows the grid-size picker for an empty round', () => {
    const store = useQuizStore()
    const quest = store.getQuestById('quest-test')!
    quest.rounds![0].categories = []
    const { wrapper } = mountWithStore()
    expect(wrapper.find('.board-empty').exists()).toBe(true)
    expect(wrapper.find('.gp').exists()).toBe(true)
  })

  it('builds the board immediately when a grid cell is picked', async () => {
    const store = useQuizStore()
    const id = 'quest-test'
    const round = store.getQuestById(id)!.rounds![0]
    round.categories = []
    const { wrapper } = mountWithStore()
    // c=2, r=3 → index (3-1)*5 + (2-1) = 11
    await wrapper.findAll('.gp__cell')[11].trigger('click')
    await wrapper.vm.$nextTick()
    expect(round.categories.length).toBe(2)
    expect(round.categories[0].questions.length).toBe(3)
  })
})
