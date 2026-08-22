import { supabase, isSupabaseConfigured } from '@/config/supabase'

export { supabase, isSupabaseConfigured }

/** Бросает понятную ошибку, если Supabase не сконфигурирован (нет ключей в .env). */
export function ensureSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase не настроен. Добавьте в .env переменные VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY (см. .env.example), затем перезапустите dev-сервер. Иначе при сохранении и удалении появляется ошибка «No API key found»'
    )
  }
}

/** Логирует ошибку Supabase с подсказками про частые причины (timeout / 500). */
export function logSupabaseError(context: string, error: unknown): void {
  const err = error as { code?: string; message?: string }
  console.error(`[Supabase] ${context}:`, err)
  if (err?.code === '57014' || err?.message?.includes('timeout')) {
    console.warn('[Supabase] Подсказка: таймаут запроса. В Dashboard: Settings → Database увеличьте statement_timeout или проверьте тяжёлые триггеры/RLS')
  }
  if (String(err?.message || '').includes('500') || (err as { status?: number })?.status === 500) {
    console.warn('[Supabase] Подсказка: 500 часто из‑за триггеров, RLS или больших JSONB. Проверьте логи в Supabase Dashboard')
  }
}
