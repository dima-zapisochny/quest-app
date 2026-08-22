import { buildStandardQuest, q } from './buildQuest'

const rounds = [
  {
    title: 'Розігрів',
    description: 'Постери, легкі цитати, знамениті ролі та кримінал',
    categories: [
      {
        title: 'Постери',
        questions: [
          q(
            100,
            'Який фільм рекламує цей постер?',
            'The Shawshank Redemption',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/8/81/ShawshankRedemptionMoviePoster.jpg'
            }
          ),
          q(
            200,
            'Який фільм на цьому постері?',
            'Forrest Gump',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg'
            }
          ),
          q(
            300,
            'Який фільм зображено на цьому постері?',
            'Pulp Fiction',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg'
            }
          ),
          q(
            400,
            'Який фільм Крістофера Нолана на цьому постері?',
            'Inception',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/2/2e/Inception_%282010%29_theatrical_poster.jpg'
            }
          ),
          q(
            500,
            'Який південнокорейський оскароносний фільм на цьому постері?',
            'Parasite',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/5/53/Parasite_%282019_film%29.png'
            }
          )
        ]
      },
      {
        title: 'Відомі цитати',
        questions: [
          q(100, '«Life is like a box of chocolates…» — з якого фільму?', 'Forrest Gump'),
          q(200, '«I\'m gonna make him an offer he can\'t refuse» — хто це сказав?', 'Vito Corleone / The Godfather'),
          q(
            300,
            '«Why so serious?» — хто вимовляє цю фразу?',
            'The Joker (The Dark Knight)',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg'
            }
          ),
          q(400, '«Get busy living, or get busy dying» — з якого фільму?', 'The Shawshank Redemption'),
          q(500, '«What\'s in the box?» — з якого трилера Девіда Фінчера?', 'Se7en')
        ]
      },
      {
        title: 'Хто зіграв?',
        questions: [
          q(100, 'Хто зіграв Форреста Гампа?', 'Tom Hanks'),
          q(
            200,
            'Хто зіграв Джека Доусона в «Титаніку»?',
            'Leonardo DiCaprio',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png'
            }
          ),
          q(300, 'Хто зіграв Брюса Вейна / Бетмена в «The Dark Knight»?', 'Christian Bale'),
          q(400, 'Хто зіграв Максимуса у «Гладіаторі»?', 'Russell Crowe'),
          q(500, 'Хто зіграв Артура Флека / Джокера у фільмі 2019 року?', 'Joaquin Phoenix')
        ]
      },
      {
        title: 'Кінокласика',
        questions: [
          q(
            100,
            'Який фільм Копполи часто називають найкращим у історії кіно?',
            'The Godfather',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg'
            }
          ),
          q(200, 'У якому фільмі головний герой бігає з коробкою шоколадних цукерок у спогадах?', 'Forrest Gump'),
          q(300, 'Який фільм про затонулий океанський лайнер вийшов у 1997?', 'Titanic'),
          q(
            400,
            'Який фільм Рідлі Скотта про римського генерала здобув «Оскар» за найкращий фільм?',
            'Gladiator',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/f/fb/Gladiator_%282000_film_poster%29.png'
            }
          ),
          q(500, 'Який фільм Мартіна Скорсезе про ірландську мафію в Бостоні вийшов у 2006?', 'The Departed')
        ]
      },
      {
        title: 'Кримінал',
        questions: [
          q(
            100,
            'Який гангстерський фільм Скорсезе з Рей Ліоттою та Робертом Де Ніро?',
            'Goodfellas',
            {
              imageUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7b/Goodfellas.jpg'
            }
          ),
          q(
            200,
            'Який трилер про сім смертних гріхів зняв Девід Фінчер?',
            'Se7en',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/6/68/Seven_%28movie%29_poster.jpg'
            }
          ),
          q(300, 'Який фільм Тарантіно про двох кілерів і валізу з невідомим вмістом?', 'Pulp Fiction'),
          q(
            400,
            'У якому фільмі поліцейський впроваджується в мафію, а мафіозі — у поліцію (Бостон)?',
            'The Departed',
            {
              imageUrl: 'https://upload.wikimedia.org/wikipedia/en/5/50/Departed234.jpg'
            }
          ),
          q(500, 'Який фільм Тарантіно про колишнього раба на шляху помсти?', 'Django Unchained')
        ]
      }
    ]
  },
  {
    title: 'Середній рівень',
    description: 'Режисери, серіали, саундтреки та сюжетні деталі',
    categories: [
      {
        title: 'Режисери',
        questions: [
          q(100, 'Хто режисер «Inception» та «Interstellar»?', 'Christopher Nolan'),
          q(200, 'Хто режисер «Pulp Fiction» і «Django Unchained»?', 'Quentin Tarantino'),
          q(300, 'Хто режисер «Parasite»?', 'Bong Joon-ho'),
          q(
            400,
            'Хто режисер «The Social Network»?',
            'David Fincher',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/8/8c/The_Social_Network_film_poster.png'
            }
          ),
          q(
            500,
            'Хто режисер «Whiplash» і «La La Land»?',
            'Damien Chazelle',
            {
              imageUrl: 'https://upload.wikimedia.org/wikipedia/en/0/01/Whiplash_poster.jpg'
            }
          )
        ]
      },
      {
        title: 'Серіали',
        questions: [
          q(
            100,
            'Який серіал про вчителя хімії, що став наркобароном?',
            'Breaking Bad',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Breaking_Bad_official_logo.svg/330px-Breaking_Bad_official_logo.svg.png'
            }
          ),
          q(
            200,
            'Який британський серіал про детектива з Бейкер-стріт?',
            'Sherlock',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/thumb/4/4d/Sherlock_titlecard.jpg/330px-Sherlock_titlecard.jpg'
            }
          ),
          q(
            300,
            'Який серіал про американського тренера футбольної команди в Англії?',
            'Ted Lasso',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/thumb/7/73/Tedlassotitlecard.jpg/330px-Tedlassotitlecard.jpg'
            }
          ),
          q(
            400,
            'Який корейський серіал про смертельні ігри за гроші?',
            'Squid Game',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Squid_Game_2021_vector_logo_english.svg/330px-Squid_Game_2021_vector_logo_english.svg.png'
            }
          ),
          q(
            500,
            'Який спін-офф «Breaking Bad» про адвоката Джиммі Макгілла?',
            'Better Call Saul',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Better_Call_Saul_logo.svg/330px-Better_Call_Saul_logo.svg.png'
            }
          )
        ]
      },
      {
        title: 'Саундтреки',
        questions: [
          q(
            100,
            'Хто співає головну тему «My Heart Will Go On» до «Титаніка»?',
            'Céline Dion',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/1/18/Titanic_%281997_film%29_poster.png'
            }
          ),
          q(
            200,
            'Хто написав і виконав «Lose Yourself» — оскароносний саундтрек до «8 Mile»?',
            'Eminem'
          ),
          q(
            300,
            'Хто композитор епічного саундтреку до «Interstellar» (зокрема «Cornfield Chase»)?',
            'Hans Zimmer',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg'
            }
          ),
          q(
            400,
            'У якому мюзиклі Демієна Шазелла звучить дует «City of Stars»?',
            'La La Land',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/a/ab/La_La_Land_%28film%29.png'
            }
          ),
          q(
            500,
            'Хто виконує титульну пісню «Skyfall» до однойменного фільму про Бонда?',
            'Adele'
          )
        ]
      },
      {
        title: 'Сюжет без спойлерів',
        questions: [
          q(100, 'У якому фільмі чоловік описує своє життя, сидячи на лавці з коробкою цукерок?', 'Forrest Gump'),
          q(
            200,
            'У якому фільмі двоє закоханих зустрічаються на борту корабля, що йде в перший рейс?',
            'Titanic'
          ),
          q(
            300,
            'У якому фільмі злодії проникають у сни, щоб викрасти або посадити ідею?',
            'Inception'
          ),
          q(
            400,
            'У якому фільмі бідна й багата сім\'ї в Сеулі поступово переплітають свої життя?',
            'Parasite'
          ),
          q(
            500,
            'У якому фільмі група дослідників летить крізь червоточину, шукаючи новий дім для людства?',
            'Interstellar'
          )
        ]
      },
      {
        title: 'На екрані',
        questions: [
          q(
            100,
            'Який логотип належить серіалу про Балтимор і наркоторгівлю?',
            'The Wire',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/The_Wire_logo.svg/330px-The_Wire_logo.svg.png'
            }
          ),
          q(
            200,
            'Який мінісеріал HBO про катастрофу на атомній станції?',
            'Chernobyl',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/a/a7/Chernobyl_2019_Miniseries.jpg'
            }
          ),
          q(
            300,
            'Який воєнний фільм Спілберга відкривається висадкою в Нормандії?',
            'Saving Private Ryan',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/a/ac/Saving_Private_Ryan_poster.jpg'
            }
          ),
          q(
            400,
            'Який фільм про створення Facebook з Джессі Айзенбергом?',
            'The Social Network'
          ),
          q(
            500,
            'Який постапокаліптичний екшен Джорджа Міллера з Шарліз Терон за кермом?',
            'Mad Max: Fury Road',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/6/6e/Mad_Max_Fury_Road.jpg'
            }
          )
        ]
      }
    ]
  },
  {
    title: 'Експерти',
    description: 'Роки, другий план, trivia та глибокі деталі',
    categories: [
      {
        title: 'Рік і нагороди',
        questions: [
          q(100, 'У якому році вийшов «Titanic» Джеймса Кемерона?', '1997'),
          q(
            200,
            'У якому році вийшов «The Dark Knight»?',
            '2008',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg'
            }
          ),
          q(300, 'У якому році «Parasite» взяв «Оскар» за найкращий фільм?', '2020 (церемонія за 2019)'),
          q(
            400,
            'У якому році вийшов біографічний «Oppenheimer» Нолана?',
            '2023',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg'
            }
          ),
          q(500, 'Скільки премій «Оскар» отримав «Titanic»?', '11')
        ]
      },
      {
        title: 'Другий план',
        questions: [
          q(100, 'Хто зіграв лейтенанта Дена в «Forrest Gump»?', 'Gary Sinise'),
          q(200, 'Хто зіграв червоного (Red) у «The Shawshank Redemption»?', 'Morgan Freeman'),
          q(300, 'Хто зіграв Гарві Дента в «The Dark Knight»?', 'Aaron Eckhart'),
          q(
            400,
            'Хто зіграв Кінґа Шульца в «Django Unchained»?',
            'Christoph Waltz',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/8/8b/Django_Unchained_Poster.jpg'
            }
          ),
          q(500, 'Хто зіграв Терренса Флетчера — жорстокого викладача джазу у «Whiplash»?', 'J.K. Simmons')
        ]
      },
      {
        title: 'Деталі й trivia',
        questions: [
          q(100, 'Яке прізвисько мав Волтер Вайт у «Breaking Bad»?', 'Heisenberg'),
          q(200, 'Який колір переважає на костюмі Артура Флека на постері «Joker» (2019)?', 'Червоний / red',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/e/e1/Joker_%282019_film%29_poster.jpg'
            }
          ),
          q(300, 'Як називається в\'язниця, з якої тікає Енді Дюфрейн?', 'Shawshank'),
          q(400, 'Який тотем використовує Кобб у «Inception», щоб перевірити реальність?', 'Дзиґа / spinning top'),
          q(500, 'Під яким вуличним брендом / кольором відомий продукт лабораторії Вайта в «Breaking Bad»?', 'Blue Sky / blue meth')
        ]
      },
      {
        title: 'Епізоди й серіали',
        questions: [
          q(100, 'Як звати головного героя «Better Call Saul» до зміни імені?', 'Jimmy McGill'),
          q(200, 'Хто грає Шерлока Холмса в BBC «Sherlock»?', 'Benedict Cumberbatch'),
          q(300, 'Як звати тренера з «Ted Lasso» (повне ім\'я персонажа)?', 'Ted Lasso'),
          q(
            400,
            'Який номер гравця / костюма часто асоціюють із головним героєм «Squid Game» (Gi-hun)?',
            '456'
          ),
          q(
            500,
            'Хто зіграв Валерію Легасову в мінісеріалі «Chernobyl»?',
            'Jared Harris'
          )
        ]
      },
      {
        title: 'Глибокий кат',
        questions: [
          q(
            100,
            'Який фільм про мандрівку крізь час і космос з Меттью Макконагі?',
            'Interstellar',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/b/bc/Interstellar_film_poster.jpg'
            }
          ),
          q(200, 'Яке справжнє ім\'я Джокера Артура Флека? (ім\'я персонажа)', 'Arthur Fleck'),
          q(300, 'У якому місті розгортається основна дія «The Wire»?', 'Baltimore'),
          q(
            400,
            'Який персонаж у «The Godfather» каже фразу про пропозицію, від якої не відмовишся?',
            'Vito Corleone (Don Corleone)'
          ),
          q(
            500,
            'Яку роль у «Oppenheimer» зіграв Кілліан Мерфі?',
            'J. Robert Oppenheimer',
            {
              imageUrl:
                'https://upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg'
            }
          )
        ]
      }
    ]
  }
]

export const movieNightQuest = buildStandardQuest(
  'movie-night',
  'Movie Night',
  'Хіти IMDb: кіно й серіали без магії й надприродного. Постери, цитати, саундтреки, ролі',
  '🎬',
  rounds
)
