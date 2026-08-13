import { useState } from 'react'
import { Badge } from './Design System'
import type { BadgeSize, BadgeType, BadgeVariant } from './Design System'
import { CloseIcon, InfoCircleIcon, PlusCircleIcon } from './playground/icons'
import './App.css'

const VARIANTS: { key: BadgeVariant; label: string }[] = [
  { key: 'black', label: 'Black' },
  { key: 'white', label: 'White' },
  { key: 'coal', label: 'Coal' },
  { key: 'dlvRed', label: 'DLV Red' },
  { key: 'info', label: 'Info' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
  { key: 'cardbox', label: 'Cardbox' },
]

const SIZES: { key: BadgeSize; label: string }[] = [
  { key: 'medium', label: 'Medium' },
  { key: 'small', label: 'Small' },
  { key: 'xsmall', label: 'XSmall' },
]

/** Disabled is a state rather than a type, so the matrix renders it as a column. */
const COLUMNS: { label: string; type: BadgeType; disabled?: boolean }[] = [
  { label: 'Solid', type: 'solid' },
  { label: 'Subtle', type: 'subtle' },
  { label: 'Outlined', type: 'outlined' },
  { label: 'Disabled', type: 'solid', disabled: true },
  { label: 'Ghost', type: 'ghost' },
]

function App() {
  const [dismissed, setDismissed] = useState(false)
  const [clicks, setClicks] = useState(0)

  return (
    <main className="page">
      <header className="page__header">
        <p className="page__eyebrow">Design System</p>
        <h1 className="page__title">Badge</h1>
        <p className="page__lead">
          A compact marker for status, category or count. Nine variants, four
          types and three sizes, with optional leading and trailing icons.
        </p>
      </header>

      <section className="section">
        <h2 className="section__title">Anatomy</h2>
        <div className="anatomy">
          <Badge
            variant="success"
            type="solid"
            size="medium"
            leadingIcon={<PlusCircleIcon />}
            trailingIcon={<PlusCircleIcon />}
            label="Badge"
          />
        </div>
        <ol className="anatomy__legend">
          <li>Leading icon — optional, communicates meaning at a glance</li>
          <li>Label — required, short and title-cased</li>
          <li>Trailing icon — optional, for dismiss or drill-down affordances</li>
        </ol>
      </section>

      <section className="section">
        <h2 className="section__title">Playground</h2>
        <div className="matrix-scroll">
          <table className="matrix">
            <thead>
              <tr>
                <th className="matrix__corner" scope="col" colSpan={2}>
                  <span className="matrix__meta">Component</span>
                  Badge
                </th>
                {COLUMNS.map((column) => (
                  <th key={column.label} scope="col">
                    <span className="matrix__meta">Type</span>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {VARIANTS.map((variant) =>
                SIZES.map((size, sizeIndex) => (
                  <tr
                    key={`${variant.key}-${size.key}`}
                    className={sizeIndex === 0 ? 'matrix__row--group' : undefined}
                  >
                    {sizeIndex === 0 && (
                      <th className="matrix__variant" scope="rowgroup" rowSpan={3}>
                        <span className="matrix__meta">Variant</span>
                        {variant.label}
                      </th>
                    )}
                    <th className="matrix__size" scope="row">
                      <span className="matrix__meta">Size</span>
                      {size.label}
                    </th>
                    {COLUMNS.map((column) => (
                      <td key={column.label}>
                        <Badge
                          variant={variant.key}
                          type={column.type}
                          size={size.key}
                          disabled={column.disabled}
                          leadingIcon={<InfoCircleIcon />}
                          trailingIcon={<PlusCircleIcon />}
                          label="Badge"
                        />
                      </td>
                    ))}
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Icon slots</h2>
        <div className="row">
          <Badge variant="info" type="subtle" label="Label only" />
          <Badge
            variant="info"
            type="subtle"
            leadingIcon={<InfoCircleIcon />}
            label="Leading icon"
          />
          <Badge
            variant="info"
            type="subtle"
            trailingIcon={<PlusCircleIcon />}
            label="Trailing icon"
          />
          <Badge
            variant="info"
            type="subtle"
            leadingIcon={<InfoCircleIcon />}
            trailingIcon={<PlusCircleIcon />}
            label="Both icons"
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Interactive</h2>
        <p className="section__note">
          Passing <code>onClick</code> renders a real <code>button</code>, so the
          badge is focusable and keyboard operable.
        </p>
        <div className="row">
          <Badge
            variant="dlvRed"
            type="solid"
            label={`Clicked ${clicks} times`}
            onClick={() => setClicks((value) => value + 1)}
          />
          {!dismissed && (
            <Badge
              variant="coal"
              type="subtle"
              label="Dismiss me"
              trailingIcon={<CloseIcon />}
              onClick={() => setDismissed(true)}
            />
          )}
          <Badge
            variant="success"
            type="solid"
            label="Disabled action"
            disabled
            onClick={() => setClicks(0)}
          />
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Truncation and width</h2>
        <div className="row row--stacked">
          <div className="clamp">
            <Badge
              variant="cardbox"
              type="subtle"
              truncate
              leadingIcon={<InfoCircleIcon />}
              label="A label long enough to need truncating"
            />
          </div>
          <div className="clamp">
            <Badge variant="black" type="outlined" fullWidth label="Full width" />
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">On a dark surface</h2>
        <div className="row row--dark">
          <Badge variant="white" type="solid" label="White solid" />
          <Badge variant="white" type="outlined" label="White outlined" />
          <Badge
            variant="warning"
            type="solid"
            leadingIcon={<InfoCircleIcon />}
            label="Warning"
          />
        </div>
      </section>
    </main>
  )
}

export default App
