# Hebrew App Smoke Checklist

## Goal
Quick regression pass after parity updates in Hebrew shell/modules.

## Scope
- Hebrew shell (`hypnocards-v2-he/index.html`)
- Archetypes (`hypnocards-v2-he/archetypes-he/`)
- Planner (`hypnocards-v2-he/מצפן התשוקות/`)
- Hypno (`hypnocards-v2-he/דפוסי שפה עברית/`)

## Checklist

### Shell
- [ ] Home renders all 3 module cards + About + System Status.
- [ ] System Status runs checks and updates summary counts.
- [ ] Planner/Hypno/Archetypes iframes show loading fallback if delayed.
- [ ] Force update banner flow appears only when update is available.

### Archetypes
- [ ] Shuffle & Draw works (tap and drag both select).
- [ ] Custom Deck filters affect active draw deck.
- [ ] All Cards search + favorite toggles persist after refresh.
- [ ] About shows assets coverage and exports missing-assets CSV.

### Planner
- [ ] New session opens planner from shell.
- [ ] Saved sessions list appears in shell (`My Sessions`).
- [ ] Open/Edit/Share PDF actions route to correct chapter/behavior.
- [ ] Activity slider sets status to `yes` if status is empty/`no`.
- [ ] Pain thresholds enforce: tolerable >= desired.
- [ ] Summary filters support all/yes/maybe/no/unanswered.
- [ ] Info buttons open content in all configured chapters.

### Hypno
- [ ] Boot does not crash when localStorage has invalid JSON.
- [ ] Favorites/recordings persist.
- [ ] Reset clears only hypno keys (not all localStorage).

## Notes
- Visual archetype fronts are intentionally excluded until assets are ready.
