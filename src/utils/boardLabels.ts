type BoardLabelTranslate = (key: string, params?: { n: number }) => string

/**
 * Дефолт при створенні в store — порожній рядок.
 * UI завжди показує локалізований fallback через display*.
 */
export function defaultRoundTitle(_index: number): string {
  return ''
}

export function defaultCategoryTitle(_index: number): string {
  return ''
}

/** Старі дефолти, збережені в БД різними мовами — вважаємо плейсхолдерами. */
function isGenericRoundTitle(title: string, index: number): boolean {
  const n = index + 1
  return new RegExp(
    `^(Round|Раунд|Runde|Manche|Ronda|Круг)\\s*${n}$`,
    'i'
  ).test(title.trim())
}

function isGenericCategoryTitle(title: string, index: number): boolean {
  const n = index + 1
  return new RegExp(
    `^(Category|Категория|Категорія|Kategorie|Catégorie|Categoría)\\s*${n}$`,
    'i'
  ).test(title.trim())
}

/** Відображувана назва з i18n-fallback для порожніх / дефолтних значень. */
export function displayRoundTitle(
  title: string | undefined,
  index: number,
  t: BoardLabelTranslate
): string {
  const trimmed = title?.trim()
  if (!trimmed || isGenericRoundTitle(trimmed, index)) {
    return t('editor.round', { n: index + 1 })
  }
  return trimmed
}

export function displayCategoryTitle(
  title: string | undefined,
  index: number,
  t: BoardLabelTranslate
): string {
  const trimmed = title?.trim()
  if (!trimmed || isGenericCategoryTitle(trimmed, index)) {
    return t('editor.category', { n: index + 1 })
  }
  return trimmed
}
