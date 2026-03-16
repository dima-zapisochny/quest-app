/**
 * Migration: replace base64 media in quests with Supabase Storage URLs.
 *
 * Usage:
 *   node scripts/migrate-quest-media-to-storage.mjs
 *
 * Requires in .env:
 *   VITE_SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...  (Dashboard → Settings → API → service_role)
 *
 * Optional:
 *   DRY_RUN=1  — only list quests and media, do not upload or update
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

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
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  console.error('Get service_role key from Supabase Dashboard → Settings → API')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const BUCKET = 'quest-media'

const MIME_TO_EXT = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/webm': 'webm',
  'audio/x-wav': 'wav',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg'
}

function getExtFromDataUrl(dataUrl) {
  const match = dataUrl.trim().match(/^data:([^;]+);/)
  if (!match) return 'bin'
  const mime = (match[1] || '').toLowerCase().trim()
  return MIME_TO_EXT[mime] || mime.replace(/^.+\//, '') || 'bin'
}

function parseDataUrl(dataUrl) {
  const match = dataUrl.trim().match(/^data:[^;]+;base64,(.+)$/)
  if (!match || !match[1]) return null
  return Buffer.from(match[1], 'base64')
}

function isDataUrl(url) {
  return typeof url === 'string' && url.trim().toLowerCase().startsWith('data:')
}

async function uploadBuffer(path, buffer, contentType) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    upsert: true,
    contentType: contentType || undefined
  })
  if (error) throw error
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

async function walkQuestAndReplaceDataUrls(questId, userId, data) {
  let changed = false
  const dataCopy = JSON.parse(JSON.stringify(data))

  if (!Array.isArray(dataCopy.rounds)) return { data: dataCopy, changed: false }

  for (const round of dataCopy.rounds) {
    if (!Array.isArray(round.categories)) continue
    for (const category of round.categories) {
      if (!Array.isArray(category.questions)) continue
      for (const question of category.questions) {
        for (const key of ['questionMedia', 'answerMedia']) {
          const list = question[key]
          if (!Array.isArray(list)) continue
          for (const item of list) {
            if (!item || !isDataUrl(item.url)) continue
            const buffer = parseDataUrl(item.url)
            if (!buffer) continue
            const ext = getExtFromDataUrl(item.url)
            const path = `${userId}/${questId}/${item.id || `media-${Math.random().toString(36).slice(2)}`}.${ext}`
            const mimeMatch = item.url.trim().match(/^data:([^;]+);/)
            const contentType = mimeMatch ? mimeMatch[1].trim() : undefined

            if (!DRY_RUN) {
              try {
                const publicUrl = await uploadBuffer(path, buffer, contentType)
                item.url = publicUrl
                changed = true
              } catch (err) {
                console.error(`  Upload failed ${path}:`, err.message)
              }
            } else {
              console.log(`  [DRY RUN] Would upload ${path} (${buffer.length} bytes)`)
              changed = true
            }
          }
        }
      }
    }
  }

  return { data: dataCopy, changed }
}

async function main() {
  console.log('Fetching quests with base64 media...')
  const { data: rows, error } = await supabase
    .from('quests')
    .select('id, user_id, data, title')
  if (error) {
    console.error('Failed to fetch quests:', error)
    process.exit(1)
  }

  const withBase64 = (rows || []).filter(
    (r) => r.data && (String(r.data).includes('data:image') || String(r.data).includes('data:audio'))
  )
  console.log(`Found ${withBase64.length} quest(s) with possible base64 media (of ${rows?.length ?? 0} total).`)
  if (withBase64.length === 0) {
    console.log('Nothing to migrate.')
    return
  }

  if (DRY_RUN) console.log('\n--- DRY RUN (no uploads or DB updates) ---\n')

  let updated = 0
  for (const row of withBase64) {
    console.log(`\nQuest: ${row.title || row.id} (${row.id})`)
    const { data: newData, changed } = await walkQuestAndReplaceDataUrls(row.id, row.user_id, row.data)
    if (changed && !DRY_RUN) {
      const { error: updateErr } = await supabase.from('quests').update({ data: newData }).eq('id', row.id)
      if (updateErr) {
        console.error(`  Update failed:`, updateErr)
      } else {
        updated++
        console.log('  Updated.')
      }
    } else if (changed && DRY_RUN) {
      console.log('  Would update.')
    }
  }

  console.log(`\nDone. ${DRY_RUN ? 'Would update' : 'Updated'} ${updated} quest(s).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
