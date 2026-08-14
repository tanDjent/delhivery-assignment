import { useState, type ReactNode } from 'react'
import { Badge } from '../Design System'
import type { BadgeSize, BadgeType, BadgeVariant } from '../Design System'
import { CodeBlock } from './CodeBlock'
import { InfoCircleIcon, PlusCircleIcon } from './icons'

const VARIANTS: BadgeVariant[] = [
  'black',
  'white',
  'coal',
  'dlvRed',
  'info',
  'success',
  'warning',
  'error',
  'cardbox',
]
const TYPES: BadgeType[] = ['solid', 'subtle', 'outlined', 'ghost']
const SIZES: BadgeSize[] = ['small', 'medium', 'large']

interface PlaygroundState {
  label: string
  variant: BadgeVariant
  type: BadgeType
  size: BadgeSize
  statusDot: boolean
  leadingIcon: boolean
  trailingIcon: boolean
  disabled: boolean
}

const INITIAL: PlaygroundState = {
  label: 'Badge',
  variant: 'info',
  type: 'solid',
  size: 'medium',
  statusDot: false,
  leadingIcon: false,
  trailingIcon: false,
  disabled: false,
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
  if (state.disabled) lines.push('  disabled')
  return `<Badge\n${lines.join('\n')}\n/>`
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

  const rows: { name: string; values: string; control: ReactNode }[] = [
    {
      name: 'label',
      values: 'string',
      control: (
        <label className="control">
          <span className="control__hidden-label">label</span>
          <input
            className="control__input"
            value={state.label}
            onChange={(event) => set('label', event.target.value)}
          />
        </label>
      ),
    },
    {
      name: 'variant',
      values: VARIANTS.join(' | '),
      control: (
        <Select
          label="variant"
          value={state.variant}
          options={VARIANTS}
          onChange={(value) => set('variant', value)}
        />
      ),
    },
    {
      name: 'type',
      values: TYPES.join(' | '),
      control: (
        <Select
          label="type"
          value={state.type}
          options={TYPES}
          onChange={(value) => set('type', value)}
        />
      ),
    },
    {
      name: 'size',
      values: SIZES.join(' | '),
      control: (
        <Select
          label="size"
          value={state.size}
          options={SIZES}
          onChange={(value) => set('size', value)}
        />
      ),
    },
    {
      name: 'statusDot',
      values: 'boolean',
      control: (
        <Switch
          label="statusDot"
          checked={state.statusDot}
          onChange={(value) => set('statusDot', value)}
        />
      ),
    },
    {
      name: 'leadingIcon',
      values: 'ReactNode',
      control: (
        <Switch
          label="leadingIcon"
          checked={state.leadingIcon}
          onChange={(value) => set('leadingIcon', value)}
        />
      ),
    },
    {
      name: 'trailingIcon',
      values: 'ReactNode',
      control: (
        <Switch
          label="trailingIcon"
          checked={state.trailingIcon}
          onChange={(value) => set('trailingIcon', value)}
        />
      ),
    },
    {
      name: 'disabled',
      values: 'boolean',
      control: (
        <Switch
          label="disabled"
          checked={state.disabled}
          onChange={(value) => set('disabled', value)}
        />
      ),
    },
  ]

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
            disabled={state.disabled}
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
              <th scope="col">Control</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="props__name">{row.name}</td>
                <td className="props__values">{row.values}</td>
                <td className="props__control">{row.control}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="props__code">
          <CodeBlock code={buildCode(state)} />
        </div>
      </section>
    </>
  )
}
