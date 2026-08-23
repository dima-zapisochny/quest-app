/**
 * Цільові запити для моніторингу в Google Search Console.
 * GSC → Ефективність → Запити (раз на 1–2 тижні).
 *
 * category: brand | corporate | format | content
 */
export const SEO_PRIORITY_QUERIES = [
  // —— Бренд ——
  {
    rank: 1,
    category: 'brand',
    query: 'quizzes.website',
    locale: 'any',
    page: '/',
    difficulty: 'easy',
    note: 'Домен — має з’явитися першим після індексації'
  },
  {
    rank: 2,
    category: 'brand',
    query: 'Quiz Quest вікторина',
    locale: 'uk',
    page: '/',
    difficulty: 'medium',
    note: 'Бренд + тема'
  },

  // —— Корпоратив / «гра для компанії» ——
  {
    rank: 3,
    category: 'corporate',
    query: 'гра для компанії онлайн',
    locale: 'uk',
    page: '/about',
    difficulty: 'medium',
    note: 'Головний корпоративний запит UA'
  },
  {
    rank: 4,
    category: 'corporate',
    query: 'вікторина для компанії онлайн',
    locale: 'uk',
    page: '/about',
    difficulty: 'hard',
    note: 'Прямий конкурент Faabul / AhaSlides'
  },
  {
    rank: 5,
    category: 'corporate',
    query: 'гра для компанії безкоштовно',
    locale: 'uk',
    page: '/',
    difficulty: 'medium',
    note: 'Акцент на free — головна'
  },
  {
    rank: 6,
    category: 'corporate',
    query: 'вікторина для тімбілдингу',
    locale: 'uk',
    page: '/about',
    difficulty: 'medium',
    note: 'Тімбілдинг / HR-ніша'
  },
  {
    rank: 7,
    category: 'corporate',
    query: 'онлайн гра для команди',
    locale: 'uk',
    page: '/',
    difficulty: 'medium',
    note: 'Ширший запит без слова «компанія»'
  },
  {
    rank: 8,
    category: 'corporate',
    query: 'игра для компании онлайн',
    locale: 'ru',
    page: '/about',
    difficulty: 'medium',
    note: 'RU корпоратив'
  },
  {
    rank: 9,
    category: 'corporate',
    query: 'корпоративная викторина онлайн',
    locale: 'ru',
    page: '/about',
    difficulty: 'hard',
    note: 'RU корпоратив — вікторина'
  },
  {
    rank: 10,
    category: 'corporate',
    query: 'team building quiz online free',
    locale: 'en',
    page: '/about',
    difficulty: 'medium',
    note: 'EN тімбілдинг'
  },
  {
    rank: 11,
    category: 'corporate',
    query: 'office quiz game online',
    locale: 'en',
    page: '/about',
    difficulty: 'medium',
    note: 'EN офіс / корпоратив'
  },
  {
    rank: 12,
    category: 'corporate',
    query: 'corporate trivia game phones',
    locale: 'en',
    page: '/about',
    difficulty: 'medium',
    note: 'EN + механіка телефонів'
  },

  // —— Формат гри ——
  {
    rank: 13,
    category: 'format',
    query: 'джепарді онлайн з телефона',
    locale: 'uk',
    page: '/how-to-play',
    difficulty: 'medium',
    note: 'УТП — дошка + buzzer на телефонах'
  },
  {
    rank: 14,
    category: 'format',
    query: 'jeopardy style quiz online',
    locale: 'en',
    page: '/how-to-play',
    difficulty: 'medium',
    note: 'EN формат дошки'
  },

  // —— Контентні квести ——
  {
    rank: 15,
    category: 'content',
    query: 'кіно вікторина онлайн',
    locale: 'uk',
    page: '/quests/movie-night',
    difficulty: 'medium',
    note: 'Movie Night'
  },
  {
    rank: 16,
    category: 'content',
    query: 'музична вікторина онлайн',
    locale: 'uk',
    page: '/quests/hit-parade',
    difficulty: 'medium',
    note: 'Hit Parade'
  },
  {
    rank: 17,
    category: 'content',
    query: 'movie quiz imdb friends',
    locale: 'en',
    page: '/quests/movie-night',
    difficulty: 'medium',
    note: 'EN кіно-квест'
  },
  {
    rank: 18,
    category: 'content',
    query: 'online party quiz free',
    locale: 'en',
    page: '/',
    difficulty: 'hard',
    note: 'Широкий EN — довгий шлях'
  }
]

const CATEGORY_LABELS = {
  brand: 'Бренд',
  corporate: 'Корпоратив / гра для компанії',
  format: 'Формат гри',
  content: 'Квести (кіно / музика)'
}

export function printPriorityQueries(siteUrl) {
  console.log('\n=== Цільові запити для GSC (Ефективність → Запити) ===\n')
  let lastCategory = null
  for (const q of SEO_PRIORITY_QUERIES) {
    if (q.category !== lastCategory) {
      lastCategory = q.category
      console.log(`—— ${CATEGORY_LABELS[q.category] || q.category} ——\n`)
    }
    console.log(`${q.rank}. [${q.locale}] «${q.query}»`)
    console.log(`   Сторінка: ${siteUrl}${q.page === '/' ? '' : q.page}`)
    console.log(`   Складність: ${q.difficulty} — ${q.note}\n`)
  }
}
