#!/usr/bin/env node
/**
 * Fills the generated blocks in the agent-facing docs.
 *
 * The API tables come from badge.meta.ts and the token tables from tokens.json,
 * so the terse rules an agent reads first can never disagree with the detailed
 * component doc. Prose outside the markers is hand-written and preserved.
 *
 * Run with --check in CI to fail when a doc has drifted from its source.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SKILL_DIR = join(root, '.cursor/skills/delhivery-design-system')

const { badgeMeta } = await import(
  join(root, 'src/Design System/Badge/badge.meta.ts')
)
const tokens = JSON.parse(
  await readFile(join(root, 'src/Design System/tokens.json'), 'utf8'),
)

const code = (value) => `\`${value}\``
/** Union values as separate code spans, so no pipe breaks the table. */
const unionCell = (values) => values.map(code).join(' ')

const table = (headers, rows) =>
  [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')

const entries = (group) =>
  Object.entries(group).filter(([key]) => !key.startsWith('$'))

const blocks = {
  'components/badge.md': {
    props: table(
      ['Prop', 'Type', 'Default', 'Description'],
      badgeMeta.props.map((prop) => [
        code(prop.name),
        prop.values ? unionCell(prop.values) : code(prop.type),
        prop.required ? '**required**' : code(prop.default ?? '—'),
        prop.description,
      ]),
    ),
    sizes: table(
      ['Size', 'Height', 'Label', 'Padding'],
      badgeMeta.sizes.map((size) => [
        code(size.name),
        size.height,
        size.label,
        size.padding,
      ]),
    ),
    fixed: table(
      ['Value', 'Setting', 'Note'],
      badgeMeta.fixed.map((item) => [item.name, code(item.value), item.note]),
    ),
    absent: table(
      ['Not a prop', 'Why'],
      badgeMeta.absent.map((item) => [code(item.name), item.reason]),
    ),
  },
  'tokens.md': {
    space: table(
      ['Token', 'Value'],
      entries(tokens.space).map(([key, token]) => [
        code(`--ds-space-${key}`),
        token.$value,
      ]),
    ),
    variants: table(
      ['Variant', 'Background', 'Text'],
      entries(tokens.variant).map(([name, pair]) => [
        code(name),
        code(pair.background.$value),
        code(pair.text.$value),
      ]),
    ),
    palette: entries(tokens.color)
      .map(([key, token]) => `- ${code(`--ds-color-${key}`)} ${token.$value}`)
      .join('\n'),
    other: table(
      ['Token', 'Value'],
      [
        ...entries(tokens.radius).map(([key, token]) => [
          code(`--ds-radius-${key}`),
          token.$value,
        ]),
        [code('--ds-border-width'), tokens.border.width.$value],
        [code('--ds-status-dot-color'), tokens.statusDot.color.$value],
        ...entries(tokens.font.weight).map(([key, token]) => [
          code(`--ds-font-weight-${key}`),
          token.$value,
        ]),
        [code('--ds-duration-fast'), tokens.duration.fast.$value],
      ],
    ),
  },
}

/** One index, linked relative to whichever file it is injected into. */
const componentIndex = (fromDir) =>
  table(
    ['Component', 'Summary', 'Docs'],
    [
      [
        code(badgeMeta.name),
        badgeMeta.summary,
        `[badge.md](${relative(fromDir, join(SKILL_DIR, 'components/badge.md'))})`,
      ],
    ],
  )

blocks['SKILL.md'] = { components: componentIndex(SKILL_DIR) }

const targets = [
  ...Object.entries(blocks).map(([file, content]) => ({
    path: join(SKILL_DIR, file),
    content,
  })),
  {
    path: join(root, 'AGENTS.md'),
    content: { components: componentIndex(root) },
  },
]

function fill(source, name, body, file) {
  const start = `<!-- GENERATED:${name} -->`
  const end = `<!-- /GENERATED:${name} -->`
  const startAt = source.indexOf(start)
  const endAt = source.indexOf(end)
  if (startAt === -1 || endAt === -1) {
    throw new Error(`Missing ${start} ... ${end} markers in ${file}`)
  }
  return (
    source.slice(0, startAt + start.length) +
    `\n${body}\n` +
    source.slice(endAt)
  )
}

let drifted = false

for (const target of targets) {
  const original = await readFile(target.path, 'utf8')
  let updated = original
  for (const [name, body] of Object.entries(target.content)) {
    updated = fill(updated, name, body, relative(root, target.path))
  }

  if (updated === original) continue

  if (process.argv.includes('--check')) {
    console.error(
      `${relative(root, target.path)} is out of date. Run: npm run docs:build`,
    )
    drifted = true
  } else {
    await writeFile(target.path, updated)
    console.log(`Updated ${relative(root, target.path)}`)
  }
}

if (drifted) process.exit(1)
if (process.argv.includes('--check')) console.log('Docs are up to date.')
