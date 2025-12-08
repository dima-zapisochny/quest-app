-- Вставка квеста "Музыкальный квест" в базу данных
-- Выполните этот SQL в Supabase SQL Editor

DO $$
DECLARE
  quest_id TEXT := 'quest-musical-' || gen_random_uuid()::text;
  quest_data JSONB;
  json_text TEXT;
BEGIN
  json_text := $JSON$
    {
    "id": "QUEST_ID_PLACEHOLDER",
    "title": "Музыкальный квест",
    "description": "Погрузитесь в мир музыки: от классики до современности, от композиторов до исполнителей",
    "rounds": [
      {
        "id": "round-1",
        "title": "Классическая музыка",
        "categories": [
          {
            "id": "cat-1-1",
            "title": "Великие композиторы",
            "questions": [
              {
                "id": "q-1-1-1",
                "value": 100,
                "question": "Кто написал оперу 'Кармен'?",
                "answer": "Жорж Бизе",
                "questionMedia": [{"id": "m1", "type": "image", "name": "bizet.jpg", "url": "https://example.com/images/bizet.jpg"}]
              },
              {
                "id": "q-1-1-2",
                "value": 200,
                "question": "Какой композитор написал 'Лунную сонату'?",
                "answer": "Людвиг ван Бетховен",
                "questionMedia": [{"id": "m2", "type": "audio", "name": "moonlight-sonata.mp3", "url": "https://example.com/audio/moonlight-sonata.mp3"}]
              },
              {
                "id": "q-1-1-3",
                "value": 300,
                "question": "Кто является автором 'Времен года'?",
                "answer": "Антонио Вивальди",
                "questionMedia": [{"id": "m3", "type": "image", "name": "vivaldi.jpg", "url": "https://example.com/images/vivaldi.jpg"}]
              },
              {
                "id": "q-1-1-4",
                "value": 400,
                "question": "Какой композитор написал 'Лебединое озеро'?",
                "answer": "Пётр Ильич Чайковский",
                "questionMedia": [{"id": "m4", "type": "audio", "name": "swan-lake.mp3", "url": "https://example.com/audio/swan-lake.mp3"}]
              },
              {
                "id": "q-1-1-5",
                "value": 500,
                "question": "Кто написал оперу 'Волшебная флейта'?",
                "answer": "Вольфганг Амадей Моцарт",
                "questionMedia": [{"id": "m5", "type": "image", "name": "mozart.jpg", "url": "https://example.com/images/mozart.jpg"}]
              }
            ]
          },
          {
            "id": "cat-1-2",
            "title": "Музыкальные инструменты",
            "questions": [
              {
                "id": "q-1-2-1",
                "value": 100,
                "question": "Сколько струн у скрипки?",
                "answer": "Четыре",
                "questionMedia": [{"id": "m6", "type": "image", "name": "violin.jpg", "url": "https://example.com/images/violin.jpg"}]
              },
              {
                "id": "q-1-2-2",
                "value": 200,
                "question": "Какой инструмент имеет 88 клавиш?",
                "answer": "Фортепиано",
                "questionMedia": [{"id": "m7", "type": "image", "name": "piano.jpg", "url": "https://example.com/images/piano.jpg"}]
              },
              {
                "id": "q-1-2-3",
                "value": 300,
                "question": "Как называется самый большой струнный инструмент?",
                "answer": "Контрабас",
                "questionMedia": [{"id": "m8", "type": "image", "name": "double-bass.jpg", "url": "https://example.com/images/double-bass.jpg"}]
              },
              {
                "id": "q-1-2-4",
                "value": 400,
                "question": "Какой инструмент используется в оркестре для создания низких звуков?",
                "answer": "Туба",
                "questionMedia": [{"id": "m9", "type": "image", "name": "tuba.jpg", "url": "https://example.com/images/tuba.jpg"}]
              },
              {
                "id": "q-1-2-5",
                "value": 500,
                "question": "Как называется инструмент с мехами?",
                "answer": "Аккордеон или баян",
                "questionMedia": [{"id": "m10", "type": "audio", "name": "accordion.mp3", "url": "https://example.com/audio/accordion.mp3"}]
              }
            ]
          },
          {
            "id": "cat-1-3",
            "title": "Знаменитые произведения",
            "questions": [
              {
                "id": "q-1-3-1",
                "value": 100,
                "question": "Какое произведение написал Бах для органа?",
                "answer": "Токката и фуга ре минор",
                "questionMedia": [{"id": "m11", "type": "audio", "name": "toccata-fugue.mp3", "url": "https://example.com/audio/toccata-fugue.mp3"}]
              },
              {
                "id": "q-1-3-2",
                "value": 200,
                "question": "Как называется знаменитая симфония Бетховена №9?",
                "answer": "Хоральная симфония",
                "questionMedia": [{"id": "m12", "type": "audio", "name": "beethoven9.mp3", "url": "https://example.com/audio/beethoven9.mp3"}]
              },
              {
                "id": "q-1-3-3",
                "value": 300,
                "question": "Кто написал 'Реквием'?",
                "answer": "Вольфганг Амадей Моцарт",
                "questionMedia": [{"id": "m13", "type": "audio", "name": "requiem.mp3", "url": "https://example.com/audio/requiem.mp3"}]
              },
              {
                "id": "q-1-3-4",
                "value": 400,
                "question": "Как называется балет Чайковского о принце и лебеде?",
                "answer": "Лебединое озеро",
                "questionMedia": [{"id": "m14", "type": "image", "name": "swan-lake-scene.jpg", "url": "https://example.com/images/swan-lake-scene.jpg"}]
              },
              {
                "id": "q-1-3-5",
                "value": 500,
                "question": "Какое произведение написал Рахманинов для фортепиано?",
                "answer": "Концерт для фортепиано с оркестром №2"
              }
            ]
          },
          {
            "id": "cat-1-4",
            "title": "Музыкальные термины",
            "questions": [
              {
                "id": "q-1-4-1",
                "value": 100,
                "question": "Что означает термин 'форте'?",
                "answer": "Громко",
                "questionMedia": [{"id": "m16", "type": "image", "name": "forte.jpg", "url": "https://example.com/images/forte.jpg"}]
              },
              {
                "id": "q-1-4-2",
                "value": 200,
                "question": "Что означает 'пиано'?",
                "answer": "Тихо",
                "questionMedia": [{"id": "m17", "type": "image", "name": "piano-term.jpg", "url": "https://example.com/images/piano-term.jpg"}]
              },
              {
                "id": "q-1-4-3",
                "value": 300,
                "question": "Как называется музыкальное произведение для одного инструмента?",
                "answer": "Соло",
                "questionMedia": [{"id": "m18", "type": "audio", "name": "solo.mp3", "url": "https://example.com/audio/solo.mp3"}]
              },
              {
                "id": "q-1-4-4",
                "value": 400,
                "question": "Что означает 'аллегро'?",
                "answer": "Быстро, весело",
                "questionMedia": [{"id": "m19", "type": "audio", "name": "allegro.mp3", "url": "https://example.com/audio/allegro.mp3"}]
              },
              {
                "id": "q-1-4-5",
                "value": 500,
                "question": "Как называется медленный темп в музыке?",
                "answer": "Адажио или ларго",
                "questionMedia": [{"id": "m20", "type": "audio", "name": "adagio.mp3", "url": "https://example.com/audio/adagio.mp3"}]
              }
            ]
          },
          {
            "id": "cat-1-5",
            "title": "Оперы и балеты",
            "questions": [
              {
                "id": "q-1-5-1",
                "value": 100,
                "question": "Кто написал оперу 'Евгений Онегин'?",
                "answer": "Пётр Ильич Чайковский",
                "questionMedia": [{"id": "m21", "type": "image", "name": "onegin.jpg", "url": "https://example.com/images/onegin.jpg"}]
              },
              {
                "id": "q-1-5-2",
                "value": 200,
                "question": "Как называется опера Верди о цыганке?",
                "answer": "Травиата",
                "questionMedia": [{"id": "m22", "type": "audio", "name": "traviata.mp3", "url": "https://example.com/audio/traviata.mp3"}]
              },
              {
                "id": "q-1-5-3",
                "value": 300,
                "question": "Кто написал балет 'Щелкунчик'?",
                "answer": "Пётр Ильич Чайковский",
                "questionMedia": [{"id": "m23", "type": "audio", "name": "nutcracker.mp3", "url": "https://example.com/audio/nutcracker.mp3"}]
              },
              {
                "id": "q-1-5-4",
                "value": 400,
                "question": "Как называется опера Пуччини о японской гейше?",
                "answer": "Мадам Баттерфляй",
                "questionMedia": [{"id": "m24", "type": "image", "name": "butterfly.jpg", "url": "https://example.com/images/butterfly.jpg"}]
              },
              {
                "id": "q-1-5-5",
                "value": 500,
                "question": "Кто написал оперу 'Севильский цирюльник'?",
                "answer": "Джоаккино Россини",
                "questionMedia": [{"id": "m25", "type": "audio", "name": "barber.mp3", "url": "https://example.com/audio/barber.mp3"}]
              }
            ]
          }
        ]
      },
      {
        "id": "round-2",
        "title": "Рок и поп музыка",
        "categories": [
          {
            "id": "cat-2-1",
            "title": "Легенды рока",
            "questions": [
              {
                "id": "q-2-1-1",
                "value": 100,
                "question": "Как называется группа, которая записала альбом 'The Dark Side of the Moon'?",
                "answer": "Pink Floyd",
                "questionMedia": [{"id": "m26", "type": "image", "name": "pink-floyd.jpg", "url": "https://example.com/images/pink-floyd.jpg"}]
              },
              {
                "id": "q-2-1-2",
                "value": 200,
                "question": "Кто является вокалистом группы Queen?",
                "answer": "Фредди Меркьюри",
                "questionMedia": [{"id": "m27", "type": "audio", "name": "bohemian-rhapsody.mp3", "url": "https://example.com/audio/bohemian-rhapsody.mp3"}]
              },
              {
                "id": "q-2-1-3",
                "value": 300,
                "question": "Как называется знаменитая песня The Beatles 'Вчера' на английском?",
                "answer": "Yesterday",
                "questionMedia": [{"id": "m28", "type": "audio", "name": "yesterday.mp3", "url": "https://example.com/audio/yesterday.mp3"}]
              },
              {
                "id": "q-2-1-4",
                "value": 400,
                "question": "Кто написал песню 'Stairway to Heaven'?",
                "answer": "Led Zeppelin",
                "questionMedia": [{"id": "m29", "type": "audio", "name": "stairway.mp3", "url": "https://example.com/audio/stairway.mp3"}]
              },
              {
                "id": "q-2-1-5",
                "value": 500,
                "question": "Как называется группа, которая записала 'Hotel California'?",
                "answer": "Eagles",
                "questionMedia": [{"id": "m30", "type": "audio", "name": "hotel-california.mp3", "url": "https://example.com/audio/hotel-california.mp3"}]
              }
            ]
          },
          {
            "id": "cat-2-2",
            "title": "Поп-звёзды",
            "questions": [
              {
                "id": "q-2-2-1",
                "value": 100,
                "question": "Кто исполнил песню 'Thriller'?",
                "answer": "Майкл Джексон",
                "questionMedia": [{"id": "m31", "type": "image", "name": "michael-jackson.jpg", "url": "https://example.com/images/michael-jackson.jpg"}]
              },
              {
                "id": "q-2-2-2",
                "value": 200,
                "question": "Как называется певица, которая записала альбом '21'?",
                "answer": "Адель",
                "questionMedia": [{"id": "m32", "type": "audio", "name": "adele-rolling.mp3", "url": "https://example.com/audio/adele-rolling.mp3"}]
              },
              {
                "id": "q-2-2-3",
                "value": 300,
                "question": "Кто исполнил песню 'Shape of You'?",
                "answer": "Эд Ширан",
                "questionMedia": [{"id": "m33", "type": "audio", "name": "shape-of-you.mp3", "url": "https://example.com/audio/shape-of-you.mp3"}]
              },
              {
                "id": "q-2-2-4",
                "value": 400,
                "question": "Как называется группа, которая записала 'Uptown Funk'?",
                "answer": "Bruno Mars",
                "questionMedia": [{"id": "m34", "type": "audio", "name": "uptown-funk.mp3", "url": "https://example.com/audio/uptown-funk.mp3"}]
              },
              {
                "id": "q-2-2-5",
                "value": 500,
                "question": "Кто исполнил песню 'Bad Guy'?",
                "answer": "Билли Айлиш",
                "questionMedia": [{"id": "m35", "type": "audio", "name": "bad-guy.mp3", "url": "https://example.com/audio/bad-guy.mp3"}]
              }
            ]
          },
          {
            "id": "cat-2-3",
            "title": "Рок-группы",
            "questions": [
              {
                "id": "q-2-3-1",
                "value": 100,
                "question": "Как называется группа, которая записала 'Smells Like Teen Spirit'?",
                "answer": "Nirvana",
                "questionMedia": [{"id": "m36", "type": "audio", "name": "teen-spirit.mp3", "url": "https://example.com/audio/teen-spirit.mp3"}]
              },
              {
                "id": "q-2-3-2",
                "value": 200,
                "question": "Кто является вокалистом группы AC/DC?",
                "answer": "Брайан Джонсон (ранее Бон Скотт)",
                "questionMedia": [{"id": "m37", "type": "image", "name": "acdc.jpg", "url": "https://example.com/images/acdc.jpg"}]
              },
              {
                "id": "q-2-3-3",
                "value": 300,
                "question": "Как называется группа, которая записала 'Sweet Child O'' Mine'?",
                "answer": "Guns N'' Roses",
                "questionMedia": [{"id": "m38", "type": "audio", "name": "sweet-child.mp3", "url": "https://example.com/audio/sweet-child.mp3"}]
              },
              {
                "id": "q-2-3-4",
                "value": 400,
                "question": "Кто написал песню 'Smoke on the Water'?",
                "answer": "Deep Purple",
                "questionMedia": [{"id": "m39", "type": "audio", "name": "smoke-water.mp3", "url": "https://example.com/audio/smoke-water.mp3"}]
              },
              {
                "id": "q-2-3-5",
                "value": 500,
                "question": "Как называется группа, которая записала 'Enter Sandman'?",
                "answer": "Metallica",
                "questionMedia": [{"id": "m40", "type": "audio", "name": "enter-sandman.mp3", "url": "https://example.com/audio/enter-sandman.mp3"}]
              }
            ]
          },
          {
            "id": "cat-2-4",
            "title": "Поп-хиты",
            "questions": [
              {
                "id": "q-2-4-1",
                "value": 100,
                "question": "Кто исполнил песню 'Despacito'?",
                "answer": "Луис Фонси и Дэдди Янки",
                "questionMedia": [{"id": "m41", "type": "audio", "name": "despacito.mp3", "url": "https://example.com/audio/despacito.mp3"}]
              },
              {
                "id": "q-2-4-2",
                "value": 200,
                "question": "Как называется песня Тейлор Свифт 'Shake It Off'?",
                "answer": "Shake It Off",
                "questionMedia": [{"id": "m42", "type": "audio", "name": "shake-it-off.mp3", "url": "https://example.com/audio/shake-it-off.mp3"}]
              },
              {
                "id": "q-2-4-3",
                "value": 300,
                "question": "Кто исполнил песню 'Blinding Lights'?",
                "answer": "The Weeknd",
                "questionMedia": [{"id": "m43", "type": "audio", "name": "blinding-lights.mp3", "url": "https://example.com/audio/blinding-lights.mp3"}]
              },
              {
                "id": "q-2-4-4",
                "value": 400,
                "question": "Как называется песня Дрейка 'God''s Plan'?",
                "answer": "God''s Plan",
                "questionMedia": [{"id": "m44", "type": "audio", "name": "gods-plan.mp3", "url": "https://example.com/audio/gods-plan.mp3"}]
              },
              {
                "id": "q-2-4-5",
                "value": 500,
                "question": "Кто исполнил песню 'Levitating'?",
                "answer": "Dua Lipa",
                "questionMedia": [{"id": "m45", "type": "audio", "name": "levitating.mp3", "url": "https://example.com/audio/levitating.mp3"}]
              }
            ]
          },
          {
            "id": "cat-2-5",
            "title": "Рок-баллады",
            "questions": [
              {
                "id": "q-2-5-1",
                "value": 100,
                "question": "Кто исполнил песню 'November Rain'?",
                "answer": "Guns N'' Roses",
                "questionMedia": [{"id": "m46", "type": "audio", "name": "november-rain.mp3", "url": "https://example.com/audio/november-rain.mp3"}]
              },
              {
                "id": "q-2-5-2",
                "value": 200,
                "question": "Как называется баллада Aerosmith 'I Don''t Want to Miss a Thing'?",
                "answer": "I Don''t Want to Miss a Thing",
                "questionMedia": [{"id": "m47", "type": "audio", "name": "miss-a-thing.mp3", "url": "https://example.com/audio/miss-a-thing.mp3"}]
              },
              {
                "id": "q-2-5-3",
                "value": 300,
                "question": "Кто исполнил песню 'Nothing Else Matters'?",
                "answer": "Metallica",
                "questionMedia": [{"id": "m48", "type": "audio", "name": "nothing-else-matters.mp3", "url": "https://example.com/audio/nothing-else-matters.mp3"}]
              },
              {
                "id": "q-2-5-4",
                "value": 400,
                "question": "Как называется баллада Bon Jovi 'Always'?",
                "answer": "Always",
                "questionMedia": [{"id": "m49", "type": "audio", "name": "always.mp3", "url": "https://example.com/audio/always.mp3"}]
              },
              {
                "id": "q-2-5-5",
                "value": 500,
                "question": "Кто исполнил песню 'Wind of Change'?",
                "answer": "Scorpions",
                "questionMedia": [{"id": "m50", "type": "audio", "name": "wind-of-change.mp3", "url": "https://example.com/audio/wind-of-change.mp3"}]
              }
            ]
          }
        ]
      },
      {
        "id": "round-3",
        "title": "Джаз и блюз",
        "categories": [
          {
            "id": "cat-3-1",
            "title": "Джазовые легенды",
            "questions": [
              {
                "id": "q-3-1-1",
                "value": 100,
                "question": "Кто является 'королём джаза'?",
                "answer": "Луи Армстронг",
                "questionMedia": [{"id": "m51", "type": "image", "name": "louis-armstrong.jpg", "url": "https://example.com/images/louis-armstrong.jpg"}]
              },
              {
                "id": "q-3-1-2",
                "value": 200,
                "question": "Как называется знаменитый джазовый саксофонист, который записал 'Kind of Blue'?",
                "answer": "Майлз Дэвис",
                "questionMedia": [{"id": "m52", "type": "audio", "name": "kind-of-blue.mp3", "url": "https://example.com/audio/kind-of-blue.mp3"}]
              },
              {
                "id": "q-3-1-3",
                "value": 300,
                "question": "Кто является автором джазовой композиции 'Take Five'?",
                "answer": "Дейв Брубек",
                "questionMedia": [{"id": "m53", "type": "audio", "name": "take-five.mp3", "url": "https://example.com/audio/take-five.mp3"}]
              },
              {
                "id": "q-3-1-4",
                "value": 400,
                "question": "Как называется джазовая певица, которая записала 'Summertime'?",
                "answer": "Элла Фицджеральд",
                "questionMedia": [{"id": "m54", "type": "audio", "name": "summertime.mp3", "url": "https://example.com/audio/summertime.mp3"}]
              },
              {
                "id": "q-3-1-5",
                "value": 500,
                "question": "Кто является джазовым пианистом, который записал 'The Entertainer'?",
                "answer": "Скотт Джоплин",
                "questionMedia": [{"id": "m55", "type": "audio", "name": "entertainer.mp3", "url": "https://example.com/audio/entertainer.mp3"}]
              }
            ]
          },
          {
            "id": "cat-3-2",
            "title": "Блюзовые музыканты",
            "questions": [
              {
                "id": "q-3-2-1",
                "value": 100,
                "question": "Кто является 'королём блюза'?",
                "answer": "Би Би Кинг",
                "questionMedia": [{"id": "m56", "type": "image", "name": "bb-king.jpg", "url": "https://example.com/images/bb-king.jpg"}]
              },
              {
                "id": "q-3-2-2",
                "value": 200,
                "question": "Как называется блюзовый гитарист, который записал 'Crossroads'?",
                "answer": "Роберт Джонсон",
                "questionMedia": [{"id": "m57", "type": "audio", "name": "crossroads.mp3", "url": "https://example.com/audio/crossroads.mp3"}]
              },
              {
                "id": "q-3-2-3",
                "value": 300,
                "question": "Кто исполнил блюзовую композицию 'The Thrill Is Gone'?",
                "answer": "Би Би Кинг",
                "questionMedia": [{"id": "m58", "type": "audio", "name": "thrill-is-gone.mp3", "url": "https://example.com/audio/thrill-is-gone.mp3"}]
              },
              {
                "id": "q-3-2-4",
                "value": 400,
                "question": "Как называется блюзовая певица, которая записала 'At Last'?",
                "answer": "Этта Джеймс",
                "questionMedia": [{"id": "m59", "type": "audio", "name": "at-last.mp3", "url": "https://example.com/audio/at-last.mp3"}]
              },
              {
                "id": "q-3-2-5",
                "value": 500,
                "question": "Кто является блюзовым гитаристом, который записал 'Sweet Home Chicago'?",
                "answer": "Роберт Джонсон",
                "questionMedia": [{"id": "m60", "type": "audio", "name": "sweet-home-chicago.mp3", "url": "https://example.com/audio/sweet-home-chicago.mp3"}]
              }
            ]
          },
          {
            "id": "cat-3-3",
            "title": "Джазовые стандарты",
            "questions": [
              {
                "id": "q-3-3-1",
                "value": 100,
                "question": "Как называется знаменитый джазовый стандарт 'Autumn Leaves'?",
                "answer": "Autumn Leaves",
                "questionMedia": [{"id": "m61", "type": "audio", "name": "autumn-leaves.mp3", "url": "https://example.com/audio/autumn-leaves.mp3"}]
              },
              {
                "id": "q-3-3-2",
                "value": 200,
                "question": "Кто написал джазовый стандарт 'Blue Moon'?",
                "answer": "Ричард Роджерс и Лоренц Харт",
                "questionMedia": [{"id": "m62", "type": "audio", "name": "blue-moon.mp3", "url": "https://example.com/audio/blue-moon.mp3"}]
              },
              {
                "id": "q-3-3-3",
                "value": 300,
                "question": "Как называется джазовый стандарт 'All of Me'?",
                "answer": "All of Me",
                "questionMedia": [{"id": "m63", "type": "audio", "name": "all-of-me.mp3", "url": "https://example.com/audio/all-of-me.mp3"}]
              },
              {
                "id": "q-3-3-4",
                "value": 400,
                "question": "Кто написал джазовый стандарт 'Fly Me to the Moon'?",
                "answer": "Барт Ховард",
                "questionMedia": [{"id": "m64", "type": "audio", "name": "fly-me-to-moon.mp3", "url": "https://example.com/audio/fly-me-to-moon.mp3"}]
              },
              {
                "id": "q-3-3-5",
                "value": 500,
                "question": "Как называется джазовый стандарт 'The Girl from Ipanema'?",
                "answer": "The Girl from Ipanema",
                "questionMedia": [{"id": "m65", "type": "audio", "name": "ipanema.mp3", "url": "https://example.com/audio/ipanema.mp3"}]
              }
            ]
          },
          {
            "id": "cat-3-4",
            "title": "Джазовые инструменты",
            "questions": [
              {
                "id": "q-3-4-1",
                "value": 100,
                "question": "Какой инструмент является основным в джазе?",
                "answer": "Саксофон",
                "questionMedia": [{"id": "m66", "type": "image", "name": "saxophone.jpg", "url": "https://example.com/images/saxophone.jpg"}]
              },
              {
                "id": "q-3-4-2",
                "value": 200,
                "question": "Какой инструмент используется для ритма в джазе?",
                "answer": "Ударные (барабаны)",
                "questionMedia": [{"id": "m67", "type": "image", "name": "drums.jpg", "url": "https://example.com/images/drums.jpg"}]
              },
              {
                "id": "q-3-4-3",
                "value": 300,
                "question": "Какой инструмент создаёт басовую линию в джазе?",
                "answer": "Контрабас",
                "questionMedia": [{"id": "m68", "type": "image", "name": "double-bass-jazz.jpg", "url": "https://example.com/images/double-bass-jazz.jpg"}]
              },
              {
                "id": "q-3-4-4",
                "value": 400,
                "question": "Какой инструмент используется для гармонии в джазе?",
                "answer": "Фортепиано",
                "questionMedia": [{"id": "m69", "type": "image", "name": "piano-jazz.jpg", "url": "https://example.com/images/piano-jazz.jpg"}]
              },
              {
                "id": "q-3-4-5",
                "value": 500,
                "question": "Какой инструмент часто используется для соло в джазе?",
                "answer": "Труба",
                "questionMedia": [{"id": "m70", "type": "image", "name": "trumpet.jpg", "url": "https://example.com/images/trumpet.jpg"}]
              }
            ]
          },
          {
            "id": "cat-3-5",
            "title": "Современный джаз",
            "questions": [
              {
                "id": "q-3-5-1",
                "value": 100,
                "question": "Кто является современным джазовым пианистом, который записал 'The Way You Look Tonight'?",
                "answer": "Дайана Кролл",
                "questionMedia": [{"id": "m71", "type": "audio", "name": "diana-krall.mp3", "url": "https://example.com/audio/diana-krall.mp3"}]
              },
              {
                "id": "q-3-5-2",
                "value": 200,
                "question": "Как называется джазовый саксофонист, который записал 'Still Got the Blues'?",
                "answer": "Гэри Мур",
                "questionMedia": [{"id": "m72", "type": "audio", "name": "still-got-blues.mp3", "url": "https://example.com/audio/still-got-blues.mp3"}]
              },
              {
                "id": "q-3-5-3",
                "value": 300,
                "question": "Кто является современным джазовым гитаристом, который записал 'Breezin''?",
                "answer": "Джордж Бенсон",
                "questionMedia": [{"id": "m73", "type": "audio", "name": "breezin.mp3", "url": "https://example.com/audio/breezin.mp3"}]
              },
              {
                "id": "q-3-5-4",
                "value": 400,
                "question": "Как называется джазовый трио, которое записало 'The Look of Love'?",
                "answer": "Diana Krall",
                "questionMedia": [{"id": "m74", "type": "audio", "name": "look-of-love.mp3", "url": "https://example.com/audio/look-of-love.mp3"}]
              },
              {
                "id": "q-3-5-5",
                "value": 500,
                "question": "Кто является современным джазовым вокалистом, который записал 'L-O-V-E'?",
                "answer": "Нат Кинг Коул",
                "questionMedia": [{"id": "m75", "type": "audio", "name": "l-o-v-e.mp3", "url": "https://example.com/audio/l-o-v-e.mp3"}]
              }
            ]
          }
        ]
      },
      {
        "id": "round-4",
        "title": "Мировая музыка",
        "categories": [
          {
            "id": "cat-4-1",
            "title": "Латинская музыка",
            "questions": [
              {
                "id": "q-4-1-1",
                "value": 100,
                "question": "Какой танец является символом Латинской Америки?",
                "answer": "Самба или танго",
                "questionMedia": [{"id": "m76", "type": "audio", "name": "samba.mp3", "url": "https://example.com/audio/samba.mp3"}]
              },
              {
                "id": "q-4-1-2",
                "value": 200,
                "question": "Кто исполнил песню 'La Bamba'?",
                "answer": "Ричи Валенс",
                "questionMedia": [{"id": "m77", "type": "audio", "name": "la-bamba.mp3", "url": "https://example.com/audio/la-bamba.mp3"}]
              },
              {
                "id": "q-4-1-3",
                "value": 300,
                "question": "Как называется музыкальный стиль из Бразилии?",
                "answer": "Босса-нова",
                "questionMedia": [{"id": "m78", "type": "audio", "name": "bossa-nova.mp3", "url": "https://example.com/audio/bossa-nova.mp3"}]
              },
              {
                "id": "q-4-1-4",
                "value": 400,
                "question": "Кто является автором песни 'Garota de Ipanema'?",
                "answer": "Антониу Карлус Жобим",
                "questionMedia": [{"id": "m79", "type": "audio", "name": "garota-ipanema.mp3", "url": "https://example.com/audio/garota-ipanema.mp3"}]
              },
              {
                "id": "q-4-1-5",
                "value": 500,
                "question": "Как называется музыкальный инструмент из Латинской Америки с мехами?",
                "answer": "Бандонеон",
                "questionMedia": [{"id": "m80", "type": "image", "name": "bandoneon.jpg", "url": "https://example.com/images/bandoneon.jpg"}]
              }
            ]
          },
          {
            "id": "cat-4-2",
            "title": "Африканская музыка",
            "questions": [
              {
                "id": "q-4-2-1",
                "value": 100,
                "question": "Какой инструмент является символом Африки?",
                "answer": "Джембе",
                "questionMedia": [{"id": "m81", "type": "image", "name": "djembe.jpg", "url": "https://example.com/images/djembe.jpg"}]
              },
              {
                "id": "q-4-2-2",
                "value": 200,
                "question": "Кто является автором песни 'Waka Waka'?",
                "answer": "Shakira",
                "questionMedia": [{"id": "m82", "type": "audio", "name": "waka-waka.mp3", "url": "https://example.com/audio/waka-waka.mp3"}]
              },
              {
                "id": "q-4-2-3",
                "value": 300,
                "question": "Как называется музыкальный стиль из Южной Африки?",
                "answer": "Квайто",
                "questionMedia": [{"id": "m83", "type": "audio", "name": "kwaito.mp3", "url": "https://example.com/audio/kwaito.mp3"}]
              },
              {
                "id": "q-4-2-4",
                "value": 400,
                "question": "Кто является автором песни 'Pata Pata'?",
                "answer": "Мирьям Макеба",
                "questionMedia": [{"id": "m84", "type": "audio", "name": "pata-pata.mp3", "url": "https://example.com/audio/pata-pata.mp3"}]
              },
              {
                "id": "q-4-2-5",
                "value": 500,
                "question": "Как называется музыкальный инструмент из Африки с металлическими пластинами?",
                "answer": "Мбира или калимба",
                "questionMedia": [{"id": "m85", "type": "image", "name": "kalimba.jpg", "url": "https://example.com/images/kalimba.jpg"}]
              }
            ]
          },
          {
            "id": "cat-4-3",
            "title": "Азиатская музыка",
            "questions": [
              {
                "id": "q-4-3-1",
                "value": 100,
                "question": "Какой инструмент является символом Японии?",
                "answer": "Кото или сямисэн",
                "questionMedia": [{"id": "m86", "type": "image", "name": "koto.jpg", "url": "https://example.com/images/koto.jpg"}]
              },
              {
                "id": "q-4-3-2",
                "value": 200,
                "question": "Какой инструмент является символом Китая?",
                "answer": "Эрху или пипа",
                "questionMedia": [{"id": "m87", "type": "image", "name": "erhu.jpg", "url": "https://example.com/images/erhu.jpg"}]
              },
              {
                "id": "q-4-3-3",
                "value": 300,
                "question": "Как называется музыкальный стиль из Индии?",
                "answer": "Рага",
                "questionMedia": [{"id": "m88", "type": "audio", "name": "raga.mp3", "url": "https://example.com/audio/raga.mp3"}]
              },
              {
                "id": "q-4-3-4",
                "value": 400,
                "question": "Какой инструмент является символом Индии?",
                "answer": "Ситар",
                "questionMedia": [{"id": "m89", "type": "image", "name": "sitar.jpg", "url": "https://example.com/images/sitar.jpg"}]
              },
              {
                "id": "q-4-3-5",
                "value": 500,
                "question": "Кто является автором песни 'Gangnam Style'?",
                "answer": "PSY",
                "questionMedia": [{"id": "m90", "type": "audio", "name": "gangnam-style.mp3", "url": "https://example.com/audio/gangnam-style.mp3"}]
              }
            ]
          },
          {
            "id": "cat-4-4",
            "title": "Европейская народная музыка",
            "questions": [
              {
                "id": "q-4-4-1",
                "value": 100,
                "question": "Какой инструмент является символом Ирландии?",
                "answer": "Волынка или ирландская арфа",
                "questionMedia": [{"id": "m91", "type": "image", "name": "irish-harp.jpg", "url": "https://example.com/images/irish-harp.jpg"}]
              },
              {
                "id": "q-4-4-2",
                "value": 200,
                "question": "Какой инструмент является символом Шотландии?",
                "answer": "Волынка",
                "questionMedia": [{"id": "m92", "type": "audio", "name": "bagpipes.mp3", "url": "https://example.com/audio/bagpipes.mp3"}]
              },
              {
                "id": "q-4-4-3",
                "value": 300,
                "question": "Какой инструмент является символом России?",
                "answer": "Балалайка",
                "questionMedia": [{"id": "m93", "type": "image", "name": "balalaika.jpg", "url": "https://example.com/images/balalaika.jpg"}]
              },
              {
                "id": "q-4-4-4",
                "value": 400,
                "question": "Какой инструмент является символом Испании?",
                "answer": "Гитара (фламенко)",
                "questionMedia": [{"id": "m94", "type": "audio", "name": "flamenco.mp3", "url": "https://example.com/audio/flamenco.mp3"}]
              },
              {
                "id": "q-4-4-5",
                "value": 500,
                "question": "Какой инструмент является символом Греции?",
                "answer": "Бузуки",
                "questionMedia": [{"id": "m95", "type": "image", "name": "bouzouki.jpg", "url": "https://example.com/images/bouzouki.jpg"}]
              }
            ]
          },
          {
            "id": "cat-4-5",
            "title": "Музыка разных культур",
            "questions": [
              {
                "id": "q-4-5-1",
                "value": 100,
                "question": "Какой музыкальный стиль пришёл из Ямайки?",
                "answer": "Регги",
                "questionMedia": [{"id": "m96", "type": "audio", "name": "reggae.mp3", "url": "https://example.com/audio/reggae.mp3"}]
              },
              {
                "id": "q-4-5-2",
                "value": 200,
                "question": "Кто является автором песни 'No Woman, No Cry'?",
                "answer": "Боб Марли",
                "questionMedia": [{"id": "m97", "type": "audio", "name": "no-woman.mp3", "url": "https://example.com/audio/no-woman.mp3"}]
              },
              {
                "id": "q-4-5-3",
                "value": 300,
                "question": "Какой музыкальный стиль пришёл из Турции?",
                "answer": "Турецкая народная музыка",
                "questionMedia": [{"id": "m98", "type": "audio", "name": "turkish-folk.mp3", "url": "https://example.com/audio/turkish-folk.mp3"}]
              },
              {
                "id": "q-4-5-4",
                "value": 400,
                "question": "Какой инструмент является символом Армении?",
                "answer": "Дудук",
                "questionMedia": [{"id": "m99", "type": "image", "name": "duduk.jpg", "url": "https://example.com/images/duduk.jpg"}]
              },
              {
                "id": "q-4-5-5",
                "value": 500,
                "question": "Кто является автором песни 'Desert Rose'?",
                "answer": "Стинг",
                "questionMedia": [{"id": "m100", "type": "audio", "name": "desert-rose.mp3", "url": "https://example.com/audio/desert-rose.mp3"}]
              }
            ]
          }
        ]
      },
      {
        "id": "round-5",
        "title": "Киномузыка и саундтреки",
        "categories": [
          {
            "id": "cat-5-1",
            "title": "Знаменитые саундтреки",
            "questions": [
              {
                "id": "q-5-1-1",
                "value": 100,
                "question": "Кто написал музыку к фильму 'Титаник'?",
                "answer": "Джеймс Хорнер",
                "questionMedia": [{"id": "m101", "type": "audio", "name": "titanic-theme.mp3", "url": "https://example.com/audio/titanic-theme.mp3"}]
              },
              {
                "id": "q-5-1-2",
                "value": 200,
                "question": "Кто написал музыку к фильму 'Звёздные войны'?",
                "answer": "Джон Уильямс",
                "questionMedia": [{"id": "m102", "type": "audio", "name": "star-wars-theme.mp3", "url": "https://example.com/audio/star-wars-theme.mp3"}]
              },
              {
                "id": "q-5-1-3",
                "value": 300,
                "question": "Кто написал музыку к фильму 'Гарри Поттер'?",
                "answer": "Джон Уильямс",
                "questionMedia": [{"id": "m103", "type": "audio", "name": "harry-potter-theme.mp3", "url": "https://example.com/audio/harry-potter-theme.mp3"}]
              },
              {
                "id": "q-5-1-4",
                "value": 400,
                "question": "Кто написал музыку к фильму 'Пираты Карибского моря'?",
                "answer": "Клаус Бадельт и Ханс Циммер",
                "questionMedia": [{"id": "m104", "type": "audio", "name": "pirates-theme.mp3", "url": "https://example.com/audio/pirates-theme.mp3"}]
              },
              {
                "id": "q-5-1-5",
                "value": 500,
                "question": "Кто написал музыку к фильму 'Интерстеллар'?",
                "answer": "Ханс Циммер",
                "questionMedia": [{"id": "m105", "type": "audio", "name": "interstellar-theme.mp3", "url": "https://example.com/audio/interstellar-theme.mp3"}]
              }
            ]
          },
          {
            "id": "cat-5-2",
            "title": "Мюзиклы",
            "questions": [
              {
                "id": "q-5-2-1",
                "value": 100,
                "question": "Как называется мюзикл о кошках?",
                "answer": "Кошки (Cats)",
                "questionMedia": [{"id": "m106", "type": "audio", "name": "memory.mp3", "url": "https://example.com/audio/memory.mp3"}]
              },
              {
                "id": "q-5-2-2",
                "value": 200,
                "question": "Кто написал мюзикл 'Призрак оперы'?",
                "answer": "Эндрю Ллойд Уэббер",
                "questionMedia": [{"id": "m107", "type": "audio", "name": "phantom-opera.mp3", "url": "https://example.com/audio/phantom-opera.mp3"}]
              },
              {
                "id": "q-5-2-3",
                "value": 300,
                "question": "Как называется мюзикл о французской революции?",
                "answer": "Отверженные (Les Misérables)",
                "questionMedia": [{"id": "m108", "type": "audio", "name": "les-mis.mp3", "url": "https://example.com/audio/les-mis.mp3"}]
              },
              {
                "id": "q-5-2-4",
                "value": 400,
                "question": "Кто написал мюзикл 'Мамма Миа!'?",
                "answer": "Бенни Андерссон и Бьорн Ульвеус (ABBA)",
                "questionMedia": [{"id": "m109", "type": "audio", "name": "mamma-mia.mp3", "url": "https://example.com/audio/mamma-mia.mp3"}]
              },
              {
                "id": "q-5-2-5",
                "value": 500,
                "question": "Как называется мюзикл о ведьме из Оза?",
                "answer": "Виз (Wicked)",
                "questionMedia": [{"id": "m110", "type": "audio", "name": "wicked.mp3", "url": "https://example.com/audio/wicked.mp3"}]
              }
            ]
          },
          {
            "id": "cat-5-3",
            "title": "Композиторы кино",
            "questions": [
              {
                "id": "q-5-3-1",
                "value": 100,
                "question": "Кто написал музыку к фильму 'Крёстный отец'?",
                "answer": "Нино Рота",
                "questionMedia": [{"id": "m111", "type": "audio", "name": "godfather-theme.mp3", "url": "https://example.com/audio/godfather-theme.mp3"}]
              },
              {
                "id": "q-5-3-2",
                "value": 200,
                "question": "Кто написал музыку к фильму 'Список Шиндлера'?",
                "answer": "Джон Уильямс",
                "questionMedia": [{"id": "m112", "type": "audio", "name": "schindler-list.mp3", "url": "https://example.com/audio/schindler-list.mp3"}]
              },
              {
                "id": "q-5-3-3",
                "value": 300,
                "question": "Кто написал музыку к фильму 'Гладиатор'?",
                "answer": "Ханс Циммер",
                "questionMedia": [{"id": "m113", "type": "audio", "name": "gladiator-theme.mp3", "url": "https://example.com/audio/gladiator-theme.mp3"}]
              },
              {
                "id": "q-5-3-4",
                "value": 400,
                "question": "Кто написал музыку к фильму 'Начало' (Inception)?",
                "answer": "Ханс Циммер",
                "questionMedia": [{"id": "m114", "type": "audio", "name": "inception-theme.mp3", "url": "https://example.com/audio/inception-theme.mp3"}]
              },
              {
                "id": "q-5-3-5",
                "value": 500,
                "question": "Кто написал музыку к фильму 'Аватар'?",
                "answer": "Джеймс Хорнер",
                "questionMedia": [{"id": "m115", "type": "audio", "name": "avatar-theme.mp3", "url": "https://example.com/audio/avatar-theme.mp3"}]
              }
            ]
          },
          {
            "id": "cat-5-4",
            "title": "Песни из фильмов",
            "questions": [
              {
                "id": "q-5-4-1",
                "value": 100,
                "question": "Кто исполнил песню 'My Heart Will Go On' из фильма 'Титаник'?",
                "answer": "Селин Дион",
                "questionMedia": [{"id": "m116", "type": "audio", "name": "my-heart-will-go-on.mp3", "url": "https://example.com/audio/my-heart-will-go-on.mp3"}]
              },
              {
                "id": "q-5-4-2",
                "value": 200,
                "question": "Кто исполнил песню 'I Will Always Love You' из фильма 'Телохранитель'?",
                "answer": "Уитни Хьюстон",
                "questionMedia": [{"id": "m117", "type": "audio", "name": "i-will-always-love-you.mp3", "url": "https://example.com/audio/i-will-always-love-you.mp3"}]
              },
              {
                "id": "q-5-4-3",
                "value": 300,
                "question": "Кто исполнил песню 'Skyfall' из фильма о Джеймсе Бонде?",
                "answer": "Адель",
                "questionMedia": [{"id": "m118", "type": "audio", "name": "skyfall.mp3", "url": "https://example.com/audio/skyfall.mp3"}]
              },
              {
                "id": "q-5-4-4",
                "value": 400,
                "question": "Кто исполнил песню 'Let It Go' из мультфильма 'Холодное сердце'?",
                "answer": "Идина Мензел",
                "questionMedia": [{"id": "m119", "type": "audio", "name": "let-it-go.mp3", "url": "https://example.com/audio/let-it-go.mp3"}]
              },
              {
                "id": "q-5-4-5",
                "value": 500,
                "question": "Кто исполнил песню 'Shallow' из фильма 'Звезда родилась'?",
                "answer": "Леди Гага и Брэдли Купер",
                "questionMedia": [{"id": "m120", "type": "audio", "name": "shallow.mp3", "url": "https://example.com/audio/shallow.mp3"}]
              }
            ]
          },
          {
            "id": "cat-5-5",
            "title": "Анимационные фильмы",
            "questions": [
              {
                "id": "q-5-5-1",
                "value": 100,
                "question": "Кто написал музыку к мультфильму 'Король Лев'?",
                "answer": "Ханс Циммер",
                "questionMedia": [{"id": "m121", "type": "audio", "name": "lion-king-theme.mp3", "url": "https://example.com/audio/lion-king-theme.mp3"}]
              },
              {
                "id": "q-5-5-2",
                "value": 200,
                "question": "Кто исполнил песню 'A Whole New World' из мультфильма 'Аладдин'?",
                "answer": "Брэд Кейн и Лиа Салонга",
                "questionMedia": [{"id": "m122", "type": "audio", "name": "whole-new-world.mp3", "url": "https://example.com/audio/whole-new-world.mp3"}]
              },
              {
                "id": "q-5-5-3",
                "value": 300,
                "question": "Кто написал музыку к мультфильму 'Красавица и чудовище'?",
                "answer": "Алан Менкен",
                "questionMedia": [{"id": "m123", "type": "audio", "name": "beauty-beast.mp3", "url": "https://example.com/audio/beauty-beast.mp3"}]
              },
              {
                "id": "q-5-5-4",
                "value": 400,
                "question": "Кто исполнил песню 'How Far I''ll Go' из мультфильма 'Моана'?",
                "answer": "Аули''и Кравальо",
                "questionMedia": [{"id": "m124", "type": "audio", "name": "how-far-ill-go.mp3", "url": "https://example.com/audio/how-far-ill-go.mp3"}]
              },
              {
                "id": "q-5-5-5",
                "value": 500,
                "question": "Кто написал музыку к мультфильму 'Тачки'?",
                "answer": "Рэнди Ньюман",
                "questionMedia": [{"id": "m125", "type": "audio", "name": "cars-theme.mp3", "url": "https://example.com/audio/cars-theme.mp3"}]
              }
            ]
          }
        ]
      }
    ]
  }$JSON$;
  
  -- Заменяем placeholder на реальный ID
  json_text := replace(json_text, 'QUEST_ID_PLACEHOLDER', quest_id);
  
  -- Преобразуем в JSONB
  quest_data := json_text::jsonb;

  INSERT INTO quests (id, title, description, data) VALUES (
    quest_id,
    'Музыкальный квест',
    'Погрузитесь в мир музыки: от классики до современности, от композиторов до исполнителей',
    quest_data
  );
END $$;

