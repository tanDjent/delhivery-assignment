#!/usr/bin/env node
/**
 * Prints a component's documentation to stdout.
 *
 * The Cursor skill is one way in; this is the other, so any agent, editor or CI
 * job can retrieve the same doc without Cursor-specific conventions.
 *
 *   npm run ds:component -- badge
 *   npm run ds:component            # lists what's available
 */
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = join(root, '.cursor/skills/delhivery-design-system/components')

const available = (await readdir(DOCS))
  .filter((file) => file.endsWith('.md'))
  .map((file) => file.replace(/\.md$/, ''))

const requested = process.argv[2]?.toLowerCase()

if (!requested) {
  console.log(`Components: ${available.join(', ')}`)
  console.log('Usage: npm run ds:component -- <name>')
  process.exit(0)
}

if (!available.includes(requested)) {
  console.error(
    `Unknown component "${requested}". Available: ${available.join(', ')}`,
  )
  process.exit(1)
}

console.log(await readFile(join(DOCS, `${requested}.md`), 'utf8'))
