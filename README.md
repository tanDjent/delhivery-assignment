# Delhivery Design System — LLM-first component workflow

A prototype of one design-system component, `Badge`, built so that a large
language model can use it correctly without a human explaining it first.

The component is the smaller half of the work. The larger half is the
documentation, retrieval and verification loop around it: a single source of
truth for the component's public surface, docs generated from that source,
three ways for an agent to retrieve them, an eval that measures whether an agent
can actually build UI from the docs alone, and CI that fails when any of it
drifts apart.

**Live playground:** <https://delhivery-assignment.vercel.app/>

```
npm install
npm run dev       # playground on :5173
npm run verify    # lint, generated-file drift, tests, build
```

## What I took from the systems I looked at

Meta's Astryx is the closest reference for the AI-first framing, and its
retrieval model is the part worth copying. Component documentation is not
pasted into a rules file; it is fetched on demand with
`npx astryx component Badge`, which returns a fixed shape every time —
description, import path, anatomy, best practices as explicit Do/Don't pairs, a
props table, theming, and related templates. A terse `AGENTS.md` sits above it
and routes to the detail. That structure is what keeps the system usable when
there are eighty components instead of one: the agent's context holds the index,
not the encyclopedia.

The guidance itself is opinionated in a way that reads as written for a machine
that will otherwise do the mediocre thing. The strongest rule in Astryx's Badge
doc is not about the API at all — it says not to put a green "Active" badge on
every healthy row, because if every row is badged then none of them stand out.
That is a judgement an LLM will not reach on its own from a props table, and it
is the kind of rule this system needed to state too.

The most instructive thing, though, was a defect. Astryx's compressed
`AGENTS.md` rule says "Badge = counts only," while the full component doc frames
Badge as status-and-category and explicitly lists counts under *don't use badges
for metadata*. The two disagree, because a human compressed the detailed doc into
the terse one by hand and the copies then drifted. An agent reading the terse
rule is confidently steered wrong.

Everything about how this repo is wired follows from that observation: **the
compressed layer must be generated from the same source as the detailed layer,
or it will eventually lie.**

## How it fits together

```
src/Design System/
  variables.figma.json        Figma variables export: Brand, Alias, DLV_Mapped
  typography.figma.json       Figma text styles, fetched separately (see below)
  tokens.json                 GENERATED, DTCG, the semantic layer and type
  tokens.css                  GENERATED, what components consume, light and dark
  tokens.primitives.json      GENERATED, DTCG, Brand and Alias
  tokens.primitives.css       GENERATED, imported by tokens.css
  Badge/
    badge.meta.ts             source of truth for the public API
    badge.figma.json          the component set's own bindings, from Figma
    badge.spec.json           GENERATED, platform-neutral contract
    Badge.tsx / .types.ts / .css
    Badge.test.tsx            semantics: element, roles, aria, order
    badge.meta.test.ts        the metadata still describes the implementation
    badge.spec.test.ts        the React build conforms to the spec
  tokens.test.ts              tokens are generated, and only tokens are used

.cursor/skills/delhivery-design-system/
  SKILL.md                    the index: rules, component list, how to choose
  components/badge.md         the full doc; API tables are GENERATED
  tokens.md                   GENERATED token reference

AGENTS.md                     always-in-context rules, no duplicated API facts
scripts/                      the generators and the retrieval CLI
eval/                         the prompt, the agent's output, and the result
```

Two sources of truth, four consumers:

| Source | Consumers |
|---|---|
| `variables.figma.json` + `typography.figma.json` | `tokens.json` and `tokens.primitives.json`, then the two stylesheets, `tokens.md` and the token tests |
| `badge.meta.ts` + `badge.figma.json` | `badge.spec.json`, the props table in `components/badge.md`, the playground's Properties table, the drift tests |

Design values come straight out of Figma. `variables.figma.json` is the variables
export, three collections deep: Brand holds the primitives, Alias names them,
and DLV_Mapped is the layer components consume, carrying the light and dark
modes. That chain survives into CSS as nested `var()` references, so editing one
primitive cascades exactly as it does in Figma, and dark mode is a property of
the semantic tier rather than a second stylesheet.

The suffix marks which side of the pipeline a file is on: `*.figma.json` is
fetched and never hand-edited, `tokens.*` is generated. Text styles are not
variables in Figma and are absent from the export, so `typography.figma.json` is
fetched from the REST API by `scripts/fetch-typography.mjs` and committed, which
keeps the build offline.

The output is split where the audience changes. Brand and Alias are 581 of the
1,179 custom properties and no component may name any of them, so they are
generated into `tokens.primitives.*`, leaving `tokens.css` as the 598 tokens
somebody might legitimately reach for. That is a readability split, not a payload
one: 477 of the 478 semantic colour tokens are a `var()` into a primitive, so the
two files are a set, and `tokens.css` imports its primitives rather than trusting
a caller to load half a chain. Flattening the semantic layer to literals would
make it standalone and cost the cascade, which is the wrong trade.

Nothing else feeds the tokens. An earlier hand-authored set survived the
migration for a while so components kept rendering mid-remap, and it is now
gone: the Badge, the documentation site's own chrome and the page defaults all
read the semantic tier. Because the token tests fail on a `var()` that resolves to
nothing, deleting those names was enough to prove no stylesheet still wanted
them.

## The component spec

`badge.spec.json` is a platform-neutral contract: the API, the anatomy, the
geometry per size, all 45 variant-and-type colour pairings, the accessibility
semantics, and a list of conformance statements. It holds decisions as data and
semantics as declarations, never layout as code — token names rather than
values, logical directions rather than left and right, and `slot` rather than
`ReactNode` — so the same file can drive a Vue, SwiftUI or Compose
implementation. Only the tokens and this contract are portable; each rendering
model still writes its own implementation.

What makes it more than documentation is where it comes from. The colour
pairings are read out of the Figma component set's own variable bindings by
`scripts/fetch-badge-figma.mjs`, so the spec is generated from the design rather
than from this repo's code. `badge.spec.test.ts` then checks the React
implementation against it, which means a designer rebinding a colour in Figma
fails CI here rather than being noticed months later. Any other implementation
would be validated by the equivalent of that one test file.

Because the playground's interactive props table and the published props table
are built from the same file, the documentation site cannot describe a prop the
docs don't have — and neither can describe a prop the component doesn't have,
because `badge.meta.test.ts` reads `Badge.types.ts` and compares.

`npm run docs:build` fills the marked blocks in the markdown and leaves the prose
alone. `npm run docs:check` fails if anything is stale, so the drift that broke
Astryx's docs is a build error here rather than a bad suggestion months later.

## How an agent gets the docs

Three routes to the same markdown, because the docs should not depend on which
tool the developer happens to use:

1. **The skill.** In Cursor, `.cursor/skills/delhivery-design-system/SKILL.md`
   loads on its own when a task touches UI, and points to the component doc.
2. **`AGENTS.md`.** Always in context, for any agent that reads it. It holds only
   what is true of every task, plus the component index and the retrieval command.
3. **The CLI.** `npm run ds:component -- badge` prints the doc to stdout, for
   agents, editors and CI jobs with no notion of skills.

## Verification

`npm run verify` runs every check below, and is what the skill tells an agent to
run before finishing. CI runs the same checks as separate steps, so a failure
names itself.

| Check | Catches |
|---|---|
| `lint` | the usual |
| `tokens:check` | a generated token file hand-edited, or a Figma export refreshed without regenerating |
| `spec:check` | `badge.spec.json` stale against `badge.meta.ts` or the Figma bindings |
| `docs:check` | docs stale against `badge.meta.ts` or `tokens.json` |
| `test` | 85 tests: badge semantics, geometry, token discipline, metadata drift, spec conformance |
| `build` | typecheck and bundle |
| `eval:check` | the agent-generated screen still compiles against the real types |

Some of these started as things I checked by hand in a browser and then turned
into tests. jsdom has no layout engine and does not resolve `var()`, so the
geometry contract — 20/24/28px heights, 4px radius, 2px gap, icons at `1em`, a
6px green dot — is asserted against the stylesheet source rather than a rendered
element, which is honest about what is being proven. I verified the tests fail
when the metadata lies by mutating a documented height and watching the suite go
red.

The last row is the interesting one. `eval:check` typechecks the screen an agent
wrote from the docs against the real component types, so a breaking API change
shows up as a failing eval.

## The eval

See [eval/README.md](eval/README.md) for the protocol, the prompt, the output and
the grade.

The short version: a fresh agent that was allowed to read the skill docs and
nothing else — no component source, no types, no CSS — was asked to build a
shipment tracking list with statuses, priority markers, a presence indicator and
a loading state. The output is committed as `eval/run-1/`, and it is graded
mechanically by typechecking against the real types, plus a read of whether it
followed the judgement rules the docs put most weight on.

## Component summary

`Badge` is a compact, non-interactive marker for the status, category or count of
the thing beside it: nine variants, four types, three sizes, an optional presence
dot and optional icons. It renders a `<span>`, takes no click handler and is not
focusable — badges never carry their own action. Full documentation:
[`.cursor/skills/delhivery-design-system/components/badge.md`](.cursor/skills/delhivery-design-system/components/badge.md).
