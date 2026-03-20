/**
 * Lightweight media URL helpers — quiz data should hold only URLs (no base64).
 * Use for display, validation, and migration.
 */

import type { MediaAsset } from '@/types'

/** True if url is an external URL (http/https), not a data URL. */
export function isExternalUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  const t = url.trim()
  return t.startsWith('http://') || t.startsWith('https://')
}

/** True if url is a data: (base64) URL — should be migrated to Storage. */
export function isDataUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  return url.trim().toLowerCase().startsWith('data:')
}

/** URL safe for img/audio src: external (http/https) or data: for legacy; null if empty/invalid. */
export function safeMediaUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null
  const t = url.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (t.startsWith('data:')) return t
  // Разрешаем относительные URL (часто Storage public URL в квестах может храниться так)
  // Пример: "/storage/v1/object/public/quest-media/..."
  if (t.startsWith('/storage/')) return t
  // Нормализуем "storage/..." -> "/storage/..."
  if (t.startsWith('storage/')) return `/${t}`
  return null
}

/** First image URL from question media (lightweight: single imageUrl). */
export function getFirstImageUrl(media: MediaAsset[] | null | undefined): string | null {
  if (!Array.isArray(media)) return null
  const m = media.find((x) => x.type === 'image' && x.url)
  return m ? safeMediaUrl(m.url) ?? null : null
}

/** First audio URL from question media (lightweight: single audioUrl). */
export function getFirstAudioUrl(media: MediaAsset[] | null | undefined): string | null {
  if (!Array.isArray(media)) return null
  const m = media.find((x) => x.type === 'audio' && x.url)
  return m ? safeMediaUrl(m.url) ?? null : null
}
