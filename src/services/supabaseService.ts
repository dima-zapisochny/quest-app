/**
 * Barrel: публичный API работы с Supabase. Реализация разбита по доменам в ./api/*
 * (profiles, quests, progress, sessions, realtime). Импорты из '@/services/supabaseService'
 * продолжают работать без изменений.
 */
export * from './api/profiles'
export * from './api/quests'
export * from './api/progress'
export * from './api/sessions'
export * from './api/realtime'
