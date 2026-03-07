/**
 * Генерирует JSON квеста из quizData (5 раундов, музыкальная викторина).
 * Запуск: node scripts/generate-music-quest.mjs
 */
import { writeFileSync } from 'fs'
import { randomUUID } from 'crypto'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function uid() { return randomUUID() }

function mediaAsset(type, url, name = '') {
  if (!url || String(url).trim() === '') return null
  return { id: uid(), type, name: name || url, url: String(url).trim() }
}

function buildQuestion(raw, value) {
  const questionMedia = []
  const answerMedia = []
  if (raw.image && String(raw.image).trim()) questionMedia.push(mediaAsset('image', raw.image))
  if (raw.audio && String(raw.audio).trim()) questionMedia.push(mediaAsset('audio', raw.audio))
  if (raw.answerAudio && String(raw.answerAudio).trim()) answerMedia.push(mediaAsset('audio', raw.answerAudio))

  return {
    id: uid(),
    value,
    question: raw.text || '',
    answer: raw.answer || '',
    questionMedia: questionMedia.length ? questionMedia : undefined,
    answerMedia: answerMedia.length ? answerMedia : undefined,
  }
}

function buildCategory(rawCat, roundIndex, catIndex) {
  const questions = (rawCat.questions || []).slice(0, 5).map((q, i) =>
    buildQuestion(q, [100, 200, 300, 400, 500][i])
  )
  return {
    id: uid(),
    title: rawCat.title || `Категория ${catIndex + 1}`,
    questions,
  }
}

function buildRound(roundCategories, roundIndex) {
  return {
    id: uid(),
    title: `Раунд ${roundIndex + 1}`,
    categories: roundCategories.map((cat, i) => buildCategory(cat, roundIndex, i)),
  }
}

// ——— Исходные данные (очищенные от комментариев и лишних запятых) ———
const roundsData = [
  // Раунд 1
  [
    { title: "ЦИТАТЫ", questions: [
      { text: "Угадайте песню по цитате:<br><br>Утонула полоса в девечьих слезах", answer: "Иностранец - ВАЛЕРИЙ МЕЛАДЗЕ", image: "" },
      { text: "Угадайте песню по цитате<br><br>Don't stop, make it pop, DJ, blow my speakers up", answer: "Tik tok - KESHA", image: "" },
      { text: "Угадайте песню по цитате<br><br>Если ты с небом в хороших, оно всегда поможет", answer: "Небо поможет нам - МАКС КОРЖ", image: "" },
      { text: "Угадайте песню по цитате<br><br>И теплый вечер так прозрачен, невесом", answer: "25-й этаж - КОРНИ", image: "" },
      { text: "Угадайте песню по цитате<br><br>There's a fire starting in my heart", answer: "Rolling in the deep - ADELE", image: "" },
    ]},
    { title: "ПРОПУЩЕННОЕ СЛОВО", questions: [
      { text: "Назовите пропущенное слово<br><br>Чары силы теряют и превращают … в стекло", answer: "ЖЕМЧУГ (Молитва - БИ-2)", answerAudio: "audio/ц5.mp3" },
      { text: "Назовите пропущенное слово<br><br>Come on, let's … again", answer: "TWIST (Let's Twist Again - CHUBBY CHEKER)", answerAudio: "audio/ц10.mp3" },
      { text: "Назовите пропущенное слово<br><br>Ночь, ожидания, … , боль, словно я расколот", answer: "ХОЛОД (Ночь - ГУБИН)", answerAudio: "audio/ц15.mp3" },
      { text: "Назовите пропущенное слово<br><br>Что ты первым делом вспомнишь, если спросят про …", answer: "МЕНЯ (Август - это ты - МОТ)", answerAudio: "audio/ц20.mp3" },
      { text: "Назовите пропущенное слово<br><br>I feel the … moving through my veins", answer: "ADRENALINE (Circus - BRITNEY SPEARS)", answerAudio: "audio/ц25.mp3" },
    ]},
    { title: "ЯЗЫКИ", questions: [
      { text: "Назови на каком языке поется песня", answer: "ИСПАНСКИЙ", audio: "", answerAudio: "" },
      { text: "Назови на каком языке поется песня", answer: "ТУРЕЦКИЙ", audio: "", answerAudio: "" },
      { text: "Назови на каком языке поется песня", answer: "РУМЫНСКИЙ", audio: "", answerAudio: "" },
      { text: "Назови на каком языке поется песня", answer: "КАЗАХСКИЙ", audio: "", answerAudio: "" },
      { text: "Назови на каком языке поется песня", answer: "ЯПОНСКИЙ", audio: "", answerAudio: "" },
    ]},
    { title: "ИМЕНА", questions: [
      { text: "Про какое имя поется в песне?", answer: "Alejandro", audio: "audio/я5.mp3" },
      { text: "Про какое имя поется в песне?", answer: "Вера", audio: "audio/я10.mp3" },
      { text: "Про какое имя поется в песне?", answer: "Валера", audio: "audio/я15.mp3" },
      { text: "Про какое имя поется в песне?", answer: "Сережа", audio: "audio/я20.mp3" },
      { text: "Про какое имя поется в песне?", answer: "Рома", audio: "audio/я25.mp3" },
    ]},
    { title: "90-Е", questions: [
      { text: "Назовите исполнителя?", answer: "NIRVANA", audio: "audio/г5.mp3" },
      { text: "Угадайте песню по минусу", answer: "Владимирский централ - МИХАИЛ КРУГ", audio: "audio/г10.mp3" },
      { text: "Назовите пропущенное слово в названии песни:<br><br>... is a dancer", answer: "Rhythm", audio: "audio/г15.mp3" },
      { text: "Угадайте песню по цитате:<br><br>Притормози, притормози и отвези меня туда, где будут рады мне всегда", answer: "Зеленоглазое такси - БОЯРСКИЙ", audio: "audio/г20.mp3" },
      { text: "Назовите пропущенное слово в тексте:<br><br>Напрасно нас бури пугали, вам скажет любой …", answer: "МОРЯК", audio: "audio/г25.mp3" },
    ]},
    { title: "МУЛЬФИЛЬМЫ", questions: [
      { text: "Назовите мультфильм откуда эта песня", answer: "Шрек", audio: "audio/с5.mp3" },
      { text: "Назовите мультфильм откуда эта песня", answer: "Гадкий я", audio: "audio/с10.mp3" },
      { text: "Назовите мультфильм откуда эта песня", answer: "Русалочка", audio: "audio/с15.mp3" },
      { text: "Назовите мультфильм откуда эта песня", answer: "Тачки", audio: "audio/с20.mp3" },
      { text: "Назовите мультфильм откуда эта песня", answer: "Аладин", audio: "audio/с25.mp3" },
    ]},
  ],
  // Раунд 2
  [
    { title: "ИСПОЛНИТЕЛИ", questions: [
      { text: "<br><br>(2000)<br>Это моя жизнь", answer: "It's My Life - QUEEN", answerAudio: "audio/а5.mp3" },
      { text: "Назовите песню:<br><br>(1965)<br>Вчера", answer: "Yesterday - THE BEATLES", answerAudio: "audio/а10.mp3" },
      { text: "Назовите песню:<br><br>(2006)<br>Прекрасный лжец", answer: "Beautiful Liar - BEYONCE & SHAKIRA", answerAudio: "audio/а15.mp3" },
      { text: "Назовите песню:<br><br>(2016)<br>Это моя девочка", answer: "That's My Girl - FIFTH HARMONY", answerAudio: "audio/а20.mp3" },
      { text: "Назовите песню:<br><br>(2017)<br>Новые правила", answer: "New Rules - DUA LIPA", answerAudio: "audio/а25.mp3" },
    ]},
    { title: "ПЕРЕМЕШАННЫЕ СЛОВА", questions: [
      { text: "Назовите песню:<br><br>Поговорим посидим папа пришел мы с ней неважном о чем-то", answer: "У мамы - ПОТАП И НАСТЯ", audio: "audio/н5.mp3", answerAudio: "audio/2н5.mp3" },
      { text: "Назовите песню:<br><br>Made sweet are of this dreams", answer: "Sweet Dreams - EURYTHMICS", audio: "audio/н10.mp3", answerAudio: "audio/2н10.mp3" },
      { text: "Назовите песню:<br><br>Know up it don't you pump", answer: "Pump it up - DUNZEL", audio: "audio/н15.mp3", answerAudio: "audio/2н15.mp3" },
      { text: "Назовите песню:<br><br>С листьями желтыми и в небо улетает отпускаю", answer: "Отпускаю - МАКСИМ", audio: "audio/н20.mp3", answerAudio: "audio/2н20.mp3" },
      { text: "Назовите песню:<br><br>Darling, perfect you look tonight", answer: "Perfect - ED SHEERAN", audio: "audio/н25.mp3", answerAudio: "audio/2н25.mp3" },
    ]},
    { title: "СТРАНЫ", questions: [
      { text: "Угадай страну откуда родом исполнитель песни", answer: "ЮЖНАЯ КОРЕЯ", audio: "audio/ф5.mp3" },
      { text: "Угадай страну откуда родом исполнитель песни", answer: "США", audio: "audio/ф10.mp3" },
      { text: "Угадай страну откуда родом исполнитель песни", answer: "ВЕЛИКОБРИТАНИЯ", audio: "audio/ф15.mp3" },
      { text: "Угадай страну откуда родом исполнитель песни", answer: "ФРАНЦИЯ", audio: "audio/ф20.mp3" },
      { text: "Угадай страну откуда родом исполнитель песни", answer: "ИСПАНИЯ", audio: "audio/ф25.mp3" },
    ]},
    { title: "ОДНО СЛОВО", questions: [
      { text: "Назовите название песни", answer: "Toxic - BRITNEY SPEARS", answerAudio: "audio/2пс5.mp3" },
      { text: "Назовите название песни", answer: "Місця щасливих людей - СКРЯБІН", answerAudio: "audio/2пс10.mp3" },
      { text: "Назовите название песни", answer: "Zoo - SHAKIRA", answerAudio: "audio/2пс15.mp3" },
      { text: "Назовите название песни", answer: "Манхэттен - БАНД'ЭРОС", answerAudio: "audio/2пс20.mp3" },
      { text: "Назовите название песни", answer: "Cheri cheri lady", answerAudio: "audio/2пс25.mp3" },
    ]},
    { title: "МИНУС", questions: [
      { text: "Назовите исполнителя", answer: "Espresso - SABRINA", answerAudio: "audio/ч5.mp3" },
      { text: "Назовите исполнителя", answer: "Люди - БУМБОКС", answerAudio: "audio/ч10.mp3" },
      { text: "Назовите исполнителя", answer: "Run - ONE REPUBLIC", answerAudio: "audio/ч15.mp3" },
      { text: "Назовите исполнителя", answer: "Шоколадка - МИНАЕВА", answerAudio: "audio/ч20.mp3" },
      { text: "Назовите исполнителя", answer: "Вовчиця - ВІННИК", answerAudio: "audio/ч25.mp3" },
    ]},
    { title: "АЛЬБОМЫ", questions: [
      { text: "Назовите исполнителя", answer: "LINKIN PARK" },
      { text: "Назовите исполнителя", answer: "РАНЕТКИ" },
      { text: "Назовите исполнителя", answer: "TWENTY ONE PILOTS" },
      { text: "Назовите исполнителя", answer: "ДИСКОТЕКА АВАРИЯ" },
      { text: "Назовите исполнителя", answer: "AURORA" },
    ]},
  ],
  // Раунд 3
  [
    { title: "ПЕРЕВОД", questions: [
      { text: "Назовите песню", answer: "Firework - KATY PERRY", audio: "audio/сл5.mp3", answerAudio: "audio/2сл5.mp3" },
      { text: "Назовите песню", answer: "Bad romance - LADY GAGA", audio: "audio/сл10.mp3", answerAudio: "audio/2сл10.mp3" },
      { text: "Назовите песню", answer: "Wake me up - AVICII", audio: "audio/сл15.mp3", answerAudio: "audio/2сл15.mp3" },
      { text: "Назовите песню", answer: "Call me maybe - CARLY RAE", audio: "audio/сл20.mp3", answerAudio: "audio/2сл20.mp3" },
      { text: "Назовите песню", answer: "Take on me - A-HA", audio: "audio/сл25.mp3", answerAudio: "audio/2сл25.mp3" },
    ]},
    { title: "РЕМИКС", questions: [
      { text: "Назовите оригинал песни и его исполнителя", answer: "Die with a smile - BRUNO MARS & LADY GAGA", audio: "audio/м5.mp3", answerAudio: "audio/2м5.mp3" },
      { text: "Назовите оригинал песни и его исполнителя", answer: "APT - ROSE & BRUNO MARS", audio: "audio/м10.mp3", answerAudio: "audio/2м10.mp3" },
      { text: "Назовите оригинал песни и его исполнителя", answer: "Abracadabra - LADY GAGA", audio: "audio/м15.mp3", answerAudio: "audio/2м15.mp3" },
      { text: "Назовите оригинал песни и его исполнителя", answer: "Yeah! - USHER", audio: "audio/м20.mp3", answerAudio: "audio/2м20.mp3" },
      { text: "Назовите оригинал песни и его исполнителя", answer: "Popular - THE WEEKND", audio: "audio/м25.mp3", answerAudio: "audio/2м25.mp3" },
    ]},
    { title: "НАЧАЛО", questions: [
      { text: "Назовите песню", answer: "Танцы - ГУБИН", image: "images/д5.jpg" },
      { text: "Назовите песню", answer: "Додайте світла - ДОРОФЕЕВА", image: "images/д10.jpg" },
      { text: "Назовите песню", answer: "The rare occasions notion", image: "images/д15.jpg" },
      { text: "Назовите песню", answer: "Это здорово - НОСКОВ", image: "images/д20.jpg" },
      { text: "Назовите песню", answer: "Runaway - AURORA", image: "images/д25.jpg" },
    ]},
    { title: "ХИТ", questions: [
      { text: "Назовите год песни", answer: "1989", image: "images/по5.jpg" },
      { text: "Назовите год песни", answer: "2025", image: "images/по10.jpg" },
      { text: "Назовите год песни", answer: "2019", image: "images/по15.jpg" },
      { text: "Назовите год песни", answer: "2002", image: "images/по20.jpg" },
      { text: "Назовите год песни", answer: "2004", image: "images/по25.jpg" },
    ]},
    { title: "СЛОВА", questions: [
      { text: "Какие ДВА слова будут звучать дальше?", answer: "AFTER LOVE (Believe - CHER)", audio: "audio/r5.mp3" },
      { text: "Какие ДВА слова будут звучать дальше?", answer: "СЛОВА - ВОДА (Аэропорты - ГУБИН)", audio: "audio/r10.mp3" },
      { text: "Какие ЧЕТЫРЕ слова будут звучать дальше?", answer: "КОРАБЛИК-КОРАБЛИК-КОРАБЛИК-КОРАБЛИКИ (Кораблики - БИС)", audio: "audio/r15.mp3" },
      { text: "Какие ЧЕТЫРЕ слова будут звучать дальше?", answer: "СЕГОДНЯ Я СЫГРАЮ БЕЛЫМИ (Притяженья больше нет - ВИАГРА)", audio: "audio/r20.mp3" },
      { text: "Какие ЧЕТЫРЕ слова будут звучать дальше?", answer: "ARE YOU AND ME (Gangsta Paradise - COOLIO)", audio: "audio/r25.mp3" },
    ]},
    { title: "ЭМОДЗИ", questions: [
      { text: "Назовите название песни", answer: "Черные глаза - АЙДАМИР МУГУ", audio: "audio/и5.mp3" },
      { text: "Назовите название песни", answer: "Горы по колено - КОРЖ", audio: "audio/и10.mp3" },
      { text: "Назовите название песни", answer: "Ice ice baby - VANILLA ICE", audio: "audio/и15.mp3" },
      { text: "Назовите название песни", answer: "Звезда по имени солнце - КИНО", audio: "audio/и20.mp3" },
      { text: "Назовите название песни", answer: "Поворот - МАШИНА ВРЕМЕНИ", audio: "audio/и25.mp3" },
    ]},
  ],
  // Раунд 4
  [
    { title: "СЕКУНДА", questions: [
      { text: "Назовите песню", answer: "Поезда - ЖЕНЯ ТРОФИМОВ", image: "images/э5.jpg", answerAudio: "audio/э5.mp3" },
      { text: "Назовите песню", answer: "Tempo se ne va - CHELENTANO", image: "images/э10.jpg", answerAudio: "audio/э10.mp3" },
      { text: "Назовите песню", answer: "Lovely - BILLIE EILISH", image: "images/э15.jpg", answerAudio: "audio/э15.mp3" },
      { text: "Назовите песню", answer: "Дарите женщинам цветы - JAZZDAUREN", image: "images/э20.jpg", answerAudio: "audio/э20.mp3" },
      { text: "Назовите песню", answer: "Ясный мой свет - БУЛАНОВА", image: "images/э25.jpg", answerAudio: "audio/э25.mp3" },
    ]},
    { title: "АССОЦИАЦИИ", questions: [
      { text: "Назовите песню", answer: "Кукушка - ГАГАРИНА", answerAudio: "audio/45.mp3" },
      { text: "Назовите песню", answer: "7 этаж - ЛЕРА МАССКВА", answerAudio: "audio/410.mp3" },
      { text: "Назовите песню", answer: "Япония - ДОРОФЕЕВА", answerAudio: "audio/415.mp3" },
      { text: "Назовите песню", answer: "Ловит ритм - МОНАТИК", answerAudio: "audio/420.mp3" },
      { text: "Назовите песню", answer: "Камин - ДЖОННИ", answerAudio: "audio/425.mp3" },
    ]},
    { title: "СУПЕРМИКС", questions: [
      { text: "Назовите песни", answer: "Белые розы & Мокрые кроссы", audio: "audio/се5.mp3", answerAudio: "audio/2се5.mp3" },
      { text: "Назовите песни", answer: "Американ бой & Poker face", audio: "audio/се10.mp3", answerAudio: "audio/2се10.mp3" },
      { text: "Назовите песни", answer: "Позови меня с собой & Самба белого мотылька", audio: "audio/се15.mp3", answerAudio: "audio/2се15.mp3" },
      { text: "Назовите песни", answer: "Its my life & Numb", audio: "audio/се20.mp3", answerAudio: "audio/2се20.mp3" },
      { text: "Назовите песни", answer: "Он тебя целует & Малинки", audio: "audio/се15.mp3", answerAudio: "audio/2се25.mp3" },
    ]},
    { title: "РЕБУСЫ", questions: [
      { text: "Назовите загаданного исполнителя", answer: "КОРОЛЬ ШУТ", audio: "audio/е5.mp3" },
      { text: "Назовите загаданного исполнителя", answer: "ЗЕМФИРА", audio: "audio/е10.mp3" },
      { text: "Назовите загаданного исполнителя", answer: "ПАРФЕНЮК", audio: "audio/е15.mp3" },
      { text: "Назовите загаданного исполнителя", answer: "WOODKID", audio: "audio/е20.mp3" },
      { text: "Назовите загаданного исполнителя", answer: "МОНАТИК", audio: "audio/е25.mp3" },
    ]},
    { title: "ВОПРОСЫ", questions: [
      { text: "Отражение чего видит героиня этой песни?", answer: "МЕЧТЫ", image: "images/ас5.jpg", answerAudio: "audio/ас5.mp3" },
      { text: "О чем напоминает дождь, который рисует на окнах?", answer: "О ПОЦЕЛУЯХ", image: "images/ас10.jpg", answerAudio: "audio/ас10.mp3" },
      { text: "Від чого немов захоплює душу в цій пісні?", answer: "ВІД ВИСОТИ", image: "images/ас15.jpg", answerAudio: "audio/ас15.mp3" },
      { text: "Что делают голоса в этой песне?", answer: "СМЕЮТСЯ", image: "images/ас20.jpg", answerAudio: "audio/ас20.mp3" },
      { text: "Что просит сделать Нюша?", answer: "НАВСТРЕЧУ ШАГ", image: "images/ас25.jpg", answerAudio: "audio/ас25.mp3" },
    ]},
    { title: "ГУГЛ", questions: [
      { text: "Назовите песню", answer: "Let it snow - FRANK SINATRA", audio: "audio/х5.mp3" },
      { text: "Назовите песню", answer: "Я буду с тобой всегда - АГУТИН", audio: "audio/х10.mp3" },
      { text: "Назовите песню", answer: "Не оставляй меня, любимый - ВИАГРА", audio: "audio/х15.mp3" },
      { text: "Назовите песню", answer: "Плот - ЮРИЙ ЛОЗА", audio: "audio/х20.mp3" },
      { text: "Назовите песню", answer: "Old town road", audio: "audio/х25.mp3" },
    ]},
  ],
  // Раунд 5
  [
    { title: "ЭМОДЗИ 2.0", questions: [
      { text: "Расшифруйте фразу", answer: "ТРИ БЕЛЫХ КОНЯ, ЭХ, ТРИ БЕЛЫХ КОНЯ - ДЕКАБРЬ, ЯНВАРЬ И ФЕВРАЛЬ", answerAudio: "audio/пс5.mp3" },
      { text: "Расшифруйте фразу", answer: "ЖЕНЩИНА, НЕ ТАНЦУЮ, ЖЕНЩИНА, Я НЕ ТАНЦУЮ" },
      { text: "Расшифруйте фразу", answer: "ТВОЙ ФРАНЦУЗКИЙ ПОЦЕЛУЙ, ТЫ ЦЕЛУЙ МЕНЯ ЦЕЛУЙ" },
      { text: "Расшифруйте фразу", answer: "ПТИЦЕЙ ЦВЕТА УЛЬТРАМАРИН" },
      { text: "Расшифруйте фразу", answer: "Я КАЛЕНДАРЬ ПЕРЕВЕРНУ И СНОВА 3 СЕНТЕБРЯ" },
    ]},
    { title: "ЗЕРКАЛО", questions: [
      { text: "Назовите песню", answer: "Я сошла с ума - T.A.T.U", audio: "audio/о5.mp3" },
      { text: "Назовите песню", answer: "Still falling for you - ELLIE GOULDING", audio: "audio/о10.mp3" },
      { text: "Назовите песню", answer: "Самолеты - ЖЕНЯ ТРОФИМОВ", audio: "audio/о15.mp3" },
      { text: "Назовите песню", answer: "Белая ночь - ФОРУМ", audio: "audio/о20.mp3" },
      { text: "Назовите песню", answer: "Yes and - ARIANA GRANDE", audio: "audio/о25.mp3" },
    ]},
    { title: "ИСКАЖЕНИЕ", questions: [
      { text: "Назовите песню", answer: "Зажигают огоньки - ФАБРИКА", audio: "audio/з5.mp3", answerAudio: "audio/2з5.mp3" },
      { text: "Назовите песню", answer: "До скорой встречи - ЗВЕРИ", audio: "audio/з10.mp3", answerAudio: "audio/2з10.mp3" },
      { text: "Назовите песню", answer: "The show must go on - QUEEN", audio: "audio/з15.mp3", answerAudio: "audio/2з15.mp3" },
      { text: "Назовите песню", answer: "NUNTA", audio: "audio/з20.mp3", answerAudio: "audio/2з20.mp3" },
      { text: "Назовите песню", answer: "Yellow - COLDPLAY", audio: "audio/з25.mp3", answerAudio: "audio/2з25.mp3" },
    ]},
    { title: "ЗВУКИ", questions: [
      { text: "Назовите песни", answer: "Три полоси - JERRY HEIL", audio: "audio/ми5.mp3" },
      { text: "Назовите песни", answer: "Лови момент - АНТИТЕЛА", audio: "audio/ми10.mp3" },
      { text: "Назовите песни", answer: "Run - ONE REPUBLIC", audio: "audio/ми15.mp3" },
      { text: "Назовите песни", answer: "", audio: "audio/ми20.mp3" },
      { text: "Назовите песни", answer: "Yellow submarine - THE BEATLES", audio: "audio/ми25.mp3" },
    ]},
    { title: "ФИНАЛ", questions: [
      { text: "Назовите песню", answer: "Мир сошел с ума - ДЖОННИ", audio: "audio/ис5.mp3", answerAudio: "audio/2ис5.mp3" },
      { text: "Назовите песню", answer: "Мама - БУРИТО", audio: "audio/ис10.mp3", answerAudio: "audio/2ис10.mp3" },
      { text: "Назовите песню", answer: "Dont blame me - TAYLOR SWIFT", audio: "audio/ис15.mp3", answerAudio: "audio/2ис15.mp3" },
      { text: "Назовите песню", answer: "Чемпионы любви - РАНЕТКИ", audio: "audio/ис20.mp3", answerAudio: "audio/2ис20.mp3" },
      { text: "Назовите песню", answer: "Прасковья - УМАТУРМАН", audio: "audio/ис25.mp3", answerAudio: "audio/2ис25.mp3" },
    ]},
    { title: "МЕМ", questions: [
      { text: "Назовите песню", answer: "ВОЗЬМИ ТЕЛЕФОН, ДЕТКА", audio: "audio/фи5.mp3", answerAudio: "audio/2фи5.mp3" },
      { text: "Назовите песню", answer: "КОТЛЕТКИ С ПЮРЕШКОЙ", audio: "audio/фи10.mp3", answerAudio: "audio/2фи10.mp3" },
      { text: "Назовите песню", answer: "ШОППИНГ МОДНЫЙ ЛУК", audio: "audio/фи15.mp3", answerAudio: "audio/2фи15.mp3" },
      { text: "Назовите песню", answer: "ОБЛАКА", audio: "audio/фи20.mp3", answerAudio: "audio/2фи20.mp3" },
      { text: "Назовите песню", answer: "ПЛЫВЕТ ВЕНОЧЕК", audio: "audio/фи25.mp3", answerAudio: "audio/2фи25.mp3" },
    ]},
  ],
]

const quest = {
  id: `quest-${randomUUID().slice(0, 8)}`,
  title: 'Музыкальная викторина',
  description: '5 раундов: цитаты, пропущенное слово, языки, имена, 90-е, мультфильмы, исполнители, страны, минус, альбомы, перевод, ремикс, начало, хит, слова, эмодзи, секунда, ассоциации, супермикс, ребусы, вопросы, Гугл, эмодзи 2.0, зеркало, искажение, звуки, финал, мем.',
  rounds: roundsData.map((r, i) => buildRound(r, i)),
}

const outPath = join(root, `${quest.id}.json`)
writeFileSync(outPath, JSON.stringify(quest, null, 2), 'utf8')
console.log('Written:', outPath)
console.log('Rounds:', quest.rounds.length)
console.log('Categories:', quest.rounds.reduce((s, r) => s + r.categories.length, 0))
console.log('Questions:', quest.rounds.reduce((s, r) => s + r.categories.reduce((s2, c) => s2 + c.questions.length, 0), 0))
