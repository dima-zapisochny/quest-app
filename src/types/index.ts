export type MediaAsset = {
  id: string
  type: 'image' | 'audio'
  name: string
  url: string
  delay?: number // Время появления в секундах (только для изображений)
}

export type Question = {
  id: string
  value: number
  question: string
  answer: string
  played?: boolean
  /** true только когда вопрос закрыт по истечению таймера и никто не ответил правильно (показываем крестик) */
  timedOut?: boolean
  answeredBy?: {
    playerId: string
    playerName: string
    playerAvatar: string
  }
  /** Lightweight: single image URL (Supabase Storage). Prefer over questionMedia for display. */
  imageUrl?: string | null
  /** Lightweight: single audio URL (Supabase Storage). Prefer over questionMedia for display. */
  audioUrl?: string | null
  questionMedia?: MediaAsset[]
  answerMedia?: MediaAsset[]
  /** Lightweight: single image URL for answer reveal. */
  answerImageUrl?: string | null
  /** Lightweight: single audio URL for answer reveal. */
  answerAudioUrl?: string | null
}

export type Category = {
  id: string
  title: string
  questions: Question[]
}

export type Round = {
  id: string
  title: string
  description?: string
  categories: Category[]
}

export type Quest = {
  id: string
  title: string
  description?: string
  /** Відсутній або порожній — квест завантажений лише для списку; повний квест підвантажується через loadQuestFull */
  rounds?: Round[]
}

export type UserProfile = {
  id: string
  name: string
  avatar: string
}

export type PlayerStatus = 'idle' | 'buzzed' | 'queued' | 'locked'

export type Player = {
  id: string
  name: string
  avatar: string
  joinedAt: number
  status: PlayerStatus
  buzzedAt?: number
  score: number
}

export type ActiveQuestionState = {
  roundId: string
  categoryId: string
  questionId: string
  openedAt: number
  showAnswer: boolean
  timerPaused: boolean
  buzzedOrder: string[]
  currentResponderId: string | null
  responderStartedAt: number | null
  /** Клієнтський timestamp натискання «Відповісти» — для визначення, хто натиснув першим при гонці запитів */
  responderClientTs?: number | null
}

export type GameSession = {
  id: string
  code: string
  questId: string
  /** Снимок квеста при создании сессии; участники получают его по коду (квест не доступен другим пользователям в списке) */
  quest?: Quest
  hostId: string
  hostName: string
  hostAvatar: string
  state: 'lobby' | 'active' | 'completed'
  roundId?: string
  players: Player[]
  activeQuestion?: ActiveQuestionState
  createdAt: number
  updatedAt: number
}

