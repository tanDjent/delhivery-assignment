#!/usr/bin/env node
/**
 * Builds the token artifacts from the Figma exports.
 *
 *   variables.figma.json     tokens.primitives.json   tokens.primitives.css
 *                        ->                        ->
 *   typography.figma.json    tokens.json              tokens.css
 *
 * variables.figma.json is Figma's variables export: three collections, where
 * Brand holds primitives, Alias points at Brand, and DLV_Mapped points at Alias
 * and carries the Light and Dark modes. That chain is preserved all the way into
 * CSS as nested var() references, so changing one primitive cascades exactly as
 * it does in Figma.
 *
 * The output is split where the audience changes. Brand and Alias go to the
 * primitives files, which exist so the chain resolves and are read by almost
 * nobody; the semantic layer and the text styles go to tokens.json and
 * tokens.css, which is what components consume. Because nearly every semantic
 * token is a reference, the two are a set: tokens.css imports the primitives so
 * a caller cannot load half the chain.
 *
 * typography.figma.json is separate because Figma text styles are not variables
 * and never appear in a variables export.
 *
 * Run with --check in CI to fail when a generated file has drifted.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const DS = join(root, 'src/Design System')

const VARIABLES = join(DS, 'variables.figma.json')
const TYPOGRAPHY = join(DS, 'typography.figma.json')
const TOKENS_JSON = join(DS, 'tokens.json')
const TOKENS_CSS = join(DS, 'tokens.css')
const PRIMITIVES_JSON = join(DS, 'tokens.primitives.json')
const PRIMITIVES_CSS = join(DS, 'tokens.primitives.css')

/** Appended to every font family, since Figma only stores the family name. */
const FONT_FALLBACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

/** Figma stores weights as names on the Font_Weight primitives. */
const WEIGHT_NUMBERS = {
  bold: 700,
  semibold: 600,
  medium: 500,
  regular: 400,
  light: 300,
}

const CHECK = process.argv.includes('--check')

// --------------------------------------------------------------- helpers ---

/** `Surface/BG_Primary/Default` -> `surface-bg_primary-default`. Figma's own
 *  wording is preserved, underscores included, so a token named in Figma can be
 *  found in CSS by searching for the same string. */
const slug = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[\s/]+/g, '-')
    .replace(/[^a-z0-9_-]/g, '')

const channel = (n) =>
  Math.round(n * 255)
    .toString(16)
    .padStart(2, '0')

const hex = ({ r, g, b, a }) =>
  a === 1
    ? `#${channel(r)}${channel(g)}${channel(b)}`
    : `#${channel(r)}${channel(g)}${channel(b)}${channel(a)}`

/** DTCG alias syntax: {group.token}. */
const ref = (path) => `{${path.join('.')}}`

// ----------------------------------------------------------------- inputs ---

const variables = JSON.parse(await readFile(VARIABLES, 'utf8'))
const typography = JSON.parse(await readFile(TYPOGRAPHY, 'utf8'))

const collection = (name) =>
  variables.collections.find((c) => c.name.trim() === name)

const BRAND = collection('Brand')
const ALIAS = collection('Alias')
const MAPPED = collection('DLV_Mapped')

if (!BRAND || !ALIAS || !MAPPED) {
  throw new Error(
    'variables.figma.json is missing one of Brand, Alias, DLV_Mapped',
  )
}

/** Which tier each variable belongs to, and its dotted DTCG path. */
const tierOf = new Map()
const registerTier = (col, tier) => {
  for (const variable of col.variables) {
    tierOf.set(variable.id, { tier, name: variable.name, variable })
  }
}
registerTier(BRAND, 'brand')
registerTier(ALIAS, 'alias')
registerTier(MAPPED, 'mapped')

/** DTCG path for a variable, e.g. ['brand','white','25']. */
const pathOf = (variable) => {
  const { tier } = tierOf.get(variable.id)
  const segments = variable.name.split('/').map((s) => slug(s))
  return tier === 'mapped' ? segments : [tier, ...segments]
}

/** CSS custom property name. The semantic tier — Figma calls the collection
 *  DLV_Mapped — is unprefixed because it is the layer components consume; the
 *  other two are prefixed, which also resolves the 30 Alpha ramp names that
 *  Brand and Alias share. */
const cssName = (variable) => `--ds-${pathOf(variable).join('-')}`

const modeOf = (col, label) =>
  col.modes.find((m) => m.name.toLowerCase() === label)?.modeId ??
  col.defaultModeId ??
  col.modes[0].modeId

const LIGHT = modeOf(MAPPED, 'light')
const DARK = modeOf(MAPPED, 'dark')

/**
 * One step of resolution: an alias becomes a reference to the target variable,
 * a literal becomes a value. Nothing is flattened.
 */
function valueFor(variable, modeId) {
  const raw =
    variable.valuesByMode[modeId] ??
    variable.valuesByMode[Object.keys(variable.valuesByMode)[0]]

  if (raw && raw.type === 'VARIABLE_ALIAS') {
    const target = tierOf.get(raw.id)
    if (!target) return { kind: 'missing', id: raw.id }
    return { kind: 'alias', target: target.variable }
  }
  if (raw && typeof raw === 'object' && 'r' in raw) {
    return { kind: 'color', value: hex(raw) }
  }
  if (typeof raw === 'number') return { kind: 'number', value: raw }
  return { kind: 'string', value: String(raw) }
}

const dtcgValue = (resolved, type) => {
  switch (resolved.kind) {
    case 'alias':
      return ref(pathOf(resolved.target))
    case 'color':
      return resolved.value
    case 'number':
      return type === 'number' ? resolved.value : `${resolved.value}px`
    default:
      return resolved.value
  }
}

const cssValue = (resolved, type) => {
  switch (resolved.kind) {
    case 'alias':
      return `var(${cssName(resolved.target)})`
    case 'color':
      return resolved.value
    case 'number':
      return type === 'number' ? String(resolved.value) : `${resolved.value}px`
    default:
      return resolved.value
  }
}

// ------------------------------------------------------------- the documents ---

const setPath = (target, path, value) => {
  let node = target
  for (const segment of path.slice(0, -1)) {
    node[segment] ??= {}
    node = node[segment]
  }
  node[path.at(-1)] = value
}

const SOURCE = {
  variables: 'variables.figma.json',
  typography: 'typography.figma.json',
  regenerate: 'npm run tokens:build',
}

const primitives = {
  $description:
    'GENERATED FILE — DO NOT EDIT. The Brand and Alias tiers: raw values, and the names given to them. Split out of tokens.json because components never reference these directly — they exist so the semantic tokens have something to point at. Read tokens.json instead unless you are changing a primitive.',
  $source: { ...SOURCE, consumedBy: 'tokens.json' },
}

const tokens = {
  $description:
    'GENERATED FILE — DO NOT EDIT. The semantic layer, which is what components consume, plus the Figma text styles. DTCG format, so the tokens are consumable outside CSS. Names mirror Figma: Surface/BG_Primary/Default becomes surface.bg_primary.default. Almost every value here is a reference into tokens.primitives.json, so resolve the two together.',
  $source: { ...SOURCE, primitives: 'tokens.primitives.json' },
}

/** Brand and Alias belong to the primitives document, everything else here. */
const documentFor = (path) =>
  path[0] === 'brand' || path[0] === 'alias' ? primitives : tokens

const cssBlocks = { light: [], dark: [] }

for (const col of [BRAND, ALIAS, MAPPED]) {
  const isMapped = col === MAPPED
  for (const variable of col.variables) {
    const type =
      variable.resolvedType === 'COLOR'
        ? 'color'
        : variable.resolvedType === 'FLOAT'
          ? 'dimension'
          : 'string'

    const light = valueFor(variable, isMapped ? LIGHT : col.modes[0].modeId)
    const path = pathOf(variable)
    const entry = {
      $type: type,
      $value: dtcgValue(light, type),
    }

    if (isMapped) {
      const dark = valueFor(variable, DARK)
      const darkValue = dtcgValue(dark, type)
      if (darkValue !== entry.$value) {
        entry.$extensions = { 'com.delhivery.mode': { dark: darkValue } }
        cssBlocks.dark.push(`  ${cssName(variable)}: ${cssValue(dark, type)};`)
      }
    }

    setPath(documentFor(path), path, entry)
    cssBlocks.light.push(`  ${cssName(variable)}: ${cssValue(light, type)};`)
  }
}

// Typography: composite in DTCG, individual custom properties in CSS.
const typographyCss = []
for (const [name, style] of Object.entries(typography.styles)) {
  const path = ['typography', ...name.split('/').map(slug)]
  const family = `'${style.fontFamily}', ${FONT_FALLBACK}`
  setPath(tokens, path, {
    $type: 'typography',
    $value: {
      fontFamily: family,
      fontWeight: style.fontWeight,
      fontSize: `${style.fontSize}px`,
      lineHeight: `${style.lineHeight}px`,
      letterSpacing: `${style.letterSpacing}px`,
    },
    $extensions: { 'com.delhivery.figmaNodeIds': style.figmaNodeIds },
  })

  const base = `--ds-${path.join('-')}`
  typographyCss.push(
    `  ${base}-font-family: ${family};`,
    `  ${base}-font-size: ${style.fontSize}px;`,
    `  ${base}-font-weight: ${style.fontWeight};`,
    `  ${base}-line-height: ${style.lineHeight}px;`,
    `  ${base}-letter-spacing: ${style.letterSpacing}px;`,
    `  ${base}: ${style.fontWeight} ${style.fontSize}px/${style.lineHeight}px ${family};`,
  )
}

// Brand font weights are stored as names; publish the numeric equivalents.
const weightCss = []
for (const variable of BRAND.variables) {
  if (!variable.name.startsWith('Font_Weight/')) continue
  const label = variable.name.split('/')[1].toLowerCase()
  const number = WEIGHT_NUMBERS[label]
  if (!number) continue
  weightCss.push(`  --ds-brand-font_weight_value-${label}: ${number};`)
  setPath(primitives, ['brand', 'font_weight_value', label], {
    $type: 'number',
    $value: number,
  })
}

// ----------------------------------------------------------- the stylesheets ---

const section = (title, lines) =>
  [`  /* ${'-'.repeat(Math.max(1, 70 - title.length))} ${title} -- */`, ...lines].join(
    '\n',
  )

const groupOf = (line) => line.trim().replace(/^--ds-/, '').split('-')[0]

/** Split a tier's declarations into readable groups. */
function grouped(lines) {
  const out = []
  let current = null
  for (const line of lines) {
    const group = groupOf(line)
    if (group !== current) {
      if (current !== null) out.push('')
      current = group
    }
    out.push(line)
  }
  return out
}

/** Match the declared name, never the value, which also names other tiers. */
const declares = (prefix) => (line) => line.trimStart().startsWith(prefix)

const brandLines = cssBlocks.light.filter(declares('--ds-brand-'))
const aliasLines = cssBlocks.light.filter(declares('--ds-alias-'))
const mappedLines = cssBlocks.light.filter(
  (line) => !declares('--ds-brand-')(line) && !declares('--ds-alias-')(line),
)

const primitivesCss = `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source: variables.figma.json (Figma variables).
 * Regenerate: npm run tokens:build
 *
 * The Brand and Alias tiers: the raw values, and the names given to them. No
 * component should reference anything here — these exist so that the semantic
 * tokens in tokens.css have something to point at, which is why editing one
 * value cascades the way it does in Figma. tokens.css imports this file, so
 * there is nothing to import yourself.
 */

:root {
${section('Brand — primitives', grouped(brandLines))}

${section('Font weights as numbers', weightCss)}

${section('Alias — named primitives', grouped(aliasLines))}
}
`

const css = `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source: variables.figma.json (Figma variables), typography.figma.json (Figma
 * text styles).
 * Regenerate: npm run tokens:build
 *
 * The semantic layer — the only tokens a component should name — and the text
 * styles. Almost every value below is a var() into the Brand and Alias tiers,
 * so this file imports tokens.primitives.css rather than leaving a caller to
 * load half a chain.
 *
 * Light is the default. Dark is applied by [data-theme="dark"], and by the OS
 * preference unless a theme has been chosen explicitly.
 */

@import './tokens.primitives.css';

:root {
${section('Semantic — the layer components consume (Light)', grouped(mappedLines))}

${section('Typography — Figma text styles', typographyCss)}
}

/* Dark mode overrides only the semantic tokens whose value differs. */
[data-theme='dark'] {
${cssBlocks.dark.join('\n')}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${cssBlocks.dark.map((line) => `  ${line}`).join('\n')}
  }
}
`

// ------------------------------------------------------------------ write ---

const targets = [
  {
    path: PRIMITIVES_JSON,
    content: `${JSON.stringify(primitives, null, 2)}\n`,
    label: 'tokens.primitives.json',
  },
  {
    path: TOKENS_JSON,
    content: `${JSON.stringify(tokens, null, 2)}\n`,
    label: 'tokens.json',
  },
  { path: PRIMITIVES_CSS, content: primitivesCss, label: 'tokens.primitives.css' },
  { path: TOKENS_CSS, content: css, label: 'tokens.css' },
]

let drifted = false
for (const target of targets) {
  const current = await readFile(target.path, 'utf8').catch(() => '')
  if (current === target.content) continue
  if (CHECK) {
    console.error(`${target.label} is out of date. Run: npm run tokens:build`)
    drifted = true
  } else {
    await writeFile(target.path, target.content)
    console.log(`Wrote ${target.label}`)
  }
}

if (drifted) process.exit(1)
if (CHECK) console.log('Token files are up to date.')
else {
  const semantic = mappedLines.length + typographyCss.length
  const primitive = brandLines.length + aliasLines.length + weightCss.length
  console.log(
    `${semantic} semantic custom properties (${cssBlocks.dark.length} dark overrides) over ${primitive} primitives, ${Object.keys(typography.styles).length} text styles`,
  )
}
