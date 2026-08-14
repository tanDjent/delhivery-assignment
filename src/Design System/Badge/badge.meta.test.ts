import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BADGE_VARIANTS, badgeMeta } from './badge.meta'

/**
 * badge.meta.ts is what the published docs are generated from, so these tests
 * assert the metadata still describes the real implementation. jsdom has no
 * layout engine and does not resolve var(), so the geometry contract is checked
 * against the stylesheet source rather than a rendered element.
 */
const here = join(import.meta.dirname)
const css = readFileSync(join(here, 'Badge.css'), 'utf8')
const types = readFileSync(join(here, 'Badge.types.ts'), 'utf8')
const component = readFileSync(join(here, 'Badge.tsx'), 'utf8')
const tokens = JSON.parse(
  readFileSync(join(here, '..', 'tokens.json'), 'utf8'),
) as {
  space: Record<string, { $value: string }>
  radius: Record<string, { $value: string }>
  variant: Record<string, { background: { $value: string } }>
  statusDot: { color: { $value: string } }
}

/** The declaration block for a single class selector. */
function ruleFor(selector: string) {
  const match = css.match(
    new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`.replace('$', '\\$')),
  )
  expect(match, `missing rule for ${selector}`).toBeTruthy()
  return match![1]
}

describe('documented props match the type definition', () => {
  it('lists every prop declared in BadgeProps', () => {
    const declared = [...types.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1])
    expect(new Set(badgeMeta.props.map((p) => p.name))).toEqual(
      new Set(declared),
    )
  })

  it('marks only label as required', () => {
    const required = badgeMeta.props.filter((p) => p.required).map((p) => p.name)
    expect(required).toEqual(['label'])
    expect(types).toMatch(/\n {2}label: string/)
  })

  it('documents defaults that match the component', () => {
    for (const prop of badgeMeta.props) {
      if (!prop.default || prop.default === 'false') continue
      expect(component).toContain(`${prop.name} = '${prop.default}'`)
    }
  })

  it('documents every union value present in the types', () => {
    for (const prop of badgeMeta.props) {
      if (!prop.values) continue
      for (const value of prop.values) {
        expect(types, `${prop.name} is missing ${value}`).toContain(`'${value}'`)
      }
    }
  })
})

describe('props documented as absent really are', () => {
  for (const { name } of badgeMeta.absent) {
    it(`has no ${name}`, () => {
      expect(types).not.toContain(name)
      expect(component).not.toContain(name)
    })
  }
})

describe('size table matches the stylesheet', () => {
  for (const size of badgeMeta.sizes) {
    it(`${size.name} is ${size.height} tall with ${size.padding} padding and a ${size.label} label`, () => {
      const rule = ruleFor(`.ds-badge--${size.name}`)
      expect(rule).toContain(`height: ${size.height}`)

      const spaceKey = parseInt(size.padding, 10)
      expect(tokens.space[spaceKey].$value).toBe(size.padding)
      expect(rule).toContain(`padding: var(--ds-space-${spaceKey})`)

      expect(rule).toContain(`font-size: var(--badge-font-size-${size.name})`)
      expect(css).toContain(`--badge-font-size-${size.name}: ${size.label}`)
    })
  }
})

describe('fixed values match the stylesheet', () => {
  const fixed = (name: string) =>
    badgeMeta.fixed.find((entry) => entry.name === name)!.value

  it('uses the 4px radius token at every size', () => {
    expect(fixed('Border radius')).toBe(tokens.radius.md.$value)
    expect(ruleFor('.ds-badge')).toContain('border-radius: var(--ds-radius-md)')
    // A size must not override the radius.
    for (const size of badgeMeta.sizes) {
      expect(ruleFor(`.ds-badge--${size.name}`)).not.toContain('border-radius')
    }
  })

  it('uses the 2px gap token', () => {
    const gap = fixed('Gap')
    expect(tokens.space[parseInt(gap, 10)].$value).toBe(gap)
    expect(ruleFor('.ds-badge')).toContain(
      `gap: var(--ds-space-${parseInt(gap, 10)})`,
    )
  })

  it('sizes icons to the label', () => {
    expect(fixed('Icon size')).toBe('1em')
    const rule = ruleFor('.ds-badge__icon')
    expect(rule).toContain('width: 1em')
    expect(rule).toContain('height: 1em')
  })

  it('draws a 6px green status dot', () => {
    const rule = ruleFor('.ds-badge__dot')
    expect(rule).toContain('width: 6px')
    expect(rule).toContain('height: 6px')
    expect(rule).toContain('background-color: var(--ds-status-dot-color)')
    expect(tokens.statusDot.color.$value).toBe(
      tokens.variant.success.background.$value,
    )
  })

  it('sets the label weight to Noto Sans Medium', () => {
    expect(fixed('Label font')).toContain('500')
    expect(ruleFor('.ds-badge')).toContain(
      'font-weight: var(--ds-font-weight-medium)',
    )
  })
})

describe('every variant is fully wired', () => {
  for (const variant of BADGE_VARIANTS) {
    it(`${variant} has tokens and a rule`, () => {
      expect(tokens.variant[variant]).toBeTruthy()
      const rule = ruleFor(`.ds-badge--${variant}`)
      expect(rule).toContain('--badge-solid-bg')
      expect(rule).toContain('--badge-solid-fg')
    })
  }
})
