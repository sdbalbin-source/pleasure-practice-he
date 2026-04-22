# Kinky Scene Planner Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate `scene-planner-embed-en` into the app as a first-class third module with consistent UX, persistent sessions, and unified visual language.

**Architecture:** Keep the planner logic intact initially, wrap it with an adapter layer inside the existing app shell, then iteratively align data persistence and UI styling. Implement in safe phases: structure first, then data, then behavior refinements, then visual polish.

**Tech Stack:** Single-page HTML/CSS/JS app, localStorage, dynamic DOM rendering, service worker cache/versioning.

---

## Scope and Constraints

- Do not rewrite the planner from scratch.
- Start with integration and controlled adaptation, not deep refactor.
- Preserve existing planner capabilities (chapters, summary, signature, print/copy flow).
- Keep module visual style consistent with existing app (spiral, translucent cards, typography).
- All new behavior must remain mobile-first.

---

## File Map (Planned Touch Points)

- Modify: `index.html`
  - Add planner home flow (`New Session`, `My Sessions`, `About`)
  - Add planner adapter and container rendering
  - Add save/load/list/delete session orchestration
  - Add style unification hooks for embedded planner
- Optional create: `planner_adapter.js` (if splitting is approved)
  - Planner mount/unmount bridge
  - State in/out serialization helpers
- Optional create: `planner_styles_bridge.css` (if splitting is approved)
  - Shared visual token overrides for planner embed
- Modify: `sw.js`
  - Cache/version bumps for deployment sync
- Optional create: `docs/planner-data-model.md`
  - Final schema for stored planner sessions

---

## Phase A: Baseline Integration (No Feature Expansion Yet)

### Task A1: Embed Strategy and Boot Path

**Files:**
- Modify: `index.html`

- [ ] Add a dedicated planner route/view in app state (module-level planner mode).
- [ ] Mount `scene-planner-embed-en` inside a controlled container in the Kinky Scene Planner module.
- [ ] Define clean enter/exit lifecycle (no residual listeners, no duplicate mount).
- [ ] Confirm back navigation returns to planner home, not app root.

### Task A2: Planner Home Information Architecture

**Files:**
- Modify: `index.html`

- [ ] Keep exactly 3 top-level cards:
  - `New Consent & Desires Session`
  - `My Sessions`
  - `About Kinky Scene Planner`
- [ ] Route each card to a real view (no placeholder dead-end).
- [ ] Ensure all three actions are visible on mobile without mandatory scroll.

---

## Phase B: Data and Session Persistence

### Task B1: Session Data Model

**Files:**
- Modify: `index.html`
- Optional create: `docs/planner-data-model.md`

- [ ] Define stable schema for saved sessions:
  - `id`, `title`, `createdAt`, `updatedAt`
  - `plannerState` (serialized full planner state)
  - `summarySnapshot` (optional lightweight preview)
- [ ] Add version field for migration safety (`schemaVersion`).
- [ ] Add validation guard when reading saved sessions.

### Task B2: Storage API (Local First)

**Files:**
- Modify: `index.html`

- [ ] Implement minimal storage helpers:
  - `listPlannerSessions()`
  - `savePlannerSession(sessionPayload)`
  - `loadPlannerSession(id)`
  - `deletePlannerSession(id)`
- [ ] Use one storage key namespace dedicated to planner sessions.
- [ ] Add defensive fallback for corrupted JSON.

### Task B3: My Sessions UX

**Files:**
- Modify: `index.html`

- [ ] Build `My Sessions` list with:
  - open/continue
  - rename
  - delete
- [ ] Add empty state UI.
- [ ] Add confirmation for destructive delete.

---

## Phase C: Requested Behavior Adjustments (User Critical)

### Task C1: Expandable Headers Per Step

**Files:**
- Modify: `scene-planner-embed-en.html` (or adapter-injected DOM behavior in `index.html`, depending on selected strategy)

- [ ] Add collapsible heading behavior for each chapter/step section.
- [ ] Keep default-open behavior for active/current step.
- [ ] Preserve accessibility (`aria-expanded`, keyboard support).
- [ ] Ensure summary chapter remains stable and readable.

### Task C2: Slider Click Auto-Selects "Yes"

**Files:**
- Modify: `scene-planner-embed-en.html` (or behavior layer in integration adapter)

- [ ] When intensity slider is interacted with:
  - auto-set corresponding row status to `yes`
  - mark `Yes` button as active
  - remove disabled state from slider container if needed
- [ ] Do not override explicit `No` unless user actually touches slider again.
- [ ] Add test checklist for edge cases:
  - from `No` -> slider moved
  - from `Maybe` -> slider moved
  - untouched row -> slider moved

---

## Phase D: Visual Language Unification

### Task D1: Shared Design Tokens

**Files:**
- Modify: `index.html`
- Modify: `scene-planner-embed-en.html` (or injected CSS bridge)

- [ ] Align planner visuals with app language:
  - translucent cards (same feel as module cards)
  - spiral background visibility
  - centered typography hierarchy where relevant
  - border/blur/shadow consistency

### Task D2: About Page Consistency

**Files:**
- Modify: `index.html`

- [ ] Match planner About structure with other modules:
  - title block
  - foundations-style sections
  - expandable subsections where needed
- [ ] Keep naming consistent:
  - `About Kinky Scene Planner`

---

## Phase E: Verification and Hardening

### Task E1: Functional Regression Checklist

**Files:**
- Modify: `index.html`
- Modify: `scene-planner-embed-en.html` (if touched)

- [ ] Verify planner chapter navigation works after integration.
- [ ] Verify summary rendering still includes all key fields.
- [ ] Verify signature canvas still works on mobile touch.
- [ ] Verify copy/print actions do not break app shell.
- [ ] Verify save/load/delete sessions in `My Sessions`.

### Task E2: Mobile QA Checklist

**Files:**
- N/A (verification task)

- [ ] Test on narrow viewport Android dimensions.
- [ ] Check keyboard overlap with text inputs/textareas.
- [ ] Check sticky controls and back navigation.
- [ ] Confirm no clipped cards/buttons on planner home.

### Task E3: Deployment Reliability

**Files:**
- Modify: `index.html`
- Modify: `sw.js`

- [ ] Bump build and SW versions on each release phase.
- [ ] Confirm `Force update now` flow updates installed PWA.

---

## Implementation Order Recommendation

1. Phase A (mount + structure)  
2. Phase B (session persistence)  
3. Phase C (two requested behavior changes)  
4. Phase D (visual harmonization)  
5. Phase E (verification + deploy)

---

## Key Product Suggestions (Before Coding)

- Start with adapter integration, not full internal refactor. This reduces breakage risk.
- Keep planner data as full serialized state in early versions; derive summary lazily.
- Treat the two requested behavior changes (`expandable headers`, `slider->yes`) as explicit acceptance criteria in QA.
- Avoid mixing visual redesign and behavior change in one giant commit; split by phase for easier rollback.

---

## Hotfix Round (User-Requested UI/Flow Corrections)

Implementation order for the current correction wave:

1. **Fix corrupted subheading labels and duplicates (critical correctness)**
   - Repair Chapter 3 heading text issues:
     - remove duplicate `🫳🏼 Gentle Touch` in the impact block
     - restore missing `🦶 Impact (spanking, slapping, etc.)` title
     - remove accidental misplaced subheadings inside impact info blocks
   - Scan nearby groups for similar copy/paste corruption and clean it.

2. **Change expand/collapse behavior to subsection level**
   - Keep chapter titles static.
   - Make subsection headers (e.g., Gentle/Rough/Kisses/Impact) collapsible.
   - Default state: collapsed.

3. **Summary filters layout and behavior fix**
   - Remove overlap with summary cards.
   - Restyle filter chips for clearer hierarchy and spacing.
   - Ensure summary content starts below filters on all viewport sizes.

4. **Finish-session flow**
   - Add `Finish Session` action in Summary.
   - On finish: force-save session (name + updated date), then navigate to `My Sessions`.
   - Add easy path from `My Sessions` to summary/share/export (open in summary chapter or equivalent direct access).

5. **Header and navigation layout hardening**
   - Remove top-right share button from planner header.
   - Ensure top step menu is never clipped and can wrap to two lines when needed.
   - Remove custom horizontal drag bar behavior; rely on native touch/wheel scrolling.

6. **Desktop parity pass (not mobile-only)**
   - Ensure planner layout is readable and functional on browser/desktop viewport.
   - Validate no clipping in desktop summary and chapter content.

7. **Regression pass and deploy sync**
   - Re-run lint checks.
   - Bump build/SW cache versions.
   - Deploy and verify visible update on production URL.

