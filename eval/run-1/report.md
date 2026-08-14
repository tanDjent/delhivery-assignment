# Run 1 — the agent's own report, verbatim

Written by the agent that produced `ShipmentList.tsx` and `ShipmentList.css` from
the skill documentation alone. Unedited, including the parts where it disagrees
with the grade in [../README.md](../README.md).

---

Both files are written. Here's the report.

## 1. What I read and ran

Read only: `AGENTS.md`, `.cursor/skills/delhivery-design-system/SKILL.md`, `.cursor/skills/delhivery-design-system/tokens.md`, `.cursor/skills/delhivery-design-system/components/badge.md`. I also globbed that skill directory to confirm those were the only docs. Ran `npm run ds:component -- badge` in the repo root; its output matched `badge.md` byte for byte, so it added nothing new. I opened nothing under `src/`, and no `.tsx` in the repo.

## 2. Marker decisions and the line that drove each

**Status → variant.** From the SKILL.md variant table: "Confirmed, healthy, delivered → `success`" for Delivered; "Failure, critical issue → `error`" for RTO; "Caution, needs attention → `warning`" for Delayed; "Informational, contextual → `info`" for In Transit. In Transit is the weakest fit of the four — it is a system state, but the table has no "in progress" row, and `info` is the only remaining semantic variant.

**Status → type and size: `subtle`, `small`.** Driven by badge.md's list example, which is verbatim this case: `<Badge variant="success" type="subtle" size="small" label="Delivered" />` alongside Delayed and RTO. Reinforced by SKILL.md's "`subtle` is secondary status in dense lists" and "Keep one type and one size per group."

**Priority → `black`, `subtle`, `small`, label "Priority".** Priority is not a system state, so no semantic variant applies; the table's only remaining fit is "Neutral emphasis / metadata → `black` `coal`". `dlvRed` is explicitly excluded ("brand only, not a second error colour"). badge.md's when-to-use lists "Table and list metadata — priority, tier, category — where a whole column would be too much", and the Do says "Use `subtle` or `outlined` for supporting metadata"; I picked `subtle` over `outlined` because "Don't mix solid and outlined in the same list."

**Two badges on the priority rows.** Allowed by the exact carve-out in badge.md: "Don't use more than one badge per item, unless each carries genuinely distinct information such as status *and* tier." I placed the priority badge beside the AWB, per "Place the badge next to the thing it describes."

**Online courier → `coal`, `subtle`, `statusDot`, label "Online".** Copied from the presence example, `<Badge variant="coal" type="subtle" statusDot label="Online" />`, next to the courier's name. The dot is documented as "first in the row" and fixed at 6px green, so I let the component draw it rather than styling anything myself. The label carries the meaning because "colour never does so on its own."

**Loading → `ghost`.** From the loading example and the props table, "`ghost` is a loading placeholder, not a style choice", and SKILL.md's "`ghost` is only ever a loading placeholder — never pick it for emphasis." Only the status cell swaps; AWB, city and courier stay. Because "`ghost` … is `aria-hidden`, so the surrounding loading region must announce the pending state", I put `aria-busy` on the section and a `role="status"` line that announces loading and completion.

**Supporting text for RTO and Delayed.** badge.md: "Don't use a badge as the only signal for a critical failure — pair it with explanatory text", and the accessibility note "Critical system states need supporting text in the interface, not just a badge." So `Shipment` has an optional `note` rendered under the badge on those two rows.

**CSS.** All padding, gap, margin and radius come from `var(--ds-space-*)` / `var(--ds-radius-md)`; all colours from `--ds-color-*`; borders from `--ds-border-width`; weights from `--ds-font-weight-*`. The three row font sizes are local `--shipment-list-*` properties, following "Badge label sizes live in `Badge.css` as `--badge-font-size-*`, not in the shared tokens." Grid columns are `fr` fractions so no raw widths appear. Plain CSS, no new dependency.

## 3. What the docs left ambiguous

- **Whether to badge Delivered at all.** Three of six rows are Delivered, and the docs say three separate times not to badge a healthy default state on every row. But the one concrete list example badges Delivered next to Delayed and RTO, and your requirement 6 asks for a design-system marker on every status. I followed the example and badged all four states, reading the prohibition as applying to lists where *every* row is healthy. If you'd rather Delivered were plain text, that's a one-line change.
- **The priority variant.** The docs never name a variant for priority. `black` is my reading of "neutral emphasis / metadata"; `coal` would be equally defensible, and I avoided it only so priority doesn't look like the presence badge.
- **Size for the presence badge.** The documented presence example omits `size`, which would default to `medium` (24px) beside 20px status badges. Since "one size per group" is scoped to a group and presence is its own group, either is legal; I used `small` so the row reads as one dense line.
- **Where the six shipments come from.** The component takes `shipments` as a prop, but you also specified the exact six rows, and I could create only two files. I exported a `sampleShipments` fixture from the component file and kept both props required, rather than inventing a default that changes the public surface.
- **Class naming.** The convention `ds-<component>__<part>` is documented for design-system components. This is app code, not a shipped component, so I used the same BEM shape under a `shipment-list` prefix instead of claiming the `ds-` namespace.
- **Whether a status is announced on change.** The docs say badges "may appear, disappear or change" but don't say whether a status change should be announced. My `role="status"` region covers only the loading transition.

## 4. What I wanted to check but couldn't

- The export surface of `src/Design System` — whether `Badge` is a named export and whether the directory has an index that resolves as `'../../src/Design System'`. The doc's snippet is `import { Badge } from './Design System'`, so I assumed a named export from the directory and adjusted the relative path.
- Whether importing a plain `.css` file from a component is the house pattern here, and whether `tokens.css` is already loaded globally. I assumed it is, since `main.tsx` is documented as importing the font.
- Whether `Badge`'s props type is exported, which would have let me type `STATUS_VARIANT` against the real variant union instead of my own local `BadgeVariant` alias.
- The exact spelling of the variant string `dlvRed` in code versus docs — not used here, but I couldn't confirm the union members are literally those strings.
- Whether the space between "Design" and "System" in the directory name needs any escaping in an import specifier. It shouldn't in a quoted string, but I couldn't verify against an existing import.
