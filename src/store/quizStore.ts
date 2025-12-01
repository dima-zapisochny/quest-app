import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Quest, Round, Category, Question, MediaAsset } from '@/types'
import { generateId } from '@/utils/id'
import {
  getAllQuests,
  getQuestById as getQuestByIdFromDb,
  createQuest as createQuestInDb,
  updateQuest as updateQuestInDb,
  deleteQuest as deleteQuestInDb,
  markQuestionAsPlayed as markQuestionAsPlayedInDb,
  resetQuestProgress as resetQuestProgressInDb,
  resetRoundProgress as resetRoundProgressInDb,
  getQuestProgress as getQuestProgressFromDb,
  subscribeToQuests
} from '@/services/supabaseService'
import { useGameSessionStore } from './gameSessionStore'

function createMediaAsset(file: File, dataUrl: string): MediaAsset {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const type = file.type.startsWith('audio') || extension === 'mp3' || extension === 'wav' ? 'audio' : 'image'
  return {
    id: generateId('media'),
    type,
    name: file.name,
    url: dataUrl
  }
}

let unsubscribeQuests: (() => void) | null = null

export const useQuizStore = defineStore('quiz', () => {
  const quests = ref<Quest[]>([])
  const isLoading = ref(false)

  // Helpers ------------------------------------------------------------------
  async function saveToStorage() {
    // Сохраняем каждый квест в Supabase
    for (const quest of quests.value) {
      try {
        const existing = await getQuestByIdFromDb(quest.id)
        if (existing) {
          await updateQuestInDb(quest)
        } else {
          await createQuestInDb(quest)
        }
      } catch (error) {
        console.error('Failed to save quest to Supabase:', error)
        // Fallback to localStorage
        try {
          localStorage.setItem(`quiz-app-quest-${quest.id}`, JSON.stringify(quest))
        } catch (e) {
          console.error('Failed to save to localStorage:', e)
        }
      }
    }
  }

  async function loadFromStorage() {
    isLoading.value = true
    try {
      // Загружаем из Supabase
      const dbQuests = await getAllQuests()
      if (dbQuests.length > 0) {
        quests.value = dbQuests
      } else {
        // Fallback: загружаем из localStorage
        const stored = localStorage.getItem('quiz-app-data')
        if (stored) {
          try {
            quests.value = JSON.parse(stored)
          } catch (error) {
            console.error('Failed to parse localStorage data:', error)
          }
        }
      }
      
      // Загружаем прогресс для каждого квеста
      await loadQuestProgress()
    } catch (error) {
      console.error('Failed to load data:', error)
      // Fallback: загружаем из localStorage
      const stored = localStorage.getItem('quiz-app-data')
      if (stored) {
        try {
          quests.value = JSON.parse(stored)
        } catch (e) {
          console.error('Failed to parse localStorage data:', e)
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  async function loadQuestProgress() {
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) return

    for (const quest of quests.value) {
      try {
        const progress = await getQuestProgressFromDb(quest.id, userId)
        // Применяем прогресс к квесту
        progress.forEach(p => {
          const round = quest.rounds.find(r => r.id === p.roundId)
          if (round) {
            const category = round.categories.find(c => c.id === p.categoryId)
            if (category) {
              const question = category.questions.find(q => q.id === p.questionId)
              if (question) {
                question.played = true
              }
            }
          }
        })
      } catch (error) {
        console.error(`Failed to load progress for quest ${quest.id}:`, error)
      }
    }
  }

  // Инициализация при создании store
  if (typeof window !== 'undefined') {
    loadFromStorage()

    // Подписываемся на изменения квестов через real-time
    unsubscribeQuests = subscribeToQuests((quest) => {
      const existingIndex = quests.value.findIndex(q => q.id === quest.id)
      if (existingIndex >= 0) {
        quests.value[existingIndex] = quest
      } else {
        quests.value.push(quest)
      }
    })
  }

  function findQuest(questId: string) {
    const quest = quests.value.find(q => q.id === questId)
    if (!quest) throw new Error('Quest not found')
    return quest
  }

  function findRound(quest: Quest, roundId: string) {
    const round = quest.rounds.find(r => r.id === roundId)
    if (!round) throw new Error('Round not found')
    return round
  }

  function findCategory(round: Round, categoryId: string) {
    const category = round.categories.find(c => c.id === categoryId)
    if (!category) throw new Error('Category not found')
    return category
  }

  function findQuestion(category: Category, questionId: string) {
    const question = category.questions.find(q => q.id === questionId)
    if (!question) throw new Error('Question not found')
    return question
  }

  // Getters ------------------------------------------------------------------
  function getQuestById(questId: string): Quest | undefined {
    return quests.value.find(q => q.id === questId)
  }

  const getRoundById = computed(() => (questId: string, roundId: string) => {
    const quest = quests.value.find(q => q.id === questId)
    if (!quest) return undefined
    return quest.rounds.find(r => r.id === roundId)
  })

  const getRoundStats = computed(() => (questId: string, roundId: string) => {
    const quest = quests.value.find(q => q.id === questId)
    if (!quest || !Array.isArray(quest.rounds)) {
      return { total: 0, played: 0 }
    }
    const round = quest.rounds.find(r => r.id === roundId)
    if (!round || !Array.isArray(round.categories)) {
      return { total: 0, played: 0 }
    }
    const total = round.categories.reduce((sum, cat) => sum + (cat.questions?.length ?? 0), 0)
    const played = round.categories.reduce(
      (sum, cat) => sum + (cat.questions?.filter(q => q.played).length ?? 0),
      0
    )
    return { total, played }
  })

  const getQuestProgress = computed(() => (questId: string) => {
    const quest = quests.value.find(q => q.id === questId)
    if (!quest || !Array.isArray(quest.rounds)) {
      return { totalRounds: 0, totalQuestions: 0, playedQuestions: 0 }
    }
    const totalRounds = quest.rounds.length
    const totalQuestions = quest.rounds.reduce((sum, round) => {
      const categories = Array.isArray(round.categories) ? round.categories : []
      return sum + categories.reduce((catSum, cat) => catSum + (cat.questions?.length ?? 0), 0)
    }, 0)
    const playedQuestions = quest.rounds.reduce((sum, round) => {
      const categories = Array.isArray(round.categories) ? round.categories : []
      return (
        sum +
        categories.reduce(
          (catSum, cat) => catSum + (cat.questions?.filter(q => q.played).length ?? 0),
          0
        )
      )
    }, 0)
    return { totalRounds, totalQuestions, playedQuestions }
  })

  // Quest actions -------------------------------------------------------------
  async function createQuest(title: string, description = ''): Promise<string> {
    const newQuest: Quest = {
      id: generateId('quest'),
      title,
      description,
      rounds: []
    }
    quests.value.push(newQuest)
    try {
      await createQuestInDb(newQuest)
    } catch (error) {
      console.error('Error creating quest:', error)
      // Fallback: сохраняем локально
      await saveToStorage()
    }
    return newQuest.id
  }

  async function updateQuest(questId: string, payload: Partial<Omit<Quest, 'id' | 'rounds'>>) {
    const quest = findQuest(questId)
    Object.assign(quest, payload)
    try {
      await updateQuestInDb(quest)
    } catch (error) {
      console.error('Error updating quest:', error)
      // Fallback: сохраняем локально
      await saveToStorage()
    }
  }

  async function replaceQuest(updatedQuest: Quest) {
    const index = quests.value.findIndex(q => q.id === updatedQuest.id)
    if (index === -1) throw new Error('Quest not found')
    quests.value[index] = updatedQuest
    try {
      await updateQuestInDb(updatedQuest)
    } catch (error) {
      console.error('Error replacing quest:', error)
      // Fallback: сохраняем локально
      await saveToStorage()
    }
  }

  async function deleteQuest(questId: string) {
    quests.value = quests.value.filter(q => q.id !== questId)
    try {
      await deleteQuestInDb(questId)
    } catch (error) {
      console.error('Error deleting quest:', error)
      // Fallback: сохраняем локально
      await saveToStorage()
    }
  }

  // Round actions -------------------------------------------------------------
  async function addRound(questId: string, title: string, description = ''): Promise<string> {
    const quest = findQuest(questId)
    if (!Array.isArray(quest.rounds)) {
      quest.rounds = []
    }
    if (quest.rounds.length >= 10) throw new Error('Maximum 10 rounds per quest')
    const newRound: Round = {
      id: generateId('round'),
      title,
      description,
      categories: []
    }
    quest.rounds.push(newRound)
    await saveToStorage()
    return newRound.id
  }

  async function updateRound(questId: string, roundId: string, payload: Partial<Omit<Round, 'id' | 'categories'>>) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    Object.assign(round, payload)
    await saveToStorage()
  }

  async function replaceRound(questId: string, round: Round) {
    const quest = findQuest(questId)
    const index = quest.rounds.findIndex(r => r.id === round.id)
    if (index === -1) throw new Error('Round not found')
    quest.rounds[index] = round
    await saveToStorage()
  }

  async function deleteRound(questId: string, roundId: string) {
    const quest = findQuest(questId)
    quest.rounds = quest.rounds.filter(r => r.id !== roundId)
    await saveToStorage()
  }

  // Category actions ---------------------------------------------------------
  async function addCategory(questId: string, roundId: string, title: string): Promise<string> {
    const quest = findQuest(questId)
    if (!Array.isArray(quest.rounds)) {
      quest.rounds = []
    }
    const round = findRound(quest, roundId)
    if (!Array.isArray(round.categories)) {
      round.categories = []
    }
    if (round.categories.length >= 8) throw new Error('Maximum 8 categories per round')
    const newCategory: Category = {
      id: generateId('category'),
      title,
      questions: []
    }
    round.categories.push(newCategory)
    await saveToStorage()
    return newCategory.id
  }

  async function updateCategory(questId: string, roundId: string, categoryId: string, payload: Partial<Omit<Category, 'id' | 'questions'>>) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const category = findCategory(round, categoryId)
    Object.assign(category, payload)
    await saveToStorage()
  }

  async function replaceCategory(questId: string, roundId: string, category: Category) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const index = round.categories.findIndex(c => c.id === category.id)
    if (index === -1) throw new Error('Category not found')
    round.categories[index] = category
    await saveToStorage()
  }

  async function deleteCategory(questId: string, roundId: string, categoryId: string) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    round.categories = round.categories.filter(c => c.id !== categoryId)
    await saveToStorage()
  }

  // Question actions ---------------------------------------------------------
  async function addQuestion(
    questId: string,
    roundId: string,
    categoryId: string,
    value: number,
    questionText: string,
    answer: string
  ): Promise<string> {
    const quest = findQuest(questId)
    if (!Array.isArray(quest.rounds)) {
      quest.rounds = []
    }
    const round = findRound(quest, roundId)
    if (!Array.isArray(round.categories)) {
      round.categories = []
    }
    const category = findCategory(round, categoryId)
    if (!Array.isArray(category.questions)) {
      category.questions = []
    }
    if (category.questions.length >= 10) throw new Error('Maximum 10 questions per category')

    const newQuestion: Question = {
      id: generateId('question'),
      value,
      question: questionText,
      answer,
      played: false,
      questionMedia: [],
      answerMedia: []
    }
    category.questions.push(newQuestion)
    await saveToStorage()
    return newQuestion.id
  }

  async function updateQuestion(
    questId: string,
    roundId: string,
    categoryId: string,
    questionId: string,
    payload: Partial<Omit<Question, 'id'>>
  ) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const category = findCategory(round, categoryId)
    const question = findQuestion(category, questionId)
    Object.assign(question, payload)
    await saveToStorage()
  }

  async function replaceQuestion(
    questId: string,
    roundId: string,
    categoryId: string,
    question: Question
  ) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const category = findCategory(round, categoryId)
    const index = category.questions.findIndex(q => q.id === question.id)
    if (index === -1) throw new Error('Question not found')
    category.questions[index] = question
    await saveToStorage()
  }

  async function deleteQuestion(
    questId: string,
    roundId: string,
    categoryId: string,
    questionId: string
  ) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const category = findCategory(round, categoryId)
    category.questions = category.questions.filter(q => q.id !== questionId)
    await saveToStorage()
  }

  async function appendQuestionMedia(
    questId: string,
    roundId: string,
    categoryId: string,
    questionId: string,
    files: FileList,
    target: 'question' | 'answer'
  ) {
    if (!files.length) return []
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const category = findCategory(round, categoryId)
    const question = findQuestion(category, questionId)

    const promises = Array.from(files).map(
      file =>
        new Promise<MediaAsset>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve(createMediaAsset(file, String(reader.result)))
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    )

    const mediaAssets = await Promise.all(promises)
    const key = target === 'question' ? 'questionMedia' : 'answerMedia'
    const current = question[key] ?? []
    question[key] = [...current, ...mediaAssets]
    await saveToStorage()
    return mediaAssets
  }

  async function removeQuestionMedia(
    questId: string,
    roundId: string,
    categoryId: string,
    questionId: string,
    mediaId: string,
    target: 'question' | 'answer'
  ) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const category = findCategory(round, categoryId)
    const question = findQuestion(category, questionId)
    const key = target === 'question' ? 'questionMedia' : 'answerMedia'
    const current = question[key] ?? []
    question[key] = current.filter(item => item.id !== mediaId)
    await saveToStorage()
  }

  async function markQuestionAsPlayed(
    questId: string,
    roundId: string,
    categoryId: string,
    questionId: string,
    answeredBy?: { playerId: string; playerName: string; playerAvatar: string }
  ) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const category = findCategory(round, categoryId)
    const question = findQuestion(category, questionId)
    question.played = true
    if (answeredBy) {
      question.answeredBy = answeredBy
    }
    
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (userId) {
      try {
        await markQuestionAsPlayedInDb(questId, userId, roundId, categoryId, questionId)
      } catch (error) {
        console.error('Error marking question as played:', error)
      }
    }
    
    await saveToStorage()
  }

  async function resetRoundProgress(questId: string, roundId: string) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    round.categories.forEach(category => {
      category.questions.forEach(question => {
        question.played = false
      })
    })
    
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (userId) {
      try {
        await resetRoundProgressInDb(questId, userId, roundId)
      } catch (error) {
        console.error('Error resetting round progress:', error)
      }
    }
    
    await saveToStorage()
  }

  async function resetQuestProgress(questId: string) {
    const quest = findQuest(questId)
    quest.rounds.forEach(round => {
      round.categories.forEach(category => {
        category.questions.forEach(question => {
          question.played = false
        })
      })
    })
    
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (userId) {
      try {
        await resetQuestProgressInDb(questId, userId)
      } catch (error) {
        console.error('Error resetting quest progress:', error)
      }
    }
    
    await saveToStorage()
  }

  // Export / Import ----------------------------------------------------------
  function exportData(): string {
    return JSON.stringify(quests.value, null, 2)
  }

  function importData(json: string) {
    try {
      const data = JSON.parse(json)
      if (Array.isArray(data)) {
        quests.value = data
        saveToStorage()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import data', error)
      return false
    }
  }

  async function clearAllData() {
    // Удаляем все квесты из Supabase
    for (const quest of quests.value) {
      try {
        await deleteQuestInDb(quest.id)
      } catch (error) {
        console.error('Error deleting quest:', error)
      }
    }
    quests.value = []
    localStorage.removeItem('quiz-app-data')
  }

  return {
    quests,
    isLoading,
    loadFromStorage,
    saveToStorage,
    getQuestById,
    getRoundById,
    getRoundStats,
    getQuestProgress,
    createQuest,
    updateQuest,
    replaceQuest,
    deleteQuest,
    addRound,
    updateRound,
    replaceRound,
    deleteRound,
    addCategory,
    updateCategory,
    replaceCategory,
    deleteCategory,
    addQuestion,
    updateQuestion,
    replaceQuestion,
    deleteQuestion,
    appendQuestionMedia,
    removeQuestionMedia,
    markQuestionAsPlayed,
    resetRoundProgress,
    resetQuestProgress,
    exportData,
    importData,
    clearAllData
  }
})

