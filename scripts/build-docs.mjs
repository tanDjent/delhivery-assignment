#!/usr/bin/env node
/**
 * Fills the generated blocks in the agent-facing docs.
 *
 * The API tables come from badge.meta.ts and the token tables from the tokens,
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
/** The two documents share no top-level key, so a shallow merge rejoins the
 *  reference chain that splitting the primitives out broke. */
const tokens = {
  ...JSON.parse(
    await readFile(join(root, 'src/Design System/tokens.primitives.json'), 'utf8'),
  ),
  ...JSON.parse(
    await readFile(join(root, 'src/Design System/tokens.json'), 'utf8'),
  ),
}

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

/** Every token in a subtree, as [pathSegments, token]. */
function leaves(node, path = []) {
  if (node?.$value !== undefined) return [[path, node]]
  return entries(node ?? {}).flatMap(([key, child]) =>
    leaves(child, [...path, key]),
  )
}

/** The semantic tier: everything that is neither a primitive nor an alias. */
const MAPPED_GROUPS = entries(tokens).filter(
  ([key]) => !['brand', 'alias', 'typography'].includes(key),
)

const mappedGroups = () =>
  table(
    ['Group', 'Tokens', 'Example'],
    MAPPED_GROUPS.map(([name, group]) => {
      const all = leaves(group)
      return [
        code(name),
        String(all.length),
        code(`--ds-${name}-${all[0][0].join('-')}`),
      ]
    }),
  )

/** Follows {group.token} references to the literal a browser ends up with. */
function resolve(value, depth = 0) {
  if (typeof value !== 'string' || !value.startsWith('{') || depth > 10) {
    return String(value)
  }
  const target = value
    .slice(1, -1)
    .split('.')
    .reduce((node, key) => node?.[key], tokens)
  return target ? resolve(target.$value, depth + 1) : value
}

const scaleRows = (group, prefix) =>
  leaves(tokens[group] ?? {}).map(([path, token]) => [
    code(`${prefix}${path.join('-')}`),
    resolve(token.$value),
  ])

const scale = (group, prefix) =>
  table(['Token', 'Value'], scaleRows(group, prefix))

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
      ['Size', 'Height', 'Padding', 'Label style', 'Icon', 'Dot'],
      badgeMeta.sizes.map((size) => [
        code(size.name),
        size.height,
        size.padding,
        code(size.label),
        size.icon,
        size.dot,
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
    groups: mappedGroups(),
    spacing: scale('spacing', '--ds-spacing-'),
    shape: [
      ...scaleRows('radius', '--ds-radius-'),
      ...scaleRows('stroke', '--ds-stroke-'),
    ].length
      ? table(
          ['Token', 'Value'],
          [
            ...scaleRows('radius', '--ds-radius-'),
            ...scaleRows('stroke', '--ds-stroke-'),
          ],
        )
      : '',
    typography: table(
      ['Token', 'Family', 'Size', 'Weight', 'Line height'],
      leaves(tokens.typography).map(([path, token]) => [
        code(`--ds-typography-${path.join('-')}`),
        token.$value.fontFamily.split(',')[0].replace(/'/g, ''),
        token.$value.fontSize,
        String(token.$value.fontWeight),
        token.$value.lineHeight,
      ]),
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
