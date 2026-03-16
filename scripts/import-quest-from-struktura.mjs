/**
 * Імпорт квеста з Квест/Структура.html: парсить структуру, завантажує медіа в Supabase Storage,
 * генерує quest-app JSON з посиланнями на медіа.
 *
 * Запуск (з кореня проєкту):
 *   node scripts/import-quest-from-struktura.mjs
 *
 * В .env потрібні:
 *   VITE_SUPABASE_URL (або SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY (або VITE_SUPABASE_SERVICE_ROLE_KEY)
 *
 * Опціонально:
 *   USER_ID=uuid  — якщо задано, квест буде створений в Supabase для цього user_id
 *   DRY_RUN=1     — тільки згенерувати JSON, не завантажувати в Storage і не створювати квест
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
// Шлях до Квест відносно поточної робочої директорії (звідки запустили node)
const QUEST_DIR = join(process.cwd(), 'Квест')
const HTML_FILE = join(QUEST_DIR, 'Структура.html')
const OUTPUT_JSON = join(QUEST_DIR, 'quest-generated.json')
const BUCKET = 'quest-media'
const POINTS = [100, 120, 140, 170, 200]

function loadEnv() {
  const envPath = join(rootDir, '.env')
  if (!existsSync(envPath)) return
  const content = readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  }
}
loadEnv()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const USER_ID = process.env.USER_ID
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

function generateId(prefix = 'id') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/** Витягнути об'єкт quizData з HTML (прибираємо коментарі та trailing commas). */
function extractQuizData(html) {
  const startMarker = 'let quizData = '
  const idx = html.indexOf(startMarker)
  if (idx === -1) throw new Error('quizData not found in HTML')
  let str = html.slice(idx + startMarker.length)
  let depth = 0
  let end = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') depth++
    else if (str[i] === '}') {
      depth--
      if (depth === 0) {
        end = i + 1
        break
      }
    }
  }
  str = str.slice(0, end)
  str = str.replace(/\/\/[^\n]*/g, '').replace(/,(\s*[}\]])/g, '$1')
  return JSON.parse(str)
}

/** Знайти файл: спочатку з префіксом (audio/ або images/), потім без префіксу або в ФОТО. */
function resolveMediaPath(relativePath) {
  const normalized = relativePath.replace(/^\.\//, '').trim()
  if (!normalized) return null
  // Нормалізація Unicode (macOS часто зберігає імена в NFD, рядки з JSON — в NFC)
  const n = typeof normalized.normalize === 'function' ? normalized.normalize('NFC') : normalized
  const withPrefix = join(QUEST_DIR, n)
  if (existsSync(withPrefix)) return withPrefix
  const withoutPrefix = n.replace(/^(audio|images)\//, '')
  const inRoot = join(QUEST_DIR, withoutPrefix)
  if (existsSync(inRoot)) return inRoot
  if (n.startsWith('images/')) {
    const inFoto = join(QUEST_DIR, 'ФОТО', n.slice(7))
    if (existsSync(inFoto)) return inFoto
  }
  try {
    const withPrefixNFD = join(QUEST_DIR, normalized.normalize('NFD'))
    if (existsSync(withPrefixNFD)) return withPrefixNFD
  } catch (_) {}
  return null
}

async function uploadFile(supabase, userId, questId, localPath, mediaId) {
  const ext = localPath.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${userId}/${questId}/${mediaId}.${ext}`
  const buffer = readFileSync(localPath)
  const contentType = ext === 'mp3' ? 'audio/mpeg' : ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : undefined
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, { upsert: true, contentType })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function main() {
  if (!existsSync(HTML_FILE)) {
    console.error('File not found:', HTML_FILE)
    process.exit(1)
  }

  const html = readFileSync(HTML_FILE, 'utf8')
  let quizData
  try {
    quizData = extractQuizData(html)
  } catch (e) {
    console.error('Failed to parse quizData from HTML:', e.message)
    process.exit(1)
  }

  const userId = USER_ID || (DRY_RUN ? 'import-user' : null)
  if (!DRY_RUN && !userId) {
    console.warn('USER_ID not set. Set USER_ID in .env to create quest in Supabase, or use DRY_RUN=1 to only generate JSON.')
  }

  let supabase = null
  const storageUrlMap = new Map()
  if (!DRY_RUN && SUPABASE_URL && SERVICE_ROLE_KEY) {
    supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  }

  // First pass: collect all media paths and upload
  const rawRounds = Array.isArray(quizData.rounds) ? quizData.rounds : []
  const questId = generateId('quest')
  const effectiveUserId = userId || 'import-user'
  let uploadCount = 0
  let skippedMissing = 0

  if (!supabase && !DRY_RUN) {
    console.warn('Supabase не підключено (потрібні VITE_SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY або VITE_SUPABASE_SERVICE_ROLE_KEY у .env). Медіа не завантажуються.')
  }

  for (let roundIdx = 0; roundIdx < rawRounds.length; roundIdx++) {
    const roundCategories = rawRounds[roundIdx]
    if (!Array.isArray(roundCategories)) continue
    for (let catIdx = 0; catIdx < roundCategories.length; catIdx++) {
      const cat = roundCategories[catIdx]
      const questions = Array.isArray(cat.questions) ? cat.questions : []
      for (let qIdx = 0; qIdx < questions.length; qIdx++) {
        const q = questions[qIdx]
        for (const field of ['audio', 'image', 'answerAudio']) {
          const rel = q[field] && String(q[field]).trim()
          if (!rel) continue
          const localPath = resolveMediaPath(rel)
          if (!localPath) {
            skippedMissing++
            continue
          }
          const key = rel
          if (storageUrlMap.has(key)) continue
          if (supabase) {
            try {
              const mediaId = generateId('media')
              const url = await uploadFile(supabase, effectiveUserId, questId, localPath, mediaId)
              storageUrlMap.set(key, url)
              uploadCount++
              if (uploadCount % 20 === 0) console.log('  Uploaded', uploadCount, 'files...')
            } catch (err) {
              console.error('  Upload failed', rel, err.message)
            }
          }
        }
      }
    }
  }

  console.log('Uploaded', uploadCount, 'media files.')
  if (skippedMissing > 0) console.log('Skipped', skippedMissing, 'missing files (no upload).')

  // Second pass: build quest JSON with URLs
  const roundIdGen = () => generateId('round')
  const categoryIdGen = () => generateId('category')
  const questionIdGen = () => generateId('question')
  const mediaIdGen = () => generateId('media')

  const quest = {
    id: questId,
    title: 'Аудио викторина — Своя игра',
    description: 'Імпорт з Квест/Структура.html',
    rounds: rawRounds.map((roundCategories, roundIdx) => {
      const round = { id: roundIdGen(), title: `Раунд ${roundIdx + 1}`, description: '', categories: [] }
      if (!Array.isArray(roundCategories)) return round
      round.categories = roundCategories.map((cat, catIdx) => {
        const category = { id: categoryIdGen(), title: cat.title || `Категорія ${catIdx + 1}`, questions: [] }
        const questions = Array.isArray(cat.questions) ? cat.questions : []
        category.questions = questions.map((q, qIdx) => {
          const value = POINTS[qIdx] ?? 100 * (qIdx + 1)
          const questionMedia = []
          const answerMedia = []
          const NOT_LOADED = 'файл не був завантажений'
          if (q.audio && String(q.audio).trim()) {
            const url = storageUrlMap.get(q.audio.trim())
            questionMedia.push({
              id: mediaIdGen(),
              type: 'audio',
              name: (q.audio.split('/').pop() || 'audio.mp3'),
              ...(url ? { url } : { url: null, note: NOT_LOADED })
            })
          }
          if (q.image && String(q.image).trim()) {
            const url = storageUrlMap.get(q.image.trim())
            questionMedia.push({
              id: mediaIdGen(),
              type: 'image',
              name: (q.image.split('/').pop() || 'image.jpg'),
              delay: 0,
              ...(url ? { url } : { url: null, note: NOT_LOADED })
            })
          }
          if (q.answerAudio && String(q.answerAudio).trim()) {
            const url = storageUrlMap.get(q.answerAudio.trim())
            answerMedia.push({
              id: mediaIdGen(),
              type: 'audio',
              name: (q.answerAudio.split('/').pop() || 'answer.mp3'),
              ...(url ? { url } : { url: null, note: NOT_LOADED })
            })
          }
          return {
            id: questionIdGen(),
            value,
            question: q.text || '',
            answer: q.answer || '',
            questionMedia,
            answerMedia
          }
        })
        return category
      })
      return round
    })
  }

  const jsonPath = OUTPUT_JSON
  const fs = await import('fs')
  fs.writeFileSync(jsonPath, JSON.stringify(quest, null, 2), 'utf8')
  console.log('Written:', jsonPath)

  if (supabase && userId && userId !== 'import-user') {
    const { error } = await supabase.from('quests').insert({
      id: quest.id,
      title: quest.title,
      description: quest.description || null,
      data: quest,
      user_id: userId
    })
    if (error) {
      console.error('Failed to create quest in Supabase:', error)
    } else {
      console.log('Quest created in Supabase for user', userId)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
