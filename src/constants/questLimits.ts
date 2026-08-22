/** Ліміти назви/опису квесту (UI + збереження). */
export const QUEST_TITLE_MAX_LENGTH = 80
export const QUEST_DESCRIPTION_MAX_LENGTH = 300

export function clampQuestTitle(value: string): string {
  return value.slice(0, QUEST_TITLE_MAX_LENGTH)
}

export function clampQuestDescription(value: string): string {
  return value.slice(0, QUEST_DESCRIPTION_MAX_LENGTH)
}
