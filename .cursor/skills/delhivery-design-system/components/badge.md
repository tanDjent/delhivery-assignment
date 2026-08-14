# Badge

A compact, non-interactive marker for the status, category or count of the thing
beside it.

The entry point is `src/Design System/index.ts`. Import from it with a path
relative to your own file; it also exports the prop types, so annotate with those
rather than redeclaring a union.

```tsx
import { Badge } from '../Design System'
import type { BadgeProps, BadgeSize, BadgeType, BadgeVariant } from '../Design System'

<Badge variant="success" type="solid" size="medium" label="Delivered" />
```

## Anatomy

| Part | Required | Notes |
|---|---|---|
| Status dot | no | Green presence dot, first in the row. |
| Leading icon | no | Reinforces the label. Hidden from screen readers. |
| Label | **yes** | One or two words. |
| Trailing icon | no | Hidden from screen readers. |

Renders a single `<span>`. There is no wrapper element and no focusable child.

## Props

<!-- GENERATED:props -->
| Prop | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | **required** | Text shown inside the badge. A string rather than a node, to keep labels short. |
| `variant` | `black` `white` `coal` `dlvRed` `info` `success` `warning` `error` `cardbox` | `black` | Colour intent. Semantic variants report state; the rest categorise. |
| `type` | `solid` `subtle` `outlined` `ghost` | `solid` | Visual emphasis. `ghost` is a loading placeholder, not a style choice. |
| `size` | `small` `medium` `large` | `medium` | Height step. See the size table below. |
| `statusDot` | `boolean` | `false` | Shows a green presence dot before the leading icon, as for an online indicator. |
| `leadingIcon` | `ReactNode` | `—` | Icon before the label. Hidden from assistive technology, so it must reinforce the label rather than replace it. |
| `trailingIcon` | `ReactNode` | `—` | Icon after the label. Also hidden from assistive technology. |
| `disabled` | `boolean` | `false` | Dims the badge and sets `aria-disabled`. |
<!-- /GENERATED:props -->

Also accepts `HTMLAttributes<HTMLSpanElement>` except `children` and `color`, and
forwards a ref to the `<span>`.

## Sizes

<!-- GENERATED:sizes -->
| Size | Height | Label | Padding |
|---|---|---|---|
| `small` | 20px | 10px | 4px |
| `medium` | 24px | 12px | 6px |
| `large` | 28px | 16px | 6px |
<!-- /GENERATED:sizes -->

The height is authoritative. At medium and large the label plus padding would be
2px taller than the height, so the effective vertical inset lands 1px tighter
than the declared padding. Small resolves exactly.

## Fixed by design

Not configurable, deliberately.

<!-- GENERATED:fixed -->
| Value | Setting | Note |
|---|---|---|
| Border radius | `4px` | Every size. |
| Gap | `2px` | Between dot, icons and label. |
| Label font | `Noto Sans Medium (500)` | Self-hosted via @fontsource. |
| Icon size | `1em` | Always equal to the label size. |
| Status dot | `6px, green` | Does not scale. |
<!-- /GENERATED:fixed -->

## Not props

<!-- GENERATED:absent -->
| Not a prop | Why |
|---|---|
| `onClick` | Badges are never interactive. Use a button or link beside the badge. |
| `fullWidth` | A badge sizes to its label; stretching it reads as a banner. |
| `truncate` | A label that needs truncating is too long. Shorten it to one or two words. |
<!-- /GENERATED:absent -->

## Best practices

| | Practice |
|---|---|
| **Do** | Badge only the exceptional states. Before adding a badge, ask whether the value is the healthy default for that column — if it is, render it as plain text and badge only the rows that deviate. A green badge on every healthy row makes all of them invisible. |
| **Don't** | Rely on colour alone. The label must carry the meaning by itself. |
| **Do** | Keep labels to one or two words — a badge is scanned, not read. |
| **Don't** | Use a badge for a sentence or a phrase. That belongs in body copy. |
| **Do** | Keep one size and one type within a group. |
| **Don't** | Mix solid and outlined in the same list. |
| **Do** | Use `subtle` or `outlined` for supporting metadata. |
| **Don't** | Use more than one badge per item, unless each carries genuinely distinct information such as status *and* tier. |
| **Do** | Place the badge next to the thing it describes. |
| **Don't** | Use a badge as the only signal for a critical failure — pair it with explanatory text. |

## When to use

- Shipment or order status on a tracking row or card: In Transit, Delivered,
  RTO, Delayed.
- Table and list metadata — priority, tier, category — where a whole column
  would be too much.
- Count and overflow summaries, such as `+3`.
- Card corner labels such as New or COD.
- Environment or account tier beside a page title.

## When not to use

- **As a button.** Badges take no click handler and are not focusable. Put a
  button or link beside the badge instead.
- **For long text.** Anything beyond two words belongs in body copy.
- **Decoratively.** Colour maps to meaning; never pick a variant because it
  matches the palette.
- **For a healthy default state**, on every row. See the first Do above.

## Behaviour

Badges are static and informational. They may appear, disappear or change as the
underlying system state changes, but the badge itself is never what the user
acts on.

`ghost` renders a shimmering block instead of the label and is `aria-hidden`, so
the surrounding loading region must announce the pending state. It honours
`prefers-reduced-motion`.

## Accessibility

- The label carries the meaning; colour never does so on its own.
- Icons are decorative and hidden from assistive technology, so an icon-only
  badge announces nothing.
- `warning` keeps dark text because white fails contrast on its yellow.
- `disabled` sets `aria-disabled` rather than removing the badge from the
  accessibility tree.
- Critical system states need supporting text in the interface, not just a badge.

## Examples

Status in a list. `Delivered` is the healthy default for this column, so it is
text and only the rows that deviate get a badge:

```tsx
function ShipmentStatus({ status }: { status: Status }) {
  if (status === 'Delivered') {
    return <span className="shipment__status">Delivered</span>
  }
  return (
    <Badge
      variant={status === 'RTO' ? 'error' : 'warning'}
      type="subtle"
      size="small"
      label={status}
    />
  )
}
```

Presence, with the dot before the label:

```tsx
<Badge variant="coal" type="subtle" statusDot label="Online" />
```

Loading placeholder while the real status is being fetched:

```tsx
{isLoading ? (
  <Badge type="ghost" label="Loading" />
) : (
  <Badge variant={statusVariant} label={status} />
)}
```
