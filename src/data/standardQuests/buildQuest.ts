import type { Quest } from '@/types'

export type QInput = {
  value: number
  question: string
  answer: string
  imageUrl?: string
  audioUrl?: string
  answerImageUrl?: string
  answerAudioUrl?: string
}

export type CatInput = { title: string; questions: QInput[] }
export type RoundInput = { title: string; description?: string; categories: CatInput[] }

/** Збирає повний Quest з фіксованими id (для ідемпотентного сіду за назвою). */
export function buildStandardQuest(
  slug: string,
  title: string,
  description: string,
  emoji: string,
  rounds: RoundInput[]
): Quest {
  return {
    id: `std-${slug}`,
    title,
    description,
    emoji,
    rounds: rounds.map((round, ri) => ({
      id: `std-${slug}-r${ri + 1}`,
      title: round.title,
      description: round.description,
      categories: round.categories.map((cat, ci) => ({
        id: `std-${slug}-r${ri + 1}-c${ci + 1}`,
        title: cat.title,
        questions: cat.questions.map((q, qi) => ({
          id: `std-${slug}-r${ri + 1}-c${ci + 1}-q${qi + 1}`,
          value: q.value,
          question: q.question,
          answer: q.answer,
          imageUrl: q.imageUrl ?? null,
          audioUrl: q.audioUrl ?? null,
          answerImageUrl: q.answerImageUrl ?? null,
          answerAudioUrl: q.answerAudioUrl ?? null,
          questionMedia: [],
          answerMedia: []
        }))
      }))
    }))
  }
}

/** Зручний хелпер: [value, question, answer, media?] */
export function q(
  value: number,
  question: string,
  answer: string,
  media?: Partial<Pick<QInput, 'imageUrl' | 'audioUrl' | 'answerImageUrl' | 'answerAudioUrl'>>
): QInput {
  return { value, question, answer, ...media }
}
