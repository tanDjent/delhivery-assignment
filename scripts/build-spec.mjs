#!/usr/bin/env node
/**
 * Builds badge.spec.json: a platform-neutral description of the component,
 * complete enough to implement it in React, Vue, SwiftUI or Compose.
 *
 *   badge.meta.ts   the public API and the deliberate omissions
 *   badge.figma.json  what design actually bound, per variant, type and size
 *   tokens.json     used to verify every reference in the spec resolves
 *
 * The spec deliberately holds decisions as data and semantics as declarations,
 * never layout as code: token names rather than values, logical directions
 * rather than left and right, and a neutral type vocabulary rather than one
 * framework's. Behaviour that cannot be declared is stated as a contract in
 * `conformance` for each implementation to satisfy in its own way.
 *
 * Run with --check in CI to fail when the spec has drifted from its sources.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const BADGE = join(root, 'src/Design System/Badge')
const TARGET = join(BADGE, 'badge.spec.json')

const { badgeMeta } = await import(join(BADGE, 'badge.meta.ts'))
const figma = JSON.parse(await readFile(join(BADGE, 'badge.figma.json'), 'utf8'))
const tokens = JSON.parse(
  await readFile(join(root, 'src/Design System/tokens.json'), 'utf8'),
)

/** A framework-neutral vocabulary; each platform maps these to its own types. */
const KINDS = {
  string: 'text',
  boolean: 'flag',
  ReactNode: 'slot',
}

const kindOf = (prop) =>
  prop.values ? 'enum' : (KINDS[prop.type] ?? prop.type.toLowerCase())

const api = Object.fromEntries(
  badgeMeta.props.map((prop) => {
    const entry = { kind: kindOf(prop) }
    if (prop.values) entry.values = [...prop.values]
    if (prop.required) entry.required = true
    else if (prop.default !== undefined) {
      entry.default = prop.default === 'false' ? false : prop.default
    }
    if (entry.kind === 'slot') entry.accepts = 'icon'
    entry.description = prop.description
    return [prop.name, entry]
  }),
)

/** Token references are resolved against tokens.json so the spec cannot name
 *  something the token pipeline does not publish. Deliberately not merged with
 *  tokens.primitives.json: a spec that reached past the semantic layer for a raw
 *  primitive should fail here rather than be copied onto another platform. */
const resolves = (reference) =>
  reference
    .slice(1, -1)
    .split('.')
    .reduce((node, key) => node?.[key], tokens) !== undefined

const unresolved = []
const checked = (reference) => {
  if (reference && reference.startsWith('{') && !resolves(reference)) {
    unresolved.push(reference)
  }
  return reference
}

const SIZE_ORDER = ['small', 'medium', 'large']

const bySize = Object.fromEntries(
  SIZE_ORDER.map((size) => {
    const g = figma.geometry[size]
    const [group, name] = g.textStyle.toLowerCase().split('/')
    return [
      size,
      {
        height: g.height,
        // Logical, so a right-to-left locale needs no separate spec.
        paddingInline: checked(`{spacing.${g.padding}}`),
        paddingBlock: checked(`{spacing.${g.padding}}`),
        textStyle: checked(`{typography.${group}.${name}}`),
        iconSize: g.iconSize,
        dotSize: g.dotSize,
      },
    ]
  }),
)

/** null means Figma set no fill or stroke; say what that means explicitly
 *  rather than leaving each platform to guess. */
const appearanceFor = (slots, type) => ({
  background: checked(slots.background) ?? 'transparent',
  foreground: checked(slots.foreground) ?? 'inherit',
  border:
    checked(slots.border) ?? (type === 'solid' ? 'match-background' : 'none'),
})

const byVariant = Object.fromEntries(
  badgeMeta.props
    .find((prop) => prop.name === 'variant')
    .values.map((variant) => [
      variant,
      Object.fromEntries(
        badgeMeta.props
          .find((prop) => prop.name === 'type')
          .values.map((type) => [
            type,
            appearanceFor(figma.appearance[variant][type], type),
          ]),
      ),
    ]),
)

const spec = {
  $description:
    'GENERATED FILE — DO NOT EDIT. A platform-neutral contract for Badge, built from badge.meta.ts and badge.figma.json by scripts/build-spec.mjs. Token references are DTCG paths into tokens.json. Regenerate: npm run spec:build',
  name: badgeMeta.name,
  summary: badgeMeta.summary,
  source: { figmaComponentSet: figma.componentSetId },

  /** No platform may give this component a tap target. */
  interactive: false,

  api,

  anatomy: {
    container: { layout: 'row', align: 'center', focusable: false },
    parts: [
      { name: 'statusDot', when: 'statusDot', decorative: true },
      { name: 'leadingIcon', when: 'leadingIcon', decorative: true },
      { name: 'label', always: true, source: 'label' },
      { name: 'trailingIcon', when: 'trailingIcon', decorative: true },
    ],
  },

  layout: {
    gap: checked(`{spacing.${figma.geometry.medium.gap}}`),
    cornerRadius: checked('{radius.default}'),
    borderWidth: checked('{stroke.default}'),
    bySize,
  },

  appearance: {
    slots: ['background', 'foreground', 'border'],
    byVariant,
  },

  behaviour: {
    ghost: {
      rendersLabel: false,
      animation: { name: 'shimmer', durationMs: 1400, respectsReducedMotion: true },
    },
  },

  accessibility: {
    labelSource: 'label',
    decorativeParts: ['statusDot', 'leadingIcon', 'trailingIcon'],
    disabledWhen: "type == 'disabled'",
    ghost: {
      hiddenFromAssistiveTech: true,
      announcedBy: 'the surrounding loading region',
    },
  },

  constraints: badgeMeta.absent.map((item) => ({
    absent: item.name,
    reason: item.reason,
  })),

  conformance: [
    'the rendered height equals layout.bySize[size].height',
    'the container exposes no tap or click target and is not focusable',
    'decorative parts are absent from the accessibility tree',
    'the accessible name equals the label input',
    "type 'disabled' is exposed as disabled to assistive technology",
    "type 'ghost' renders no label and is hidden from assistive technology",
    'every colour comes from the token named in appearance, never a literal',
  ],
}

if (unresolved.length) {
  console.error(`Unresolved token references: ${[...new Set(unresolved)].join(', ')}`)
  process.exit(1)
}

const content = `${JSON.stringify(spec, null, 2)}\n`
const current = await readFile(TARGET, 'utf8').catch(() => '')

if (current === content) {
  if (process.argv.includes('--check')) console.log('badge.spec.json is up to date.')
  process.exit(0)
}

if (process.argv.includes('--check')) {
  console.error('badge.spec.json is out of date. Run: npm run spec:build')
  process.exit(1)
}

await writeFile(TARGET, content)
const pairings = Object.keys(byVariant).length * spec.api.type.values.length
console.log(`Wrote ${relative(root, TARGET)}: ${pairings} appearance pairings`)
