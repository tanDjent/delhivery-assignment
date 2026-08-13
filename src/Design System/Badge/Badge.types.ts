import type { HTMLAttributes, ReactNode } from 'react'

/** Colour intent of the badge. */
export type BadgeVariant =
  | 'black'
  | 'white'
  | 'coal'
  | 'dlvRed'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'cardbox'

/**
 * Visual treatment applied on top of the variant colour.
 *
 * `ghost` is the placeholder used while the real value is still loading; it
 * renders a shimmering block instead of the label.
 */
export type BadgeType = 'solid' | 'subtle' | 'outlined' | 'ghost'

/** Height / type scale step of the badge. */
export type BadgeSize = 'medium' | 'small' | 'xsmall'

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'color'> {
  /** Text shown inside the badge. Kept as a string to enforce short labels. */
  label: string
  variant?: BadgeVariant
  type?: BadgeType
  size?: BadgeSize
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode
  /** Icon rendered after the label, e.g. a chevron or dismiss glyph. */
  trailingIcon?: ReactNode
  /** Dims the badge and blocks interaction. */
  disabled?: boolean
  /** Stretches the badge to the width of its container. */
  fullWidth?: boolean
  /** Clamps the label to a single line with an ellipsis. */
  truncate?: boolean
  /**
   * Makes the badge actionable. Supplying this renders a `<button>` instead of
   * a `<span>` so keyboard and screen reader users get real button semantics.
   */
  onClick?: () => void
}
