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
