import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  DEFAULT_SEO_LOCALE,
  isSeoLocale,
  localeFromPath,
  seoPath,
  type SeoLocale
} from '@/seo/localeUrls'
import type { SeoPageId } from '@/seo/copy'

/** Локаль з URL і helper для locale-aware SEO-посилань. */
export function useSeoLinks() {
  const route = useRoute()

  const locale = computed<SeoLocale>(() => {
    const param = route.params.locale as string | undefined
    if (isSeoLocale(param)) return param
    return localeFromPath(route.path) ?? DEFAULT_SEO_LOCALE
  })

  const to = (pageId: SeoPageId) => seoPath(locale.value, pageId)

  return { locale, to, home: () => to('home') }
}
