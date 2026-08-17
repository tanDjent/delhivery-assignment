import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Conformance: the React implementation against badge.spec.json.
 *
 * The spec is generated from the Figma component set, not from this code, so
 * these assertions compare the implementation to the design rather than to
 * itself. Any other implementation — Vue, SwiftUI, Compose — would be checked
 * against the same spec with the equivalent of this file.
 */
const here = join(import.meta.dirname)
const css = readFileSync(join(here, 'Badge.css'), 'utf8')
const types = readFileSync(join(here, 'Badge.types.ts'), 'utf8')
const component = readFileSync(join(here, 'Badge.tsx'), 'utf8')
const spec = JSON.parse(readFileSync(join(here, 'badge.spec.json'), 'utf8'))

/** `{surface.bg_success.default}` -> `--ds-surface-bg_success-default`. */
const cssVar = (reference: string) =>
  `--ds-${reference.slice(1, -1).split('.').join('-')}`

function ruleFor(selector: string) {
  const match = css.match(new RegExp(`\\${selector}\\s*\\{([^}]*)\\}`))
  expect(match, `missing rule for ${selector}`).toBeTruthy()
  return match![1]
}

const VARIANTS: string[] = spec.api.variant.values
const TYPES: string[] = spec.api.type.values
const SIZES: string[] = spec.api.size.values

/** The local property each appearance slot is delivered through. */
const SLOT_PROPERTY: Record<string, Record<string, string | null>> = {
  solid: { background: 'solid-bg', foreground: 'solid-fg', border: null },
  subtle: {
    background: 'subtle-bg',
    foreground: 'subtle-fg',
    border: 'subtle-line',
  },
  outlined: {
    background: null,
    foreground: 'outlined-fg',
    border: 'outlined-line',
  },
  disabled: {
    background: null,
    foreground: 'disabled-fg',
    border: 'disabled-line',
  },
  ghost: { background: null, foreground: null, border: null },
}

describe('the public API matches the spec', () => {
  it('declares exactly the specified props', () => {
    const declared = [...types.matchAll(/^\s{2}(\w+)\??:/gm)].map((m) => m[1])
    expect(new Set(declared)).toEqual(new Set(Object.keys(spec.api)))
  })

  it('offers exactly the specified values for each enum', () => {
    for (const [name, prop] of Object.entries<{ kind: string; values?: string[] }>(
      spec.api,
    )) {
      if (prop.kind !== 'enum') continue
      for (const value of prop.values!) {
        expect(types, `${name} is missing ${value}`).toContain(`'${value}'`)
      }
    }
  })

  it('uses the specified defaults', () => {
    for (const [name, prop] of Object.entries<{ default?: unknown }>(spec.api)) {
      if (typeof prop.default !== 'string') continue
      expect(component).toContain(`${name} = '${prop.default}'`)
    }
  })

  it('omits everything the spec forbids', () => {
    for (const { absent } of spec.constraints) {
      expect(types).not.toMatch(new RegExp(`^\\s{2}${absent}\\??:`, 'm'))
    }
  })
})

describe('layout matches the spec', () => {
  const base = () => ruleFor('.ds-badge')

  it('applies the shared gap, radius and border width', () => {
    expect(base()).toContain(`gap: var(${cssVar(spec.layout.gap)})`)
    expect(base()).toContain(
      `border-radius: var(${cssVar(spec.layout.cornerRadius)})`,
    )
    expect(base()).toContain(`var(${cssVar(spec.layout.borderWidth)}) solid`)
  })

  for (const size of SIZES) {
    const step = spec.layout.bySize[size]
    it(`${size} matches its specified geometry`, () => {
      const rule = ruleFor(`.ds-badge--${size}`)
      expect(rule).toContain(`height: ${step.height}px`)
      expect(rule).toContain(`padding: var(${cssVar(step.paddingInline)})`)
      expect(rule).toContain(`font: var(${cssVar(step.textStyle)})`)
      expect(rule).toContain(`--badge-icon-size: ${step.iconSize}px`)
      expect(rule).toContain(`--badge-dot-size: ${step.dotSize}px`)
    })
  }
})

describe('appearance matches the spec', () => {
  for (const variant of VARIANTS) {
    it(`${variant} uses the token design bound for every type`, () => {
      const rule = ruleFor(`.ds-badge--${variant}`)
      for (const type of TYPES) {
        const slots = spec.appearance.byVariant[variant][type]
        for (const [slot, reference] of Object.entries<string>(slots)) {
          const property = SLOT_PROPERTY[type][slot]
          if (!property || !reference.startsWith('{')) continue
          expect(
            rule,
            `${variant}.${type}.${slot} should be ${reference}`,
          ).toContain(`--badge-${property}: var(${cssVar(reference)})`)
        }
      }
    })
  }

  it('gives solid a border matching its background', () => {
    expect(spec.appearance.byVariant.info.solid.border).toBe('match-background')
    expect(ruleFor('.ds-badge--solid')).toContain(
      'border-color: var(--badge-solid-bg)',
    )
  })

  it('leaves outlined and disabled without a background', () => {
    for (const type of ['outlined', 'disabled']) {
      expect(spec.appearance.byVariant.info[type].background).toBe('transparent')
      expect(ruleFor(`.ds-badge--${type}`)).toContain(
        'background-color: transparent',
      )
    }
  })

  it('builds the ghost shimmer from the specified surface', () => {
    // Ghost has no label, so its background is the shimmer's base colour.
    const background = spec.appearance.byVariant.info.ghost.background
    expect(ruleFor('.ds-badge__shimmer')).toContain(`var(${cssVar(background)})`)
  })
})

describe('behaviour and accessibility match the spec', () => {
  it('is not interactive', () => {
    expect(spec.interactive).toBe(false)
    expect(component).not.toMatch(/onClick|tabIndex|<button|role="button"/)
  })

  it('hides every decorative part from assistive technology', () => {
    for (const part of spec.accessibility.decorativeParts) {
      const element = part === 'statusDot' ? 'dot' : 'icon'
      expect(component).toMatch(
        new RegExp(`ds-badge__${element}"[\\s\\S]{0,40}aria-hidden`),
      )
    }
  })

  it('exposes the disabled type to assistive technology', () => {
    expect(component).toContain("aria-disabled={type === 'disabled'")
  })

  it('renders no label for ghost and hides it', () => {
    expect(spec.behaviour.ghost.rendersLabel).toBe(false)
    const ghostBranch = component.slice(component.indexOf("type === 'ghost'"))
    expect(ghostBranch).toContain('aria-hidden="true"')
    expect(ghostBranch).toContain('ds-badge__shimmer')
  })

  it('respects reduced motion', () => {
    expect(spec.behaviour.ghost.animation.respectsReducedMotion).toBe(true)
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})
