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
  spacing: Record<string, { $value: string }>
  radius: Record<string, { $value: string }>
  typography: Record<
    string,
    Record<string, { $value: { fontSize: string; fontWeight: number } }>
  >
}

/** `C2/caption2_default` -> the custom property Badge applies. */
const typographyToken = (style: string) =>
  `--ds-typography-${style.toLowerCase().replace('/', '-')}`

/** The literal a mapped dimension resolves to, following one alias hop. */
const dimension = (group: 'spacing' | 'radius', key: string) => {
  const raw = tokens[group][key].$value
  const path = raw.slice(1, -1).split('.')
  const target = path.reduce<Record<string, never>>(
    (node, segment) => (node as Record<string, never>)[segment],
    tokens as never,
  ) as unknown as { $value: string }
  return target.$value
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
    it(`has no ${name} prop`, () => {
      // Matching a declaration rather than the bare word, because a name can
      // legitimately survive as something else: `disabled` is now a type value.
      expect(types).not.toMatch(new RegExp(`^\\s{2}${name}\\??:`, 'm'))
      expect(component).not.toMatch(new RegExp(`^\\s{4}${name}[,=]`, 'm'))
    })
  }
})

describe('size table matches the stylesheet', () => {
  for (const size of badgeMeta.sizes) {
    it(`${size.name} is ${size.height} tall, padded ${size.padding}, labelled ${size.label}`, () => {
      const rule = ruleFor(`.ds-badge--${size.name}`)
      expect(rule).toContain(`height: ${size.height}`)

      const spacingKey = parseInt(size.padding, 10)
      expect(dimension('spacing', String(spacingKey))).toBe(size.padding)
      expect(rule).toContain(`padding: var(--ds-spacing-${spacingKey})`)

      expect(rule).toContain(`font: var(${typographyToken(size.label)})`)
      expect(rule).toContain(`--badge-icon-size: ${size.icon}`)
      expect(rule).toContain(`--badge-dot-size: ${size.dot}`)
    })
  }

  it('applies the label size the Figma text style actually specifies', () => {
    for (const size of badgeMeta.sizes) {
      const [group, name] = size.label.toLowerCase().split('/')
      expect(tokens.typography[group][name].$value.fontSize).toBe(
        size.name === 'large' ? '12px' : '10px',
      )
    }
  })
})

describe('fixed values match the stylesheet', () => {
  const fixed = (name: string) =>
    badgeMeta.fixed.find((entry) => entry.name === name)!.value

  it('uses the 4px radius token at every size', () => {
    expect(fixed('Border radius')).toBe(dimension('radius', 'default'))
    expect(ruleFor('.ds-badge')).toContain(
      'border-radius: var(--ds-radius-default)',
    )
    // A size must not override the radius.
    for (const size of badgeMeta.sizes) {
      expect(ruleFor(`.ds-badge--${size.name}`)).not.toContain('border-radius')
    }
  })

  it('uses the 2px gap token', () => {
    const gap = fixed('Gap')
    expect(dimension('spacing', String(parseInt(gap, 10)))).toBe(gap)
    expect(ruleFor('.ds-badge')).toContain(
      `gap: var(--ds-spacing-${parseInt(gap, 10)})`,
    )
  })

  it('scales the icon and the dot with the size, not with the label', () => {
    const icon = ruleFor('.ds-badge__icon')
    expect(icon).toContain('width: var(--badge-icon-size)')
    expect(icon).toContain('height: var(--badge-icon-size)')
    const dot = ruleFor('.ds-badge__dot')
    expect(dot).toContain('width: var(--badge-dot-size)')
    expect(dot).toContain('height: var(--badge-dot-size)')
  })

  it('draws the status dot in green whatever the variant', () => {
    expect(fixed('Status dot colour')).toBe('green')
    expect(ruleFor('.ds-badge__dot')).toContain(
      'background-color: var(--ds-surface-bg_success-default)',
    )
    for (const variant of BADGE_VARIANTS) {
      expect(ruleFor(`.ds-badge--${variant}`)).not.toContain('--badge-dot')
    }
  })

  it('takes the label weight from the text style, not a local rule', () => {
    expect(fixed('Label font')).toContain('500')
    expect(tokens.typography.c2.caption2_default.$value.fontWeight).toBe(500)
    expect(css).not.toContain('font-weight:')
  })
})

describe('every variant is fully wired', () => {
  /** The local properties each type modifier consumes. */
  const SLOTS = [
    'solid-bg',
    'solid-fg',
    'subtle-bg',
    'subtle-fg',
    'subtle-line',
    'outlined-fg',
    'outlined-line',
    'disabled-fg',
    'disabled-line',
  ]

  for (const variant of BADGE_VARIANTS) {
    it(`${variant} fills every slot from the mapped tier`, () => {
      const rule = ruleFor(`.ds-badge--${variant}`)
      for (const slot of SLOTS) {
        const declaration = new RegExp(`--badge-${slot}:\\s*var\\((--ds-[\\w-]+)\\)`)
        const match = rule.match(declaration)
        expect(match, `${variant} is missing --badge-${slot}`).toBeTruthy()
        // Reaching past the mapped tier would lose dark mode.
        expect(match![1]).toMatch(/^--ds-(surface|text|border|icon)-/)
      }
    })
  }
})
