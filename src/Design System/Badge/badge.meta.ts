/**
 * Badge metadata — the single source of truth for the component's public
 * surface.
 *
 * Consumed by:
 *  - scripts/build-docs.mjs, which writes the props table into the skill docs
 *  - src/playground/PropertiesTab.tsx, which builds its table and controls
 *  - src/Design System/Badge/badge.meta.test.ts, which checks the claims here
 *    against the implementation
 *
 * Editing a prop here updates the docs, the playground and the tests together,
 * so the terse agent-facing rules can never drift from the detailed docs.
 */

export interface PropMeta {
  name: string
  /** Type as an author writes it, e.g. `boolean` or `ReactNode`. */
  type: string
  /** Accepted literal values, for union types. */
  values?: readonly string[]
  /** Rendered as the default column; omit for required props. */
  default?: string
  required?: boolean
  description: string
}

export interface SizeMeta {
  name: string
  height: string
  label: string
  padding: string
}

/** A value that is deliberately not configurable. */
export interface FixedMeta {
  name: string
  value: string
  note: string
}

/** A prop an author might expect that intentionally does not exist. */
export interface AbsentMeta {
  name: string
  reason: string
}

export const BADGE_VARIANTS = [
  'black',
  'white',
  'coal',
  'dlvRed',
  'info',
  'success',
  'warning',
  'error',
  'cardbox',
] as const

export const BADGE_TYPES = ['solid', 'subtle', 'outlined', 'ghost'] as const

export const BADGE_SIZES = ['small', 'medium', 'large'] as const

const props: readonly PropMeta[] = [
  {
    name: 'label',
    type: 'string',
    required: true,
    description:
      'Text shown inside the badge. A string rather than a node, to keep labels short.',
  },
  {
    name: 'variant',
    type: 'BadgeVariant',
    values: BADGE_VARIANTS,
    default: 'black',
    description:
      'Colour intent. Semantic variants report state; the rest categorise.',
  },
  {
    name: 'type',
    type: 'BadgeType',
    values: BADGE_TYPES,
    default: 'solid',
    description:
      'Visual emphasis. `ghost` is a loading placeholder, not a style choice.',
  },
  {
    name: 'size',
    type: 'BadgeSize',
    values: BADGE_SIZES,
    default: 'medium',
    description: 'Height step. See the size table below.',
  },
  {
    name: 'statusDot',
    type: 'boolean',
    default: 'false',
    description:
      'Shows a green presence dot before the leading icon, as for an online indicator.',
  },
  {
    name: 'leadingIcon',
    type: 'ReactNode',
    description:
      'Icon before the label. Hidden from assistive technology, so it must reinforce the label rather than replace it.',
  },
  {
    name: 'trailingIcon',
    type: 'ReactNode',
    description: 'Icon after the label. Also hidden from assistive technology.',
  },
  {
    name: 'disabled',
    type: 'boolean',
    default: 'false',
    description: 'Dims the badge and sets `aria-disabled`.',
  },
]

const sizes: readonly SizeMeta[] = [
  { name: 'small', height: '20px', label: '10px', padding: '4px' },
  { name: 'medium', height: '24px', label: '12px', padding: '6px' },
  { name: 'large', height: '28px', label: '16px', padding: '6px' },
]

const fixed: readonly FixedMeta[] = [
  { name: 'Border radius', value: '4px', note: 'Every size.' },
  { name: 'Gap', value: '2px', note: 'Between dot, icons and label.' },
  {
    name: 'Label font',
    value: 'Noto Sans Medium (500)',
    note: 'Self-hosted via @fontsource.',
  },
  { name: 'Icon size', value: '1em', note: 'Always equal to the label size.' },
  { name: 'Status dot', value: '6px, green', note: 'Does not scale.' },
]

const absent: readonly AbsentMeta[] = [
  {
    name: 'onClick',
    reason:
      'Badges are never interactive. Use a button or link beside the badge.',
  },
  {
    name: 'fullWidth',
    reason: 'A badge sizes to its label; stretching it reads as a banner.',
  },
  {
    name: 'truncate',
    reason:
      'A label that needs truncating is too long. Shorten it to one or two words.',
  },
]

export const badgeMeta = {
  name: 'Badge',
  summary:
    'A compact, non-interactive marker for the status, category or count of the thing beside it.',
  importStatement: "import { Badge } from './Design System'",
  element: 'span',
  props,
  sizes,
  fixed,
  absent,
} as const
