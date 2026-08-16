import { Badge } from '../Design System'
import type { BadgeVariant } from '../Design System'
import { CodeBlock } from './CodeBlock'
import { ExampleCard } from './ExampleCard'
import { CheckCircleIcon, CrossCircleIcon, InfoCircleIcon, PlusCircleIcon } from './icons'

/**
 * Semantic variants are labelled by the meaning they carry; the brand and
 * neutral variants have no inherent meaning, so they are labelled by name.
 */
const SHOWCASE: { variant: BadgeVariant; label: string }[] = [
  { variant: 'info', label: 'Info' },
  { variant: 'success', label: 'Success' },
  { variant: 'warning', label: 'Warning' },
  { variant: 'error', label: 'Error' },
  { variant: 'black', label: 'Black' },
  { variant: 'white', label: 'White' },
  { variant: 'coal', label: 'Coal' },
  { variant: 'dlvRed', label: 'DLV Red' },
  { variant: 'cardbox', label: 'Cardbox' },
]

const PRACTICES: { kind: 'do' | 'dont'; text: string }[] = [
  {
    kind: 'do',
    text: 'Use semantic colour variants — green for success, red for error.',
  },
  { kind: 'dont', text: 'Don’t rely on colour alone to convey meaning.' },
  { kind: 'do', text: 'Keep badge labels short and scannable (1–2 words).' },
  { kind: 'dont', text: 'Don’t use badges for long text or sentences.' },
  { kind: 'do', text: 'Use consistent sizing within the same context.' },
  {
    kind: 'dont',
    text: 'Don’t mix filled and outlined styles in the same group.',
  },
  {
    kind: 'do',
    text: 'Use subtle or outlined styles for lower-emphasis contexts.',
  },
  { kind: 'dont', text: 'Don’t use badges as primary action buttons.' },
]

const TYPES_CODE = `<Badge variant="success" type="solid" label="Solid" />
<Badge variant="success" type="subtle" label="Subtle" />
<Badge variant="success" type="outlined" label="Outlined" />
<Badge variant="success" type="disabled" label="Disabled" />`

const SIZES_CODE = `<Badge variant="info" size="small" label="Small" />
<Badge variant="info" size="medium" label="Medium" />
<Badge variant="info" size="large" label="Large" />`

const ICONS_CODE = `<Badge
  variant="coal"
  type="subtle"
  leadingIcon={<InfoCircleIcon />}
  label="Leading"
/>
<Badge
  variant="coal"
  type="subtle"
  trailingIcon={<PlusCircleIcon />}
  label="Trailing"
/>
<Badge
  variant="coal"
  type="subtle"
  leadingIcon={<InfoCircleIcon />}
  trailingIcon={<PlusCircleIcon />}
  label="Both"
/>`

export function OverviewTab() {
  return (
    <>
      <div className="display">
        <div className="display__row">
          {SHOWCASE.map((item) => (
            <Badge
              key={item.variant}
              variant={item.variant}
              type="solid"
              size="medium"
              label={item.label}
            />
          ))}
        </div>
      </div>

      <section className="section">
        <h2 className="section__title">Usage</h2>
        <p className="section__body">
          Use a Badge to label the object next to it — its status, category or
          count. Badges are compact and read-only by default, so they summarise
          information the user can act on elsewhere rather than being the action
          themselves.
        </p>
        <p className="section__body">
          Reach for a semantic variant when the label reports state, and pair it
          with clear wording so the meaning survives without colour. Keep one
          size and one type within a single group; mixing them reads as a
          difference in meaning that isn’t there.
        </p>
        <CodeBlock inline code={`import { Badge } from './Design System'`} />
      </section>

      <section className="section">
        <h2 className="section__title">Best Practices</h2>
        <table className="practices">
          <thead>
            <tr>
              <th scope="col">Guidance</th>
              <th scope="col">Practices</th>
            </tr>
          </thead>
          <tbody>
            {PRACTICES.map((practice) => (
              <tr key={practice.text}>
                <td>
                  <Badge
                    type="subtle"
                    size="medium"
                    variant={practice.kind === 'do' ? 'success' : 'error'}
                    leadingIcon={
                      practice.kind === 'do' ? (
                        <CheckCircleIcon />
                      ) : (
                        <CrossCircleIcon />
                      )
                    }
                    label={practice.kind === 'do' ? 'Do' : 'Don’t'}
                  />
                </td>
                <td className="practices__text">{practice.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="section">
        <h2 className="section__title">Examples</h2>
        <p className="section__subtitle">
          Common configurations, variations, and states.
        </p>

        <ExampleCard
          title="Types"
          description="The same variant rendered as each visible type. Solid carries the most emphasis and suits primary status; subtle sits quietly inside dense tables and lists; outlined is the lightest and works where the surface already carries colour. Disabled is a type rather than a flag, because it replaces the colours instead of dimming them. Pick one type per group so the difference in weight is never mistaken for a difference in meaning."
          code={TYPES_CODE}
        >
          <Badge variant="success" type="solid" label="Solid" />
          <Badge variant="success" type="subtle" label="Subtle" />
          <Badge variant="success" type="outlined" label="Outlined" />
          <Badge variant="success" type="disabled" label="Disabled" />
        </ExampleCard>

        <ExampleCard
          title="Sizes"
          description="Three sizes at 20, 24 and 28 pixels tall. Small and medium share the caption2_default text style at 10 pixels; large steps up to caption1_default at 12. Medium is the default. Small suits dense rows where a medium badge would push the line height out; large is for headers and detail pages where the badge is the thing you want read first."
          code={SIZES_CODE}
        >
          <Badge variant="info" size="small" label="Small" />
          <Badge variant="info" size="medium" label="Medium" />
          <Badge variant="info" size="large" label="Large" />
        </ExampleCard>

        <ExampleCard
          title="With icons"
          description="Optional leading and trailing icon slots. A leading icon reinforces the meaning the colour is already signalling, which keeps the badge readable for colour-blind users. A trailing icon suggests an affordance — a dismiss cross or a drill-down chevron — so only use one when the badge is genuinely interactive. Icons scale with the badge size and are hidden from screen readers, since the label already carries the meaning."
          code={ICONS_CODE}
        >
          <Badge
            variant="coal"
            type="subtle"
            leadingIcon={<InfoCircleIcon />}
            label="Leading"
          />
          <Badge
            variant="coal"
            type="subtle"
            trailingIcon={<PlusCircleIcon />}
            label="Trailing"
          />
          <Badge
            variant="coal"
            type="subtle"
            leadingIcon={<InfoCircleIcon />}
            trailingIcon={<PlusCircleIcon />}
            label="Both"
          />
        </ExampleCard>
      </section>
    </>
  )
}
