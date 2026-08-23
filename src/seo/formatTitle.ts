const SEO_TITLE_SEP = ' · '

/** Після кожного « · » — велика літера на початку сегмента (для tab title). */
export function formatSeoTitle(title: string): string {
  const parts = title.split(SEO_TITLE_SEP)
  if (parts.length <= 1) return title

  return parts
    .map((part, index) => (index === 0 ? part : capitalizeSegment(part)))
    .join(SEO_TITLE_SEP)
}

function capitalizeSegment(segment: string): string {
  const match = segment.match(/^(\s*)(\S)([\s\S]*)$/)
  if (!match) return segment
  const [, lead, first, rest] = match
  return `${lead}${first.toLocaleUpperCase()}${rest}`
}
