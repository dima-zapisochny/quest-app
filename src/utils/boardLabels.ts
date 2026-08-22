type BoardLabelTranslate = (key: string, params?: { n: number }) => string

/** Дефолт при создании (store без i18n) — нейтральный EN; UI показывает через display*. */
export function defaultRoundTitle(index: number): string {
  return `Round ${index + 1}`
}

export function defaultCategoryTitle(index: number): string {
  return `Category ${index + 1}`
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
