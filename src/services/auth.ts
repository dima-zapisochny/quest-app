/**
 * Анонимная авторизация Supabase — основа для закрытия RLS (находка аудита №1).
 *
 * ⚠️ STAGING-ONLY, пока не выполнено:
 *   1. Dashboard → Authentication → Providers → включить Anonymous sign-ins.
 *   2. Применить supabase-migrations/005_anon_auth_claim.sql.
 * До этого signInAnonymously вернёт ошибку, и ensureAnonymousSession отдаст null
 * (клиент продолжит работать на клиентском id, как раньше — без регрессии).
 */
import { supabase, isSupabaseConfigured } from '@/config/supabase'

/**
 * Гарантирует наличие анонимной сессии и возвращает auth uid.
 * null — если Supabase не настроен или анонимный вход не включён (тогда fallback
 * на клиентский id сохраняется, приложение не ломается).
 */
export async function ensureAnonymousSession(): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  try {
    const { data: sess } = await supabase.auth.getSession()
    if (sess.session?.user?.id) return sess.session.user.id

    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.warn('[auth] signInAnonymously недоступен (включён ли провайдер?):', error.message)
      return null
    }
    return data.user?.id ?? null
  } catch (e) {
    console.warn('[auth] ensureAnonymousSession error:', e)
    return null
  }
}

/**
 * Одноразовая привязка старых данных (клиентский player-xxx id) к текущему auth uid.
 * Вызывать один раз при первом входе после включения анонимной авторизации.
 * Требует RPC claim_user_data (005_anon_auth_claim.sql). При отсутствии — no-op.
 */
export async function claimLegacyData(oldId: string): Promise<void> {
  if (!isSupabaseConfigured || !oldId) return
  try {
    const { error } = await supabase.rpc('claim_user_data', { p_old_id: oldId })
    if (error) console.warn('[auth] claim_user_data недоступен:', error.message)
  } catch (e) {
    console.warn('[auth] claimLegacyData error:', e)
  }
}
