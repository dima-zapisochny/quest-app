import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Quest, Round, Category, Question, MediaAsset } from '@/types'
import { generateId } from '@/utils/id'
import { isSupabaseConfigured } from '@/config/supabase'
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
import musicQuestSeed from '@/data/musicQuest.json'
import kinokvestSeed from '@/data/kinokvest.json'
/** Фиксированные id глобальных квестов — одинаковы у всех пользователей, прогресс хранится по ним */
const GLOBAL_MUSIC_QUEST_ID = 'global-music'
const GLOBAL_KINOKVEST_QUEST_ID = 'global-kinokvest'

function isGlobalQuestId(id: string): boolean {
  return id === GLOBAL_MUSIC_QUEST_ID || id === GLOBAL_KINOKVEST_QUEST_ID
}

/** Собирает квест из JSON с фиксированными id (квест, раунды, категории, вопросы) для глобального отображения и прогресса */
function buildGlobalQuest(seed: Quest, questId: string): Quest {
  const clone = JSON.parse(JSON.stringify(seed)) as Quest
  clone.id = questId
  clone.rounds = (clone.rounds || []).map((r, ri) => {
    const roundId = `${questId}-r${ri}`
    const round = { ...r, id: roundId, categories: r.categories || [] }
    round.categories = round.categories.map((c, ci) => {
      const categoryId = `${roundId}-c${ci}`
      const cat = { ...c, id: categoryId, questions: c.questions || [] }
      cat.questions = cat.questions.map((q, qi) => ({
        ...q,
        id: `${categoryId}-q${qi}`,
        played: false,
        answeredBy: undefined,
        questionMedia: q.questionMedia || [],
        answerMedia: q.answerMedia || []
      }))
      return cat
    })
    return round
  })
  return clone
}

/** Глобальные квесты по умолчанию — всегда видны всем (гостям и авторизованным) */
function getGlobalDefaultQuests(): Quest[] {
  return [
    buildGlobalQuest(musicQuestSeed as Quest, GLOBAL_MUSIC_QUEST_ID),
    buildGlobalQuest(kinokvestSeed as Quest, GLOBAL_KINOKVEST_QUEST_ID)
  ]
}

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
    if (!isSupabaseConfigured) return
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) {
      console.warn('Cannot save quests: user not authenticated')
      return
    }
    for (const quest of quests.value) {
      if (isGlobalQuestId(quest.id)) continue
      try {
        const existing = await getQuestByIdFromDb(quest.id, userId)
        if (existing) {
          await updateQuestInDb(quest, userId)
        } else {
          await createQuestInDb(quest, userId)
        }
      } catch (error) {
        console.error('Failed to save quest to Supabase:', error)
      }
    }
  }

  async function loadFromStorage() {
    isLoading.value = true
    try {
      const sessionStore = useGameSessionStore()
      const userId = sessionStore.userProfile?.id
      const globalQuests = getGlobalDefaultQuests()

      if (userId && isSupabaseConfigured) {
        const dbQuests = await getAllQuests(userId)
        const userOnlyQuests = dbQuests.filter(
          q => q.title !== 'Музыкальная викторина' && q.title !== 'Киноквест'
        )
        quests.value = [...globalQuests, ...userOnlyQuests]
        console.log('📂 [Quest] Loaded: global (2) + from storage:', userOnlyQuests.length, 'quests')
      } else {
        quests.value = [...globalQuests]
        console.log('📂 [Quest] Loaded: global quests only', userId ? '(Supabase not configured)' : '(guest)')
      }

      if (isSupabaseConfigured) {
        await loadQuestProgress()
      }
      initializeSubscription()
    } catch (error) {
      console.error('Failed to load data:', error)
      quests.value = getGlobalDefaultQuests()
      initializeSubscription()
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
    // Следим за изменениями userProfile и загружаем квесты при авторизации
    const sessionStore = useGameSessionStore()
    watch(
      () => sessionStore.userProfile?.id,
      (userId) => {
        if (userId) {
          loadFromStorage()
        } else {
          quests.value = getGlobalDefaultQuests()
          if (unsubscribeQuests) {
            unsubscribeQuests()
            unsubscribeQuests = null
          }
        }
      },
      { immediate: true }
    )
  }
  
  // Функция для инициализации подписки на изменения квестов
  function initializeSubscription() {
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) return
    
    // Отписываемся от старой подписки, если она есть
    if (unsubscribeQuests) {
      unsubscribeQuests()
      unsubscribeQuests = null
    }
    
    // Подписываемся на изменения квестов текущего пользователя через real-time
    unsubscribeQuests = subscribeToQuests(userId, (quest) => {
      if (isGlobalQuestId(quest.id)) return
      const existingIndex = quests.value.findIndex(q => q.id === quest.id)
      if (existingIndex >= 0) {
        quests.value[existingIndex] = quest
        console.log('📡 [Quest] Realtime: quest updated', quest.id, quest.title)
      } else {
        quests.value.push(quest)
        console.log('📡 [Quest] Realtime: quest added', quest.id, quest.title)
      }
    })
    console.log('📡 [Quest] Realtime subscription initialized for user:', userId)
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
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) {
      throw new Error('User must be authenticated to create quests')
    }
    
    const newQuest: Quest = {
      id: generateId('quest'),
      title,
      description,
      rounds: []
    }
    quests.value.push(newQuest)
    try {
      await createQuestInDb(newQuest, userId)
    } catch (error) {
      console.error('Error creating quest:', error)
      // Откатываем добавление квеста, если не удалось сохранить
      quests.value = quests.value.filter(q => q.id !== newQuest.id)
      throw error
    }
    return newQuest.id
  }

  async function updateQuest(questId: string, payload: Partial<Omit<Quest, 'id' | 'rounds'>>) {
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) {
      throw new Error('User must be authenticated to update quests')
    }
    
    const quest = findQuest(questId)
    Object.assign(quest, payload)
    try {
      await updateQuestInDb(quest, userId)
    } catch (error) {
      console.error('Error updating quest:', error)
      // Откатываем изменения, если не удалось сохранить
      await loadFromStorage()
      throw error
    }
  }

  async function replaceQuest(updatedQuest: Quest) {
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) {
      throw new Error('User must be authenticated to replace quests')
    }
    
    const index = quests.value.findIndex(q => q.id === updatedQuest.id)
    if (index === -1) throw new Error('Quest not found')
    const oldQuest = quests.value[index]
    quests.value[index] = updatedQuest
    try {
      await updateQuestInDb(updatedQuest, userId)
    } catch (error) {
      console.error('Error replacing quest:', error)
      // Откатываем изменения, если не удалось сохранить
      quests.value[index] = oldQuest
      throw error
    }
  }

  async function deleteQuest(questId: string) {
    if (isGlobalQuestId(questId)) {
      throw new Error('Глобальные квесты нельзя удалить')
    }
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) {
      throw new Error('User must be authenticated to delete quests')
    }

    const questToDelete = quests.value.find(q => q.id === questId)
    quests.value = quests.value.filter(q => q.id !== questId)
    try {
      await deleteQuestInDb(questId, userId)
    } catch (error) {
      console.error('Error deleting quest:', error)
      // Откатываем удаление, если не удалось сохранить
      if (questToDelete) {
        quests.value.push(questToDelete)
      }
      throw error
    }
  }

  // Round actions -------------------------------------------------------------
  async function addRound(questId: string, title: string, description = ''): Promise<string> {
    const quest = findQuest(questId)
    if (!Array.isArray(quest.rounds)) {
      quest.rounds = []
    }
    if (quest.rounds.length >= 5) throw new Error('Максимум 5 раундов в квесте')
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
    // Если обновляется questionMedia или answerMedia, заменяем полностью
    if (payload.questionMedia) {
      question.questionMedia = payload.questionMedia
    }
    if (payload.answerMedia) {
      question.answerMedia = payload.answerMedia
    }
    // Остальные поля обновляем через Object.assign
    const { questionMedia, answerMedia, ...rest } = payload
    Object.assign(question, rest)
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
    
    // Для первого изображения в вопросе устанавливаем delay = 0
    if (target === 'question') {
      const imageAssets = current.filter(m => m.type === 'image')
      mediaAssets.forEach((asset, index) => {
        if (asset.type === 'image' && imageAssets.length === 0 && index === 0) {
          asset.delay = 0
        }
      })
    }
    
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
          question.answeredBy = undefined
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
    await sessionStore.syncSessionQuestSnapshot(questId, quest)
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
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) {
      console.warn('Cannot clear data: user not authenticated')
      return
    }
    
    // Удаляем все квесты текущего пользователя из Supabase
    for (const quest of quests.value) {
      try {
        await deleteQuestInDb(quest.id, userId)
      } catch (error) {
        console.error('Error deleting quest:', error)
      }
    }
    quests.value = []
    localStorage.removeItem(`quiz-app-data-${userId}`)
    localStorage.removeItem('quiz-app-data') // Удаляем старый формат для совместимости
  }

  async function addSeedQuest(seedFn: () => Quest): Promise<string> {
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) {
      throw new Error('User must be authenticated to add seed quests')
    }
    const quest = seedFn()
    quests.value.push(quest)
    try {
      await createQuestInDb(quest, userId)
    } catch (error) {
      console.error('Error saving seed quest:', error)
      quests.value = quests.value.filter(q => q.id !== quest.id)
      throw error
    }
    return quest.id
  }

  async function addKinokQuest(): Promise<string> {
    return importQuest(kinokvestSeed as Quest)
  }

  /** Клонирует квест с новыми id и сохраняет для текущего пользователя (импорт из JSON). */
  async function importQuest(questData: Quest): Promise<string> {
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) throw new Error('User must be authenticated to import quests')

    const clone = JSON.parse(JSON.stringify(questData)) as Quest
    const oldToNewId = new Map<string, string>()

    function newId(old: string, prefix: string): string {
      let id = oldToNewId.get(old)
      if (!id) {
        id = generateId(prefix)
        oldToNewId.set(old, id)
      }
      return id
    }

    clone.id = generateId('quest')
    clone.rounds = (clone.rounds || []).map((r) => {
      const round = { ...r, id: newId(r.id, 'round'), categories: r.categories || [] }
      round.categories = round.categories.map((c) => {
        const cat = { ...c, id: newId(c.id, 'category'), questions: c.questions || [] }
        cat.questions = cat.questions.map((q) => ({
          ...q,
          id: newId(q.id, 'q'),
          played: false,
          answeredBy: undefined,
          questionMedia: (q.questionMedia || []).map((m) => ({ ...m, id: generateId('media') })),
          answerMedia: (q.answerMedia || []).map((m) => ({ ...m, id: generateId('media') }))
        }))
        return cat
      })
      return round
    })

    quests.value.push(clone)
    try {
      await createQuestInDb(clone, userId)
    } catch (error) {
      console.error('Error importing quest:', error)
      quests.value = quests.value.filter((q) => q.id !== clone.id)
      throw error
    }
    return clone.id
  }

  return {
    quests,
    isLoading,
    loadFromStorage,
    saveToStorage,
    initializeSubscription,
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
    clearAllData,
    addSeedQuest,
    addKinokQuest,
    importQuest
  }
})

