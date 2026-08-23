#!/usr/bin/env node
/**
 * Бандлить src/seo/localeUrls.ts (+ copy) для Node-скриптів prerender/sitemap.
 */
import { buildSync } from 'esbuild'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outdir = join(__dirname, '.cache')
const outfile = join(outdir, 'seo-bundle.mjs')

mkdirSync(outdir, { recursive: true })

buildSync({
  entryPoints: [join(root, 'src/seo/localeUrls.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile,
  alias: { '@': join(root, 'src') },
  packages: 'external'
})

export async function loadSeoBundle() {
  return import(`file://${outfile}`)
}
