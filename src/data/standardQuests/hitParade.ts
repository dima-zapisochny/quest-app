import { buildStandardQuest, q } from './buildQuest'

const IMG = {
  beatles:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg/330px-The_Beatles_1963_Dezo_Hoffman_Capitol_Records_press_photo_2.jpg',
  queen:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Queen_A_Night_At_The_Opera_%281975_Elektra_publicity_photo_02%29.jpg/330px-Queen_A_Night_At_The_Opera_%281975_Elektra_publicity_photo_02%29.jpg',
  mj: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg/330px-Michael_Jackson_1983_%283x4_cropped%29_%28contrast%29.jpg',
  madonna:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/MadonnaO2171023_%2897_of_133%29_%2853269593787%29_%28cropped%29.jpg/330px-MadonnaO2171023_%2897_of_133%29_%2853269593787%29_%28cropped%29.jpg',
  nirvana:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Nirvana_around_1992.jpg/330px-Nirvana_around_1992.jpg',
  abba: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/ABBA_-_TopPop_1974_5.png/330px-ABBA_-_TopPop_1974_5.png',
  drake:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg/330px-Drake_at_The_Carter_Effect_2017_%2836818935200%29_%28cropped%29.jpg',
  bruno:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg/330px-BrunoMars24KMagicWorldTourLive_%28cropped%29.jpg',
  elvis:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Elvis_Presley_promoting_Jailhouse_Rock.jpg/330px-Elvis_Presley_promoting_Jailhouse_Rock.jpg',
  whitney:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Whitney_Houston_%28cropped3%29.JPEG/330px-Whitney_Houston_%28cropped3%29.JPEG',
  adele: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Adele_2016.jpg/330px-Adele_2016.jpg',
  eminem:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Eminem_2021_Color_Corrected.jpg/330px-Eminem_2021_Color_Corrected.jpg',
  beyonce:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg/330px-Beyonc%C3%A9_-_Tottenham_Hotspur_Stadium_-_1st_June_2023_%2810_of_118%29_%2852946364598%29_%28best_crop%29.jpg',
  taylor:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png/330px-Taylor_Swift_at_the_2023_MTV_Video_Music_Awards_%283%29.png',
  daftPunk:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Daft_Punk_in_2013_2-_centered.jpg/330px-Daft_Punk_in_2013_2-_centered.jpg',
  coldplay:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/ColdplayWembley120925_%28cropped%29.jpg/330px-ColdplayWembley120925_%28cropped%29.jpg',
  gaga: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg/330px-Lady_Gaga_at_Joe_Biden%27s_inauguration_%28cropped_5%29.jpg",
  weeknd:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/The_Weeknd_Portrait_by_Brian_Ziff.jpg/330px-The_Weeknd_Portrait_by_Brian_Ziff.jpg',
  billie:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg/330px-BillieEilishO2140725-39_-_54665577407_%28cropped%29.jpg',
  ed: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Ed_Sheeran-6886_%28cropped_2%29.jpg/330px-Ed_Sheeran-6886_%28cropped_2%29.jpg',
  pinkFloyd: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Pink_Floyd_-_all_members.jpg',
  acdc: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/AC_DC_Black_Ice_Tour_2009_Buenos_Aires_4_de_Diciembre_%284238680962%29.jpg/330px-AC_DC_Black_Ice_Tour_2009_Buenos_Aires_4_de_Diciembre_%284238680962%29.jpg',
  linkinPark:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Linkin_Park_-_From_Zero_Lead_Press_Photo_-_James_Minchin_III.jpg/330px-Linkin_Park_-_From_Zero_Lead_Press_Photo_-_James_Minchin_III.jpg',
  rihanna:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rihanna_Fenty_2018.png/330px-Rihanna_Fenty_2018.png',
  shakira:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2023-11-16_Gala_de_los_Latin_Grammy%2C_03_%28cropped%2902.jpg/330px-2023-11-16_Gala_de_los_Latin_Grammy%2C_03_%28cropped%2902.jpg',
  oasis:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Oasis_-_Principality_Stadium%2C_Cardiff_-_Friday_4th_July_2025_member_collage.jpg/330px-Oasis_-_Principality_Stadium%2C_Cardiff_-_Friday_4th_July_2025_member_collage.jpg',
  darkSide:
    'https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Dark_Side_of_the_Moon.png/330px-Dark_Side_of_the_Moon.png',
  thriller:
    'https://upload.wikimedia.org/wikipedia/en/thumb/5/55/Michael_Jackson_-_Thriller.png/330px-Michael_Jackson_-_Thriller.png',
  sgtPepper:
    'https://upload.wikimedia.org/wikipedia/en/thumb/5/50/Sgt._Pepper%27s_Lonely_Hearts_Club_Band.jpg/330px-Sgt._Pepper%27s_Lonely_Hearts_Club_Band.jpg',
  nightOpera:
    'https://upload.wikimedia.org/wikipedia/en/thumb/4/4d/Queen_A_Night_At_The_Opera.png/330px-Queen_A_Night_At_The_Opera.png',
  likeAVirgin:
    'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Madonna_-_Like_a_Virgin.png/330px-Madonna_-_Like_a_Virgin.png'
} as const

const description =
  'Хіти останніх десятиліть і вічна класика: тексти, виконавці, жанри, колаборації.'

export const hitParadeQuest = buildStandardQuest('hit-parade', 'Hit Parade', description, '🎵', [
  {
    title: 'Legends & Classics',
    description: 'Beatles, Queen, Elvis, ABBA, Michael Jackson та інші ікони',
    categories: [
      {
        title: 'Фото легенд',
        questions: [
          q(100, 'Хто на фото? Британський квартет 1960-х, автори «Hey Jude».', 'The Beatles', {
            imageUrl: IMG.beatles
          }),
          q(200, 'Хто на фото? Фредді Мерк’юрі — фронтмен цієї групи.', 'Queen', {
            imageUrl: IMG.queen
          }),
          q(300, 'Хто на фото? «King of Rock and Roll», Jailhouse Rock.', 'Elvis Presley', {
            imageUrl: IMG.elvis
          }),
          q(400, 'Хто на фото? Шведський квартет, хіт «Dancing Queen».', 'ABBA', {
            imageUrl: IMG.abba
          }),
          q(500, 'Хто на фото? King of Pop, альбом Thriller.', 'Michael Jackson', {
            imageUrl: IMG.mj
          })
        ]
      },
      {
        title: 'Пропущене слово',
        questions: [
          q(
            100,
            'Назвіть пропущене слово (The Beatles):\n\n«Yesterday, all my … seemed so far away»',
            'troubles'
          ),
          q(
            200,
            'Назвіть пропущене слово (Queen):\n\n«Is this the real life? Is this just …?»',
            'fantasy'
          ),
          q(
            300,
            'Назвіть пропущене слово (Elvis Presley):\n\n«You ain’t nothin’ but a … dog»',
            'hound'
          ),
          q(
            400,
            'Назвіть пропущене слово (ABBA):\n\n«You can dance, you can jive, having the time of your …»',
            'life'
          ),
          q(
            500,
            'Назвіть пропущене слово (Michael Jackson — «Smooth Criminal»):\n\n«Annie, are you …?»',
            'OK'
          )
        ]
      },
      {
        title: 'Докінчи рядок',
        questions: [
          q(
            100,
            'Докінчіть рядок (The Beatles — «Hey Jude»):\n\n«Hey Jude, don’t make it …»',
            'bad'
          ),
          q(
            200,
            'Докінчіть рядок (Queen — «We Will Rock You»):\n\n«We will, we will … you»',
            'rock'
          ),
          q(
            300,
            'Докінчіть рядок (Madonna — «Like a Virgin»):\n\n«Like a virgin, touched for the very first …»',
            'time',
            { imageUrl: IMG.madonna }
          ),
          q(
            400,
            'Докінчіть рядок (Whitney Houston — «I Will Always Love You»):\n\n«And I will always love …»',
            'you'
          ),
          q(
            500,
            'Докінчіть рядок (Pink Floyd — «Wish You Were Here»):\n\n«How I wish, how I wish you were …»',
            'here'
          )
        ]
      },
      {
        title: 'Альбоми й епохи',
        questions: [
          q(
            100,
            'Який альбом The Beatles 1967 року часто називають одним із перших концептуальних?',
            'Sgt. Pepper’s Lonely Hearts Club Band',
            { imageUrl: IMG.sgtPepper }
          ),
          q(
            200,
            'Який альбом Queen 1975 року містить «Bohemian Rhapsody»?',
            'A Night at the Opera',
            { imageUrl: IMG.nightOpera }
          ),
          q(300, 'У якому році вийшов цей альбом Майкла Джексона?', '1982', {
            imageUrl: IMG.thriller
          }),
          q(
            400,
            'Який альбом Madonna 1984 року зробив її світовою зіркою pop?',
            'Like a Virgin',
            { imageUrl: IMG.likeAVirgin }
          ),
          q(
            500,
            'Який альбом Pink Floyd 1973 року з цією обкладинкою (призма)?',
            'The Dark Side of the Moon',
            { imageUrl: IMG.darkSide }
          )
        ]
      },
      {
        title: 'Оригінал чи кавер',
        questions: [
          q(
            100,
            'Хто виконав оригінал «I Will Always Love You» до хіта Whitney Houston?',
            'Dolly Parton'
          ),
          q(
            200,
            'Хто співав оригінал «Respect», який пізніше зробила знаменитим Aretha Franklin?',
            'Otis Redding'
          ),
          q(
            300,
            'Хто записав оригінал «All Along the Watchtower», який каверував Jimi Hendrix?',
            'Bob Dylan'
          ),
          q(
            400,
            'Хто виконав оригінал «Nothing Compares 2 U» до версії Sinéad O’Connor?',
            'Prince (The Family)'
          ),
          q(
            500,
            'Хто записав оригінал «Hallelujah», який пізніше популяризували Jeff Buckley та інші?',
            'Leonard Cohen'
          )
        ]
      }
    ]
  },
  {
    title: 'Charts & Genres',
    description: 'Pop, rock, hip-hop, dance і балади 1990–2020',
    categories: [
      {
        title: 'Pop хіти',
        questions: [
          q(100, 'Хто на фото? Авторка «Hello» і «Rolling in the Deep».', 'Adele', {
            imageUrl: IMG.adele
          }),
          q(
            200,
            'Докінчіть рядок (Taylor Swift — «Shake It Off»):\n\n«The players gonna play, play, play, play, …»',
            'play',
            { imageUrl: IMG.taylor }
          ),
          q(
            300,
            'Назвіть пропущене слово (Lady Gaga — «Bad Romance»):\n\n«I want your …, I want your revenge»',
            'love',
            { imageUrl: IMG.gaga }
          ),
          q(
            400,
            'Який хіт Bruno Mars 2010 року починається зі слів про «grenade»?',
            'Grenade',
            { imageUrl: IMG.bruno }
          ),
          q(
            500,
            'У якому році The Weeknd випустив глобальний хіт «Blinding Lights»?',
            '2019',
            { imageUrl: IMG.weeknd }
          )
        ]
      },
      {
        title: 'Rock & Alternative',
        questions: [
          q(100, 'Хто на фото? Грутж-тріо з «Smells Like Teen Spirit».', 'Nirvana', {
            imageUrl: IMG.nirvana
          }),
          q(200, 'Хто на фото? Австралійський hard rock, «Highway to Hell».', 'AC/DC', {
            imageUrl: IMG.acdc
          }),
          q(
            300,
            'Назвіть пропущене слово (Linkin Park — «In the End»):\n\n«I tried so hard and got so …»',
            'far',
            { imageUrl: IMG.linkinPark }
          ),
          q(
            400,
            'Докінчіть рядок (Oasis — «Wonderwall»):\n\n«Because maybe, you’re gonna be the one that … me»',
            'saves',
            { imageUrl: IMG.oasis }
          ),
          q(
            500,
            'Який жанр найточніше описує Coldplay ранніх 2000-х (Parachutes, A Rush of Blood to the Head)?',
            'Alternative rock / Britpop-influenced rock',
            { imageUrl: IMG.coldplay }
          )
        ]
      },
      {
        title: 'Hip-Hop',
        questions: [
          q(100, 'Хто на фото? Slim Shady, хіт «Lose Yourself».', 'Eminem', {
            imageUrl: IMG.eminem
          }),
          q(200, 'Хто на фото? Канадський репер, хіти «Hotline Bling», «God’s Plan».', 'Drake', {
            imageUrl: IMG.drake
          }),
          q(
            300,
            'Назвіть пропущене слово (Eminem — «Lose Yourself»):\n\n«You better lose yourself in the …»',
            'music'
          ),
          q(
            400,
            'Докінчіть рядок (Drake — «Hotline Bling»):\n\n«You used to call me on my …»',
            'cell phone'
          ),
          q(
            500,
            'У якому році Eminem випустив The Marshall Mathers LP?',
            '2000'
          )
        ]
      },
      {
        title: 'Dance & Electronic',
        questions: [
          q(100, 'Хто на фото? Французький дует у шоломах, «Get Lucky».', 'Daft Punk', {
            imageUrl: IMG.daftPunk
          }),
          q(
            200,
            'Назвіть пропущене слово (Daft Punk — «Get Lucky»):\n\n«We’re up all night to get …»',
            'lucky'
          ),
          q(
            300,
            'Який жанр найкраще описує Daft Punk і трек «One More Time»?',
            'French house / electronic dance'
          ),
          q(
            400,
            'Хто на фото? Авторка «bad guy» і «Therefore I Am».',
            'Billie Eilish',
            { imageUrl: IMG.billie }
          ),
          q(
            500,
            'Докінчіть рядок (Billie Eilish — «bad guy»):\n\n«So you’re a tough guy, like it really rough …»',
            'guy'
          )
        ]
      },
      {
        title: 'Балади й вокал',
        questions: [
          q(100, 'Хто на фото? «I Will Always Love You», The Bodyguard.', 'Whitney Houston', {
            imageUrl: IMG.whitney
          }),
          q(200, 'Хто на фото? «Shape of You», «Perfect».', 'Ed Sheeran', {
            imageUrl: IMG.ed
          }),
          q(
            300,
            'Докінчіть рядок (Adele — «Someone Like You»):\n\n«Never mind, I’ll find someone like …»',
            'you'
          ),
          q(
            400,
            'Назвіть пропущене слово (Ed Sheeran — «Perfect»):\n\n«Darling, just hold my …»',
            'hand'
          ),
          q(
            500,
            'Який альбом Adele 2011 року містить «Someone Like You» і «Rolling in the Deep»?',
            '21'
          )
        ]
      }
    ]
  },
  {
    title: 'Deep Cuts',
    description: 'Колаборації, роки, альбоми та складніші тексти',
    categories: [
      {
        title: 'Колаборації',
        questions: [
          q(
            100,
            'Хто на фото? Барбадоська зірка хіта «Umbrella».',
            'Rihanna',
            { imageUrl: IMG.rihanna }
          ),
          q(
            200,
            'Хто був запрошеним артистом (feat.) на «Umbrella» Rihanna?',
            'Jay-Z'
          ),
          q(
            300,
            'Хто на фото? Солістка Destiny’s Child і хіта «Crazy in Love».',
            'Beyoncé',
            { imageUrl: IMG.beyonce }
          ),
          q(
            400,
            'Хто співав із Daft Punk у хіті «Get Lucky» (основний вокал)?',
            'Pharrell Williams'
          ),
          q(
            500,
            'Хто на фото записав «Hips Don’t Lie» разом із Wyclef Jean?',
            'Shakira',
            { imageUrl: IMG.shakira }
          )
        ]
      },
      {
        title: 'Роки й чарти',
        questions: [
          q(100, 'У якому році Nirvana випустила Nevermind?', '1991'),
          q(200, 'У якому році Lady Gaga випустила дебютний альбом The Fame?', '2008'),
          q(300, 'У якому році Taylor Swift випустила 1989?', '2014'),
          q(400, 'У якому році The Weeknd випустив After Hours?', '2020'),
          q(500, 'У якому році Billie Eilish випустила When We All Fall Asleep, Where Do We Go?', '2019')
        ]
      },
      {
        title: 'Альбоми deep cut',
        questions: [
          q(
            100,
            'Який альбом Linkin Park 2000 року відкрив трек «Papercut»?',
            'Hybrid Theory'
          ),
          q(
            200,
            'Який альбом Oasis 1995 року містить «Wonderwall» і «Don’t Look Back in Anger»?',
            '(What’s the Story) Morning Glory?'
          ),
          q(
            300,
            'Який альбом AC/DC 1980 року з Брайаном Джонсоном став їхнім бестселером?',
            'Back in Black'
          ),
          q(
            400,
            'Який альбом Madonna 1998 року з електронним звучанням включає «Frozen»?',
            'Ray of Light'
          ),
          q(
            500,
            'Який альбом Daft Punk 2013 року містить «Get Lucky» і «Instant Crush»?',
            'Random Access Memories'
          )
        ]
      },
      {
        title: 'Жорсткі тексти',
        questions: [
          q(
            100,
            'Назвіть пропущене слово (Rihanna — «Umbrella»):\n\n«You can stand under my …»',
            'umbrella'
          ),
          q(
            200,
            'Докінчіть рядок (Beyoncé — «Single Ladies»):\n\n«If you liked it then you shoulda put a … on it»',
            'ring'
          ),
          q(
            300,
            'Назвіть пропущене слово (Shakira — «Hips Don’t Lie»):\n\n«I never really knew that she could … like this»',
            'dance'
          ),
          q(
            400,
            'Докінчіть рядок (The Weeknd — «Blinding Lights»):\n\n«I can’t sleep until I feel your …»',
            'touch'
          ),
          q(
            500,
            'Назвіть пропущене слово (Coldplay — «Viva La Vida»):\n\n«I used to rule the …»',
            'world'
          )
        ]
      },
      {
        title: 'Хто співав?',
        questions: [
          q(
            100,
            'Хто співає оригінал хіта «Smells Like Teen Spirit»?',
            'Nirvana'
          ),
          q(
            200,
            'Хто співає оригінал «Bohemian Rhapsody»?',
            'Queen'
          ),
          q(
            300,
            'Хто записав оригінал «Shape of You»?',
            'Ed Sheeran'
          ),
          q(
            400,
            'Хто записав оригінал «bad guy»?',
            'Billie Eilish'
          ),
          q(
            500,
            'Хто на фото? Британська група альбому The Dark Side of the Moon.',
            'Pink Floyd',
            { imageUrl: IMG.pinkFloyd }
          )
        ]
      }
    ]
  }
])
