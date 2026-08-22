import type { useQuizStore } from '@/store/quizStore'
import { i18n, type AppLocale } from '@/i18n'
import { useGameSessionStore } from '@/store/gameSessionStore'
import {
  getAllStandardQuests,
  localizeExistingStandardQuest,
  slugFromStandardTitle,
  STANDARD_SLUGS,
  STANDARD_TITLES,
  type StandardSlug
} from '@/data/standardQuests/resolve'

type QuizStore = ReturnType<typeof useQuizStore>

const SEED_FLAG_PREFIX = 'quest-app:std-quests-offered:'

export { STANDARD_TITLES, STANDARD_SLUGS, slugFromStandardTitle }
export type { StandardSlug }

export const STANDARD_QUEST_ORDER = STANDARD_SLUGS.map(s => STANDARD_TITLES[s])

export function isStandardQuestTitle(title: string): boolean {
  return !!slugFromStandardTitle(title)
}

/** Movie Night, Hit Parade зверху; решта — як були. */
export function sortQuestsWithStandardsFirst<T extends { id: string; title: string; standardSlug?: string }>(
  list: T[]
): T[] {
  const pinned: T[] = []
  const used = new Set<string>()
  for (const slug of STANDARD_SLUGS) {
    const q = list.find(item => (item.standardSlug ?? slugFromStandardTitle(item.title)) === slug)
    if (q) {
      pinned.push(q)
      used.add(q.id)
    }
  }
  return [...pinned, ...list.filter(q => !used.has(q.id))]
}

function seedFlagKey(userId: string) {
  return `${SEED_FLAG_PREFIX}${userId}`
}

function wasOffered(userId: string): boolean {
  try {
    return localStorage.getItem(seedFlagKey(userId)) === '1'
  } catch {
    return false
  }
}

function markOffered(userId: string) {
  try {
    localStorage.setItem(seedFlagKey(userId), '1')
  } catch {
    /* ignore */
  }
}

function currentLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale
}

function isStandardQuest(q: { title: string; standardSlug?: string }): boolean {
  return !!(q.standardSlug || slugFromStandardTitle(q.title))
}

/** Оновлює тексти вже наявних стандартних квестів під поточну мову. */
export async function syncStandardQuestLocales(store: QuizStore): Promise<void> {
  const locale = currentLocale()
  for (const quest of [...store.quests]) {
    if (!isStandardQuest(quest)) continue

    let full = quest
    if (!quest.rounds?.length) {
      try {
        const loaded = await store.loadQuestFull(quest.id)
        if (loaded) full = loaded
      } catch (e) {
        console.warn('[StandardQuests] load for locale sync failed', quest.title, e)
        continue
      }
    }

    const localized = localizeExistingStandardQuest(full, locale)
    if (localized) store.replaceQuest(localized)
  }
  store.quests = sortQuestsWithStandardsFirst(store.quests)
}

/**
 * Один раз на користувача додає Movie Night і Hit Parade мовою UI.
 * Якщо видалив — не повертаємо. При зміні мови — syncStandardQuestLocales.
 */
export async function seedStandardQuests(store: QuizStore): Promise<number> {
  const sessionStore = useGameSessionStore()
  const userId = sessionStore.userProfile?.id
  if (!userId) return 0

  const locale = currentLocale()
  const templates = getAllStandardQuests(locale)
  const offered = wasOffered(userId)
  let created = 0

  if (!offered) {
    for (const template of templates) {
      const exists = store.quests.some(
        q =>
          q.standardSlug === template.standardSlug ||
          q.title === template.title ||
          slugFromStandardTitle(q.title) === template.standardSlug
      )
      if (exists) continue
      try {
        await store.importQuest(template)
        created++
      } catch (e) {
        console.warn('[StandardQuests] Failed to seed', template.title, e)
      }
    }
    const hasAny = store.quests.some(isStandardQuest)
    if (created > 0 || hasAny) markOffered(userId)
  }

  await syncStandardQuestLocales(store)

  if (import.meta.env.DEV) {
    const extras = store.quests.filter(q => !isStandardQuest(q))
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
    console.log(`🎬🎵 [Quest] Seeded ${created} standard quest(s) [${locale}]`)
  }
  return created
}
