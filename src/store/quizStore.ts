import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Quest, Round, Category, Question, MediaAsset } from '@/types'
import { generateId } from '@/utils/id'
import { isSupabaseConfigured } from '@/config/supabase'
import {
  getAllQuests,
  getQuestById as getQuestByIdFromDb,
  getQuestByIdGlobal,
  createQuest as createQuestInDb,
  updateQuest as updateQuestInDb,
  deleteQuest as deleteQuestInDb,
  markQuestionAsPlayed as markQuestionAsPlayedInDb,
  resetQuestProgress as resetQuestProgressInDb,
  resetRoundProgress as resetRoundProgressInDb,
  getQuestProgress as getQuestProgressFromDb,
  subscribeToQuests,
  uploadQuestMedia
} from '@/services/supabaseService'
import { useGameSessionStore } from './gameSessionStore'
import kinokvestSeed from '@/data/kinokvest.json'

function createMediaAsset(
  file: File,
  url: string,
  id?: string
): MediaAsset {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const type = file.type.startsWith('audio') || extension === 'mp3' || extension === 'wav' ? 'audio' : 'image'
  return {
    id: id ?? generateId('media'),
    type,
    name: file.name,
    url
  }
}

let unsubscribeQuests: (() => void) | null = null

const SAVE_DEBOUNCE_MS = 2500

export const useQuizStore = defineStore('quiz', () => {
  const quests = ref<Quest[]>([])
  const isLoading = ref(false)
  let saveTimeoutId: ReturnType<typeof setTimeout> | null = null

  /** Відкладає збереження на SAVE_DEBOUNCE_MS; зменшує кількість запитів і таймаути при частых змінах. */
  function scheduleSave() {
    if (!isSupabaseConfigured) return
    if (saveTimeoutId) clearTimeout(saveTimeoutId)
    saveTimeoutId = setTimeout(() => {
      saveTimeoutId = null
      saveToStorage()
    }, SAVE_DEBOUNCE_MS)
  }

  /** Виконує збереження одразу (скасовує таймер дебаунсу). */
  async function flushSave() {
    if (saveTimeoutId) {
      clearTimeout(saveTimeoutId)
      saveTimeoutId = null
    }
    await saveToStorage()
  }

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

      if (userId && isSupabaseConfigured) {
        quests.value = await getAllQuests(userId)
        console.log('📂 [Quest] Loaded from DB:', quests.value.length, 'quests')
        await loadQuestProgress()
      } else {
        quests.value = []
        console.log('📂 [Quest] No user or Supabase — quests empty')
      }

      initializeSubscription()
    } catch (error) {
      console.error('Failed to load data:', error)
      quests.value = []
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
          quests.value = []
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
      const existingIndex = quests.value.findIndex(q => q.id === quest.id)
      if (existingIndex >= 0) {
        quests.value[existingIndex] = quest
        console.log('📡 [Quest] Realtime: quest updated', quest.id, quest.title)
      } else {
        quests.value = [...quests.value, quest]
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

  function updateQuest(questId: string, payload: Partial<Omit<Quest, 'id' | 'rounds'>>) {
    const quest = findQuest(questId)
    Object.assign(quest, payload)
    scheduleSave()
  }

  function replaceQuest(updatedQuest: Quest) {
    const index = quests.value.findIndex(q => q.id === updatedQuest.id)
    if (index === -1) throw new Error('Quest not found')
    quests.value[index] = updatedQuest
    scheduleSave()
  }

  async function deleteQuest(questId: string) {
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id
    if (!userId) {
      throw new Error('User must be authenticated to delete quests')
    }

    const questToDelete = quests.value.find(q => q.id === questId)
    quests.value = quests.value.filter(q => q.id !== questId)
    try {
      await deleteQuestInDb(questId, userId)
    } catch (error: unknown) {
      console.error('Error deleting quest:', error)
      // Откатываем удаление, если не удалось сохранить
      if (questToDelete) {
        quests.value.push(questToDelete)
      }
      const msg = (error as { message?: string })?.message ?? ''
      // Если бэкенд (триггер/RLS) запрещает удаление глобального квеста — подсказываем, что делать
      if (/глобаль|удалять нельзя|нельзя удалить/i.test(msg)) {
        throw new Error(
          'Удаление заблокировано настройками Supabase. В Dashboard: Database → Triggers отключите триггер на таблице quests, запрещающий удаление.'
        )
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
    scheduleSave()
    return newRound.id
  }

  async function updateRound(questId: string, roundId: string, payload: Partial<Omit<Round, 'id' | 'categories'>>) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    Object.assign(round, payload)
    scheduleSave()
  }

  async function replaceRound(questId: string, round: Round) {
    const quest = findQuest(questId)
    const index = quest.rounds.findIndex(r => r.id === round.id)
    if (index === -1) throw new Error('Round not found')
    quest.rounds[index] = round
    scheduleSave()
  }

  async function deleteRound(questId: string, roundId: string) {
    const quest = findQuest(questId)
    quest.rounds = quest.rounds.filter(r => r.id !== roundId)
    scheduleSave()
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
    scheduleSave()
    return newCategory.id
  }

  async function updateCategory(questId: string, roundId: string, categoryId: string, payload: Partial<Omit<Category, 'id' | 'questions'>>) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const category = findCategory(round, categoryId)
    Object.assign(category, payload)
    scheduleSave()
  }

  async function replaceCategory(questId: string, roundId: string, category: Category) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    const index = round.categories.findIndex(c => c.id === category.id)
    if (index === -1) throw new Error('Category not found')
    round.categories[index] = category
    scheduleSave()
  }

  async function deleteCategory(questId: string, roundId: string, categoryId: string) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    round.categories = round.categories.filter(c => c.id !== categoryId)
    scheduleSave()
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
    scheduleSave()
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
    scheduleSave()
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
    scheduleSave()
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
    scheduleSave()
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
    const sessionStore = useGameSessionStore()
    const userId = sessionStore.userProfile?.id ?? ''

    const mediaAssets: MediaAsset[] = []
    for (const file of Array.from(files)) {
      const mediaId = generateId('media')
      const storageUrl = userId && isSupabaseConfigured
        ? await uploadQuestMedia(questId, userId, file, mediaId)
        : null
      const url = storageUrl ?? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const asset = createMediaAsset(file, url, mediaId)
      mediaAssets.push(asset)
    }

    const key = target === 'question' ? 'questionMedia' : 'answerMedia'
    const current = question[key] ?? []

    if (target === 'question') {
      const imageAssets = current.filter(m => m.type === 'image')
      mediaAssets.forEach((asset, index) => {
        if (asset.type === 'image' && imageAssets.length === 0 && index === 0) {
          asset.delay = 0
        }
      })
    }

    question[key] = [...current, ...mediaAssets]
    scheduleSave()
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
    scheduleSave()
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
    
    scheduleSave()
  }

  async function resetRoundProgress(questId: string, roundId: string) {
    const quest = findQuest(questId)
    const round = findRound(quest, roundId)
    round.categories.forEach(category => {
      category.questions.forEach(question => {
        question.played = false
        question.timedOut = false
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
    
    scheduleSave()
  }

  async function resetQuestProgress(questId: string) {
    const quest = findQuest(questId)
    quest.rounds.forEach(round => {
      round.categories.forEach(category => {
        category.questions.forEach(question => {
          question.played = false
          question.timedOut = false
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
    
    scheduleSave()
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
        scheduleSave()
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

  /** Загружает квест из БД по id (без фильтра user_id) и добавляет в список. Если квест уже в списке — не дублирует. */
  async function restoreQuestFromDb(questId: string): Promise<Quest | null> {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured')
      return null
    }
    const existing = quests.value.find(q => q.id === questId)
    if (existing) {
      return existing
    }
    const quest = await getQuestByIdGlobal(questId)
    if (!quest) {
      console.warn('[QuizStore] Quest not found in DB:', questId)
      return null
    }
    quests.value.push(quest)
    console.log('[QuizStore] Restored quest from DB:', quest.title || questId)
    return quest
  }

  /** Создаёт квест как новый (все id генерируются заново) и сохраняет для текущего пользователя (импорт из JSON). */
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
          timedOut: false,
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
    scheduleSave,
    flushSave,
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
    importQuest,
    restoreQuestFromDb
  }
})

