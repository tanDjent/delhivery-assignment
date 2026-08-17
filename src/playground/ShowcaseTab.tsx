import { useState } from 'react'
import { Badge } from '../Design System'
import { CodeBlock } from './CodeBlock'
import { Switch } from './Switch'
import { ShipmentList, sampleShipments } from '../../eval/run-1/ShipmentList'
import promptSource from '../../eval/prompt.md?raw'
import grade from '../../eval/run-1/grade.json'
import './eval-compat.css'

interface Check {
  name: string
  result: 'pass' | 'fail'
  note?: string
}

const MECHANICAL = grade.mechanical as Check[]
const JUDGEMENT = grade.judgement as Check[]

const PASSED = JUDGEMENT.filter((check) => check.result === 'pass').length

/** prompt.md opens with the context rules and puts the task itself below a rule. */
const PROMPT = (promptSource.split(/^---$/m).at(-1) ?? promptSource).trim()

/** Backticks in the grade become code spans, the one bit of markup it may use. */
function withCode(text: string) {
  return text
    .split(/`([^`]+)`/)
    .map((part, index) => (index % 2 ? <code key={index}>{part}</code> : part))
}

function GradeTable({ heading, checks }: { heading: string; checks: Check[] }) {
  return (
    <table className="practices">
      <thead>
        <tr>
          <th scope="col">Result</th>
          <th scope="col">{heading}</th>
        </tr>
      </thead>
      <tbody>
        {checks.map((check) => (
          <tr key={check.name}>
            <td>
              <Badge
                type="subtle"
                size="medium"
                variant={check.result === 'pass' ? 'success' : 'error'}
                label={check.result}
              />
            </td>
            <td className="practices__text">
              {withCode(check.name)}
              {check.note ? (
                <span className="grade__note"> — {withCode(check.note)}</span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function ShowcaseTab() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <>
      <section className="section section--first">
        <h2 className="section__title">Built from the docs alone</h2>
        <p className="section__subtitle">
          An eval, because “the documentation is good” is otherwise just a
          claim.
        </p>
        <p className="section__body">
          What matters about this repo is not that a Badge exists, but that an
          agent can use it correctly with nobody there to explain it. So a fresh
          agent was given the prompt below and allowed to read{' '}
          <code>AGENTS.md</code> and the skill folder — no component source, no
          types, no CSS, and no sight of the grading criteria. What it wrote is
          committed unedited and is running further down this page.
        </p>
      </section>

      <section className="section">
        <h2 className="section__title">The prompt</h2>
        <p className="section__subtitle">
          Given verbatim, with the deliberate omissions described below it.
        </p>
        <CodeBlock code={PROMPT} />
        <p className="section__body">
          Nothing in it mentions screen readers, loading semantics or which
          statuses deserve a badge at all. Those are the interesting parts: they
          are decisions the docs have to carry on their own.
        </p>
      </section>

      <section className="section">
        <h2 className="section__title">What came back</h2>
        <p className="section__subtitle">
          The agent’s component, rendering live from the file it wrote.
        </p>
        <div className="example__card">
          <div className="showcase__stage eval-output">
            <ShipmentList shipments={sampleShipments} isLoading={isLoading} />
          </div>
          <div className="showcase__bar">
            <span>
              Flip <code>isLoading</code> for the placeholder it chose
            </span>
            <Switch
              label="isLoading"
              checked={isLoading}
              onChange={setIsLoading}
            />
          </div>
        </div>
        <p className="section__body">
          Every marker on the page is a Badge: the statuses, the two priority
          shipments, the online courier, and the placeholder that stands in
          while the list loads. The row layout is the agent’s own CSS. The
          supporting sentences under Delayed and RTO were not asked for — the
          accessibility guidance says a critical state needs more than a colour,
          so it wrote them.
        </p>
        <p className="section__body">
          This run predates the move to the Figma-generated tokens, so its
          stylesheet still spells the old token names. The playground answers
          those names with their current equivalents rather than editing the
          agent’s file, which would spoil the record.
        </p>
      </section>

      <section className="section">
        <h2 className="section__title">The grade</h2>
        <p className="section__subtitle">
          Mechanical checks first: <code>npm run eval:check</code> typechecks the
          output against the real component types, so an invented prop or an
          impossible variant fails the build.
        </p>
        <GradeTable heading="Check" checks={MECHANICAL} />

        <p className="section__body">
          Then the judgement calls — the guidance the docs put the most weight
          on, which no typechecker can enforce.
        </p>
        <GradeTable heading="Guidance" checks={JUDGEMENT} />

        <p className="section__body">
          The tally is {PASSED} of {JUDGEMENT.length}, and the one failure
          belongs to the documentation rather than to the agent. The rule said
          not to badge a status that is the healthy default for its column. The
          code example directly beneath it badged <code>Delivered</code> next to{' '}
          <code>Delayed</code> and <code>RTO</code>. Asked for a list where three
          of six rows were <code>Delivered</code>, the agent badged all six.
        </p>
        <p className="section__body">
          It had not missed the rule: it reported the contradiction unprompted,
          and followed the example on the grounds that a runnable example is the
          more concrete instruction. That is the right instinct, so the defect
          was in the pair of them, and both were rewritten before these docs were
          committed — the rule now states the decision to make, and the example
          renders <code>Delivered</code> as plain text.
        </p>
        <p className="section__body">
          This is the part of a design system that generators cannot protect.
          Building the API tables from <code>badge.meta.ts</code> stops the facts
          drifting apart, but judgement lives in prose and examples, which no
          generator owns and which a human can write out of step with each other.
          An eval is what catches that, and the row above is left failing because
          it records the run as it happened.
        </p>

        <h3 className="section__heading">What the rule still gets wrong</h3>
        <p className="section__body">
          Making the rule and the example agree settled the contradiction, not
          the question underneath it. In an operations table the status column is
          usually badged on every row, <code>Delivered</code> included. A column
          where some cells are pills and others are bare text reads as ragged, or
          as though the plain rows are missing their value, and a uniform chip is
          what lets the column be scanned at all. On that reading, badging all
          six rows is what a developer would want and what the Figma table would
          show.
        </p>
        <p className="section__body">
          So “badge only the exceptional states” answers the wrong question. What
          decides it is the job the badge is doing. Where the badge is the format
          of a column, every row carries one and the colour does the ranking.
          Where it is a marker laid on top of content that is otherwise plain —
          priority, held, COD — only the rows that deviate get one. The rule is
          sound for the second case and wrong for the first, and it currently
          draws no line between them.
        </p>
        <p className="section__body">
          That line cannot be drawn in prose alone. A fully badged column only
          works if the variants are deliberately ordered by emphasis, so a subtle
          green recedes while warning and error come forward; that ordering is a
          decision in Figma, not a sentence in a doc. The same run found two
          neighbouring gaps — no variant for an in-progress state, which is why{' '}
          <code>In Transit</code> had to borrow <code>info</code>, and no named
          table pattern for either the library or the doc to point at. All three
          belong with the designer before the rule is written a third time, which
          is the useful kind of outcome for an eval to have: it found a missing
          distinction rather than a typo.
        </p>
        <p className="section__body">
          The full write-up, the agent’s own report of what it read and decided,
          and the doc changes the run caused are in{' '}
          <code>eval/README.md</code>. The tables above are read from{' '}
          <code>eval/run-1/grade.json</code>, the same file that fills the tables
          in that write-up.
        </p>
      </section>
    </>
  )
}
