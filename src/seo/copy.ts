import type { AppLocale } from '@/i18n'

export type SeoPageId = 'home' | 'howto' | 'movie-night' | 'hit-parade' | 'about'

export type SeoPageCopy = {
  title: string
  description: string
  keywords: string
  ogTitle?: string
  ogDescription?: string
  /** H1 для noscript/prerender; якщо немає — береться з title. */
  h1?: string
}

export const SEO_COPY: Record<SeoPageId, Record<AppLocale, SeoPageCopy>> = {
  home: {
    uk: {
      title: 'Quiz Quest · вікторина для компанії',
      ogTitle: 'вікторина для компанії',
      h1: 'Quiz Quest',
      description:
        'Безкоштовна гра для компанії онлайн: командна вікторина у стилі шоу. Створіть гру, поділіться кодом, грайте з телефона.',
      keywords:
        'гра для компанії, гра для компанії онлайн, вікторина для компанії, онлайн гра для команди, тімбілдинг вікторина, вікторина онлайн, джепарді онлайн, кіно вікторина, музична вікторина, quiz quest, гра з друзями'
    },
    ru: {
      title: 'Quiz Quest · викторина для компании',
      ogTitle: 'викторина для компании',
      h1: 'Quiz Quest',
      description:
        'Бесплатная игра для компании онлайн: командная викторина в стиле шоу. Создайте игру, поделитесь кодом, играйте с телефона.',
      keywords:
        'игра для компании, игра для компании онлайн, викторина для компании, онлайн игра для команды, тимбилдинг викторина, викторина онлайн, джепарди онлайн, кино викторина, quiz quest'
    },
    en: {
      title: 'Quiz Quest · online party quiz',
      ogTitle: 'online party quiz',
      h1: 'Quiz Quest',
      description:
        'Free online game for teams and companies: host a quiz board, share a code, play from phones.',
      keywords:
        'company team game, office quiz game, team building quiz online, corporate trivia game, online quiz, party quiz, team quiz, jeopardy online, movie quiz, quiz quest, buzz-in quiz'
    },
    de: {
      title: 'Quiz Quest · Online-Quiz für die Gruppe',
      ogTitle: 'Online-Quiz für die Gruppe',
      h1: 'Quiz Quest',
      description:
        'Kostenloses Team-Quiz online im Show-Stil: Spiel erstellen, Code teilen, vom Handy mitspielen.',
      keywords:
        'online quiz, firmenevent quiz, quiz für unternehmen, team quiz, teamevent quiz, filmquiz, musikquiz, quiz quest, jeopardy online'
    },
    fr: {
      title: 'Quiz Quest · quiz en ligne',
      ogTitle: 'quiz en ligne',
      h1: 'Quiz Quest',
      description:
        'Quiz d’équipe gratuit en ligne façon show : créez une partie, partagez le code, jouez sur téléphone.',
      keywords:
        'quiz entreprise, quiz team building, jeu quiz équipe, quiz en ligne, quiz entre amis, quiz cinéma, quiz quest, jeu buzz'
    },
    es: {
      title: 'Quiz Quest · quiz online',
      ogTitle: 'quiz online',
      h1: 'Quiz Quest',
      description:
        'Quiz en equipo gratis online con estilo de concurso: crea la partida, comparte el código, juega desde el móvil.',
      keywords:
        'juego quiz empresa, quiz team building, quiz online, quiz con amigos, quiz de cine, quiz de música, quiz quest, trivia online'
    }
  },
  howto: {
    uk: {
      title: 'Як грати в Quiz Quest · інструкція для ведучого та гравців',
      h1: 'Як грати в Quiz Quest?',
      description:
        'Покроково: створити гру, поділитися кодом, відкривати питання на дошці, відповідати з телефона та рахувати бали. Також як зібрати власний квест.',
      keywords:
        'як грати вікторину, інструкція вікторина онлайн, як створити вікторину, quiz quest як грати'
    },
    ru: {
      title: 'Как играть в Quiz Quest · инструкция для ведущего и игроков',
      h1: 'Как играть в Quiz Quest?',
      description:
        'По шагам: создать игру, поделиться кодом, открывать вопросы на доске, отвечать с телефона и считать очки. Также как собрать свой квест.',
      keywords:
        'как играть в викторину, инструкция викторина онлайн, как создать викторину, quiz quest как играть'
    },
    en: {
      title: 'How to play Quiz Quest · host & player guide',
      h1: 'How to play Quiz Quest?',
      description:
        'Step by step: create a game, share the code, open board questions, buzz in on phones and keep score. Plus how to build your own quest.',
      keywords: 'how to play quiz, online quiz guide, create quiz board, quiz quest howto'
    },
    de: {
      title: 'Quiz Quest spielen · Anleitung für Moderator und Spieler',
      h1: 'Quiz Quest spielen',
      description:
        'Schritt für Schritt: Spiel erstellen, Code teilen, Fragen öffnen, per Handy antworten und Punkte zählen. Plus eigenes Quiz bauen.',
      keywords: 'quiz anleitung, online quiz spielen, quiz erstellen, quiz quest'
    },
    fr: {
      title: 'Comment jouer à Quiz Quest · guide animateur et joueurs',
      h1: 'Comment jouer à Quiz Quest ?',
      description:
        'Étape par étape : créer une partie, partager le code, ouvrir les questions, buzzer sur téléphone et compter les points. Et créer votre propre quiz.',
      keywords: 'comment jouer quiz, guide quiz en ligne, créer un quiz, quiz quest'
    },
    es: {
      title: 'Cómo jugar a Quiz Quest · guía para anfitrión y jugadores',
      h1: 'Cómo jugar a Quiz Quest',
      description:
        'Paso a paso: crear partida, compartir código, abrir preguntas, responder desde el móvil y sumar puntos. También cómo crear tu propio cuestionario.',
      keywords: 'cómo jugar quiz, guía trivia online, crear quiz, quiz quest'
    }
  },
  'movie-night': {
    uk: {
      title: 'Movie Night · кіно-вікторина онлайн · Quiz Quest',
      h1: 'Movie Night — кіно-вікторина',
      description:
        'Готовий квест про популярні фільми й серіали IMDb: постери, цитати, ролі, саундтреки. 3 раунди × 5 категорій × 5 питань — для вечора з друзями.',
      keywords:
        'кіно вікторина, вікторина по фільмах, movie quiz, imdb вікторина, movie night quiz, кіноквест'
    },
    ru: {
      title: 'Movie Night · кино-викторина онлайн · Quiz Quest',
      h1: 'Movie Night — кино-викторина',
      description:
        'Готовый квест про популярные фильмы и сериалы IMDb: постеры, цитаты, роли, саундтреки. 3 раунда × 5 категорий × 5 вопросов — для вечера с друзьями.',
      keywords:
        'кино викторина, викторина по фильмам, movie quiz, imdb викторина, movie night, киноквест'
    },
    en: {
      title: 'Movie Night · online movie quiz pack · Quiz Quest',
      h1: 'Movie Night — online movie quiz',
      description:
        'Ready-made quiz on popular IMDb films and series: posters, quotes, cast, soundtracks. 3 rounds × 5 categories × 5 questions for movie night with friends.',
      keywords: 'movie quiz, film trivia, imdb quiz, movie night quiz, online movie quiz'
    },
    de: {
      title: 'Movie Night · Online-Filmquiz · Quiz Quest',
      h1: 'Movie Night — Filmquiz',
      description:
        'Fertiges Quiz zu beliebten IMDb-Filmen und Serien: Poster, Zitate, Rollen, Soundtracks. 3 Runden × 5 Kategorien × 5 Fragen.',
      keywords: 'filmquiz, movie quiz, imdb quiz, movie night, kinorätsel'
    },
    fr: {
      title: 'Movie Night · quiz cinéma en ligne · Quiz Quest',
      h1: 'Movie Night — quiz cinéma',
      description:
        'Quiz prêt à jouer sur les films et séries IMDb populaires : affiches, citations, rôles, BO. 3 manches × 5 catégories × 5 questions.',
      keywords: 'quiz cinéma, quiz films, movie quiz, movie night, trivia cinéma'
    },
    es: {
      title: 'Movie Night · quiz de cine online · Quiz Quest',
      h1: 'Movie Night — quiz de cine',
      description:
        'Cuestionario listo sobre películas y series populares de IMDb: pósters, citas, roles, bandas sonoras. 3 rondas × 5 categorías × 5 preguntas.',
      keywords: 'quiz de cine, trivia películas, movie quiz, movie night, imdb quiz'
    }
  },
  'hit-parade': {
    uk: {
      title: 'Hit Parade · музична вікторина онлайн · Quiz Quest',
      h1: 'Hit Parade — музична вікторина',
      description:
        'Готовий музичний квест: Beatles, Queen, поп, рок, хіп-хоп. Пропущені слова, альбоми, колаборації. 75 питань для вечірки з хітами.',
      keywords:
        'музична вікторина, вікторина по музиці, music quiz, hit parade, вікторина пісні, quiz hits'
    },
    ru: {
      title: 'Hit Parade · музыкальная викторина онлайн · Quiz Quest',
      h1: 'Hit Parade — музыкальная викторина',
      description:
        'Готовый музыкальный квест: Beatles, Queen, поп, рок, хип-хоп. Пропущенные слова, альбомы, коллаборации. 75 вопросов для вечеринки с хитами.',
      keywords:
        'музыкальная викторина, викторина по музыке, music quiz, hit parade, викторина песни'
    },
    en: {
      title: 'Hit Parade · online music quiz pack · Quiz Quest',
      h1: 'Hit Parade — music quiz',
      description:
        'Ready-made music quiz: Beatles, Queen, pop, rock, hip-hop. Lyric gaps, albums, collabs. 75 questions for a hit-filled party night.',
      keywords: 'music quiz, song trivia, hit parade quiz, lyric quiz, online music quiz'
    },
    de: {
      title: 'Hit Parade · Online-Musikquiz · Quiz Quest',
      h1: 'Hit Parade — Musikquiz',
      description:
        'Fertiges Musikquiz: Beatles, Queen, Pop, Rock, Hip-Hop. Lückentexte, Alben, Features. 75 Fragen für die Hit-Party.',
      keywords: 'musikquiz, song quiz, hit parade, lyrics quiz, online musikquiz'
    },
    fr: {
      title: 'Hit Parade · quiz musique en ligne · Quiz Quest',
      h1: 'Hit Parade — quiz musique',
      description:
        'Quiz musical prêt à jouer : Beatles, Queen, pop, rock, hip-hop. Paroles à trous, albums, collabs. 75 questions pour une soirée hits.',
      keywords: 'quiz musique, trivia chansons, hit parade, quiz paroles, quiz musical'
    },
    es: {
      title: 'Hit Parade · quiz de música online · Quiz Quest',
      h1: 'Hit Parade — quiz de música',
      description:
        'Cuestionario musical listo: Beatles, Queen, pop, rock, hip-hop. Letras incompletas, álbumes, colaboraciones. 75 preguntas para la fiesta.',
      keywords: 'quiz de música, trivia canciones, hit parade, quiz letras, music quiz'
    }
  },
  about: {
    uk: {
      title: 'Про Quiz Quest · онлайн-гра для компанії, правила та для кого',
      ogTitle: 'онлайн-гра для компанії',
      h1: 'Про Quiz Quest — онлайн-гра для компанії',
      description:
        'Quiz Quest — безкоштовна гра для компанії та команди онлайн: вікторина у стилі шоу, тімбілдинг, офіс. Правила, кому підійде, як грати з телефона.',
      keywords:
        'гра для компанії, гра для компанії онлайн, вікторина для компанії, тімбілдинг вікторина, корпоративна гра, онлайн гра для команди, quiz quest, правила вікторини'
    },
    ru: {
      title: 'О Quiz Quest · игра для компании онлайн, правила и для кого',
      ogTitle: 'игра для компании онлайн',
      h1: 'О Quiz Quest — игра для компании',
      description:
        'Quiz Quest — бесплатная игра для компании и команды онлайн: викторина в стиле шоу, тимбилдинг, офис. Правила, кому подойдёт, как играть с телефона.',
      keywords:
        'игра для компании, игра для компании онлайн, викторина для компании, тимбилдинг викторина, корпоративная игра, quiz quest, правила викторины'
    },
    en: {
      title: 'About Quiz Quest · online game for teams & companies',
      ogTitle: 'online game for teams',
      h1: 'About Quiz Quest',
      description:
        'Quiz Quest is a free online game for companies and teams: game-show quiz, team building, office parties. Rules, who it’s for, how to host and play from phones.',
      keywords:
        'company team game, office quiz game, team building quiz, corporate trivia, about quiz quest, team quiz, party quiz, jeopardy-style quiz'
    },
    de: {
      title: 'Über Quiz Quest · Online-Quiz für die Gruppe, Regeln & Zielgruppe',
      ogTitle: 'Online-Quiz für die Gruppe',
      h1: 'Über Quiz Quest',
      description:
        'Was Quiz Quest ist: kostenloses Team-Quiz online im Show-Stil. Regeln, für wen es passt, Spiel starten und per Handy mitspielen.',
      keywords: 'über quiz quest, online quiz regeln, quiz für freunde, team quiz, jeopardy online'
    },
    fr: {
      title: 'À propos de Quiz Quest · quiz en ligne, règles et pour qui',
      ogTitle: 'quiz en ligne',
      h1: 'À propos de Quiz Quest',
      description:
        'Qu’est-ce que Quiz Quest : quiz d’équipe gratuit en ligne façon show. Règles, public, créer une partie et jouer sur téléphone.',
      keywords: 'à propos quiz quest, règles quiz en ligne, quiz entre amis, quiz buzz'
    },
    es: {
      title: 'Sobre Quiz Quest · quiz online, reglas y para quién',
      ogTitle: 'quiz online para equipos',
      h1: 'Sobre Quiz Quest',
      description:
        'Qué es Quiz Quest: quiz en equipo gratis online con estilo de concurso. Reglas, a quién va dirigido, crear partida y jugar desde el móvil.',
      keywords: 'sobre quiz quest, reglas trivia online, quiz con amigos, quiz tipo concurso'
    }
  }
}

export const SEO_PAGE_IDS: SeoPageId[] = ['home', 'howto', 'movie-night', 'hit-parade', 'about']
