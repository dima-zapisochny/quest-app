/** Стабільні коди помилок зі store → ключі i18n на UI-межі. */
const ERROR_KEYS: Record<string, string> = {
  SESSION_NOT_FOUND: 'landing.errNotFound',
  SESSION_FULL: 'landing.errFull',
  SESSION_CODE_EXHAUSTED: 'host.errCreateCode',
  QUEST_AUTH_REQUIRED: 'editor.errAuth',
  QUEST_ROUND_LIMIT: 'editor.errRoundLimit',
  QUEST_CATEGORY_LIMIT: 'editor.errCategoryLimit',
  QUEST_QUESTION_LIMIT: 'editor.errQuestionLimit'
}

type Translate = (key: string, params?: Record<string, unknown>) => string

export function mapAppError(err: unknown, t: Translate, fallbackKey = 'common.unknownError'): string {
  const raw = err instanceof Error ? err.message : String(err ?? '')
  if (raw.startsWith('MEDIA_UPLOAD_FAILED:')) {
    return t('editor.errMediaUpload', { files: raw.slice('MEDIA_UPLOAD_FAILED:'.length).trim() })
  }
  const key = ERROR_KEYS[raw]
  if (key) return t(key)
  if (raw) return raw
  return t(fallbackKey)
}
