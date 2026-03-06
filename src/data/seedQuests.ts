import type { Quest } from '@/types'
import { generateId } from '@/utils/id'

export function createMusicQuest(): Quest {
  return {
    id: generateId('quest'),
    title: 'Музыкальный квест',
    description: 'Проверьте свои знания о музыке — от классики до современных хитов!',
    rounds: [
      {
        id: generateId('round'),
        title: 'Раунд 1: Легенды рока',
        categories: [
          {
            id: generateId('category'),
            title: 'Queen',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какая песня Queen стала гимном стадионов по всему миру?', answer: 'We Will Rock You' },
              { id: generateId('q'), value: 200, question: 'Как звали вокалиста группы Queen?', answer: 'Фредди Меркьюри (Freddie Mercury)' },
              { id: generateId('q'), value: 300, question: 'В каком году вышел альбом «A Night at the Opera»?', answer: '1975' },
              { id: generateId('q'), value: 400, question: 'Какая песня Queen длится около 6 минут и считается одной из лучших в истории рока?', answer: 'Bohemian Rhapsody' },
              { id: generateId('q'), value: 500, question: 'Настоящее имя Фредди Меркьюри при рождении?', answer: 'Фарух Булсара' },
            ]
          },
          {
            id: generateId('category'),
            title: 'The Beatles',
            questions: [
              { id: generateId('q'), value: 100, question: 'Из какого города родом The Beatles?', answer: 'Ливерпуль' },
              { id: generateId('q'), value: 200, question: 'Сколько участников было в группе The Beatles?', answer: '4 (Джон, Пол, Джордж, Ринго)' },
              { id: generateId('q'), value: 300, question: 'Какой альбом Beatles содержит знаменитый переход через Abbey Road?', answer: 'Abbey Road' },
              { id: generateId('q'), value: 400, question: 'В каком году The Beatles распались?', answer: '1970' },
              { id: generateId('q'), value: 500, question: 'Кто был продюсером большинства альбомов Beatles, известным как «пятый битл»?', answer: 'Джордж Мартин' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Nirvana',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто был фронтменом группы Nirvana?', answer: 'Курт Кобейн' },
              { id: generateId('q'), value: 200, question: 'Как называется самый известный альбом Nirvana?', answer: 'Nevermind' },
              { id: generateId('q'), value: 300, question: 'Какая песня открывает альбом Nevermind?', answer: 'Smells Like Teen Spirit' },
              { id: generateId('q'), value: 400, question: 'В каком городе была основана группа Nirvana?', answer: 'Абердин, штат Вашингтон' },
              { id: generateId('q'), value: 500, question: 'Как называется последний студийный альбом Nirvana?', answer: 'In Utero (1993)' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Led Zeppelin',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой инструмент играл Джимми Пейдж в Led Zeppelin?', answer: 'Гитара' },
              { id: generateId('q'), value: 200, question: 'Как называется самая известная песня Led Zeppelin?', answer: 'Stairway to Heaven' },
              { id: generateId('q'), value: 300, question: 'В каком году была основана группа Led Zeppelin?', answer: '1968' },
              { id: generateId('q'), value: 400, question: 'Кто был вокалистом Led Zeppelin?', answer: 'Роберт Плант' },
              { id: generateId('q'), value: 500, question: 'Какой символ Джимми Пейдж использовал вместо имени на альбоме Led Zeppelin IV?', answer: 'ZoSo (руна)' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Pink Floyd',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой альбом Pink Floyd содержит песню «Another Brick in the Wall»?', answer: 'The Wall' },
              { id: generateId('q'), value: 200, question: 'Что изображено на обложке альбома «The Dark Side of the Moon»?', answer: 'Призма, разлагающая свет на радугу' },
              { id: generateId('q'), value: 300, question: 'Кто был основателем и первым лидером Pink Floyd?', answer: 'Сид Барретт' },
              { id: generateId('q'), value: 400, question: 'Сколько недель альбом «The Dark Side of the Moon» находился в чарте Billboard 200?', answer: '937 недель (более 18 лет)' },
              { id: generateId('q'), value: 500, question: 'Какое животное было надувным талисманом группы на концертах?', answer: 'Свинья' },
            ]
          }
        ]
      },
      {
        id: generateId('round'),
        title: 'Раунд 2: Поп и современность',
        categories: [
          {
            id: generateId('category'),
            title: 'Майкл Джексон',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какое прозвище носил Майкл Джексон?', answer: 'Король поп-музыки' },
              { id: generateId('q'), value: 200, question: 'Как называется самый продаваемый альбом в истории?', answer: 'Thriller' },
              { id: generateId('q'), value: 300, question: 'Какой фирменный танцевальный приём создал Майкл Джексон?', answer: 'Лунная походка (Moonwalk)' },
              { id: generateId('q'), value: 400, question: 'В какой семейной группе начинал карьеру Майкл Джексон?', answer: 'The Jackson 5' },
              { id: generateId('q'), value: 500, question: 'Сколько копий альбома Thriller было продано по всему миру?', answer: 'Более 70 миллионов' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Современные хиты',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто исполняет песню «Shape of You»?', answer: 'Эд Ширан (Ed Sheeran)' },
              { id: generateId('q'), value: 200, question: 'Какая песня стала первым клипом, набравшим миллиард просмотров на YouTube?', answer: 'Gangnam Style — PSY' },
              { id: generateId('q'), value: 300, question: 'Кто исполняет песню «Blinding Lights»?', answer: 'The Weeknd' },
              { id: generateId('q'), value: 400, question: 'Какой альбом Адель назван числом?', answer: '21, 25 или 30 (все три)' },
              { id: generateId('q'), value: 500, question: 'Какая песня Луиса Фонси стала самым просматриваемым видео на YouTube?', answer: 'Despacito' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Русская музыка',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто исполняет песню «Группа крови»?', answer: 'Кино (Виктор Цой)' },
              { id: generateId('q'), value: 200, question: 'Как называется группа Бориса Гребенщикова?', answer: 'Аквариум' },
              { id: generateId('q'), value: 300, question: 'Кто написал рок-оперу «Юнона и Авось»?', answer: 'Алексей Рыбников' },
              { id: generateId('q'), value: 400, question: 'Какая группа исполняет песню «Всё идёт по плану»?', answer: 'Гражданская оборона' },
              { id: generateId('q'), value: 500, question: 'В каком году погиб Виктор Цой?', answer: '1990' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Музыкальные клипы',
            questions: [
              { id: generateId('q'), value: 100, question: 'Клип какой песни Майкла Джексона длится 14 минут?', answer: 'Thriller' },
              { id: generateId('q'), value: 200, question: 'В клипе какой песни OK Go танцуют на беговых дорожках?', answer: 'Here It Goes Again' },
              { id: generateId('q'), value: 300, question: 'Кто снял клип «Sledgehammer» для Питера Гэбриела?', answer: 'Стивен Р. Джонсон (пластилиновая анимация)' },
              { id: generateId('q'), value: 400, question: 'В клипе какой песни Бейонсе танцует в жёлтом платье на фоне горящего здания?', answer: 'Hold Up (из альбома Lemonade)' },
              { id: generateId('q'), value: 500, question: 'Какой клип считается первым видео, показанным на канале MTV 1 августа 1981 года?', answer: 'Video Killed the Radio Star — The Buggles' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Награды и рекорды',
            questions: [
              { id: generateId('q'), value: 100, question: 'Как называется главная музыкальная премия в мире?', answer: 'Грэмми (Grammy)' },
              { id: generateId('q'), value: 200, question: 'Кто имеет наибольшее количество наград Грэмми среди женщин?', answer: 'Бейонсе' },
              { id: generateId('q'), value: 300, question: 'Какой артист провёл больше всего недель на первом месте Billboard Hot 100?', answer: 'The Weeknd (Blinding Lights — 90 недель в чарте)' },
              { id: generateId('q'), value: 400, question: 'Какой альбом стал первым, достигшим миллиарда прослушиваний на Spotify?', answer: '÷ (Divide) — Ed Sheeran' },
              { id: generateId('q'), value: 500, question: 'Кто является самым продаваемым сольным артистом всех времён?', answer: 'Элвис Пресли' },
            ]
          }
        ]
      },
      {
        id: generateId('round'),
        title: 'Раунд 3: Классика и инструменты',
        categories: [
          {
            id: generateId('category'),
            title: 'Классическая музыка',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто написал «Лунную сонату»?', answer: 'Людвиг ван Бетховен' },
              { id: generateId('q'), value: 200, question: 'Какой композитор написал «Времена года»?', answer: 'Антонио Вивальди' },
              { id: generateId('q'), value: 300, question: 'Сколько симфоний написал Бетховен?', answer: '9' },
              { id: generateId('q'), value: 400, question: 'Какой композитор стал глухим, но продолжал писать музыку?', answer: 'Людвиг ван Бетховен' },
              { id: generateId('q'), value: 500, question: 'Как называется последняя, незаконченная опера Моцарта?', answer: 'Реквием' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Инструменты',
            questions: [
              { id: generateId('q'), value: 100, question: 'Сколько струн у стандартной гитары?', answer: '6' },
              { id: generateId('q'), value: 200, question: 'Какой инструмент называют «королём оркестра»?', answer: 'Скрипка' },
              { id: generateId('q'), value: 300, question: 'Сколько клавиш на стандартном фортепиано?', answer: '88' },
              { id: generateId('q'), value: 400, question: 'К какой группе инструментов относится саксофон?', answer: 'Деревянные духовые (несмотря на металлический корпус)' },
              { id: generateId('q'), value: 500, question: 'Какой инструмент является самым большим в оркестре?', answer: 'Контрабас (или рояль, если считать клавишные)' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Музыка из кино',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто написал музыку к фильмам о Гарри Поттере?', answer: 'Джон Уильямс (первые три фильма)' },
              { id: generateId('q'), value: 200, question: 'Какая песня из «Титаника» стала мировым хитом?', answer: 'My Heart Will Go On — Селин Дион' },
              { id: generateId('q'), value: 300, question: 'Кто написал музыку к «Звёздным войнам»?', answer: 'Джон Уильямс' },
              { id: generateId('q'), value: 400, question: 'Какая песня из мультфильма «Холодное сердце» стала мировым хитом?', answer: 'Let It Go' },
              { id: generateId('q'), value: 500, question: 'Кто написал саундтрек к фильму «Интерстеллар»?', answer: 'Ханс Циммер' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Жанры музыки',
            questions: [
              { id: generateId('q'), value: 100, question: 'Из какой страны родом жанр регги?', answer: 'Ямайка' },
              { id: generateId('q'), value: 200, question: 'Какой жанр музыки зародился в Новом Орлеане?', answer: 'Джаз' },
              { id: generateId('q'), value: 300, question: 'Что означает аббревиатура EDM?', answer: 'Electronic Dance Music (электронная танцевальная музыка)' },
              { id: generateId('q'), value: 400, question: 'Какой жанр появился в Бронксе (Нью-Йорк) в 1970-х?', answer: 'Хип-хоп' },
              { id: generateId('q'), value: 500, question: 'Как называется жанр, сочетающий панк и электронную музыку, популярный в 2000-х?', answer: 'Электроклэш (Electroclash)' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Музыкальные факты',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какая нота идёт после «до» в гамме?', answer: 'Ре' },
              { id: generateId('q'), value: 200, question: 'Сколько нот в октаве?', answer: '7 (до, ре, ми, фа, соль, ля, си)' },
              { id: generateId('q'), value: 300, question: 'Что такое «риф» в музыке?', answer: 'Короткая повторяющаяся музыкальная фраза' },
              { id: generateId('q'), value: 400, question: 'Какой музыкальный термин означает «постепенное усиление звука»?', answer: 'Крещендо (crescendo)' },
              { id: generateId('q'), value: 500, question: 'Частота какой ноты принята за стандарт настройки и равна 440 Гц?', answer: 'Ля первой октавы (A4)' },
            ]
          }
        ]
      }
    ]
  }
}

/** Киноквест на 5 раундов — всегда доступен по умолчанию */
export function createKinokvest(): Quest {
  return {
    id: generateId('quest'),
    title: 'Киноквест',
    description: 'Проверьте свои знания о кино — от классики до блокбастеров!',
    rounds: [
      {
        id: generateId('round'),
        title: 'Классика кино',
        categories: [
          {
            id: generateId('category'),
            title: 'Оскар',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой фильм получил «Оскар» за лучший фильм в 2020 году?', answer: 'Паразиты' },
              { id: generateId('q'), value: 200, question: 'Кто получил «Оскар» за лучшую мужскую роль в «Форресте Гампе»?', answer: 'Том Хэнкс' },
              { id: generateId('q'), value: 300, question: 'В каком году вручают премию «Оскар»?', answer: 'Ежегодно с 1929 года' },
              { id: generateId('q'), value: 400, question: 'Какой фильм выиграл «Оскар» за лучший фильм в 1998 году?', answer: 'Титаник' },
              { id: generateId('q'), value: 500, question: 'Сколько категорий «Оскар» вручается на церемонии?', answer: '24 (по состоянию на последние годы)' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Стивен Спилберг',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой фильм Спилберга рассказывает о доисторическом парке?', answer: 'Парк Юрского периода' },
              { id: generateId('q'), value: 200, question: 'Как зовут мальчика-героя «Инопланетянина»?', answer: 'Эллиот' },
              { id: generateId('q'), value: 300, question: 'В каком году вышел «Список Шиндлера»?', answer: '1993' },
              { id: generateId('q'), value: 400, question: 'Какой фильм Спилберга снят про Вторую мировую войну и спасение рядового?', answer: 'Спасти рядового Райана' },
              { id: generateId('q'), value: 500, question: 'Как называется научно-фантастический фильм Спилберга про НЛО?', answer: 'Близкие контакты третьей степени' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Классика Голливуда',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой фильм снял Орсон Уэллс в 1941 году?', answer: 'Гражданин Кейн' },
              { id: generateId('q'), value: 200, question: 'Кто сыграл главную роль в «Касабланке»?', answer: 'Хамфри Богарт' },
              { id: generateId('q'), value: 300, question: 'В каком фильме героиня произносит: «Завтра будет другой день»?', answer: 'Унесённые ветром' },
              { id: generateId('q'), value: 400, question: 'Какой фильм Билли Уайлдера о Голливуде получил множество «Оскаров»?', answer: 'Бульвар Сансет' },
              { id: generateId('q'), value: 500, question: 'Кто режиссёр «Крёстного отца»?', answer: 'Фрэнсис Форд Коппола' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Хичкок',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой фильм Хичкока снят в душевой сцене?', answer: 'Психо' },
              { id: generateId('q'), value: 200, question: 'Кто сыграл главную роль в «Головокружении»?', answer: 'Джеймс Стюарт и Ким Новак' },
              { id: generateId('q'), value: 300, question: 'Как называется фильм Хичкока про птиц?', answer: 'Птицы' },
              { id: generateId('q'), value: 400, question: 'В каком фильме Хичкока действие происходит в поезде?', answer: 'Север к северо-западу' },
              { id: generateId('q'), value: 500, question: 'Какой цвет преобладает в фильме Хичкока «Головокружение» в ключевых сценах?', answer: 'Зелёный' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Вестерны',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто снял «Хороший, плохой, злой»?', answer: 'Серджио Леоне' },
              { id: generateId('q'), value: 200, question: 'Какой актёр прославился ролями в вестернах и «Играл с огнём»?', answer: 'Клинт Иствуд' },
              { id: generateId('q'), value: 300, question: 'Как называется вестерн с Полом Ньюманом и Робертом Редфордом?', answer: 'Бутч Кэссиди и Санденс Кид' },
              { id: generateId('q'), value: 400, question: 'Какой вестерн с Клинтом Иствудом снял Серджио Леоне?', answer: 'Хороший, плохой, злой / На несколько долларов больше' },
              { id: generateId('q'), value: 500, question: 'Какой вестерн Джона Форда снят в долине Монументов?', answer: 'Искатели' },
            ]
          },
        ]
      },
      {
        id: generateId('round'),
        title: 'Блокбастеры',
        categories: [
          {
            id: generateId('category'),
            title: 'Марвел',
            questions: [
              { id: generateId('q'), value: 100, question: 'Как зовут бога грома из Марвел?', answer: 'Тор' },
              { id: generateId('q'), value: 200, question: 'Какой камень даёт силу времени в фильмах Марвел?', answer: 'Камень времени (Time Stone)' },
              { id: generateId('q'), value: 300, question: 'Кто сыграл Железного человека в КВМ?', answer: 'Роберт Дауни-младший' },
              { id: generateId('q'), value: 400, question: 'В каком фильме впервые собралась команда Мстителей?', answer: 'Мстители (2012)' },
              { id: generateId('q'), value: 500, question: 'Какой актёр сыграл Капитана Америку в КВМ?', answer: 'Крис Эванс' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Звёздные войны',
            questions: [
              { id: generateId('q'), value: 100, question: 'Как зовут отца Люка Скайуокера?', answer: 'Дарт Вейдер (Энакин Скайуокер)' },
              { id: generateId('q'), value: 200, question: 'Как называется родная планета Люка?', answer: 'Татуин' },
              { id: generateId('q'), value: 300, question: 'Кто написал музыку к «Звёздным войнам»?', answer: 'Джон Уильямс' },
              { id: generateId('q'), value: 400, question: 'Какой орден защищает галактику в саге?', answer: 'Джедаи' },
              { id: generateId('q'), value: 500, question: 'В каком году вышел первый фильм «Звёздные войны»?', answer: '1977' },
            ]
          },
          {
            id: generateId('category'),
            title: 'DC и супергерои',
            questions: [
              { id: generateId('q'), value: 100, question: 'Как зовут родной город Бэтмена?', answer: 'Готэм' },
              { id: generateId('q'), value: 200, question: 'Какой металл ослабляет Супермена?', answer: 'Криптонит' },
              { id: generateId('q'), value: 300, question: 'Кто сыграл Джокера в «Тёмном рыцаре»?', answer: 'Хит Леджер' },
              { id: generateId('q'), value: 400, question: 'Как зовут супергероиню из «Чудо-женщины»?', answer: 'Диана Принс' },
              { id: generateId('q'), value: 500, question: 'В каком фильме DC снялся Генри Кавилл в роли Супермена?', answer: 'Человек из стали' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Властелин колец',
            questions: [
              { id: generateId('q'), value: 100, question: 'Как зовут хоббита — хранителя Кольца?', answer: 'Фродо' },
              { id: generateId('q'), value: 200, question: 'В какой стране снимали трилогию «Властелин колец»?', answer: 'Новая Зеландия' },
              { id: generateId('q'), value: 300, question: 'Кто режиссёр «Властелина колец»?', answer: 'Питер Джексон' },
              { id: generateId('q'), value: 400, question: 'Как зовут волшебника с посохом в трилогии?', answer: 'Гэндальф' },
              { id: generateId('q'), value: 500, question: 'Как называется крепость Саурона?', answer: 'Барад-дур' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Гарри Поттер',
            questions: [
              { id: generateId('q'), value: 100, question: 'Как называется школа волшебства для Гарри?', answer: 'Хогвартс' },
              { id: generateId('q'), value: 200, question: 'Кто сыграл Гарри Поттера в фильмах?', answer: 'Дэниел Рэдклифф' },
              { id: generateId('q'), value: 300, question: 'Как зовут лучшего друга Гарри?', answer: 'Рон Уизли' },
              { id: generateId('q'), value: 400, question: 'Кто написал музыку к первым фильмам о Гарри Поттере?', answer: 'Джон Уильямс' },
              { id: generateId('q'), value: 500, question: 'Как называется седьмая книга о Гарри Поттере?', answer: 'Гарри Поттер и Дары Смерти' },
            ]
          },
        ]
      },
      {
        id: generateId('round'),
        title: 'Анимация',
        categories: [
          {
            id: generateId('category'),
            title: 'Дисней',
            questions: [
              { id: generateId('q'), value: 100, question: 'Как зовут принцессу в «Холодном сердце»?', answer: 'Эльза и Анна' },
              { id: generateId('q'), value: 200, question: 'Какой мультфильм Диснея рассказывает о львёнке Симбе?', answer: 'Король Лев' },
              { id: generateId('q'), value: 300, question: 'Как зовут русалку Диснея?', answer: 'Ариэль' },
              { id: generateId('q'), value: 400, question: 'В каком году вышел первый полнометражный мультфильм Диснея?', answer: '1937 («Белоснежка и семь гномов»)' },
              { id: generateId('q'), value: 500, question: 'Какой диснеевский персонаж летает на ковре?', answer: 'Аладдин (и Жасмин)' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Пиксар',
            questions: [
              { id: generateId('q'), value: 100, question: 'Как зовут рыжего робота в мультфильме про космос?', answer: 'Валли (WALL-E)' },
              { id: generateId('q'), value: 200, question: 'В каком мультфильме игрушки оживают?', answer: 'История игрушек' },
              { id: generateId('q'), value: 300, question: 'Как зовут девочку в «Вверх»?', answer: 'Элли' },
              { id: generateId('q'), value: 400, question: 'Какой мультфильм Пиксар про рыбку?', answer: 'В поисках Немо' },
              { id: generateId('q'), value: 500, question: 'Какой первый полнометражный мультфильм студии Pixar?', answer: 'История игрушек (1995)' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Дримворкс',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой мультфильм DreamWorks про дракона и викингов?', answer: 'Как приручить дракона' },
              { id: generateId('q'), value: 200, question: 'Как зовут осла в «Шреке»?', answer: 'Осёл' },
              { id: generateId('q'), value: 300, question: 'Какой мультфильм DreamWorks про пингвинов из зоопарка?', answer: 'Мадагаскар' },
              { id: generateId('q'), value: 400, question: 'Кто озвучил Шрека в оригинале?', answer: 'Майк Майерс' },
              { id: generateId('q'), value: 500, question: 'В каком году вышел первый «Шрек»?', answer: '2001' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Японская анимация',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто режиссёр «Унесённых призраками»?', answer: 'Хаяо Миядзаки' },
              { id: generateId('q'), value: 200, question: 'Как называется студия Миядзаки?', answer: 'Studio Ghibli' },
              { id: generateId('q'), value: 300, question: 'Как зовут девушку-ведьму в «Унесённых призраками»?', answer: 'Юбаба' },
              { id: generateId('q'), value: 400, question: 'Какой аниме-фильм получил «Оскар» за лучший анимационный фильм?', answer: 'Унесённые призраками' },
              { id: generateId('q'), value: 500, question: 'Как называется фильм Миядзаки про летающий замок?', answer: 'Ходячий замок Хаула' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Современная анимация',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой мультфильм про эмоции внутри головы девочки?', answer: 'Головоломка' },
              { id: generateId('q'), value: 200, question: 'В каком мультфильме зверь живёт в городе зайцев?', answer: 'Зверополис' },
              { id: generateId('q'), value: 300, question: 'Какой мультфильм Pixar про семью супергероев?', answer: 'Суперсемейка' },
              { id: generateId('q'), value: 400, question: 'Как зовут паучка в мультфильме «Человек-паук: Паутина вселенных»?', answer: 'Майлз Моралес' },
              { id: generateId('q'), value: 500, question: 'Какой мультфильм получил «Оскар» за лучший анимационный фильм в 2024 году?', answer: 'Мальчик и птица' },
            ]
          },
        ]
      },
      {
        id: generateId('round'),
        title: 'Российское кино',
        categories: [
          {
            id: generateId('category'),
            title: 'Комедии',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто сыграл главную роль в «Иронии судьбы»?', answer: 'Андрей Мягков' },
              { id: generateId('q'), value: 200, question: 'Как называется комедия Гайдая про троих в одной квартире?', answer: 'Операция «Ы» и другие приключения Шурика' },
              { id: generateId('q'), value: 300, question: 'Какой фильм с Фандерой и Смирновым про «нашу службу и опасна»?', answer: 'Служебный роман' },
              { id: generateId('q'), value: 400, question: 'Кто режиссёр «Бриллиантовой руки»?', answer: 'Леонид Гайдай' },
              { id: generateId('q'), value: 500, question: 'В каком году вышла «Ирония судьбы»?', answer: '1975' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Драма и военное кино',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой фильм Тарковского про зону и сталкера?', answer: 'Сталкер' },
              { id: generateId('q'), value: 200, question: 'Кто снял «Войну и мир» (СССР)?', answer: 'Сергей Бондарчук' },
              { id: generateId('q'), value: 300, question: 'Как называется фильм про блокаду Ленинграда с Ливановым?', answer: 'Блокада' },
              { id: generateId('q'), value: 400, question: 'Какой советский фильм получил «Оскар» за лучший иностранный фильм?', answer: 'Война и мир (1968), Москва слезам не верит (1980) и др.' },
              { id: generateId('q'), value: 500, question: 'Кто режиссёр «Андрея Рублёва»?', answer: 'Андрей Тарковский' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Детективы и триллеры',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто сыграл Шерлока Холмса в советском сериале?', answer: 'Василий Ливанов' },
              { id: generateId('q'), value: 200, question: 'Какой фильм снял Станислав Говорухин про Мегрэ?', answer: 'Место встречи изменить нельзя' },
              { id: generateId('q'), value: 300, question: 'Как называется фильм Балабанова про бандитов в 90-х?', answer: 'Брат' },
              { id: generateId('q'), value: 400, question: 'Кто режиссёр «Жмурки»?', answer: 'Алексей Балабанов' },
              { id: generateId('q'), value: 500, question: 'В каком фильме звучит фраза «Всё будет хорошо»?', answer: 'Бриллиантовая рука' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Фантастика и приключения',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой советский фильм про космос снял Клушанцев?', answer: 'Планета бурь / Луна' },
              { id: generateId('q'), value: 200, question: 'Как называется фильм Тарковского по роману Лема?', answer: 'Солярис' },
              { id: generateId('q'), value: 300, question: 'Кто снял «Приключения Электроника»?', answer: 'Константин Бромберг' },
              { id: generateId('q'), value: 400, question: 'Какой фильм Гайдая снят по Ильфу и Петрову?', answer: '12 стульев' },
              { id: generateId('q'), value: 500, question: 'Кто режиссёр «Сталкера»?', answer: 'Андрей Тарковский' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Мелодрамы и драмы',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто сыграл главную роль в «Москва слезам не верит»?', answer: 'Вера Алентова' },
              { id: generateId('q'), value: 200, question: 'Какой фильм Рязанова про любовь и поезд?', answer: 'Вокзал для двоих' },
              { id: generateId('q'), value: 300, question: 'Кто режиссёр «Осеннего марафона»?', answer: 'Георгий Данелия' },
              { id: generateId('q'), value: 400, question: 'В каком фильме звучит песня «Остров невезения»?', answer: 'Бриллиантовая рука' },
              { id: generateId('q'), value: 500, question: 'Какой фильм Меньшова получил «Оскар» за лучший иностранный фильм?', answer: 'Москва слезам не верит' },
            ]
          },
        ]
      },
      {
        id: generateId('round'),
        title: 'Саундтреки и факты',
        categories: [
          {
            id: generateId('category'),
            title: 'Музыка из кино',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какая песня звучит в «Титанике»?', answer: 'My Heart Will Go On' },
              { id: generateId('q'), value: 200, question: 'Кто написал музыку к «Гарри Поттеру»?', answer: 'Джон Уильямс (первые три), затем другие композиторы' },
              { id: generateId('q'), value: 300, question: 'Какой хит из «Холодного сердца» знают во всём мире?', answer: 'Let It Go' },
              { id: generateId('q'), value: 400, question: 'Кто написал саундтрек к «Интерстеллару»?', answer: 'Ханс Циммер' },
              { id: generateId('q'), value: 500, question: 'Какой фильм сделал знаменитой песню «(I\'ve Had) The Time of My Life»?', answer: 'Грязные танцы' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Кинофакты',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой фильм самый кассовый в истории?', answer: 'Аватар (до 2020-х); затем могли обойти другие' },
              { id: generateId('q'), value: 200, question: 'В какой стране снимали «Властелин колец»?', answer: 'Новая Зеландия' },
              { id: generateId('q'), value: 300, question: 'Какой режиссёр снял «Криминальное чтиво»?', answer: 'Квентин Тарантино' },
              { id: generateId('q'), value: 400, question: 'Какой студии принадлежит франшиза «Гарри Поттер» (фильмы)?', answer: 'Warner Bros.' },
              { id: generateId('q'), value: 500, question: 'Какой фильм выиграл «Оскар» за лучший фильм в 2024 году?', answer: 'Оппенгеймер' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Режиссёры',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто снял «Криминальное чтиво»?', answer: 'Квентин Тарантино' },
              { id: generateId('q'), value: 200, question: 'Какой режиссёр снял «Начало» и «Тёмный рыцарь»?', answer: 'Кристофер Нолан' },
              { id: generateId('q'), value: 300, question: 'Кто режиссёр «Титаника» и «Аватара»?', answer: 'Джеймс Кэмерон' },
              { id: generateId('q'), value: 400, question: 'Какой режиссёр снял «Интерстеллар»?', answer: 'Кристофер Нолан' },
              { id: generateId('q'), value: 500, question: 'Кто снял «Апокалипсис сегодня»?', answer: 'Фрэнсис Форд Коппола' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Актёры',
            questions: [
              { id: generateId('q'), value: 100, question: 'Кто сыграл Джекса в «Титанике»?', answer: 'Леонардо ДиКаприо' },
              { id: generateId('q'), value: 200, question: 'Какой актёр сыграл Тони Старка в КВМ?', answer: 'Роберт Дауни-младший' },
              { id: generateId('q'), value: 300, question: 'Кто сыграл Джокера в «Джокере» (2019)?', answer: 'Хоакин Феникс' },
              { id: generateId('q'), value: 400, question: 'Какой актёр сыграл Форреста Гампа?', answer: 'Том Хэнкс' },
              { id: generateId('q'), value: 500, question: 'Кто сыграл главную роль в «Одержимости» (Whiplash)?', answer: 'Майлз Теллер (и Дж. К. Симмонс — учитель)' },
            ]
          },
          {
            id: generateId('category'),
            title: 'Награды и рекорды',
            questions: [
              { id: generateId('q'), value: 100, question: 'Какой фестиваль проходит в Каннах?', answer: 'Каннский кинофестиваль' },
              { id: generateId('q'), value: 200, question: 'Какой фильм получил больше всего «Оскаров» (11)?', answer: 'Бен-Гур, Титаник, Властелин колец: Возвращение короля' },
              { id: generateId('q'), value: 300, question: 'В какой стране вручают «Золотую пальмовую ветвь»?', answer: 'Франция (Канны)' },
              { id: generateId('q'), value: 400, question: 'Какой фильм долгое время был самым кассовым в мире?', answer: 'Аватар' },
              { id: generateId('q'), value: 500, question: 'Какой фильм получил «Оскар» за лучший фильм в 2023 году?', answer: 'Всё везде и сразу' },
            ]
          },
        ]
      },
    ]
  }
}
