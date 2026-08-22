import type { useQuizStore } from '@/store/quizStore'
import { movieNightQuest } from '@/data/standardQuests/movieNight'
import { hitParadeQuest } from '@/data/standardQuests/hitParade'
import type { Quest } from '@/types'

type QuizStore = ReturnType<typeof useQuizStore>

/** Порядок фіксований: кіно → музика. */
export const STANDARD_QUESTS: Quest[] = [movieNightQuest, hitParadeQuest]

export const STANDARD_QUEST_ORDER = STANDARD_QUESTS.map(q => q.title)

const STANDARD_TITLES = new Set(STANDARD_QUEST_ORDER)

export function isStandardQuestTitle(title: string): boolean {
  return STANDARD_TITLES.has(title)
}

/** Movie Night, Hit Parade зверху; решта — як були. */
export function sortQuestsWithStandardsFirst(list: Quest[]): Quest[] {
  const byTitle = new Map(list.map(q => [q.title, q]))
  const pinned: Quest[] = []
  for (const title of STANDARD_QUEST_ORDER) {
    const q = byTitle.get(title)
    if (q) pinned.push(q)
  }
  const pinnedIds = new Set(pinned.map(q => q.id))
  return [...pinned, ...list.filter(q => !pinnedIds.has(q.id))]
}

/**
 * Завжди гарантує наявність Movie Night і Hit Parade (за назвою).
 * У DEV також прибирає всі інші локальні квести.
 */
export async function seedStandardQuests(store: QuizStore): Promise<number> {
  const existing = new Set(store.quests.map(q => q.title))
  let created = 0

  for (const quest of STANDARD_QUESTS) {
    if (existing.has(quest.title)) continue
    try {
      await store.importQuest(quest)
      existing.add(quest.title)
      created++
    } catch (e) {
      console.warn('[StandardQuests] Failed to seed', quest.title, e)
    }
  }

  if (import.meta.env.DEV) {
    const extras = store.quests.filter(q => !STANDARD_TITLES.has(q.title))
    for (const quest of extras) {
      try {
        await store.deleteQuest(quest.id)
      } catch (e) {
        console.warn('[StandardQuests] Failed to remove local quest', quest.title, e)
      }
    }
    if (extras.length > 0) {
      console.log(`🧹 [Quest] Removed ${extras.length} non-standard quest(s) (DEV)`)
    }
  }

  store.quests = sortQuestsWithStandardsFirst(store.quests)

  if (created > 0) {
    console.log(`🎬🎵 [Quest] Seeded ${created} standard quest(s)`)
  }
  return created
}
