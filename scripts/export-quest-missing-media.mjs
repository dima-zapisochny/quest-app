/**
 * Список раундів, категорій і питань, де не вистачало медіафайлів
 * (questionMedia або answerMedia з url: null / note: "файл не був завантажений").
 *
 * Запуск: node scripts/export-quest-missing-media.mjs
 * Вихід: Квест/quest-missing-media.txt
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const QUEST_DIR = join(process.cwd(), 'Квест')
const INPUT_JSON = join(QUEST_DIR, 'quest-generated.json')
const OUTPUT_TXT = join(QUEST_DIR, 'quest-missing-media.txt')

function stripHtml(text) {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
}

function isMissing(media) {
  return media && (media.url == null || media.note === 'файл не був завантажений')
}

const data = JSON.parse(readFileSync(INPUT_JSON, 'utf8'))
const lines = []

lines.push('Питання без медіафайлів (або з відсутнім медіа)')
lines.push(`Квест: ${data.title || '—'}`)
lines.push('')
lines.push('='.repeat(60))

const rounds = data.rounds || []
let totalMissing = 0

rounds.forEach((round, rIdx) => {
  const roundMissing = []

  const categories = round.categories || []
  categories.forEach((cat, cIdx) => {
    const questions = cat.questions || []
    questions.forEach((q, qIdx) => {
      const missingQuestion = (q.questionMedia || []).filter(isMissing).map(m => m.name || '?')
      const missingAnswer = (q.answerMedia || []).filter(isMissing).map(m => m.name || '?')
      if (missingQuestion.length || missingAnswer.length) {
        roundMissing.push({
          category: cat.title || 'Без назви',
          value: q.value ?? 0,
          question: stripHtml(q.question || '').split('\n').join(' ').slice(0, 80),
          answer: (q.answer || '').trim().slice(0, 60),
          missingQuestion,
          missingAnswer
        })
        totalMissing++
      }
    })
  })

  if (roundMissing.length === 0) return

  lines.push('')
  lines.push(`РАУНД ${rIdx + 1}: ${round.title || 'Без назви'}`)
  lines.push('-'.repeat(50))

  roundMissing.forEach(({ category, value, question, answer, missingQuestion, missingAnswer }) => {
    lines.push('')
    lines.push(`  Категорія: ${category}`)
    lines.push(`  [${value} очок]`)
    lines.push(`  Питання: ${question}${question.length >= 80 ? '…' : ''}`)
    lines.push(`  Відповідь: ${answer}${answer.length >= 60 ? '…' : ''}`)
    if (missingQuestion.length) lines.push(`  Не завантажено (питання): ${missingQuestion.join(', ')}`)
    if (missingAnswer.length) lines.push(`  Не завантажено (відповідь): ${missingAnswer.join(', ')}`)
  })
})

lines.push('')
lines.push('='.repeat(60))
lines.push(`Всього питань з відсутнім медіа: ${totalMissing}`)

writeFileSync(OUTPUT_TXT, lines.join('\n'), 'utf8')
console.log('Written:', OUTPUT_TXT)
console.log('Questions with missing media:', totalMissing)
