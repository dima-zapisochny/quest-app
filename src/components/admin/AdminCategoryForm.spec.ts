import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AdminCategoryForm from './AdminCategoryForm.vue'
import { useQuizStore } from '@/store/quizStore'
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
            }
          ]
        }
      ]
    }
  ]
}

describe('AdminCategoryForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useQuizStore()
    store.quests = JSON.parse(JSON.stringify([questTemplate]))
  })

  const globalStubs = {
    stubs: {
      AdminQuestionRow: {
        template: '<tr class="question-row-stub"></tr>',
        props: ['questId', 'roundId', 'categoryId', 'question']
      }
    }
  }

  function mountWithStore(categoryIndex = 0) {
    const store = useQuizStore()
    const quest = store.getQuestById('quest-test')!
    const round = quest.rounds[0]
    const category = round.categories[categoryIndex]
    return {
      wrapper: mount(AdminCategoryForm, {
        props: {
          questId: quest.id,
          roundId: round.id,
          category
        },
        global: globalStubs
      }),
      store,
      quest,
      round,
      category
    }
  }

  it('renders category title', () => {
    const { wrapper } = mountWithStore()
    const input = wrapper.find('.category-title-input')
    expect((input.element as HTMLInputElement).value).toBe('Test Category')
  })

  it('updates category title in store when input changes', async () => {
    const { wrapper, category } = mountWithStore()
    const input = wrapper.find('.category-title-input')
    await input.setValue('Новая категория')
    expect(category.title).toBe('Новая категория')
  })

  it('emits delete when delete button is clicked', async () => {
    const { wrapper } = mountWithStore()
    const deleteButton = wrapper.find('.delete-button')
    await deleteButton.trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
  })

  it('adds question when under limit', async () => {
    const { wrapper, category, store } = mountWithStore()
    expect(category.questions.length).toBe(1)
    const addButton = wrapper.find('.add-question-button')
    expect(addButton.exists()).toBe(true)
    await addButton.trigger('click')
    expect(category.questions.length).toBe(2)
    // последний вопрос должен принадлежать store и иметь значения по умолчанию
    const addedQuestion = category.questions.at(-1)!
    expect(addedQuestion.question).toBe('Новый вопрос')
    // очистка для следующего теста
    store.deleteQuestion('quest-test', 'round-test', 'category-test', addedQuestion.id)
  })

  it('hides add button when question limit reached', () => {
    const store = useQuizStore()
    const quest = store.getQuestById('quest-test')!
    const round = quest.rounds[0]
    round.categories[0].questions = Array.from({ length: 10 }, (_, index) => ({
      id: `q-${index}`,
      value: 100,
      question: `Question ${index}`,
      answer: `Answer ${index}`,
      played: false,
      questionMedia: [],
      answerMedia: []
    }))

    const { wrapper } = mountWithStore()
    expect(wrapper.find('.add-question-button').exists()).toBe(false)
  })

  it('shows empty message when no questions', () => {
    const store = useQuizStore()
    const quest = store.getQuestById('quest-test')!
    const round = quest.rounds[0]
    round.categories[0].questions = []

    const { wrapper } = mountWithStore()
    expect(wrapper.find('.empty-questions').exists()).toBe(true)
  })

  it('renders accordion when questions exist', () => {
    const { wrapper } = mountWithStore()
    expect(wrapper.find('.questions-accordion').exists()).toBe(true)
  })
})

