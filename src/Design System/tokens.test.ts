import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = join(import.meta.dirname, '..')
const TOKENS_CSS = join(import.meta.dirname, 'tokens.css')
const TOKENS_JSON = join(import.meta.dirname, 'tokens.json')

function cssFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return cssFiles(path)
    return entry.name.endsWith('.css') ? [path] : []
  })
}

const tokensCss = readFileSync(TOKENS_CSS, 'utf8')
const declared = new Set(
  [...tokensCss.matchAll(/^\s+(--ds-[\w-]+):/gm)].map((match) => match[1]),
)

/** Every $value in the JSON tree, whatever its nesting. */
function values(node: unknown, found: string[] = []): string[] {
  if (typeof node !== 'object' || node === null) return found
  for (const [key, child] of Object.entries(node)) {
    if (key === '$value') found.push(String(child))
    else values(child, found)
  }
  return found
}

describe('tokens.css is generated from tokens.json', () => {
  const json = JSON.parse(readFileSync(TOKENS_JSON, 'utf8'))

  it('carries the generated-file warning', () => {
    expect(tokensCss).toContain('GENERATED FILE — DO NOT EDIT')
    expect(tokensCss).toContain('npm run tokens:build')
  })

  it('emits one declaration per token', () => {
    expect(declared.size).toBe(values(json).length)
  })

  it('emits no value that is absent from the source', () => {
    const source = new Set(values(json))
    const emitted = [...tokensCss.matchAll(/^\s+--ds-[\w-]+:\s*(.+);$/gm)].map(
      (match) => match[1],
    )
    for (const value of emitted) {
      expect(source, `${value} is not in tokens.json`).toContain(value)
    }
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
        /^var\(--ds-space-\d+\)$/,
      )
    }
  })
})
