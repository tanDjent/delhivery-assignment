import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(import.meta.dirname, '..')
const TOKENS_CSS = join(import.meta.dirname, 'tokens.css')
const TOKENS_JSON = join(import.meta.dirname, 'tokens.json')

const tokensCss = readFileSync(TOKENS_CSS, 'utf8')
const json = JSON.parse(readFileSync(TOKENS_JSON, 'utf8'))

const DARK_AT = tokensCss.indexOf("[data-theme='dark']")
const lightBlock = tokensCss.slice(tokensCss.indexOf(':root {'), DARK_AT)
const darkBlock = tokensCss.slice(DARK_AT)

const declarations = (block: string) =>
  [...block.matchAll(/^\s+(--ds-[\w-]+):\s*(.+);$/gm)].map((match) => ({
    name: match[1],
    value: match[2],
  }))

const light = declarations(lightBlock)
const declared = new Set(light.map((d) => d.name))

/** The single var() a value consists of, or null if it is a literal. */
const reference = (value: string) =>
  /^var\((--ds-[\w-]+)\)$/.exec(value)?.[1] ?? null

const tierOf = (name: string) =>
  name.startsWith('--ds-brand-')
    ? 'brand'
    : name.startsWith('--ds-alias-')
      ? 'alias'
      : 'mapped'

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.name.endsWith('.css') ? [path] : []
  })
}

/** Every token in a subtree, as [pathSegments, token]. */
function leaves(
  node: unknown,
  path: string[] = [],
): [string[], { $value: unknown }][] {
  if (typeof node !== 'object' || node === null) return []
  if ('$value' in node) return [[path, node as { $value: unknown }]]
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => leaves(child, [...path, key]))
}

describe('tokens.css is generated from the Figma exports', () => {
  it('carries the generated-file warning', () => {
    expect(tokensCss).toContain('GENERATED FILE — DO NOT EDIT')
    expect(tokensCss).toContain('npm run tokens:build')
  })

  it('declares each token exactly once', () => {
    const names = light.map((d) => d.name)
    const duplicated = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))]
    expect(duplicated).toEqual([])
  })

  it('leaves no var() pointing at a token that does not exist', () => {
    const used = new Set(
      [...tokensCss.matchAll(/var\((--ds-[\w-]+)\)/g)].map((m) => m[1]),
    )
    expect([...used].filter((name) => !declared.has(name))).toEqual([])
  })

  it('emits every token in tokens.json', () => {
    for (const group of ['brand', 'alias'] as const) {
      for (const [path] of leaves(json[group])) {
        expect(declared, `${group}.${path.join('.')}`).toContain(
          `--ds-${group}-${path.join('-')}`,
        )
      }
    }
    for (const [path] of leaves(json.typography)) {
      expect(declared).toContain(`--ds-typography-${path.join('-')}-font-size`)
    }
  })
})

describe('the three tiers keep their references', () => {
  it('gives Brand literal values only', () => {
    for (const d of light.filter((d) => tierOf(d.name) === 'brand')) {
      expect(reference(d.value), `${d.name} should not point at another token`).toBeNull()
    }
  })

  it('points every Alias token at a Brand token', () => {
    for (const d of light.filter((d) => tierOf(d.name) === 'alias')) {
      expect(reference(d.value), `${d.name} is not a reference`).not.toBeNull()
      expect(tierOf(reference(d.value)!), `${d.name}`).toBe('brand')
    }
  })

  it('points the mapped colour tokens at Alias or Brand', () => {
    const mapped = light.filter(
      (d) => tierOf(d.name) === 'mapped' && !d.name.startsWith('--ds-typography-'),
    )
    expect(mapped.length).toBeGreaterThan(400)
    for (const d of mapped) {
      const target = reference(d.value)
      if (target === null) {
        // A fully transparent surface has no primitive to point at.
        expect(d.value, `${d.name}`).toMatch(/^#[0-9a-f]{8}$/i)
        continue
      }
      expect(['brand', 'alias'], `${d.name} -> ${target}`).toContain(tierOf(target))
    }
  })
})

describe('dark mode', () => {
  const dark = declarations(darkBlock)

  it('overrides only tokens that exist in light', () => {
    for (const d of dark) expect(declared).toContain(d.name)
  })

  it('overrides nothing in Brand or Alias, so the primitives stay stable', () => {
    for (const d of dark) expect(tierOf(d.name)).toBe('mapped')
  })

  it('applies by attribute and by system preference', () => {
    expect(tokensCss).toContain("[data-theme='dark']")
    expect(tokensCss).toContain('@media (prefers-color-scheme: dark)')
    // An explicit light choice must survive a dark system preference.
    expect(tokensCss).toContain(":root:not([data-theme='light'])")
  })
})

describe('component CSS only consumes tokens', () => {
  const files = cssFiles(SRC).filter((file) => file !== TOKENS_CSS)

  it('finds stylesheets to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files)('%s references only declared tokens', (file) => {
    const used = [...readFileSync(file, 'utf8').matchAll(/var\((--ds-[\w-]+)/g)]
    for (const [, name] of used) {
      expect(declared, `${name} is not declared in tokens.css`).toContain(name)
    }
  })

  it('has no raw hex colour in Badge.css', () => {
    const badgeCss = readFileSync(join(import.meta.dirname, 'Badge/Badge.css'), 'utf8')
    expect(badgeCss).not.toMatch(/#[0-9a-f]{3,8}\b/i)
  })

  it('sets Badge spacing from the spacing scale', () => {
    const badgeCss = readFileSync(join(import.meta.dirname, 'Badge/Badge.css'), 'utf8')
    const spacing = [...badgeCss.matchAll(/^\s+(?:padding|gap|margin):\s*(.+);$/gm)]
    for (const [, value] of spacing) {
      expect(value, `${value} is not a spacing token`).toMatch(
        /^var\(--ds-spacing-[\d.]+\)$/,
      )
    }
  })
})
