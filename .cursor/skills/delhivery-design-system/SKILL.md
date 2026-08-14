---
name: delhivery-design-system
description: Build and edit UI with the Delhivery design system. Use when adding or changing any UI in this repo, choosing a Badge variant, type or size, or writing component CSS that must use design tokens.
---

# Delhivery Design System

Read the doc for a component before you use it. Do not infer props from the
component name.

## Components

<!-- GENERATED:components -->
| Component | Summary | Docs |
|---|---|---|
| `Badge` | A compact, non-interactive marker for the status, category or count of the thing beside it. | [badge.md](components/badge.md) |
<!-- /GENERATED:components -->

Docs are also retrievable outside this skill, for any agent or CI job:

```
npm run ds:component -- badge
```

## Non-negotiables

1. **No colour value outside the tokens.** Component CSS must reach for
   `var(--ds-variant-*)` or `var(--ds-color-*)`, never a hex. Padding, gap and
   margin must use `var(--ds-space-*)`; radius must use `var(--ds-radius-*)`.
   See [tokens.md](tokens.md). Both rules are enforced by tests.
2. **`tokens.css` is generated.** Edit `tokens.json`, then run
   `npm run tokens:build`. Never hand-edit the CSS.
3. **Values used by one component belong to that component.** Badge label sizes
   live in `Badge.css` as `--badge-font-size-*`, not in the shared tokens.
4. **Plain CSS only.** No CSS-in-JS, no utility classes, no preprocessor.
5. **Ask before adding a dependency.**
6. **A component's public surface is declared in its `*.meta.ts`.** Change that
   file, then run `npm run docs:build` so the docs and playground follow.

## Choosing a variant

Semantic variants report system state. Everything else categorises.

| Intent | Variant |
|---|---|
| Confirmed, healthy, delivered | `success` |
| Failure, critical issue | `error` |
| Caution, needs attention | `warning` |
| Informational, contextual | `info` |
| Delhivery brand identity | `dlvRed` — brand only, not a second error colour |
| Priority, tier, category and other non-state metadata | `black` `coal` |
| On dark surfaces | `white` |
| Packaging and logistics context | `cardbox` |

**Badge only the exceptional states.** Before badging a value, ask whether it is
the healthy default for that column. If it is, render it as plain text and badge
only the rows that deviate — if every row carries a green badge, nothing stands
out and the badge becomes noise. This outranks any example you find; if an
example appears to contradict it, the example is wrong.

## Choosing a type

`solid` is the loudest and belongs on status that demands attention. `subtle`
is secondary status in dense lists. `outlined` suits already-tinted surfaces.
`ghost` is only ever a loading placeholder — never pick it for emphasis.

Keep one type and one size per group; mixing them reads as a difference in
meaning that isn't there.

## Before you finish

Run `npm run verify`. It lints, typechecks, tests and builds, fails if any
generated file has drifted from its source, and fails if a change to a
component's API breaks the agent-written screen in `eval/`.
