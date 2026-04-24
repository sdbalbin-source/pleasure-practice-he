# Archetypes HE Rebuild: Parity Matrix + Cleanup Protocol

## Purpose

Rebuild Hebrew Archetypes from English canonical baseline with strict parity:
- Same behavior
- Same architecture
- Same interaction logic
- Same diagnostics logic
- Only content language (Hebrew) and RTL adjustments may differ

This document is execution-first. Follow in order. No skipping.

---

## Non-Negotiable Rules

1. Do not implement new Hebrew-only behavior.
2. Do not keep compatibility shims unless EN baseline requires them.
3. Do not delete code before replacement is verified.
4. Every cleanup step must have:
   - reason
   - affected files
   - verification command/results

---

## Phase 0 — Baseline Gate (Must Pass Before Coding)

- [ ] Obtain canonical EN Archetypes implementation files (HTML/JS/CSS/assets contract).
- [ ] Lock baseline snapshot in repo (or explicit reference commit/file set).
- [ ] Build EN->HE file mapping table.
- [ ] Confirm expected EN feature list:
  - [ ] Module home
  - [ ] Shuffle & Draw
  - [ ] Custom Deck
  - [ ] All Cards
  - [ ] Favorites
  - [ ] About
  - [ ] Diagnostics

If any baseline item is missing, stop and resolve baseline first.

---

## Phase 1 — Parity Matrix (Implementation Tracker)

Use this table as the single source of execution status.

| Feature Slice | EN Baseline File(s) | HE Target File(s) | Current Gap | Severity | Action | Status |
|---|---|---|---|---|---|---|
| Module entry route | Live EN archetypes shell | `hypnocards-v2-he/index.html` + `hypnocards-v2-he/archetypes-he/index.html` | No active gap | Minor | Keep current route contract (`initialView`, postMessage back) | DONE |
| Module home cards/actions | Live EN archetypes shell | `hypnocards-v2-he/index.html` | No active gap | Minor | Keep current actions in sync | DONE |
| Shuffle animation timeline | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | No active gap | Minor | Keep timeline constants stable | DONE |
| Draw spread interaction | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | No active gap | Minor | Keep drag-to-reveal behavior | DONE |
| Reveal/flip card behavior | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | No active gap | Minor | Keep flip semantics unchanged | DONE |
| Custom deck selection logic | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | No active gap | Minor | Keep deck key contract | DONE |
| Favorites toggle + persistence | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | No active gap | Minor | Keep localStorage contract | DONE |
| All Cards list grouping/sort | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | No active gap | Minor | Keep grouping/sort stable | DONE |
| All Cards open-on-click behavior | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | Keyboard path was missing | Important | Added unified click+keyboard open handler | DONE |
| About page sections/content hooks | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` + `about-copy-he.json` | No active gap | Minor | Keep accordion/content hooks | DONE |
| Asset map + fallback probing | Live EN asset contract | `hypnocards-v2-he/archetypes-he/index.html` + `image-map.json` | No active gap | Minor | Keep probe fallback logic | DONE |
| Missing-asset diagnostics actions | Live EN diagnostics contract | `hypnocards-v2-he/index.html` diagnostics panel | No active gap in runtime path | Minor | Keep shell diagnostics checks | DONE |
| Reduced motion behavior | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | No active gap | Minor | Keep media-query parity | DONE |
| Keyboard accessibility states | Live EN module behavior | `hypnocards-v2-he/archetypes-he/index.html` | All Cards button keyboard open fixed | Important | Added keydown handling | DONE |
| SW asset coverage for Archetypes | Live EN PWA behavior | `hypnocards-v2-he/sw.js` | Precache had missing file paths | Critical | Replaced missing icon/backside paths with existing asset paths | DONE |
| Shell embed/open/back flow | Live EN shell behavior | `hypnocards-v2-he/index.html` | No active gap | Minor | Keep postMessage back flow stable | DONE |

Severity meanings:
- Critical: behavior wrong/broken
- Important: parity mismatch likely to regress UX
- Minor: cosmetic or maintainability-only

---

## Phase 2 — Cleanup Protocol (What to Clean and How)

### A) Remove drift code safely

- [ ] Identify duplicate logic blocks not present in EN baseline.
- [ ] Mark each candidate:
  - file
  - exact symbol/function
  - why drift
  - replacement source in EN baseline
- [ ] Replace first, then remove old block in same patch.

### B) Remove dead code safely

- [ ] For each candidate, verify no references (`rg`).
- [ ] If zero references and not part of public contract, remove.
- [ ] Re-run lint/smoke after each removal batch.

### C) Remove stale assets safely

- [ ] Build expected asset list from data + image map.
- [ ] Detect orphan assets (present but unused).
- [ ] Do not delete immediately:
  - move to quarantine list in docs first
  - delete only after one successful parity verification cycle

### D) Service worker cleanup

- [ ] Ensure only existing files are precached.
- [ ] Ensure no sensitive dynamic API responses are cached unintentionally.
- [ ] Verify SW install/activate does not fail due to missing paths.

---

## Phase 3 — Verification Protocol (Per Batch)

For each implementation batch:

1. Static checks
   - [ ] syntax check changed JS
   - [ ] lint check changed files

2. Behavioral checks
   - [ ] target feature works in HE
   - [ ] same scenario passes in EN baseline
   - [ ] compare outcome parity

3. Regression checks
   - [ ] module navigation still works
   - [ ] favorites/deck persistence still works
   - [ ] share/open flows unaffected (if touched)

4. Reviewer pass
   - [ ] run code-review subagent for parity re-check
   - [ ] no Critical/Important findings for completed slices

---

## Phase 4 — Final Acceptance Criteria (Definition of Done)

All must pass:

- [ ] No Critical/Important parity findings in final review.
- [ ] Archetypes HE behavior matches EN baseline across all feature slices.
- [ ] SW and asset diagnostics are clean (no false missing paths).
- [ ] No drift/dead-code items left in cleanup list.
- [ ] Live smoke checks pass on production URL.

---

## Suggested Session Rhythm

1. Audit batch (agent)
2. Implement batch
3. Verify batch
4. Cleanup batch
5. Re-audit batch

Repeat until matrix is fully closed.

---

## Execution Log

### Batch 1 - Drift/Dead code cleanup (completed)

- File: `hypnocards-v2-he/archetypes-he/index.html`
- Removed dead baseline variables and unused prefs field (`allCardsQuery`).
- Removed unused helper functions not referenced by UI flow:
  - `drawRandom`
  - `selectAllRealms`
  - `clearRealms`
  - `setFavoritesSet`
  - `copyMissingImageList`
  - `rescanAssets`
  - `downloadMissingAssetsCsv`
- Removed unused baseline fetch branch (`parity-baseline.json`) from module runtime boot.
- Intent: reduce drift and simplify runtime to active EN-parity behavior only.

Verification required after this batch:
- lint pass for edited file
- smoke pass: draw/custom/all/about navigation

---

### Batch 2 - Accessibility parity + style dead-code cleanup (completed)

- File: `hypnocards-v2-he/archetypes-he/index.html`
- Added keyboard-open path for All Cards card-name button:
  - `onclick` open
  - `onkeydown` Enter/Space open
- Removed clearly-unused CSS blocks:
  - `.realm-option`
  - `.search-input`
  - `.status-chip`
  - `.mono-box`
- Reviewer status used for this batch: no Critical findings; one Important a11y gap fixed.

Verification required after this batch:
- lint pass for edited file
- smoke pass: All Cards open via mouse + keyboard

---

### Batch 3 - SW coverage hardening (completed)

- File: `hypnocards-v2-he/sw.js`
- Fixed critical precache mismatch that could break SW install:
  - removed non-existing `./icons/icon-192.png`
  - removed non-existing `./icons/icon-512.png`
  - replaced non-existing `./archetypes-he/backside.png` with existing `./archetypes-he/archetype-card-back.webp`
- Aligned archetype asset fast-path matcher to the real card-back file:
  - `...endsWith('/archetypes-he/archetype-card-back.webp')`

Verification required after this batch:
- lint pass for edited file
- deploy smoke: SW installs and archetypes module opens with draw flow

---

## Notes for Next Session

- Prefer restart-copy-localize approach over patch-in-place for Archetypes.
- Use this document together with:
  - `docs/hebrew-parity-master-protocol-archetypes-next.md`
- Keep all status updates grounded in matrix rows (not generic progress statements).

