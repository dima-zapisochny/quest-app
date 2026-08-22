type BoardLabelTranslate = (key: string, params?: { n: number }) => string

/** Дефолт при создании (store без i18n) — совпадает с редактором. */
export function defaultRoundTitle(index: number): string {
  return `Раунд ${index + 1}`
}

export function defaultCategoryTitle(index: number): string {
  return `Категория ${index + 1}`
}

/** Отображаемое имя с fallback для пустых сохранённых значений. */
export function displayRoundTitle(
  title: string | undefined,
  index: number,
  t: BoardLabelTranslate
): string {
  return title?.trim() || t('editor.round', { n: index + 1 })
}

export function displayCategoryTitle(
  title: string | undefined,
  index: number,
  t: BoardLabelTranslate
): string {
  return title?.trim() || t('editor.category', { n: index + 1 })
}
