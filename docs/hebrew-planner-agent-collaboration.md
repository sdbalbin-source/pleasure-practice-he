# Hebrew Planner Multi-Agent Collaboration Protocol

## Agents Created
- `Lead Architect` - scope, priorities, final decisions.
- `Parity Analyst` - maps EN vs HE gaps into actionable tickets.
- `Planner Implementer` - applies code changes in Hebrew planner module.
- `Shell Integrator` - validates shell/embed/session flows in Hebrew shell.
- `QA Gatekeeper` - independent pass/fail validation by gate matrix.
- `Data & Migration` - schema compatibility, storage integrity, migration policy.

## Source of Truth
- EN baseline: `scene-planner-embed-en.html`, `index.html`
- HE targets: `hypnocards-v2-he/index.html`, `hypnocards-v2-he/מצפן התשוקות/index.html`, `hypnocards-v2-he/מצפן התשוקות/script.js`, `hypnocards-v2-he/מצפן התשוקות/style.css`
- QA framework: `docs/hebrew-planner-parity-validation-framework.md`
- Tracking docs: `docs/hebrew-planner-gap-report.md`, `docs/hebrew-smoke-checklist.md`

## Handoff Contract (Required)
Each agent handoff must include:
- `task_id`
- `owner_role`
- `inputs` (files, constraints, baseline refs)
- `change_plan`
- `expected_outputs`
- `acceptance_tests` (QA gate IDs)
- `status`
- `blocking_reason` (if blocked)

## Collaboration Loop
1. `Parity Analyst` creates/updates prioritized task queue.
2. `Planner Implementer` and `Shell Integrator` execute tasks in small batches.
3. `QA Gatekeeper` validates against mandatory gates (`P0`/`P1`) with evidence.
4. `Data & Migration` validates persistence compatibility for touched session fields.
5. `Lead Architect` resolves conflicts and approves next batch.
6. Repeat until no open `blocker`/`high` in core gates.

## Conflict Rules
- Severity order: data integrity > core flow > UX parity > visual polish > docs.
- English behavior wins by default unless explicit Hebrew divergence is approved.
- Any unresolved conflict over 20 minutes escalates to `Lead Architect`.

## Stop-Ship Rules
- Any open `blocker`.
- Any open `high` in `F`, `UX`, or `DI` gates.
- Missing evidence on mandatory gates.

## Active Sprint Backlog (Current)
1. `PLNR-P1-002` - Validate shell routing + open/edit/share contracts.
2. `PLNR-P1-004` - Fix highest-impact parity gaps in planner core flow.
3. `PLNR-P1-006` - Mobile viewport smoke for stepper/chapter transitions.
4. `PLNR-P2-010` - Saved session reopen/edit/share reliability.
5. `PLNR-P3-011` - Refresh planner gap report with post-fix truth.

## Super-Goal (Formal)
Ship the Hebrew Planner as a release-gated, English-parity module that completes all core journeys (new, resume/edit, summary/share) with:
- `blocker = 0`
- no open `high` in core gates (`F`, `UX`, `DI`)
- validated shell/planner data integrity

## Milestones (Measured)
1. Baseline lock + parity gap classification by gates/severity.
2. Core flow and data parity closure (`F1`, `F2`, `F4`, `DI1`, `DI2`).
3. Shell/embed contract stability + smoke pass.
4. Quality convergence (responsive + accessibility + UX) with P1 threshold.
5. Release readiness evidence + QA gatekeeper signoff.

## QA Completion Threshold
- `P0`: 100% pass
- `P1`: >= 90% pass
- No stop-ship trigger from `docs/hebrew-planner-parity-validation-framework.md`
