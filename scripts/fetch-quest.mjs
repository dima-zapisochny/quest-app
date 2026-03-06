/**
 * One-off script: fetch a quest from Supabase by id and user_id, save to JSON in project root.
 * Usage: node scripts/fetch-quest.mjs
 * Requires .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Load .env
try {
  const env = readFileSync(join(root, '.env'), 'utf8')
  env.split('\n').forEach((line) => {
    const eq = line.indexOf('=')
    if (eq > 0) {
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1)
      process.env[key] = val
    }
  })
} catch (e) {
  console.error('Failed to read .env:', e.message)
  process.exit(1)
}

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env')
  process.exit(1)
}

const QUEST_ID = '1661af7b-247d-4c59-9011-9b72c8ecd0fa'
const USER_ID = '61f4e2d9-5d93-4931-8001-a0af7395b916'

const supabase = createClient(url, key)

async function main() {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('id', QUEST_ID)
    .eq('user_id', USER_ID)
    .maybeSingle()

  if (error) {
    console.error('Supabase error:', error)
    process.exit(1)
  }
  if (!data) {
    console.error('Quest not found for id=%s user_id=%s', QUEST_ID, USER_ID)
    process.exit(1)
  }

  const quest = data.data || data
  const outPath = join(root, 'quest-1661af7b.json')
  writeFileSync(outPath, JSON.stringify(quest, null, 2), 'utf8')
  console.log('Quest saved to', outPath)
  console.log('Title:', quest.title)
}

main()
