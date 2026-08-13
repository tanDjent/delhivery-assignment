import { forwardRef } from 'react'
import type { BadgeProps } from './Badge.types'
import './Badge.css'

/**
 * Badge — a compact, non-interactive-by-default marker for status, category or
 * count. Pass `onClick` to make it actionable.
 */
export const Badge = forwardRef<HTMLElement, BadgeProps>(function Badge(
  {
    label,
    variant = 'black',
    type = 'solid',
    size = 'medium',
    leadingIcon,
    trailingIcon,
    disabled = false,
    fullWidth = false,
    truncate = false,
    onClick,
    className,
    ...rest
  },
  ref,
) {
  const isGhost = type === 'ghost'
  const isInteractive = Boolean(onClick) && !disabled && !isGhost

  const classes = [
    'ds-badge',
    `ds-badge--${variant}`,
    `ds-badge--${type}`,
    `ds-badge--${size}`,
    disabled && 'ds-badge--disabled',
    fullWidth && 'ds-badge--full-width',
    truncate && 'ds-badge--truncate',
    isInteractive && 'ds-badge--interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // The ghost state has no meaningful content yet, so it is hidden from the
  // accessibility tree and announced by the surrounding loading region instead.
  if (isGhost) {
    return (
      <span
        {...rest}
        ref={ref as React.Ref<HTMLSpanElement>}
        className={classes}
        aria-hidden="true"
      >
        <span className="ds-badge__shimmer" />
      </span>
    )
  }

  const content = (
    <>
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
    </>
  )

  if (onClick) {
    return (
      <button
        {...rest}
        ref={ref as React.Ref<HTMLButtonElement>}
        type="button"
        className={classes}
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </button>
    )
  }

  return (
    <span
      {...rest}
      ref={ref as React.Ref<HTMLSpanElement>}
      className={classes}
      aria-disabled={disabled || undefined}
    >
      {content}
    </span>
  )
})
