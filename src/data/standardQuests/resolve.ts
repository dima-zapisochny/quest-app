import type { Quest } from '@/types'
import type { AppLocale } from '@/i18n'
import movieSkeleton from './content/movie-night.skeleton.json'
import hitSkeleton from './content/hit-parade.skeleton.json'

import movieUk from './content/movie-night.uk.json'
import movieEn from './content/movie-night.en.json'
import movieRu from './content/movie-night.ru.json'
import movieDe from './content/movie-night.de.json'
import movieFr from './content/movie-night.fr.json'
import movieEs from './content/movie-night.es.json'

import hitUk from './content/hit-parade.uk.json'
import hitEn from './content/hit-parade.en.json'
import hitRu from './content/hit-parade.ru.json'
import hitDe from './content/hit-parade.de.json'
import hitFr from './content/hit-parade.fr.json'
import hitEs from './content/hit-parade.es.json'

export type StandardSlug = 'movie-night' | 'hit-parade'

type SkeletonQ = { value: number; imageUrl?: string | null }
type Skeleton = {
  slug: StandardSlug
  title: string
  emoji: string
  rounds: { categories: { questions: SkeletonQ[] }[] }[]
}

type LocaleQ = { question: string; answer: string }
type LocalePack = {
  description: string
  rounds: {
    title: string
    description?: string
    categories: { title: string; questions: LocaleQ[] }[]
  }[]
}

const skeletons: Record<StandardSlug, Skeleton> = {
  'movie-night': movieSkeleton as Skeleton,
  'hit-parade': hitSkeleton as Skeleton
}

const packs: Record<StandardSlug, Record<AppLocale, LocalePack>> = {
  'movie-night': {
    uk: movieUk as LocalePack,
    en: movieEn as LocalePack,
    ru: movieRu as LocalePack,
    de: movieDe as LocalePack,
    fr: movieFr as LocalePack,
    es: movieEs as LocalePack
  },
  'hit-parade': {
    uk: hitUk as LocalePack,
    en: hitEn as LocalePack,
    ru: hitRu as LocalePack,
    de: hitDe as LocalePack,
    fr: hitFr as LocalePack,
    es: hitEs as LocalePack
  }
}

export const STANDARD_SLUGS: StandardSlug[] = ['movie-night', 'hit-parade']

/** Канонічні англійські назви (ідентифікатор у списку / сіду). */
export const STANDARD_TITLES: Record<StandardSlug, string> = {
  'movie-night': 'Movie Night',
  'hit-parade': 'Hit Parade'
}

export function slugFromStandardTitle(title: string): StandardSlug | null {
  const t = title.trim()
  for (const slug of STANDARD_SLUGS) {
    if (STANDARD_TITLES[slug] === t) return slug
  }
  return null
}

export function getStandardQuest(slug: StandardSlug, locale: AppLocale): Quest {
  const sk = skeletons[slug]
  const pack = packs[slug][locale] ?? packs[slug].en

  return {
    id: `std-${slug}`,
    title: sk.title,
    description: pack.description,
    emoji: sk.emoji,
    standardSlug: slug,
    rounds: sk.rounds.map((round, ri) => {
      const lr = pack.rounds[ri]
      return {
        id: `std-${slug}-r${ri + 1}`,
        title: lr.title,
        description: lr.description,
        categories: round.categories.map((cat, ci) => {
          const lc = lr.categories[ci]
          return {
            id: `std-${slug}-r${ri + 1}-c${ci + 1}`,
            title: lc.title,
            questions: cat.questions.map((sq, qi) => {
              const lq = lc.questions[qi]
              return {
                id: `std-${slug}-r${ri + 1}-c${ci + 1}-q${qi + 1}`,
                value: sq.value,
                question: lq.question,
                answer: lq.answer,
                imageUrl: sq.imageUrl ?? null,
                audioUrl: null,
                answerImageUrl: null,
                answerAudioUrl: null,
                questionMedia: [],
                answerMedia: []
              }
            })
          }
        })
      }
    })
  }
}

export function getAllStandardQuests(locale: AppLocale): Quest[] {
  return STANDARD_SLUGS.map(slug => getStandardQuest(slug, locale))
}

/**
 * Накладає переклад на вже збережений квест: зберігає id та стан played.
 */
export function localizeExistingStandardQuest(existing: Quest, locale: AppLocale): Quest | null {
  const slug =
    (existing.standardSlug as StandardSlug | undefined) ?? slugFromStandardTitle(existing.title)
  if (!slug || !STANDARD_SLUGS.includes(slug)) return null

  const template = getStandardQuest(slug, locale)
  const rounds = existing.rounds
  if (!rounds?.length) {
    return { ...template, id: existing.id, standardSlug: slug }
  }

  return {
    ...existing,
    title: template.title,
    description: template.description,
    emoji: template.emoji ?? existing.emoji,
    standardSlug: slug,
    rounds: rounds.map((round, ri) => {
      const tr = template.rounds![ri]
      if (!tr) return round
      return {
        ...round,
        title: tr.title,
        description: tr.description,
        categories: round.categories.map((cat, ci) => {
          const tc = tr.categories[ci]
          if (!tc) return cat
          return {
            ...cat,
            title: tc.title,
            questions: cat.questions.map((q, qi) => {
              const tq = tc.questions[qi]
              if (!tq) return q
              return {
                ...q,
                question: tq.question,
                answer: tq.answer,
                // Завжди підтягуємо актуальний imageUrl з шаблону (померлі wiki-лінкі).
                imageUrl: tq.imageUrl ?? null,
                value: tq.value
              }
            })
          }
        })
      }
    })
  }
}
