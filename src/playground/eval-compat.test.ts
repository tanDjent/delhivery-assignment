import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The Showcase tab renders the committed eval output live, which only works
 * while every token name that output reaches for still answers to something.
 * Its stylesheet predates the Figma-generated tokens, so eval-compat.css
 * supplies the names that have since gone, and these tests are what stop the
 * page from quietly degrading — an unresolved var() drops the declaration
 * rather than raising anything.
 */
const root = join(import.meta.dirname, '../..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

const shim = read('src/playground/eval-compat.css')
const artifact = read('eval/run-1/ShipmentList.css')
const tab = read('src/playground/ShowcaseTab.tsx')
const current =
  read('src/Design System/tokens.css') +
  read('src/Design System/tokens.primitives.css')

const declarations = (css: string) =>
  new Set([...css.matchAll(/^\s*(--ds-[\w-]+):/gm)].map((m) => m[1]))

describe('the committed eval output still renders', () => {
  const used = [...new Set([...artifact.matchAll(/var\((--ds-[\w-]+)/g)].map((m) => m[1]))]
  const answered = new Set([...declarations(shim), ...declarations(current)])

  it('finds the token names the run reaches for', () => {
    expect(used.length).toBeGreaterThan(0)
  })

  it('answers every one of them, so no declaration is dropped', () => {
    expect(used.filter((name) => !answered.has(name))).toEqual([])
  })

  it('wraps the artifact in the scope that carries the answers', () => {
    expect(tab).toContain('eval-output')
  })

  it('scopes the departed names, keeping them out of the design system', () => {
    expect(shim).toMatch(/^\.eval-output \{$/m)
    const gone = [...declarations(shim)].filter((name) => !declarations(current).has(name))
    expect(gone.length, 'nothing left to shim; delete the file').toBeGreaterThan(0)
  })
})
