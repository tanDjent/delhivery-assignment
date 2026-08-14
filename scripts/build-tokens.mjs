#!/usr/bin/env node
/**
 * Generates tokens.css from tokens.json.
 *
 * tokens.json is the platform-agnostic source of truth; this script is the CSS
 * target. Run with --check in CI to fail when the generated file has drifted.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE = join(root, 'src/Design System/tokens.json')
const TARGET = join(root, 'src/Design System/tokens.css')

/** dlvRed -> dlv-red, so CSS names stay kebab-case. */
const kebab = (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

function heading(title) {
  const dashes = '-'.repeat(Math.max(1, 72 - title.length))
  return `  /* ${dashes} ${title} -- */`
}

function section(title, lines, description) {
  const out = [heading(title)]
  if (description) out.push(`  /* ${description} */`)
  return [...out, ...lines].join('\n')
}

const build = (tokens) => {
  const sections = []

  sections.push(
    section(
      'Spacing',
      Object.entries(tokens.space)
        .filter(([key]) => !key.startsWith('$'))
        .map(([key, token]) => `  --ds-space-${key}: ${token.$value};`),
      tokens.space.$description,
    ),
  )

  const variantLines = []
  for (const [name, pair] of Object.entries(tokens.variant)) {
    if (name.startsWith('$')) continue
    variantLines.push(
      `  --ds-variant-${kebab(name)}-bg: ${pair.background.$value};`,
      `  --ds-variant-${kebab(name)}-text: ${pair.text.$value};`,
      '',
    )
  }
  variantLines.pop()
  sections.push(
    section('Variant colours', variantLines, tokens.variant.$description),
  )

  sections.push(
    section(
      'Status dot',
      [`  --ds-status-dot-color: ${tokens.statusDot.color.$value};`],
      tokens.statusDot.$description,
    ),
  )

  sections.push(
    section(
      'Palette',
      Object.entries(tokens.color)
        .filter(([key]) => !key.startsWith('$'))
        .map(([key, token]) => `  --ds-color-${key}: ${token.$value};`),
    ),
  )

  sections.push(
    section('Typography', [
      `  --ds-font-family: ${tokens.font.family.$value};`,
      ...Object.entries(tokens.font.weight)
        .filter(([key]) => !key.startsWith('$'))
        .map(([key, token]) => `  --ds-font-weight-${key}: ${token.$value};`),
    ]),
  )

  sections.push(
    section(
      'Radius',
      Object.entries(tokens.radius)
        .filter(([key]) => !key.startsWith('$'))
        .map(([key, token]) => `  --ds-radius-${key}: ${token.$value};`),
    ),
  )

  sections.push(
    section('Borders', [`  --ds-border-width: ${tokens.border.width.$value};`]),
  )

  sections.push(
    section('Motion', [
      `  --ds-duration-fast: ${tokens.duration.fast.$value};`,
      `  --ds-easing-standard: ${tokens.easing.standard.$value};`,
    ]),
  )

  return `/**
 * GENERATED FILE — DO NOT EDIT.
 *
 * Source: tokens.json
 * Regenerate: npm run tokens:build
 *
 * Component styles must only reference the semantic \`--ds-*\` names below so a
 * palette change never requires touching component CSS.
 */

:root {
${sections.join('\n\n')}
}
`
}

const tokens = JSON.parse(await readFile(SOURCE, 'utf8'))
const css = build(tokens)

if (process.argv.includes('--check')) {
  const current = await readFile(TARGET, 'utf8').catch(() => '')
  if (current !== css) {
    console.error(
      'tokens.css is out of date with tokens.json. Run: npm run tokens:build',
    )
    process.exit(1)
  }
  console.log('tokens.css is up to date.')
} else {
  await writeFile(TARGET, css)
  console.log(`Wrote ${TARGET}`)
}
