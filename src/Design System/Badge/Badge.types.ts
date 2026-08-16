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
 * `disabled` is a treatment rather than a boolean because Figma models it as
 * one: it replaces the type's colours outright instead of dimming them, so it
 * cannot be combined with `solid` or `subtle`.
 *
 * `ghost` is the placeholder used while the real value is still loading; it
 * renders a shimmering block instead of the label.
 */
export type BadgeType = 'solid' | 'subtle' | 'outlined' | 'disabled' | 'ghost'

/** Height step of the badge: 20, 24 and 28 pixels. */
export type BadgeSize = 'small' | 'medium' | 'large'

export interface BadgeProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children' | 'color'> {
  /** Text shown inside the badge. Kept as a string to enforce short labels. */
  label: string
  variant?: BadgeVariant
  type?: BadgeType
  size?: BadgeSize
  /** Icon rendered before the label. */
  leadingIcon?: ReactNode
  /** Icon rendered after the label. */
  trailingIcon?: ReactNode
  /** Shows a green presence dot before the leading icon. */
  statusDot?: boolean
}
