# Eval prompt

Given verbatim to a fresh agent that has never seen this repo's component
source. The agent may read `AGENTS.md` and everything under
`.cursor/skills/delhivery-design-system/`, and may run `npm run ds:component`.
It may **not** open `src/Design System/**`, `src/playground/**`, or this folder.

---

Build a shipment tracking list for Delhivery operations staff.

Create two files and change nothing else:

- `eval/run-1/ShipmentList.tsx`
- `eval/run-1/ShipmentList.css`

Requirements:

1. Render a list of six shipments. Each row shows the AWB number, the
   destination city, the assigned courier, and the shipment's current status.
2. The statuses in the data are: Delivered, Delivered, Delivered, In Transit,
   Delayed, RTO.
3. Two of the shipments are priority shipments and must be identifiable as such.
4. One courier is currently online — make that visible next to their name.
5. The list is fetched asynchronously. While `isLoading` is true, the status area
   of each row shows a placeholder instead of a status.
6. Use the Delhivery design system for every status, priority and presence
   marker. Put any layout styling you need in the CSS file.

The component takes `{ shipments, isLoading }` as props. Export it as
`ShipmentList`.
