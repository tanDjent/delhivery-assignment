import { forwardRef } from 'react'
import type { BadgeProps } from './Badge.types'
import './Badge.css'

/**
 * Badges are compact, non-interactive labels that surface a single piece of
 * metadata — status, category, count, or classification — attached to another
 * element like a row, card or header. They never carry their own action;
 * tapping the row or card is the interaction, not the badge.
 *
 * Nine colour variants, five visual types, three sizes and optional icons, so
 * meaning and emphasis can be tuned independently.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    label,
    variant = 'black',
    type = 'solid',
    size = 'medium',
    leadingIcon,
    trailingIcon,
    statusDot = false,
    className,
    ...rest
  },
  ref,
) {
  const classes = [
    'ds-badge',
    `ds-badge--${variant}`,
    `ds-badge--${type}`,
    `ds-badge--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // The ghost state has no meaningful content yet, so it is hidden from the
  // accessibility tree and announced by the surrounding loading region instead.
  if (type === 'ghost') {
    return (
      <span {...rest} ref={ref} className={classes} aria-hidden="true">
        <span className="ds-badge__shimmer" />
      </span>
    )
  }

  return (
    <span
      {...rest}
      ref={ref}
      className={classes}
      aria-disabled={type === 'disabled' || undefined}
    >
      {statusDot ? <span className="ds-badge__dot" aria-hidden="true" /> : null}
      {leadingIcon ? (
        <span className="ds-badge__icon" aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className="ds-badge__label">{label}</span>
      {trailingIcon ? (
        <span className="ds-badge__icon" aria-hidden="true">
          {trailingIcon}
        </span>
      ) : null}
    </span>
  )
})
