import type { AppLocale } from '@/i18n'

/** Публічний origin сайту (для canonical / OG / sitemap). */
export function getSiteUrl(): string {
  const fromEnv = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '')
  if (fromEnv) return fromEnv
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://quizquest.app'
}

export type SeoPageId = 'home' | 'howto' | 'movie-night' | 'hit-parade' | 'about'

export type SeoPageCopy = {
  title: string
  description: string
  keywords: string
  ogTitle?: string
  ogDescription?: string
}

/**
 * Цільові запити (аналіз):
 * — вікторина онлайн / онлайн викторина / online quiz party
 * — джепарді онлайн / jeopardy-style quiz / гра з кнопкою відповіді
 * — вікторина для компанії / team quiz / quiz with friends
 * — кіно вікторина / movie quiz / викторина по фильмам IMDb
 * — музична вікторина / music quiz / hit parade quiz
 * — створити вікторину / create quiz board / quiz host
 * — як грати вікторину / how to play quiz
 * — Quiz Quest
 */
export const SEO_COPY: Record<SeoPageId, Record<AppLocale, SeoPageCopy>> = {
  home: {
    uk: {
      title: 'Quiz Quest — онлайн-вікторина для компанії | Кіно та музика',
      description:
        'Безкоштовна командна вікторина онлайн у стилі шоу: створіть гру, поділіться кодом, грайте з телефона. Готові квести Movie Night і Hit Parade — кіно й хіти.',
      keywords:
        'вікторина онлайн, онлайн вікторина, вікторина для компанії, джепарді онлайн, кіно вікторина, музична вікторина, quiz quest, створити вікторину, гра з друзями'
    },
    ru: {
      title: 'Quiz Quest — онлайн-викторина для компании | Кино и музыка',
      description:
        'Бесплатная командная викторина онлайн в стиле шоу: создайте игру, поделитесь кодом, играйте с телефона. Готовые квесты Movie Night и Hit Parade — кино и хиты.',
      keywords:
        'викторина онлайн, онлайн викторина, викторина для компании, джепарди онлайн, кино викторина, музыкальная викторина, quiz quest, создать викторину, игра с друзьями'
    },
    en: {
      title: 'Quiz Quest — online party quiz | Movie Night & Hit Parade',
      description:
        'Free team quiz online with a game-show vibe: host a board, share a code, play from phones. Ready-made Movie Night and Hit Parade packs — films and chart hits.',
      keywords:
        'online quiz, party quiz, team quiz, jeopardy online, movie quiz, music quiz, quiz quest, create quiz, quiz with friends, buzz-in quiz'
    },
    de: {
      title: 'Quiz Quest — Online-Quiz für die Gruppe | Film & Musik',
      description:
        'Kostenloses Team-Quiz online im Show-Stil: Spiel erstellen, Code teilen, vom Handy mitspielen. Fertige Packs Movie Night und Hit Parade.',
      keywords:
        'online quiz, quiz für freunde, team quiz, filmquiz, musikquiz, quiz quest, quiz erstellen, jeopardy online'
    },
    fr: {
      title: 'Quiz Quest — quiz en ligne entre amis | Cinéma et musique',
      description:
        'Quiz d’équipe gratuit en ligne façon show : créez une partie, partagez le code, jouez sur téléphone. Packs Movie Night et Hit Parade prêts à l’emploi.',
      keywords:
        'quiz en ligne, quiz entre amis, quiz cinéma, quiz musique, quiz quest, créer un quiz, jeu buzz'
    },
    es: {
      title: 'Quiz Quest — quiz online para amigos | Cine y música',
      description:
        'Quiz en equipo gratis online con estilo de concurso: crea la partida, comparte el código, juega desde el móvil. Packs listos Movie Night y Hit Parade.',
      keywords:
        'quiz online, trivia online, quiz con amigos, quiz de cine, quiz de música, quiz quest, crear quiz'
    }
  },
  howto: {
    uk: {
      title: 'Як грати в Quiz Quest — інструкція для ведучого та гравців',
      description:
        'Покроково: створити гру, поділитися кодом, відкривати питання на дошці, відповідати з телефону та рахувати бали. Також як зібрати власний квест.',
      keywords:
        'як грати вікторину, інструкція вікторина онлайн, як створити вікторину, quiz quest як грати'
    },
    ru: {
      title: 'Как играть в Quiz Quest — инструкция для ведущего и игроков',
      description:
        'По шагам: создать игру, поделиться кодом, открывать вопросы на доске, отвечать с телефона и считать очки. Также как собрать свой квест.',
      keywords:
        'как играть в викторину, инструкция викторина онлайн, как создать викторину, quiz quest как играть'
    },
    en: {
      title: 'How to play Quiz Quest — host & player guide',
      description:
        'Step by step: create a game, share the code, open board questions, buzz in on phones and keep score. Plus how to build your own quest.',
      keywords: 'how to play quiz, online quiz guide, create quiz board, quiz quest howto'
    },
    de: {
      title: 'Quiz Quest spielen — Anleitung für Moderator und Spieler',
      description:
        'Schritt für Schritt: Spiel erstellen, Code teilen, Fragen öffnen, per Handy antworten und Punkte zählen. Plus eigenes Quiz bauen.',
      keywords: 'quiz anleitung, online quiz spielen, quiz erstellen, quiz quest'
    },
    fr: {
      title: 'Comment jouer à Quiz Quest — guide animateur et joueurs',
      description:
        'Étape par étape : créer une partie, partager le code, ouvrir les questions, buzzer sur téléphone et compter les points. Et créer votre propre quiz.',
      keywords: 'comment jouer quiz, guide quiz en ligne, créer un quiz, quiz quest'
    },
    es: {
      title: 'Cómo jugar a Quiz Quest — guía para anfitrión y jugadores',
      description:
        'Paso a paso: crear partida, compartir código, abrir preguntas, responder desde el móvil y sumar puntos. También cómo crear tu propio cuestionario.',
      keywords: 'cómo jugar quiz, guía trivia online, crear quiz, quiz quest'
    }
  },
  'movie-night': {
    uk: {
      title: 'Movie Night — кіно-вікторина онлайн | Quiz Quest',
      description:
        'Готовий квест про популярні фільми й серіали IMDb: постери, цитати, ролі, саундтреки. 3 раунди × 5 категорій × 5 питань — для вечора з друзями.',
      keywords:
        'кіно вікторина, вікторина по фільмах, movie quiz, imdb вікторина, movie night quiz, кіноквест'
    },
    ru: {
      title: 'Movie Night — кино-викторина онлайн | Quiz Quest',
      description:
        'Готовый квест про популярные фильмы и сериалы IMDb: постеры, цитаты, роли, саундтреки. 3 раунда × 5 категорий × 5 вопросов — для вечера с друзьями.',
      keywords:
        'кино викторина, викторина по фильмам, movie quiz, imdb викторина, movie night, киноквест'
    },
    en: {
      title: 'Movie Night — online movie quiz pack | Quiz Quest',
      description:
        'Ready-made quiz on popular IMDb films and series: posters, quotes, cast, soundtracks. 3 rounds × 5 categories × 5 questions for movie night with friends.',
      keywords: 'movie quiz, film trivia, imdb quiz, movie night quiz, online movie quiz'
    },
    de: {
      title: 'Movie Night — Online-Filmquiz | Quiz Quest',
      description:
        'Fertiges Quiz zu beliebten IMDb-Filmen und Serien: Poster, Zitate, Rollen, Soundtracks. 3 Runden × 5 Kategorien × 5 Fragen.',
      keywords: 'filmquiz, movie quiz, imdb quiz, movie night, kinorätsel'
    },
    fr: {
      title: 'Movie Night — quiz cinéma en ligne | Quiz Quest',
      description:
        'Quiz prêt à jouer sur les films et séries IMDb populaires : affiches, citations, rôles, BO. 3 manches × 5 catégories × 5 questions.',
      keywords: 'quiz cinéma, quiz films, movie quiz, movie night, trivia cinéma'
    },
    es: {
      title: 'Movie Night — quiz de cine online | Quiz Quest',
      description:
        'Cuestionario listo sobre películas y series populares de IMDb: pósters, citas, roles, bandas sonoras. 3 rondas × 5 categorías × 5 preguntas.',
      keywords: 'quiz de cine, trivia películas, movie quiz, movie night, imdb quiz'
    }
  },
  'hit-parade': {
    uk: {
      title: 'Hit Parade — музична вікторина онлайн | Quiz Quest',
      description:
        'Готовий музичний квест: Beatles, Queen, поп, рок, хіп-хоп. Пропущені слова, альбоми, колаборації. 75 питань для вечірки з хітами.',
      keywords:
        'музична вікторина, вікторина по музиці, music quiz, hit parade, вікторина пісні, quiz hits'
    },
    ru: {
      title: 'Hit Parade — музыкальная викторина онлайн | Quiz Quest',
      description:
        'Готовый музыкальный квест: Beatles, Queen, поп, рок, хип-хоп. Пропущенные слова, альбомы, коллаборации. 75 вопросов для вечеринки с хитами.',
      keywords:
        'музыкальная викторина, викторина по музыке, music quiz, hit parade, викторина песни'
    },
    en: {
      title: 'Hit Parade — online music quiz pack | Quiz Quest',
      description:
        'Ready-made music quiz: Beatles, Queen, pop, rock, hip-hop. Lyric gaps, albums, collabs. 75 questions for a hit-filled party night.',
      keywords: 'music quiz, song trivia, hit parade quiz, lyric quiz, online music quiz'
    },
    de: {
      title: 'Hit Parade — Online-Musikquiz | Quiz Quest',
      description:
        'Fertiges Musikquiz: Beatles, Queen, Pop, Rock, Hip-Hop. Lückentexte, Alben, Features. 75 Fragen für die Hit-Party.',
      keywords: 'musikquiz, song quiz, hit parade, lyrics quiz, online musikquiz'
    },
    fr: {
      title: 'Hit Parade — quiz musique en ligne | Quiz Quest',
      description:
        'Quiz musical prêt à jouer : Beatles, Queen, pop, rock, hip-hop. Paroles à trous, albums, collabs. 75 questions pour une soirée hits.',
      keywords: 'quiz musique, trivia chansons, hit parade, quiz paroles, quiz musical'
    },
    es: {
      title: 'Hit Parade — quiz de música online | Quiz Quest',
      description:
        'Cuestionario musical listo: Beatles, Queen, pop, rock, hip-hop. Letras incompletas, álbumes, colaboraciones. 75 preguntas para la fiesta.',
      keywords: 'quiz de música, trivia canciones, hit parade, quiz letras, music quiz'
    }
  },
  about: {
    uk: {
      title: 'Про Quiz Quest — онлайн-вікторина для компанії, правила та для кого',
      description:
        'Що таке Quiz Quest: командна вікторина онлайн у стилі шоу. Правила гри, кому підійде, як створити гру та грати з телефона. Безкоштовно.',
      keywords:
        'про quiz quest, що таке вікторина онлайн, правила вікторини, вікторина для компанії, джепарді онлайн, гра з друзями'
    },
    ru: {
      title: 'О Quiz Quest — онлайн-викторина для компании, правила и для кого',
      description:
        'Что такое Quiz Quest: командная викторина онлайн в стиле шоу. Правила, кому подойдёт, как создать игру и играть с телефона. Бесплатно.',
      keywords:
        'о quiz quest, что такое викторина онлайн, правила викторины, викторина для компании, джепарди онлайн'
    },
    en: {
      title: 'About Quiz Quest — online party quiz, rules & who it’s for',
      description:
        'What Quiz Quest is: a free team quiz online with a game-show vibe. Rules, who it’s for, how to host a game and play from phones.',
      keywords:
        'about quiz quest, what is online quiz, quiz rules, party quiz, team quiz, jeopardy-style quiz'
    },
    de: {
      title: 'Über Quiz Quest — Online-Quiz für die Gruppe, Regeln & Zielgruppe',
      description:
        'Was Quiz Quest ist: kostenloses Team-Quiz online im Show-Stil. Regeln, für wen es passt, Spiel starten und per Handy mitspielen.',
      keywords: 'über quiz quest, online quiz regeln, quiz für freunde, team quiz, jeopardy online'
    },
    fr: {
      title: 'À propos de Quiz Quest — quiz en ligne, règles et pour qui',
      description:
        'Qu’est-ce que Quiz Quest : quiz d’équipe gratuit en ligne façon show. Règles, public, créer une partie et jouer sur téléphone.',
      keywords: 'à propos quiz quest, règles quiz en ligne, quiz entre amis, quiz buzz'
    },
    es: {
      title: 'Sobre Quiz Quest — quiz online, reglas y para quién',
      description:
        'Qué es Quiz Quest: quiz en equipo gratis online con estilo de concurso. Reglas, a quién va dirigido, crear partida y jugar desde el móvil.',
      keywords: 'sobre quiz quest, reglas trivia online, quiz con amigos, quiz tipo concurso'
    }
  }
}

export const SEO_PATHS: Record<SeoPageId, string> = {
  home: '/',
  howto: '/how-to-play',
  'movie-night': '/quests/movie-night',
  'hit-parade': '/quests/hit-parade',
  about: '/about'
}

export const HREFLANG_LOCALES: { locale: AppLocale; hreflang: string }[] = [
  { locale: 'uk', hreflang: 'uk' },
  { locale: 'uk', hreflang: 'uk-UA' },
  { locale: 'ru', hreflang: 'ru' },
  { locale: 'ru', hreflang: 'ru-RU' },
  { locale: 'en', hreflang: 'en' },
  { locale: 'en', hreflang: 'en-US' },
  { locale: 'en', hreflang: 'en-GB' },
  { locale: 'de', hreflang: 'de' },
  { locale: 'de', hreflang: 'de-DE' },
  { locale: 'fr', hreflang: 'fr' },
  { locale: 'fr', hreflang: 'fr-FR' },
  { locale: 'es', hreflang: 'es' },
  { locale: 'es', hreflang: 'es-ES' },
  { locale: 'es', hreflang: 'es-MX' }
]
