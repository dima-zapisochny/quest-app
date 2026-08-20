import { createI18n } from 'vue-i18n'
import ru from '@/locales/ru.json'
import en from '@/locales/en.json'
import uk from '@/locales/uk.json'
import es from '@/locales/es.json'
import fr from '@/locales/fr.json'
import de from '@/locales/de.json'

export const SUPPORTED_LOCALES = ['ru', 'en', 'uk', 'es', 'fr', 'de'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

/** Родные названия языков — показываются в переключателе на своём же языке. */
export const LOCALE_NAMES: Record<AppLocale, string> = {
  ru: 'Русский',
  en: 'English',
  uk: 'Українська',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch'
}

const STORAGE_KEY = 'quiz-app-locale'
const DEFAULT_LOCALE: AppLocale = 'ru'

function isSupported(value: string | null | undefined): value is AppLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

/**
 * Определяем язык: ручной выбор из localStorage → язык браузера (по локации
 * системы) → дефолт. IP-геолокация не используется намеренно — язык браузера
 * надёжнее и приватнее.
 */
export function detectLocale(): AppLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const saved = localStorage.getItem(STORAGE_KEY)
  if (isSupported(saved)) return saved

  const candidates = [navigator.language, ...(navigator.languages ?? [])]
  for (const lang of candidates) {
    const short = lang?.slice(0, 2).toLowerCase()
    if (isSupported(short)) return short
  }
  return DEFAULT_LOCALE
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: { ru, en, uk, es, fr, de }
})

/** Меняет язык приложения и запоминает выбор. */
export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.setAttribute('lang', locale)
  }
}

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', i18n.global.locale.value)
}
