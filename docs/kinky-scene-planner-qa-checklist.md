# Kinky Scene Planner QA Checklist

Use this quick checklist after each deployment to confirm planner stability and summary fidelity.

## 1) Access and Navigation

- Open app home and enter `Kinky Scene Planner`.
- Verify all three entries appear: `New Consent & Desires Session`, `My Sessions`, `About Kinky Scene Planner`.
- Open `New Consent & Desires Session`, then back to planner home.
- Open `My Sessions`, then back to planner home.

## 2) Session Save/Load Reliability

- Start a new session and fill:
  - Session name
  - Role
  - Duration
  - At least 2 activity rows with different statuses/intensity
- Return to `My Sessions` and verify the new entry appears.
- Confirm session card shows:
  - title
  - updated date/time
  - meta preview (`Role`, `Duration`)
- Reopen the session and verify all values persisted.

## 3) Dynamic "Other" Rows

- In one activity group, add custom `Other` text.
- Set a status and slider intensity for that custom row.
- Leave and reopen the session.
- Confirm custom row exists and keeps:
  - label
  - status
  - intensity

## 4) Requested Behaviors

- Chapter headers:
  - Click chapter title to collapse/expand.
  - `Enter`/`Space` on focused title also toggles.
  - Summary chapter stays readable and stable.
- Slider behavior:
  - From untouched row -> move slider -> status becomes `Yes`.
  - From `Maybe` -> move slider -> status becomes `Yes`.
  - From `No` -> move slider -> status becomes `Yes`.

## 5) Summary Fidelity

- Open summary chapter and verify key fields render:
  - Session details
  - Limits & health
  - Pain/marks/exposure
  - Activity tags and refinements
- Use filters and sort chips; confirm rendering updates consistently.
- Use print/export and confirm content is readable.

## 6) Signature and Share Actions

- Draw in signature pad on mobile touch.
- Navigate away and back to summary; ensure no UI breakage.
- Test `Copy link` action in header and summary area.

## 7) Session Management

- Rename a saved session and verify list updates.
- Delete a saved session and verify confirmation appears and removal succeeds.
- Attempt to open a deleted session from stale UI state (if possible); app should fail safely.

## 8) Mobile UX Sanity

- Test on narrow viewport/mobile device:
  - Stepper can scroll horizontally.
  - Buttons/chips are easy to tap.
  - No clipped controls/cards.
  - Keyboard does not block critical fields irrecoverably.

## 9) PWA Update Validation

- Trigger `Force update now`.
- Reopen app from home-screen icon.
- Confirm build label changed and latest planner behavior is present.
