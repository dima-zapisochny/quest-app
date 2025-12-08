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
  answeredBy?: {
    playerId: string
    playerName: string
    playerAvatar: string
  }
  questionMedia?: MediaAsset[]
  answerMedia?: MediaAsset[]
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
  rounds: Round[]
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
}

export type GameSession = {
  id: string
  code: string
  questId: string
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

