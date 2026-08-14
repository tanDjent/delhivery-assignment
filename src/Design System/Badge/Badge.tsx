import { forwardRef } from 'react'
import type { BadgeProps } from './Badge.types'
import './Badge.css'

/**
 * Badge — a compact marker for status, category or count.
 *
 * Badges are always non-interactive: they label the thing next to them and
 * never carry an action of their own.
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
    disabled = false,
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
    disabled && 'ds-badge--disabled',
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
      aria-disabled={disabled || undefined}
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
