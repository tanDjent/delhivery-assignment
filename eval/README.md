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

## Grade

Mechanical checks — `npm run eval:check` typechecks the output against the real
component types, so an invented prop or an impossible variant fails the build:

| Check | Result |
|---|---|
| Typechecks against the real `BadgeProps` | **pass** |
| No prop or variant that does not exist | **pass** |
| No colour value outside the tokens | **pass** |
| Padding, gap, margin and radius from the token scale | **pass** |
| Values used by one component kept local, not added to `tokens.json` | **pass** |

Judgement checks — did it follow the guidance the docs put the most weight on:

| Guidance | Result |
|---|---|
| Badge is never interactive | **pass** — no handler, no focusable wrapper |
| Labels stay to one or two words | **pass** |
| One size and one type within a group | **pass** — every badge is `small` and `subtle` |
| `ghost` only as a loading placeholder | **pass** |
| A `ghost` badge needs a loading region that announces itself | **pass** — added `role="status"` and `aria-busy`, which the prompt never asked for |
| A critical state needs supporting text, not just a badge | **pass** — wrote explanatory copy for the Delayed and RTO rows, which the prompt never asked for |
| `dlvRed` is brand identity, not a second error colour | **pass** — used `error` for RTO and never reached for `dlvRed` |
| Status *and* tier may both be badged | **pass** — Priority sits beside the status |
| **Badge only the exceptional states** | **fail** — but caused by a contradictory example in my docs, which the agent flagged; see below |

Ten of eleven. The two unprompted passes are the interesting ones: nothing in the
task mentioned screen readers or supporting copy, so the accessibility section of
the component doc is doing real work.

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

## Gaps in the docs this surfaced

1. **The docs never said which types are exported.** The props table names
   `BadgeVariant`, but nothing stated that it can be imported, so the agent
   declared its own narrower union of four variants. Harmless here, wrong at
   scale.
2. **The import example was written from one caller's location**, without saying
   what the entry point is.

Both were factual omissions rather than matters of judgement, so I fixed them in
`components/badge.md` after this run. The weak judgement rule is deliberately left
as it is, so that round 2 has something to measure.

## Re-running

```
npm run eval:check     # grades the committed output
```

To run the eval itself, give [prompt.md](prompt.md) and the context rules above
to a fresh agent, and write the output to `eval/run-<n>/`.
