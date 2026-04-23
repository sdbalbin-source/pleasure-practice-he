# Hebrew Planner Parity Validation Framework (QA Gatekeeper)

## Purpose

Define independent, objective pass/fail gates to validate Hebrew planner parity against English planner reference before release.

Primary comparison baseline:
- `scene-planner-embed-en.html` (English reference behavior/UI baseline)
- `hypnocards-v2-he/מצפן התשוקות/index.html`
- `hypnocards-v2-he/מצפן התשוקות/script.js`
- Shell integration in `hypnocards-v2-he/index.html`

This framework is release-gating, not exploratory QA.

## Scope

- In scope: functionality, UX flow, visual parity, responsiveness, accessibility, data integrity, embed/shell integration, share/export behavior.
- Out of scope: intentional content localization differences (Hebrew phrasing, culturally adapted wording) unless they break comprehension or workflow.

## Severity Model

- `blocker`: legal/safety/consent risk, data corruption/loss, broken core flow, inaccessible critical path, app crash/hard failure.
- `high`: major workflow degradation, parity breach in primary journeys, severe visual/layout break, incorrect summary/share output.
- `medium`: non-critical parity mismatch, inconsistent interaction behavior, minor a11y gap with workaround.
- `low`: polish issues, small spacing/typography differences, minor copy mismatch with no functional impact.

## Stop-Ship Criteria

Release is blocked if any condition is true:
- Any open `blocker`.
- Two or more open `high` issues in different gate categories.
- One open `high` issue in a core journey gate (`F`, `UX`, `DI`).
- Missing required evidence for any mandatory gate.
- Accessibility critical-path keyboard failure or severe screen-reader failure.
- Data integrity mismatch causing loss, mutation, or wrong persisted values.

Release can proceed only when:
- `blocker = 0`.
- `high = 0` for core gates (`F`, `UX`, `DI`).
- All mandatory gates pass with attached evidence.

## Evidence Requirements (Mandatory)

Each gate result must include:
- Environment metadata: browser/device/OS/version/build hash/date.
- Test run ID and tester name.
- Repro steps (numbered), expected result, actual result.
- Artifacts:
  - full-page screenshots (EN vs HE where relevant),
  - video capture for interaction flows,
  - console/network export for failures,
  - localStorage snapshots before/after critical steps,
  - generated share/export outputs (PDF/print/link payload).
- Verdict per gate: `PASS`, `FAIL`, or `WAIVED` (waiver requires explicit reason + approver).

## Gate Matrix (Objective Pass/Fail)

### F — Functionality Parity Gates

`F1 Core chapter flow parity`
- Requirement: HE supports chapter navigation 1..8 with same logical progression and no dead-ends.
- Pass if: all step buttons navigate correctly; back/forward chapter transitions work; summary chapter opens from normal flow and from shell deep-link.
- Fail if: any chapter unreachable, frozen, duplicated, or state-reset unexpectedly.
- Severity: blocker.
- Evidence: screen recording full run + chapter URL/hash/route states.

`F2 Session lifecycle parity`
- Requirement: create, save, list, open, edit, rename, delete session works.
- Pass if: each operation succeeds and list metadata updates (title/date/role/duration).
- Fail if: operation silently fails, stale list, wrong record modified.
- Severity: blocker.
- Evidence: before/after localStorage dump + UI video.

`F3 Activity selection and intensity logic parity`
- Requirement: slider/status behavior matches baseline (including yes/maybe/no transitions and pain threshold coupling).
- Pass if: moving slider enforces expected status logic; tolerable pain never below desired (or auto-corrects consistently).
- Fail if: contradictory values persist or state drift appears after reload.
- Severity: high.
- Evidence: interaction video + serialized state snapshot.

`F4 Summary fidelity parity`
- Requirement: summary includes all core domains (session, safety, limits/health, activities, refinements, aftercare) with correct values.
- Pass if: sampled field set matches source state and updates with filters/sort.
- Fail if: missing domains, stale values, wrong mapping, filter break.
- Severity: high.
- Evidence: EN vs HE summary screenshots + field mapping checklist.

`F5 Share/export actions parity`
- Requirement: available HE share/export actions produce valid, readable outputs and do not corrupt session data.
- Pass if: each share action completes; output contains current summary state.
- Fail if: missing/empty output, outdated values, app crash, blocked UI.
- Severity: high.
- Evidence: generated outputs + action logs.

### UX — Usability and Interaction Parity Gates

`UX1 Primary journey completion`
- Journeys:
  1) New session to completed summary,
  2) Resume existing session to update summary,
  3) Open summary and share/export.
- Pass if: each journey completed without workaround in <= expected step count (+10% tolerance vs EN).
- Fail if: extra hidden steps, confusion loops, or action discoverability failure.
- Severity: high.
- Evidence: timed moderated run recordings + step count table.

`UX2 Interaction consistency`
- Requirement: chips, toggles, collapsible sections, info buttons, and stepper feel behaviorally consistent with EN.
- Pass if: interaction response <= 150ms median on target devices and states are visually obvious.
- Fail if: non-responsive controls, ambiguous selection states, accidental taps.
- Severity: medium.
- Evidence: interaction clips + timing sample notes.

`UX3 Error/empty-state quality`
- Requirement: missing/deleted/offline scenarios provide safe and actionable feedback.
- Pass if: user can recover without data loss and receives clear next action.
- Fail if: silent failure, stuck state, or misleading message.
- Severity: high.
- Evidence: forced error scenario captures.

### V — Visual Parity Gates

`V1 Layout structure parity`
- Requirement: HE preserves baseline layout hierarchy (header, stepper, chapter cards, summary blocks, actions).
- Pass if: structural sections present and ordered consistently.
- Fail if: missing key sections or hierarchy inversion.
- Severity: high.
- Evidence: annotated EN vs HE screenshots by chapter.

`V2 Component-level visual parity`
- Requirement: control families (buttons/chips/inputs/sliders/cards/info blocks) match style system intent.
- Pass if: no critical contrast/layering/overflow defects; visual diffs within agreed threshold.
- Fail if: clipped controls, unreadable text, broken chip states.
- Severity: medium.
- Evidence: pixel-diff report + manual exceptions list.

`V3 RTL and bilingual rendering quality`
- Requirement: RTL alignment, mixed-language labels, icon/text ordering remain readable and consistent.
- Pass if: no mirrored-control mistakes; punctuation and labels remain legible.
- Fail if: directional confusion, text overlap/truncation in core fields.
- Severity: high.
- Evidence: RTL-focused screenshot set across chapters.

### R — Responsiveness Gates

`R1 Viewport parity`
- Required breakpoints: 360x800, 390x844, 768x1024, 1366x768 (or nearest equivalents).
- Pass if: no blocked critical controls; stepper usable; summary readable; no horizontal trap except intentional chip wraps.
- Fail if: tap targets inaccessible, keyboard blocks required fields without recovery.
- Severity: high.
- Evidence: per-breakpoint video + screenshot pack.

`R2 Input modality resilience`
- Requirement: touch + mouse + keyboard operate critical flows.
- Pass if: same core tasks complete under each modality.
- Fail if: modality-specific dead control or focus trap.
- Severity: medium.
- Evidence: modality matrix checklist with clips.

### A — Accessibility Gates

`A1 Keyboard operability`
- Requirement: all critical controls reachable and actionable via keyboard.
- Pass if: visible focus, logical tab order, no trap, chapter toggles and actions work via Enter/Space where applicable.
- Fail if: any core action mouse-only.
- Severity: blocker.
- Evidence: keyboard-only run recording.

`A2 Screen reader semantics`
- Requirement: meaningful labels/roles for navigation, form inputs, stepper, status updates, and summary.
- Pass if: NVDA/VoiceOver smoke reads core path understandably.
- Fail if: unlabeled critical controls, misleading announcements.
- Severity: high.
- Evidence: SR transcript snippets + video/audio.

`A3 Contrast and readability`
- Requirement: text and interactive states meet WCAG AA for critical content.
- Pass if: measured contrast passes for body text, labels, active/inactive chip states, and alerts.
- Fail if: any critical text or state indicator below threshold.
- Severity: high.
- Evidence: contrast measurement report.

### DI — Data Integrity Gates

`DI1 Schema and persistence integrity`
- Requirement: session objects remain valid across create/edit/reload.
- Pass if: required fields present, types stable, and no destructive migration side effects.
- Fail if: malformed session, missing keys, or failed load due to schema drift.
- Severity: blocker.
- Evidence: JSON schema validation output + storage snapshots.

`DI2 Cross-surface consistency`
- Requirement: shell list (`planner_sessions_v1`) and embedded planner state remain synchronized.
- Pass if: rename/delete/edit reflects in both surfaces immediately after refresh/reopen.
- Fail if: divergence between shell cards and planner summary.
- Severity: high.
- Evidence: synchronized before/after captures from shell + planner.

`DI3 Non-destructive share/export`
- Requirement: share/export actions do not mutate or erase session state.
- Pass if: checksum/hash of persisted session unchanged except expected metadata timestamps.
- Fail if: content mutation unrelated to user edits.
- Severity: high.
- Evidence: pre/post serialized state diff.

## Mandatory Test Packs

- `Pack P0 (Release blocker pack)`: F1, F2, F4, UX1, R1, A1, DI1, DI2.
- `Pack P1 (Quality gate pack)`: F3, F5, UX2, UX3, V1, V3, A2, A3, DI3.
- `Pack P2 (Polish pack)`: V2, R2 and all low-priority parity checks.

Minimum release requirement:
- P0: 100% pass.
- P1: >= 90% pass with no open high issues.
- P2: tracked, not stop-ship unless promoted by risk review.

## Execution Protocol (Independent Validation)

1. Freeze comparison baseline (commit hash/tag for EN and HE).
2. Run P0 on clean profile and warm profile (existing sessions).
3. Run P1 on at least one mobile and one desktop browser.
4. Run P2 and log non-blocking deltas.
5. Hold triage: assign severity, owner, ETA.
6. Re-run only affected gates + impacted adjacent gates.
7. Final release verdict signed by QA Gatekeeper.

## Defect Triage Rules

- Any defect touching consent/safety wording, hard-limits handling, or summary correctness defaults to `high` until disproven.
- Any reproducible data loss is `blocker`.
- Any a11y failure on the primary journey is at least `high`.
- Visual-only deltas are `low/medium` unless they hide or misrepresent state.

## Handoff Template (for Implementer Agent)

For each failed gate, provide:
- Gate ID:
- Severity:
- Environment:
- Repro steps:
- Expected vs actual:
- Evidence links/files:
- Suspected root cause area (`index.html`, `script.js`, shell integration, styles):
- Fix proposal:
- Retest scope (which gates must be rerun):

This framework is approved for implementer handoff once baseline hashes and target environments are filled in.
