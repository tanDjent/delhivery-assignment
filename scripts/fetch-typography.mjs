#!/usr/bin/env node
/**
 * Refreshes typography.figma.json from Figma.
 *
 * Text styles are not variables, so they never appear in a variables export.
 * They also aren't returned by /v1/files/:key/styles unless the library is
 * published, so this walks the pages that use them and reads the `styles` map
 * attached to the response, then fetches each style's defining node for values.
 *
 *   FIGMA_TOKEN=figd_... node scripts/fetch-typography.mjs
 *
 * The output is committed, so the token build never needs network access.
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const FILE_KEY = 'TYR1QoZKa0Hw3s9MSvFDG2'
/** Pages known to reference the full set of text styles. */
const PAGES = ['2:4', '1802:11230']

const token = process.env.FIGMA_TOKEN
if (!token) {
  console.error('Set FIGMA_TOKEN to a Figma personal access token.')
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = join(root, 'src/Design System/typography.figma.json')

async function api(path) {
  const response = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}${path}`, {
    headers: { 'X-Figma-Token': token },
  })
  if (!response.ok) {
    throw new Error(`Figma API ${response.status} for ${path}`)
  }
  return response.json()
}

const textStyleIds = new Set()
for (const page of PAGES) {
  const { nodes } = await api(`/nodes?ids=${page}&depth=6`)
  for (const [id, meta] of Object.entries(nodes[page]?.styles ?? {})) {
    if (meta.styleType === 'TEXT') textStyleIds.add(id)
  }
}

const { nodes } = await api(`/nodes?ids=${[...textStyleIds].join(',')}`)

const byName = new Map()
for (const [id, node] of Object.entries(nodes)) {
  if (!node) continue
  const { name, style = {} } = node.document
  const record = {
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    fontSize: style.fontSize,
    lineHeight: style.lineHeightPx,
    letterSpacing: style.letterSpacing ?? 0,
    figmaNodeIds: [id],
  }
  const existing = byName.get(name)
  if (!existing) {
    byName.set(name, record)
    continue
  }
  // Figma allows two styles to share a name; keep one and record both ids.
  const identical =
    existing.fontSize === record.fontSize &&
    existing.fontWeight === record.fontWeight &&
    existing.lineHeight === record.lineHeight &&
    existing.fontFamily === record.fontFamily
  if (!identical) throw new Error(`Conflicting duplicate text style: ${name}`)
  existing.figmaNodeIds.push(id)
}

const styles = Object.fromEntries([...byName].sort(([a], [b]) => a.localeCompare(b)))

await writeFile(
  TARGET,
  `${JSON.stringify(
    {
      $description:
        'Figma text styles, extracted from the TDS file with the REST API. Text styles are not variables, so they are absent from variables.figma.json and must be captured separately. Regenerate with: FIGMA_TOKEN=... node scripts/fetch-typography.mjs',
      figmaFileKey: FILE_KEY,
      extractedAt: new Date().toISOString().slice(0, 10),
      units: { fontSize: 'px', lineHeight: 'px', letterSpacing: 'px' },
      styles,
    },
    null,
    2,
  )}\n`,
)

console.log(`Wrote ${Object.keys(styles).length} text styles to ${TARGET}`)
