#!/usr/bin/env node
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mdToPdf } from 'md-to-pdf'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'apps/web/public/docs')
mkdirSync(outDir, { recursive: true })

const manuals = [
  { src: 'docs/manual/bg/manual.md', dest: 'DFlowERP-Manual-BG.pdf' },
  { src: 'docs/manual/en/manual.md', dest: 'DFlowERP-Manual-EN.pdf' }
]

for (const { src, dest } of manuals) {
  const content = readFileSync(join(root, src), 'utf8')
  console.log(`Generating ${dest}...`)
  await mdToPdf({ content }, { dest: join(outDir, dest) })
  console.log(`✓ ${dest}`)
}

console.log('Done.')
