import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Badge } from './Badge'

const Icon = () => <svg data-testid="icon" />

describe('Badge semantics', () => {
  it('renders a span, never an interactive element', () => {
    const { container, queryByRole } = render(<Badge label="Delivered" />)
    expect(container.firstElementChild?.tagName).toBe('SPAN')
    expect(queryByRole('button')).toBeNull()
    expect(queryByRole('link')).toBeNull()
  })

  it('is not focusable', () => {
    const { container } = render(<Badge label="Delivered" />)
    const badge = container.firstElementChild as HTMLElement
    expect(badge.getAttribute('tabindex')).toBeNull()
    badge.focus()
    expect(document.activeElement).not.toBe(badge)
  })

  it('exposes the label as text', () => {
    const { getByText } = render(<Badge label="In Transit" />)
    expect(getByText('In Transit')).toBeTruthy()
  })

  it('hides icons from assistive technology', () => {
    const { container } = render(
      <Badge label="Delivered" leadingIcon={<Icon />} trailingIcon={<Icon />} />,
    )
    const icons = container.querySelectorAll('.ds-badge__icon')
    expect(icons).toHaveLength(2)
    for (const icon of icons) {
      expect(icon.getAttribute('aria-hidden')).toBe('true')
    }
  })

  it('places the status dot before the leading icon', () => {
    const { container } = render(
      <Badge label="Online" statusDot leadingIcon={<Icon />} />,
    )
    const parts = [...container.firstElementChild!.children].map(
      (child) => child.className,
    )
    expect(parts).toEqual([
      'ds-badge__dot',
      'ds-badge__icon',
      'ds-badge__label',
    ])
  })

  it('omits the status dot by default', () => {
    const { container } = render(<Badge label="Offline" />)
    expect(container.querySelector('.ds-badge__dot')).toBeNull()
  })

  it('marks disabled badges with aria-disabled and no label loss', () => {
    const { container, getByText } = render(<Badge label="Draft" disabled />)
    const badge = container.firstElementChild as HTMLElement
    expect(badge.getAttribute('aria-disabled')).toBe('true')
    expect(badge.className).toContain('ds-badge--disabled')
    expect(getByText('Draft')).toBeTruthy()
  })

  it('hides the ghost placeholder and drops the label', () => {
    const { container, queryByText } = render(
      <Badge label="Loading" type="ghost" />,
    )
    const badge = container.firstElementChild as HTMLElement
    expect(badge.getAttribute('aria-hidden')).toBe('true')
    expect(queryByText('Loading')).toBeNull()
    expect(container.querySelector('.ds-badge__shimmer')).toBeTruthy()
  })

  it('applies variant, type and size as classes with medium/solid/black defaults', () => {
    const { container } = render(<Badge label="Default" />)
    expect(container.firstElementChild?.className).toBe(
      'ds-badge ds-badge--black ds-badge--solid ds-badge--medium',
    )
  })

  it('forwards arbitrary span attributes and merges className', () => {
    const { container } = render(
      <Badge label="Tagged" className="extra" data-test="x" title="Tagged" />,
    )
    const badge = container.firstElementChild as HTMLElement
    expect(badge.className).toContain('extra')
    expect(badge.getAttribute('data-test')).toBe('x')
    expect(badge.getAttribute('title')).toBe('Tagged')
  })
})
