import type { useQuizStore } from '@/store/quizStore'

/** Префикс в названии — чтобы не плодить дубликаты при повторном заходе. */
export const TEST_QUEST_PREFIX = '[Тест] '

type TestQuestDef = {
  title: string
  description: string
  emoji: string
  categories: number
  questions: number
  rounds?: number
  samples: Array<[question: string, answer: string]>
}

const TEST_QUEST_DEFS: TestQuestDef[] = [
  {
    title: `${TEST_QUEST_PREFIX}Історія`,
    description: 'Події, особистості та цікаві факти з минулого.',
    emoji: '🏛',
    categories: 3,
    questions: 3,
    samples: [
      ['Столиця України?', 'Київ'],
      ['Рік проголошення незалежності України?', '1991'],
      ['Хто написав «Кобзар»?', 'Тарас Шевченко'],
      ['Перша людина на Місяці?', 'Ніл Армстронг'],
      ['Столиця Франції?', 'Париж'],
      ['Рік падіння Берлінського муру?', '1989'],
      ['Автор «Гамлета»?', 'Вільям Шекспір'],
      ['Столиця Японії?', 'Токіо'],
      ['Рік Відкриття Америки Колумбом?', '1492']
    ]
  },
  {
    title: `${TEST_QUEST_PREFIX}Наука`,
    description: 'Фізика, біологія, космос — для любителів експериментів.',
    emoji: '🔬',
    categories: 3,
    questions: 3,
    samples: [
      ['Хімічний символ води?', 'H₂O'],
      ['Планета, найближча до Сонця?', 'Меркурій'],
      ['Скільки хромосом у людини?', '46'],
      ['Одиниця сили в SI?', 'Ньютон'],
      ['Газ, необхідний для дихання?', 'Кисень'],
      ['Швидкість світла (~)?', '300 000 км/с'],
      ['Орган, що перекачує кров?', 'Серце'],
      ['Найменша частинка елемента?', 'Атом'],
      ['Супутник Землі?', 'Місяць']
    ]
  },
  {
    title: `${TEST_QUEST_PREFIX}Кіно`,
    description: 'Фільми, актори та культові цитати.',
    emoji: '🎬',
    categories: 2,
    questions: 4,
    samples: [
      ['Режисер «Titanic»?', 'James Cameron'],
      ['Хто зіграв Джокера у «The Dark Knight»?', 'Хіт Леджер'],
      ['Фільм про Нео та червону таблетку?', 'Матриця'],
      ['«May the Force be with you» — з якого фільму?', 'Зоряні війни'],
      ['Актор Iron Man у MCU?', 'Роберт Дауні-мл.'],
      ['Мультфільм про короля лева?', 'Король Лев'],
      ['Рік виходу «Аватара»?', '2009'],
      ['Хто режисував «Паразити»?', 'Bong Joon-ho']
    ]
  },
  {
    title: `${TEST_QUEST_PREFIX}Спорт`,
    description: 'Чемпіонати, рекорди та легенди спорту.',
    emoji: '⚽',
    categories: 2,
    questions: 4,
    samples: [
      ['Скільки гравців у футбольній команді на полі?', '11'],
      ['Країна — переможець ЧС-2018?', 'Франція'],
      ['Вид спорту: кільце та кошик?', 'Баскетбол'],
      ['Скільки сетів у класичному тенісному матчі (чоловіки)?', '5'],
      ['Олімпійські кільця — скільки кольорів?', '5'],
      ['Тур de France — це …?', 'Велогонка'],
      ['Вага боксерської рукавиці (профі)?', '10 унцій'],
      ['Столиця Олімпіади-2024?', 'Париж']
    ]
  }
]

type QuizStore = ReturnType<typeof useQuizStore>

async function fillSampleQuestions(
  store: QuizStore,
  questId: string,
  samples: Array<[string, string]>
) {
  const quest = store.getQuestById(questId)
  if (!quest?.rounds) return

  let idx = 0
  for (const round of quest.rounds) {
    for (const category of round.categories) {
      for (const question of category.questions) {
        if (idx >= samples.length) return
        const [questionText, answerText] = samples[idx++]
        await store.updateQuestion(questId, round.id, category.id, question.id, {
          question: questionText,
          answer: answerText
        })
      }
    }
  }
}

/** Создаёт 4 тестовых квеста в dev, если их ещё нет (идемпотентно по префиксу названия). */
export async function seedTestQuests(store: QuizStore): Promise<number> {
  if (!import.meta.env.DEV) return 0

  const existing = new Set(store.quests.map(q => q.title))
  let created = 0

  for (const def of TEST_QUEST_DEFS) {
    if (existing.has(def.title)) continue
    const questId = await store.createQuestWithBoard(
      def.title,
      def.description,
      def.categories,
      def.questions,
      def.rounds ?? 1,
      def.emoji
    )
    await fillSampleQuestions(store, questId, def.samples)
    await store.flushSave()
    existing.add(def.title)
    created++
  }

  if (created > 0) {
    console.log(`🧪 [Quest] Seeded ${created} test quest(s)`)
  }
  return created
}
