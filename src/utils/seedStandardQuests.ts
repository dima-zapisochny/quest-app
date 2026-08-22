import type { useQuizStore } from '@/store/quizStore'
import { movieNightQuest } from '@/data/standardQuests/movieNight'
import { hitParadeQuest } from '@/data/standardQuests/hitParade'
import type { Quest } from '@/types'

type QuizStore = ReturnType<typeof useQuizStore>

/** Стандартні готові квести для всіх користувачів (не лише DEV). */
export const STANDARD_QUESTS: Quest[] = [movieNightQuest, hitParadeQuest]

const STANDARD_TITLES = new Set(STANDARD_QUESTS.map(q => q.title))

/**
 * Ідемпотентно додає Movie Night і Hit Parade, якщо ще немає квесту з такою назвою.
 * У DEV також прибирає всі інші локальні квести (тестові тощо), щоб лишились лише стандартні.
 * Повертає кількість новостворених.
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

  if (created > 0) {
    console.log(`🎬🎵 [Quest] Seeded ${created} standard quest(s)`)
  }
  return created
}
