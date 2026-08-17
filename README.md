# Delhivery Design System — a component built for AI agents to use

One design-system component, `Badge`, built so that an AI coding agent can use it
correctly without a person explaining it first.

The component itself is the smaller half of the work. The larger half is
everything around it: one place where the component's public surface is defined,
documentation generated from that place, three ways for an agent to find that
documentation, a test of whether an agent can actually build a screen from it,
and CI that fails the moment any copy of a fact disagrees with another.

**Live playground:** <https://delhivery-assignment.vercel.app/>

```
npm install
npm run dev       # playground on :5173
npm run verify    # lint, stale generated files, tests, build
```

## What I took from the systems I looked at

Meta's Astryx is the closest thing to what this assignment describes, and its
retrieval model is the part worth copying. Component documentation is not pasted
into a rules file. It is fetched when needed, with `npx astryx component Badge`,
and it comes back in the same shape every time: description, import path,
anatomy, best practices as Do/Don't pairs, a props table, theming, related
templates. A short `AGENTS.md` sits above all that and points to it.

That structure is what keeps a system usable at eighty components instead of one.
The agent's context holds the index, not the encyclopedia.

The guidance is also written for a reader that will otherwise do the mediocre
thing. The strongest rule in Astryx's Badge doc is not about the API at all: it
says don't put a green "Active" badge on every healthy row, because if every row
is badged then none of them stand out. An agent will not work that out from a
props table, and it is the kind of rule this system needed too.

The most useful thing I found, though, was a bug. Astryx's short `AGENTS.md` rule
says "Badge = counts only". Its full component doc says Badge is for status and
category, and specifically lists counts under *don't*. The two contradict each
other, because a person summarised the long doc by hand and the two copies then
drifted apart. An agent reading the short version is confidently sent the wrong
way.

Everything about how this repo is wired follows from that: **if a short version
of a fact is written by hand, it will eventually be wrong. Generate it from the
same source as the long version.**

## How it fits together

```
src/Design System/
  variables.figma.json        exported from Figma: the colours, sizes, radii
  typography.figma.json       exported from Figma: the text styles
  tokens.json                 GENERATED, the tokens components are allowed to use
  tokens.css                  GENERATED, the same as CSS variables, light and dark
  tokens.primitives.json      GENERATED, the raw values underneath
  tokens.primitives.css       GENERATED, loaded by tokens.css
  Badge/
    badge.meta.ts             the one place the public API is defined
    badge.figma.json          what the Figma component actually uses, per variant
    badge.spec.json           GENERATED, the badge described without React
    Badge.tsx / .types.ts / .css
    Badge.test.tsx            the markup: element, roles, aria, order
    badge.meta.test.ts        the docs still match the code
    badge.spec.test.ts        the React badge matches the description
  tokens.test.ts              tokens are generated, and only tokens are used

.cursor/skills/delhivery-design-system/
  SKILL.md                    the index: rules, component list, how to choose
  components/badge.md         the full doc; the tables are GENERATED
  tokens.md                   GENERATED list of every token

AGENTS.md                     the always-loaded rules, with no API facts copied in
scripts/                      the generators, and the command that prints a doc
eval/                         the prompt, what an agent built, and how it scored
```

Nothing here is written twice by hand. Two files are the source, and everything
else is built from them:

| This is edited | Everything built from it |
|---|---|
| the two `*.figma.json` exports | the four token files, the token reference doc, and the token tests |
| `badge.meta.ts` plus `badge.figma.json` | `badge.spec.json`, the props table in the docs, the props table in the playground, and the tests that catch drift |

### Where the design values come from

All of them come from Figma, and none are retyped here. `variables.figma.json` is
Figma's own export, and it has three layers:

1. **Brand** — the raw values. `#2396fb`, `4px`.
2. **Alias** — names for those raw values, like `neutral/white-300`.
3. **Mapped** — names for what a value is *for*: `surface/bg_blue/default`,
   `text/heading/primary`, `border/success/base`. This is the layer a component
   is allowed to use. In this repo it is called the **semantic** layer.

Those three layers point at each other in Figma, and they still point at each
other in the CSS. `--ds-surface-bg_blue-default` doesn't hold a colour. It holds
"whatever `--ds-alias-information-info-500` is", which holds "whatever
`--ds-brand-blue-500` is", which is finally `#2396fb`. Change that one blue at the
bottom and everything above it moves with it, exactly as in Figma.

Light and dark live on the semantic layer too, so a component that uses it gets
dark mode without writing a single dark-mode rule. One that reaches past it to a
raw value does not — which is the practical reason for the rule, and a test
enforces it.

A `*.figma.json` name means the file came out of Figma and is never edited by
hand. A `tokens.*` name means a script wrote it. Figma keeps text styles separate
from variables and leaves them out of the export, so `typography.figma.json` is
pulled from Figma's API by `scripts/fetch-typography.mjs` and committed. After
that the build needs no network.

### Why there are four token files instead of two

There are 1,179 CSS variables in total, and 581 of them are the raw values and
their names — the two layers no component may use. Those go into
`tokens.primitives.*`, which leaves `tokens.css` holding the 598 tokens somebody
might actually want. Opening the file you're allowed to use no longer means
scrolling past the ones you aren't.

This is about readability, not download size. 477 of the 478 semantic colours are
just a pointer at a raw value, so the two files only work together, and
`tokens.css` loads the primitives itself rather than leaving that to whoever
imports it. The bundled CSS is byte-for-byte the size it was before the split.

We could instead have copied the real colour into each semantic token and made
`tokens.css` standalone. That would cost the thing that makes this worth doing —
changing one blue in Figma changing everything that uses it — so it isn't worth
the trade.

There used to be a third set of hand-written tokens, kept alive so components
kept rendering while they were moved over. It's gone. The Badge, the
documentation site's own styling, and the page defaults all read the semantic
layer now. The tests fail on a token name that doesn't resolve, so deleting the
old names was itself the proof that nothing still wanted them.

## Describing the badge without React

`badge.spec.json` is the badge written down in a way that mentions no framework:
what you can pass in, what's inside it, how big each size is, the colour every one
of the 45 variant-and-type combinations uses, what a screen reader should get, and
a list of checks that decide whether an implementation counts as correct.

It describes decisions rather than code. It names a token instead of a colour,
says `paddingInline` rather than left-and-right, and says `slot` instead of
`ReactNode`. Nothing in it assumes the thing being built is a web page, which is
what lets the Vue, SwiftUI or Compose version be generated from it.

What makes it more than a document is where it comes from. Which colour each
variant uses is read straight out of the Figma component by
`scripts/fetch-badge-figma.mjs`. It follows the design, not this repo's code. And
`badge.spec.test.ts` checks the React badge against it, so a designer rebinding a
colour in Figma breaks a build here instead of being noticed months later.

### Shipping the same badge on other platforms

This is the point of the file. `badge.spec.json` is data, not prose, so it is
something you point a generator or a coding agent at. The Vue, SwiftUI and Compose
versions of this badge get produced from it, instead of five teams reading the
documentation and rebuilding the badge by hand five times.

That distinction is the same one this whole repo is about. Hand-copying a fact
into a second place is how the copies end up disagreeing — it happened to
Astryx's docs, and it is exactly how five platform implementations quietly stop
being the same component. One machine-readable source, five generated outputs, is
the version that holds.

Two files travel: this one, and the tokens it points at. The React code doesn't.
Neither does `badge.figma.json`, which is the raw Figma data the description is
generated *from*.

**The tokens.** The token files use DTCG, a standard format most token tools
already read, so producing Swift constants or Kotlin values from them is a solved
problem. Two things a generator has to handle: a semantic token usually points at
another token rather than holding a value, so both files have to be resolved
together; and a token can carry a second value for dark mode, under
`$extensions["com.delhivery.mode"].dark`.

**The component.** Every part of the spec maps to something a generator emits, and
none of it is CSS:

| This part | Becomes |
|---|---|
| `api` | the parameter list. Each input has a plain kind — `text`, `enum`, `flag`, `slot` — so `leadingIcon` maps to whatever the target calls "somewhere for the caller to put an icon": a `@ViewBuilder` closure, a `@Composable` lambda, a named slot |
| `anatomy.parts` | the children, in order, and which are conditional. `when` names the input that turns a part on. `decorative: true` means it must be hidden from screen readers |
| `layout.bySize` | height, padding, gap, corner radius, icon size and dot size, per size |
| `appearance.byVariant` | the background, text and border colour for every variant and type. `match-background` means the border takes the background colour; `transparent`, `none` and `inherit` mean what they say |
| `behaviour` | the bits that aren't styling, like `ghost` showing no label |
| `accessibility` | where the accessible name comes from, what to hide, and when to report the badge as disabled |
| `constraints` | the props to refuse to generate, each with its reason. So "why is there no `onClick`?" has an answer written down |

**The checks.** The seven lines under `conformance` are written to be assertable
rather than aspirational — "the rendered height equals the height for that size"
is as easy to test in XCTest or Espresso as it is here. Generated code still needs
proving, and that list is what proves it: it is the definition of "the same
badge", and it applies equally to output nobody hand-wrote. `badge.spec.test.ts`
is the React version and reads as the worked example.

Some things deliberately don't travel. The loading shimmer's timing curve stays in
`Badge.css`, because Figma has no motion values and every platform animates
differently. A description that tried to carry it would be describing CSS instead
of the component.

And because generation runs from a file rather than from memory, keeping every
platform current is a command:

```
npm run spec:fetch    # re-read the Figma component
npm run spec:build    # rewrite badge.spec.json
npm run spec:check    # fail if the two disagree — this runs in CI
```

A designer rebinding one colour in Figma produces a diff in `badge.spec.json`, and
every platform generated from it picks the change up on its next run.

## Why the docs can't go stale

The playground's props table and the published props table are built from the
same file, so the site can't describe a prop the docs don't have. Neither can
describe a prop the component doesn't have, because `badge.meta.test.ts` reads
`Badge.types.ts` and compares the two.

`npm run docs:build` fills in the marked blocks in the markdown and leaves the
hand-written prose alone. `npm run docs:check` fails if any block is out of date.
The contradiction that broke Astryx's docs is a build error here.

## How an agent finds the docs

Three routes to the same markdown, because it shouldn't matter which tool the
developer happens to use:

1. **The skill.** In Cursor, `.cursor/skills/delhivery-design-system/SKILL.md`
   loads by itself when a task touches UI, and points to the component doc.
2. **`AGENTS.md`.** Always loaded, for any agent that reads it. It holds only what
   is true of every task, plus the component list and the command below.
3. **The command.** `npm run ds:component -- badge` prints the doc, for agents,
   editors and CI jobs that know nothing about skills.

## Shipping it to the teams that use it

In production the design system is a package, and the documentation is *inside*
the package rather than on a wiki beside it:

```
@delhivery/badge-react/
  dist/                     the component
  tokens/                   tokens.css, tokens.json
  badge.spec.json           the description the other platforms are generated from
  agent/
    SKILL.md                the index and the rules
    components/badge.md     the full doc
    AGENTS.md               the block a consuming app folds into its own
```

One version number covers the code and the guidance together.
`@delhivery/badge-vue`, and the SwiftUI and Compose packages, are generated from
the same `badge.spec.json`, so each one ships the same guidance with the examples
written in its own language.

An app installs the package and runs one command to put those files where its
agent already looks:

```
npx @delhivery/ds sync-agents          # and --check in CI
```

That copies the skill into the app's `.cursor/skills/` and rewrites a single
marked block inside the app's own `AGENTS.md` — the same `<!-- GENERATED -->`
markers this repo uses on its own files. The app's rules are left untouched and
only the design system's section is replaced.

Doing it this way is what ties the docs to the version. The guidance an agent
reads is written by the package that is installed, so it cannot describe a prop
that version doesn't have. An upgrade becomes one pull request in which the
version bump and the changed documentation appear in the same diff: a removed
prop or a renamed variant shows up as a line of prose changing, which the
reviewer sees and the next agent to work in that repo reads. Anything the upgrade
asks of a human rides along in the same file — a "Migrating from 3.x" heading in
`badge.md` is read by the very agent doing the migration. Running the sync with
`--check` in the app's CI fails a bump that was made without re-syncing, instead
of quietly leaving the agent a version behind.

Eighty components don't make the always-loaded file eighty times longer. The
generated index in `AGENTS.md` carries one line each, and a full doc is fetched
only when a task touches that component, which is why the skill is an index plus
one file per component rather than one long document.

What is built here is the source half of that: the generators, the drift checks,
and the docs already in the shape a package would publish. The publish pipeline
and the `sync-agents` CLI are what a real system adds around them, and neither
changes how anything above is written.

## What gets checked

`npm run verify` runs everything below, and is what the skill tells an agent to
run before finishing. CI runs the same checks as separate steps, so a failure
says what it is.

| Check | Catches |
|---|---|
| `lint` | the usual |
| `tokens:check` | a generated token file edited by hand, or a Figma export refreshed without rebuilding |
| `spec:check` | `badge.spec.json` out of date with the API or with Figma |
| `docs:check` | docs out of date with the API or the tokens |
| `test` | 91 tests: markup, sizes, token discipline, docs matching code, the badge matching its description, and the eval output still rendering |
| `build` | typecheck and bundle |
| `eval:check` | the screen an agent wrote still compiles against the real types |

Some of these started as things I checked by hand in the browser. The test
environment has no layout engine and doesn't resolve CSS variables, so the size
rules — 20/24/28px tall, 4px corners, 2px gap, and so on — are checked against
the stylesheet rather than a rendered element. That is less impressive than it
sounds and I'd rather say so than imply otherwise. To confirm the tests actually
bite, I changed a documented height to a wrong value and watched the suite fail.

The last row is the interesting one. `eval:check` typechecks the screen an agent
wrote from the docs against the real component types, so breaking the API breaks
the eval.

## Can an agent actually use it?

See [eval/README.md](eval/README.md) for the prompt, the rules, the output and the
score. The Showcase tab of the playground is the same thing to look at rather than
read: the prompt, the agent's component running live from the file it wrote, and
the grade.

The short version: a fresh agent was allowed to read the docs and nothing else —
no component source, no types, no CSS — and asked to build a shipment tracking
list with statuses, priority markers, a presence indicator and a loading state.
What it produced is committed as `eval/run-1/`, graded by typechecking against the
real types and by reading whether it followed the judgement calls the docs push
hardest. It passed eight of the nine judgement calls, and the one failure turned
out to be a contradiction in my own docs, which the agent had spotted and said so.

The grade is written once, in `eval/run-1/grade.json`. The tables in the write-up
are generated from it and the Showcase tab reads the same file, so the score can't
say two different things in two places — which is how it came to say eleven checks
when there were nine.

## The component itself

`Badge` is a small, non-interactive marker for the status, category or count of
the thing next to it: nine variants, five types, three sizes, an optional
presence dot and optional icons. It renders a `<span>`, takes no click handler and
can't be focused, because a badge never carries its own action. Full
documentation:
[`.cursor/skills/delhivery-design-system/components/badge.md`](.cursor/skills/delhivery-design-system/components/badge.md).
