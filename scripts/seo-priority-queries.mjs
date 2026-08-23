/**
 * Топ-10 цільових запитів для моніторингу в Google Search Console.
 * Перевіряйте: GSC → Ефективність → Запити (раз на 1–2 тижні).
 */
export const SEO_PRIORITY_QUERIES = [
  {
    rank: 1,
    query: 'quizzes.website',
    locale: 'any',
    page: '/',
    difficulty: 'easy',
    note: 'Брендовий домен — має з’явитися першим після індексації'
  },
  {
    rank: 2,
    query: 'Quiz Quest вікторина',
    locale: 'uk',
    page: '/',
    difficulty: 'medium',
    note: 'Бренд + тема; конкуренція з App Store / Steam'
  },
  {
    rank: 3,
    query: 'вікторина для компанії онлайн',
    locale: 'uk',
    page: '/about',
    difficulty: 'hard',
    note: 'Корпоративна ніша — Faabul, AhaSlides у топі'
  },
  {
    rank: 4,
    query: 'джепарді онлайн з телефона',
    locale: 'uk',
    page: '/how-to-play',
    difficulty: 'medium',
    note: 'Унікальний формат гри — ваше УТП'
  },
  {
    rank: 5,
    query: 'кіно вікторина онлайн',
    locale: 'uk',
    page: '/quests/movie-night',
    difficulty: 'medium',
    note: 'Сторінка Movie Night'
  },
  {
    rank: 6,
    query: 'музична вікторина онлайн',
    locale: 'uk',
    page: '/quests/hit-parade',
    difficulty: 'medium',
    note: 'Сторінка Hit Parade'
  },
  {
    rank: 7,
    query: 'online party quiz free',
    locale: 'en',
    page: '/',
    difficulty: 'hard',
    note: 'Широкий EN-запит — довгий шлях'
  },
  {
    rank: 8,
    query: 'jeopardy style quiz online',
    locale: 'en',
    page: '/how-to-play',
    difficulty: 'medium',
    note: 'Англомовний опис формату дошки'
  },
  {
    rank: 9,
    query: 'movie quiz imdb friends',
    locale: 'en',
    page: '/quests/movie-night',
    difficulty: 'medium',
    note: 'Нішевий EN для кіноквесту'
  },
  {
    rank: 10,
    query: 'team quiz buzz in from phone',
    locale: 'en',
    page: '/about',
    difficulty: 'medium',
    note: 'Механіка «хто швидше натиснув»'
  }
]

export function printPriorityQueries(siteUrl) {
  console.log('\n=== Топ-10 запитів для GSC (Ефективність → Запити) ===\n')
  for (const q of SEO_PRIORITY_QUERIES) {
    console.log(`${q.rank}. [${q.locale}] «${q.query}»`)
    console.log(`   Сторінка: ${siteUrl}${q.page === '/' ? '' : q.page}`)
    console.log(`   Складність: ${q.difficulty} — ${q.note}\n`)
  }
}
