# Eval: can an agent build correct UI from the docs alone?

The point of this repo is not that `Badge` exists. It is that an LLM can use it
correctly without a human explaining it. That claim is testable, so this is the
test.

## Protocol

A fresh agent, with no memory of building the component, was given
[prompt.md](prompt.md) and these context rules:

- **May read** `AGENTS.md` and anything under
  `.cursor/skills/delhivery-design-system/`.
- **May run** `npm run ds:component -- badge`.
- **May not** open `src/Design System/**`, `src/playground/**`, `src/App.tsx`, or
  any existing `.tsx` file in the repo — no component source, no types, no CSS.
- Was not shown the grading criteria below.

The restriction is enforced by instruction, not by a sandbox. The agent reported
which files it read, and its report is in [run-1/report.md](run-1/report.md).

Its output is committed unedited as [run-1/](run-1/), including a lint warning I
deliberately did not fix.

That run predates the move to the Figma-generated tokens, so `run-1/ShipmentList.css`
still spells the token names the way the docs did at the time — `--ds-space-8`
rather than `--ds-spacing-8`, and `--ds-color-*` rather than `surface`, `text` and
`border`. Those names no longer resolve. Editing the file would make it a worse
record of what the agent produced, so it stands as written; the fix is a re-run
against the current docs, not a patch.

## Grade

Mechanical checks — `npm run eval:check` typechecks the output against the real
component types, so an invented prop or an impossible variant fails the build:

<!-- GENERATED:mechanical -->
| Check | Result |
|---|---|
| Typechecks against the real `BadgeProps` | **pass** |
| No prop or variant that does not exist | **pass** |
| No colour value outside the tokens | **pass** |
| Padding, gap, margin and radius from the token scale | **pass** |
| Values used by one component kept local, not added to `tokens.json` | **pass** |
<!-- /GENERATED:mechanical -->

Judgement checks — did it follow the guidance the docs put the most weight on:

<!-- GENERATED:judgement -->
| Guidance | Result |
|---|---|
| Badge is never interactive | **pass** — no handler, no focusable wrapper |
| Labels stay to one or two words | **pass** |
| One size and one type within a group | **pass** — every badge is `small` and `subtle` |
| `ghost` only as a loading placeholder | **pass** |
| A `ghost` badge needs a loading region that announces itself | **pass** — added `role="status"` and `aria-busy`, which the prompt never asked for |
| A critical state needs supporting text, not just a badge | **pass** — wrote explanatory copy for the Delayed and RTO rows, which the prompt never asked for |
| `dlvRed` is brand identity, not a second error colour | **pass** — used `error` for RTO and never reached for `dlvRed` |
| Status and tier may both be badged | **pass** — Priority sits beside the status |
| Badge only the exceptional states | **fail** — the rule and the example beneath it disagreed, and the agent flagged the contradiction |
<!-- /GENERATED:judgement -->

<!-- GENERATED:score -->
Eight of nine judgement checks pass.
<!-- /GENERATED:score -->

The two unprompted passes are the interesting ones: nothing in the task mentioned
screen readers or supporting copy, so the accessibility section of the component
doc is doing real work.

Both tables come from [run-1/grade.json](run-1/grade.json), which the Showcase
tab of the docs site reads as well, so the grade is stated once.

## The failure was mine, not the agent's

The strongest rule in the doc is that a green badge on every healthy row makes
none of them stand out. The prompt asked for six rows, three of them `Delivered`.
The agent badged all six. The output I wanted was plain text for `Delivered` and a
badge only on `In Transit`, `Delayed` and `RTO`.

But the agent did not miss the rule. It raised the conflict unprompted, and its
reasoning is worth reading in full:

> Three of six rows are Delivered, and the docs say three separate times not to
> badge a healthy default state on every row. But the one concrete list example
> badges Delivered next to Delayed and RTO […] I followed the example and badged
> all four states, reading the prohibition as applying to lists where *every* row
> is healthy.

It is right. The prose said don't badge the healthy default; the code example
directly beneath it badged `Delivered` alongside `Delayed` and `RTO`. Given a
contradiction between prose and a runnable example, the agent trusted the example
— which is the correct instinct, and exactly what I would want it to do.

So the eval found the same defect in my documentation that I had criticised in
Astryx's: a rule and its illustration disagreeing because a human wrote them
separately. Generating the API tables from `badge.meta.ts` prevents drift in the
facts. It does nothing for drift in the judgement, because judgement lives in
prose and examples that no generator owns.

Two lessons, both of which changed the docs:

1. **An example is stronger than a rule.** If an example contradicts the guidance,
   the example wins. Examples must be checked against the rules as carefully as
   the rules are checked against the code.
2. **A judgement rule should be a decision procedure, not advice.** "Badge only
   the exceptional states" is advice. "If a status is the healthy default, render
   it as text — see the example" is an instruction with a testable outcome.
   Whether it is the *right* instruction is a separate matter, taken up below.

I rewrote the offending example and the rule accordingly. Round 2 is a re-run of
the same prompt against the corrected docs, which is the actual payoff of having
an eval at all: a documentation edit can now be judged by whether it changes agent
output rather than by whether it reads well.

## Other things the report is right about

- **`info` is a poor fit for In Transit.** The variant table has no
  "in progress" row, so the agent picked the only semantic variant left. That is
  a gap in the palette's coverage of logistics states, not a mistake.
- **No variant is named for priority or tier**, so it inferred `black` from
  "neutral emphasis / metadata". Reasonable, but the doc should say.

## The rule itself is still wrong

Making the rule and the example agree settled the contradiction, not the question
underneath it. In an operations table the status column is usually badged on every
row, `Delivered` included: a column where some cells are pills and others are bare
text reads as ragged, or as though the plain rows are missing their value, and a
uniform chip is what lets the column be scanned. On that reading the agent's output
is the one a developer would ask for, and the graded fail is a fail against a rule
that should not have been written that way.

"Badge only the exceptional states" answers the wrong question. What decides it is
the job the badge is doing:

| The badge is | Then | Example |
|---|---|---|
| the format of a column — every row has a value and colour ranks them | badge every row, healthy default included | a status column in a tracking table |
| a marker laid on content that is otherwise plain | badge only the rows that deviate | priority, held, COD |

Neither the rule nor the example draws that line, so the doc reads as though the
first case does not exist.

It cannot be drawn in prose alone, which is where this stops being a documentation
task:

1. **The variants need a deliberate emphasis order.** A fully badged column only
   works if `success` recedes while `warning` and `error` come forward. That is a
   decision in Figma about the palette, not a sentence in a doc.
2. **The palette has no in-progress state**, as above, which is why `In Transit`
   had to borrow `info`.
3. **There is no named table pattern** for either the library or the doc to point
   at, so every team will infer the column convention for itself.

All three belong with the designer before the rule is written a third time. That is
the useful kind of finding for an eval to produce: not a typo, but a distinction the
design system has not made yet.

## Gaps in the docs this surfaced

1. **The docs never said which types are exported.** The props table names
   `BadgeVariant`, but nothing stated that it can be imported, so the agent
   declared its own narrower union of four variants. Harmless here, wrong at
   scale.
2. **The import example was written from one caller's location**, without saying
   what the entry point is.

Both were factual omissions rather than matters of judgement, so I fixed them in
`components/badge.md` after this run, along with the contradiction between the rule
and its example. The rule's deeper problem stays open, because it waits on the
palette decisions above rather than on better wording. Round 2 measures whether the
edits already made change what an agent builds.

## Re-running

```
npm run eval:check     # grades the committed output
```

To run the eval itself, give [prompt.md](prompt.md) and the context rules above
to a fresh agent, and write the output to `eval/run-<n>/`.
