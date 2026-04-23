# Hebrew Planner Full Task Checklist (2026-04-23)

## Scope
- Verify and fix Hebrew planner parity with the agreed behavior and English reference.
- Work task-by-task with explicit validation after each fix.

## Tasks
- [x] Confirm deploy target and latest commit are on `he/main` for `pleasure-practice-he`.
- [x] Confirm full consent text is present in summary section.
- [x] Confirm summary filters parity (`all_form`, `answers`, `yes`, `maybe`, `no`, `unanswered`).
- [x] Confirm summary open text fields are shown with contextual headings.
- [x] Confirm summary share copies/sends summary-only link (chapter 8 deep-link).
- [x] Confirm save/finish messaging includes `sessionId`.
- [x] Confirm shell back uses `planner_request_save` handshake before exit.
- [x] Fix direct slider drag behavior from initial state.
- [x] Fix signature drawing reliability on mobile and desktop.
- [ ] Re-validate live deploy behavior on user device after push.

## Root Causes Found
- Slider was initialized inside `.slider-container.disabled` and CSS had `pointer-events:none`, blocking direct drag.
- Signature canvas relied on pointer events but lacked strong mobile safeguards (`touch-action:none`, pointer capture/cancel handling).

## Fixes Applied
- Removed `pointer-events:none` from disabled slider container in both Hebrew planner style files.
- Added `touch-action:none` and selection lock to signature canvas in both Hebrew planner style files.
- Added slider fallback event hooks (`mousedown`, `touchstart`) in both Hebrew planner script files.
- Hardened signature interaction with `preventDefault`, pointer capture, and `pointercancel` handling in both Hebrew planner script files.

## Files Touched For This Round
- `hypnocards-v2-he/planner-he/style.css`
- `hypnocards-v2-he/planner-he/script.js`
- `hypnocards-v2-he/מצפן התשוקות/style.css`
- `hypnocards-v2-he/מצפן התשוקות/script.js`
