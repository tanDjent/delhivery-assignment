#!/usr/bin/env node
/**
 * Refreshes badge.figma.json from the Figma component set.
 *
 * This is the design side of the contract: which token every variant, type and
 * size is bound to in Figma, read from the component's own variable bindings
 * rather than transcribed by eye. badge.spec.json is generated from it, and the
 * React implementation is then checked against that spec — so design, spec and
 * code cannot drift apart without a test failing.
 *
 *   FIGMA_TOKEN=figd_... node scripts/fetch-badge-figma.mjs
 *
 * The output is committed, so neither the build nor CI needs network access.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const FILE_KEY = 'TYR1QoZKa0Hw3s9MSvFDG2'
/** The frame holding the Badge component set. */
const BADGE_NODE = '1821:8881'

const token = process.env.FIGMA_TOKEN
if (!token) {
  console.error('Set FIGMA_TOKEN to a Figma personal access token.')
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = join(root, 'src/Design System/Badge/badge.figma.json')

const response = await fetch(
  `https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${BADGE_NODE}`,
  { headers: { 'X-Figma-Token': token } },
)
if (!response.ok) throw new Error(`Figma API ${response.status}`)
const { nodes } = await response.json()

// Variable ids resolve against the same export the tokens are built from, so a
// binding Figma cannot resolve here is one the token pipeline does not have.
const variables = JSON.parse(
  await readFile(join(root, 'src/Design System/variables.figma.json'), 'utf8'),
)
const pathById = new Map()
for (const collection of variables.collections) {
  const tier =
    collection.name.trim() === 'Brand'
      ? 'brand'
      : collection.name.trim() === 'Alias'
        ? 'alias'
        : null
  for (const variable of collection.variables) {
    const segments = variable.name
      .trim()
      .toLowerCase()
      .split('/')
      .map((segment) => segment.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))
    pathById.set(variable.id, [...(tier ? [tier] : []), ...segments].join('.'))
  }
}

const tokenRef = (id) => {
  const path = pathById.get(id)
  if (!path) throw new Error(`Binding ${id} is not in variables.figma.json`)
  return `{${path}}`
}

const boundToken = (node, key) => {
  const binding = node.boundVariables?.[key]
  const entry = Array.isArray(binding) ? binding[0] : binding
  return entry?.id ? tokenRef(entry.id) : null
}

let componentSet = null
const findSet = (node) => {
  if (node.type === 'COMPONENT_SET') componentSet = node
  for (const child of node.children ?? []) if (!componentSet) findSet(child)
}
findSet(nodes[BADGE_NODE].document)
if (!componentSet) throw new Error('No component set under the Badge frame')

const axisValues = (name) => name.split(',').map((p) => p.trim().split('='))
const propsOf = (name) => Object.fromEntries(axisValues(name))

/** Figma's variant names, mapped to the casing the code uses. */
const camel = (value) =>
  value.toLowerCase().replace(/_(.)/g, (_, c) => c.toUpperCase())

const appearance = {}
const geometry = {}
const axes = { variant: [], size: [], type: [] }

for (const variant of componentSet.children ?? []) {
  const props = propsOf(variant.name)
  const variantName = camel(props.Variant)
  const typeName = props.Type.toLowerCase()
  const sizeName = props.Size.toLowerCase()

  for (const [axis, value] of [
    ['variant', variantName],
    ['size', sizeName],
    ['type', typeName],
  ]) {
    if (!axes[axis].includes(value)) axes[axis].push(value)
  }

  let label = null
  let icon = null
  let dot = null
  const walk = (node, insideDot = false) => {
    const isDot = /avatar status/i.test(node.name)
    if (node.type === 'TEXT' && !label) label = node
    if (/icon container/i.test(node.name) && !icon) icon = node
    if ((insideDot || isDot) && node.type === 'ELLIPSE' && !dot) dot = node
    for (const child of node.children ?? []) walk(child, insideDot || isDot)
  }
  walk(variant)

  const round = (n) => Math.round(n * 100) / 100

  if (!geometry[sizeName] && variant.paddingTop != null) {
    geometry[sizeName] = {
      height: round(variant.absoluteBoundingBox.height),
      padding: variant.paddingTop,
      gap: variant.itemSpacing,
      cornerRadius: variant.cornerRadius,
      iconSize: icon ? round(icon.absoluteBoundingBox.width) : null,
      dotSize: dot ? round(dot.absoluteBoundingBox.width) : null,
      textStyle: null,
    }
  }
  if (geometry[sizeName] && !geometry[sizeName].textStyle && label) {
    const styleId = label.styles?.text
    geometry[sizeName].textStyle =
      nodes[BADGE_NODE].styles?.[styleId]?.name ?? null
  }
  if (geometry[sizeName] && geometry[sizeName].dotSize == null && dot) {
    geometry[sizeName].dotSize = round(dot.absoluteBoundingBox.width)
  }

  appearance[variantName] ??= {}
  appearance[variantName][typeName] ??= {
    background: boundToken(variant, 'fills'),
    foreground: label ? boundToken(label, 'fills') : null,
    border: boundToken(variant, 'strokes'),
  }
}

await writeFile(
  TARGET,
  `${JSON.stringify(
    {
      $description:
        'GENERATED FROM FIGMA — the Badge component set’s own variable bindings. Regenerate with: FIGMA_TOKEN=... node scripts/fetch-badge-figma.mjs. Consumed by scripts/build-spec.mjs.',
      figmaFileKey: FILE_KEY,
      componentSetId: componentSet.id,
      extractedAt: new Date().toISOString().slice(0, 10),
      axes,
      geometry,
      appearance,
    },
    null,
    2,
  )}\n`,
)

const pairs = Object.values(appearance).reduce(
  (total, byType) => total + Object.keys(byType).length,
  0,
)
console.log(
  `Wrote ${TARGET}: ${axes.variant.length} variants x ${axes.type.length} types (${pairs} pairings), ${axes.size.length} sizes`,
)
