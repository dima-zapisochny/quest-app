import { useI18n } from 'vue-i18n'

/**
 * Локале-зависимый выбор формы множественного числа.
 * RU/UK — 3 формы (one/few/many), FR — [0,1] / много, остальные — [one, other].
 */
function pluralIndex(locale: string, n: number): number {
  const abs = Math.abs(n)
  if (locale === 'ru' || locale === 'uk') {
    const mod10 = abs % 10
    const mod100 = abs % 100
    if (mod10 === 1 && mod100 !== 11) return 0
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 1
    return 2
  }
  if (locale === 'fr') return abs > 1 ? 1 : 0
  return abs === 1 ? 0 : 1
}

export function usePlural() {
  const { tm, locale } = useI18n()

  /** Возвращает «{count} {слово}» с правильной формой слова для текущего языка. */
  function count(n: number, formsKey: string): string {
    const forms = tm(formsKey) as unknown as string[]
    if (!Array.isArray(forms) || forms.length === 0) return String(n)
    const idx = Math.min(pluralIndex(locale.value, n), forms.length - 1)
    return `${n} ${forms[idx]}`
  }

  return { count }
}
