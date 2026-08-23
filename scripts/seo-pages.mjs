/**
 * Статичні SEO-оболонки для публічних URL (пререндер після vite build).
 * Мова за замовчуванням — uk (як у index.html); клієнт підхопить i18n після гідрації.
 */
export const SITE_URL = (process.env.VITE_PUBLIC_SITE_URL || 'https://quizzes.website').replace(/\/$/, '')

export const PUBLIC_SEO_PAGES = [
  {
    id: 'home',
    path: '/',
    file: 'index.html',
    title: 'Quiz Quest - вікторина для компанії',
    ogTitle: 'вікторина для компанії',
    description:
      'Безкоштовна гра для компанії онлайн: командна вікторина у стилі шоу. Створіть гру, поділіться кодом, грайте з телефона.',
    h1: 'Quiz Quest'
  },
  {
    id: 'howto',
    path: '/how-to-play',
    file: 'how-to-play/index.html',
    title: 'Як грати в Quiz Quest — інструкція для ведучого та гравців',
    description:
      'Покроково: створити гру, поділитися кодом, відкривати питання на дошці, відповідати з телефона та рахувати бали. Також як зібрати власний квест.',
    h1: 'Як грати в Quiz Quest?'
  },
  {
    id: 'movie-night',
    path: '/quests/movie-night',
    file: 'quests/movie-night/index.html',
    title: 'Movie Night — кіно-вікторина онлайн | Quiz Quest',
    description:
      'Готовий квест про популярні фільми й серіали IMDb: постери, цитати, ролі, саундтреки. 3 раунди × 5 категорій × 5 питань — для вечора з друзями.',
    h1: 'Movie Night — кіно-вікторина'
  },
  {
    id: 'hit-parade',
    path: '/quests/hit-parade',
    file: 'quests/hit-parade/index.html',
    title: 'Hit Parade — музична вікторина онлайн | Quiz Quest',
    description:
      'Готовий музичний квест: Beatles, Queen, поп, рок, хіп-хоп. Пропущені слова, альбоми, колаборації. 75 питань для вечірки з хітами.',
    h1: 'Hit Parade — музична вікторина'
  },
  {
    id: 'about',
    path: '/about',
    file: 'about/index.html',
    title: 'Про Quiz Quest — онлайн-гра для компанії, правила та для кого',
    description:
      'Quiz Quest — безкоштовна гра для компанії та команди онлайн: вікторина у стилі шоу, тімбілдинг, офіс. Правила, кому підійде, як грати з телефона.',
    h1: 'Про Quiz Quest — онлайн-гра для компанії'
  }
]

export const HREFLANGS = [
  'uk',
  'uk-UA',
  'ru',
  'ru-RU',
  'en',
  'en-US',
  'en-GB',
  'de',
  'de-DE',
  'fr',
  'fr-FR',
  'es',
  'es-ES',
  'es-MX',
  'x-default'
]
