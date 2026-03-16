/**
 * Експорт квеста з quest-generated.json у текстовий файл:
 * раунди → категорії → питання та відповіді.
 *
 * Запуск: node scripts/export-quest-to-txt.mjs
 * Вихід: Квест/quest-structure.txt
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const QUEST_DIR = join(process.cwd(), 'Квест')
const INPUT_JSON = join(QUEST_DIR, 'quest-generated.json')
const OUTPUT_TXT = join(QUEST_DIR, 'quest-structure.txt')

function stripHtml(text) {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
}

const data = JSON.parse(readFileSync(INPUT_JSON, 'utf8'))
const lines = []

lines.push(data.title || 'Квест')
if (data.description) lines.push(data.description)
lines.push('')
lines.push('='.repeat(60))

const rounds = data.rounds || []
rounds.forEach((round, rIdx) => {
  lines.push('')
  lines.push(`РАУНД ${rIdx + 1}: ${round.title || 'Без назви'}`)
  lines.push('-'.repeat(50))

  const categories = round.categories || []
  categories.forEach((cat, cIdx) => {
    lines.push('')
    lines.push(`  Категорія: ${cat.title || 'Без назви'}`)

    const questions = cat.questions || []
    questions.forEach((q, qIdx) => {
      const value = q.value ?? 0
      const questionText = stripHtml(q.question || '')
      const answerText = (q.answer || '').trim()
      lines.push('')
      lines.push(`    [${value} очок]`)
      lines.push(`    Питання: ${questionText.split('\n').join(' ')}`)
      lines.push(`    Відповідь: ${answerText}`)
    })
  })
})

lines.push('')
lines.push('='.repeat(60))

writeFileSync(OUTPUT_TXT, lines.join('\n'), 'utf8')
console.log('Written:', OUTPUT_TXT)
