# AGENTS.md

Delhivery design system. React 19 + TypeScript + Vite. `src/playground/` is the
documentation site and is not shipped to consumers.

## Read the component doc first

<!-- GENERATED:components -->
| Component | Summary | Docs |
|---|---|---|
| `Badge` | A compact, non-interactive marker for the status, category or count of the thing beside it. | [badge.md](.cursor/skills/delhivery-design-system/components/badge.md) |
<!-- /GENERATED:components -->

Component guidance lives in `.cursor/skills/delhivery-design-system/`, loaded on
demand rather than pasted here — this file is in context for every task, so it
holds only what is true of every task. Retrieve a doc from any tool with:

```
npm run ds:component -- badge
```

## Commands

```
npm install
npm run dev        # docs site on :5173
npm run verify     # lint + drift + test + build + agent eval typecheck
```

## Generated files — never edit by hand

| File | Source | Regenerate |
|---|---|---|
| `src/Design System/tokens.css` | `tokens.json` | `npm run tokens:build` |
| Generated blocks in the skill docs | `*.meta.ts`, `tokens.json` | `npm run docs:build` |

`npm run verify` fails if either has drifted, so change the source, not the
output.

## Rules

- **No colour value outside the tokens**, and padding, gap, margin and radius
  always come from `var(--ds-space-*)` / `var(--ds-radius-*)`. Tests enforce both.
- **A value used by one component belongs to that component**, not to
  `tokens.json`. A fixed height or a 6px dot is a literal in the component's CSS;
  it is not a shared token.
- **Plain CSS only.** No CSS-in-JS, utility classes or preprocessor.
- **Ask before adding a dependency.**
- Class names are `ds-<component>`, `ds-<component>__<part>`,
  `ds-<component>--<modifier>`.
- Variants declare local custom properties that the type modifiers consume, so
  adding a colour never requires a new type rule.
- A component's public surface is declared in its `*.meta.ts`; change that file
  and run `npm run docs:build` so docs, playground and tests follow.
- Comments explain constraints the code can't show, never what the next line does.

## Before you finish

Run `npm run verify` and re-read your diff for hardcoded values or props that
don't exist in the component's types file.
