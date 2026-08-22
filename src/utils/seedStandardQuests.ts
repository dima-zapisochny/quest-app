import type { useQuizStore } from '@/store/quizStore'
import { movieNightQuest } from '@/data/standardQuests/movieNight'
import { hitParadeQuest } from '@/data/standardQuests/hitParade'
import type { Quest } from '@/types'

type QuizStore = ReturnType<typeof useQuizStore>

/** Стандартні готові квести для всіх користувачів (не лише DEV). */
export const STANDARD_QUESTS: Quest[] = [movieNightQuest, hitParadeQuest]

/**
 * Ідемпотентно додає Movie Night і Hit Parade, якщо ще немає квесту з такою назвою.
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

  if (created > 0) {
    console.log(`🎬🎵 [Quest] Seeded ${created} standard quest(s)`)
  }
  return created
}
