import { useState, type ReactNode } from 'react'
import { Badge } from '../Design System'
import type { BadgeSize, BadgeType, BadgeVariant } from '../Design System'
import {
  BADGE_SIZES,
  BADGE_TYPES,
  BADGE_VARIANTS,
  badgeMeta,
} from '../Design System/Badge/badge.meta'
import badgeSpec from '../Design System/Badge/badge.spec.json'
import { CodeBlock } from './CodeBlock'
import { InfoCircleIcon, PlusCircleIcon } from './icons'

interface PlaygroundState {
  label: string
  variant: BadgeVariant
  type: BadgeType
  size: BadgeSize
  statusDot: boolean
  leadingIcon: boolean
  trailingIcon: boolean
}

const INITIAL: PlaygroundState = {
  label: 'Badge',
  variant: 'black',
  type: 'solid',
  size: 'medium',
  statusDot: false,
  leadingIcon: false,
  trailingIcon: false,
}

function buildCode(state: PlaygroundState) {
  const lines = [
    `  label="${state.label}"`,
    `  variant="${state.variant}"`,
    `  type="${state.type}"`,
    `  size="${state.size}"`,
  ]
  if (state.statusDot) lines.push('  statusDot')
  if (state.leadingIcon) lines.push('  leadingIcon={<InfoCircleIcon />}')
  if (state.trailingIcon) lines.push('  trailingIcon={<PlusCircleIcon />}')
  return `<Badge\n${lines.join('\n')}\n/>`
}

/**
 * The slice of badge.spec.json that describes the current selection.
 *
 * The whole spec is 400 lines and mostly the other 44 variant-and-type
 * pairings, so showing all of it would bury the part being demonstrated. This
 * narrows to the chosen combination, which is what another platform would read
 * to implement exactly the badge above.
 */
function buildSpec(state: PlaygroundState) {
  const ghost = state.type === 'ghost'
  const parts = badgeSpec.anatomy.parts
    .filter((part) => !(ghost && part.name === 'label'))
    .filter((part) => 'always' in part || state[part.when as keyof PlaygroundState])
    .map((part) => part.name)

  return JSON.stringify(
    {
      interactive: badgeSpec.interactive,
      anatomy: { container: badgeSpec.anatomy.container, parts },
      layout: {
        gap: badgeSpec.layout.gap,
        cornerRadius: badgeSpec.layout.cornerRadius,
        borderWidth: badgeSpec.layout.borderWidth,
        ...badgeSpec.layout.bySize[state.size],
      },
      appearance: badgeSpec.appearance.byVariant[state.variant][state.type],
      ...(ghost ? { behaviour: badgeSpec.behaviour.ghost } : {}),
      accessibility: {
        labelSource: badgeSpec.accessibility.labelSource,
        decorativeParts: badgeSpec.accessibility.decorativeParts.filter((part) =>
          parts.includes(part),
        ),
        ...(state.type === 'disabled' ? { disabled: true } : {}),
        ...(ghost ? badgeSpec.accessibility.ghost : {}),
      },
    },
    null,
    2,
  )
}

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <label className="control">
      <span className="control__hidden-label">{label}</span>
      <select
        className="control__select"
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="control control--switch">
      <span className="control__hidden-label">{label}</span>
      <input
        type="checkbox"
        className="switch__input"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="switch__track" aria-hidden="true">
        <span className="switch__thumb" />
      </span>
      <span className="switch__value">{checked ? 'true' : 'false'}</span>
    </label>
  )
}

export function PropertiesTab() {
  const [state, setState] = useState<PlaygroundState>(INITIAL)

  function set<K extends keyof PlaygroundState>(
    key: K,
    value: PlaygroundState[K],
  ) {
    setState((current) => ({ ...current, [key]: value }))
  }

  /**
   * Row order, names and accepted values come from badge.meta.ts — the same file
   * the published docs are generated from — so this table cannot describe a prop
   * the docs don't, or vice versa. Only the control widget is chosen here.
   */
  const controls: Record<string, ReactNode> = {
    label: (
      <label className="control">
        <span className="control__hidden-label">label</span>
        <input
          className="control__input"
          value={state.label}
          onChange={(event) => set('label', event.target.value)}
        />
      </label>
    ),
    variant: (
      <Select
        label="variant"
        value={state.variant}
        options={BADGE_VARIANTS}
        onChange={(value) => set('variant', value)}
      />
    ),
    type: (
      <Select
        label="type"
        value={state.type}
        options={BADGE_TYPES}
        onChange={(value) => set('type', value)}
      />
    ),
    size: (
      <Select
        label="size"
        value={state.size}
        options={BADGE_SIZES}
        onChange={(value) => set('size', value)}
      />
    ),
    statusDot: (
      <Switch
        label="statusDot"
        checked={state.statusDot}
        onChange={(value) => set('statusDot', value)}
      />
    ),
    leadingIcon: (
      <Switch
        label="leadingIcon"
        checked={state.leadingIcon}
        onChange={(value) => set('leadingIcon', value)}
      />
    ),
    trailingIcon: (
      <Switch
        label="trailingIcon"
        checked={state.trailingIcon}
        onChange={(value) => set('trailingIcon', value)}
      />
    ),
  }

  return (
    <>
      <div className="display">
        <div className="display__row">
          <Badge
            label={state.label}
            variant={state.variant}
            type={state.type}
            size={state.size}
            statusDot={state.statusDot}
            leadingIcon={state.leadingIcon ? <InfoCircleIcon /> : undefined}
            trailingIcon={state.trailingIcon ? <PlusCircleIcon /> : undefined}
          />
        </div>
      </div>

      <section className="section">
        <h2 className="section__title">Props</h2>
        <p className="section__subtitle">
          Change a value to update the badge above and the snippet below.
        </p>
        <table className="props">
          <thead>
            <tr>
              <th scope="col">Prop</th>
              <th scope="col">Values</th>
              <th scope="col">Default</th>
              <th scope="col">Control</th>
            </tr>
          </thead>
          <tbody>
            {badgeMeta.props.map((prop) => (
              <tr key={prop.name}>
                <td className="props__name">{prop.name}</td>
                <td className="props__values">
                  {prop.values ? prop.values.join(' | ') : prop.type}
                </td>
                <td className="props__values props__default">
                  {prop.required ? 'required' : (prop.default ?? '—')}
                </td>
                <td className="props__control">{controls[prop.name]}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="props__code">
          <CodeBlock code={buildCode(state)} />
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Spec</h2>
        <p className="section__subtitle">
          The same badge as a platform-neutral contract, narrowed to this
          selection. Generated from the Figma component set, so the colours
          below are the tokens design bound rather than ones chosen in code.
        </p>

        <div className="props__code">
          <CodeBlock code={buildSpec(state)} />
        </div>
      </section>
    </>
  )
}
