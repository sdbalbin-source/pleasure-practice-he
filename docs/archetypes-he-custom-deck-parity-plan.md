# Archetypes HE Custom Deck Parity Plan

Goal: keep Hebrew Custom Deck behavior identical to EN canonical logic while allowing localization-only changes.

## EN vs HE parity status (current)

- MATCH: selection model (`__favorites__` + realms as union), localStorage contracts, draw pipeline wiring, card back-nav from `fromView='custom'`, keyboard flip, thresholds.
- DRIFT: data source contract (`ensureArchetypesDataLoaded()` + multi-path manifest probing in HE vs canonical EN `archetypes_data.json` loading contract).
- RISK: strict visual parity cannot be proven without a committed EN runtime source file in this repo.

## Must remain identical

- `toggleArchetypeDeckKey()`, `selectAllArchetypeDeckKeys()`, `clearAllArchetypeDeckKeys()` semantics.
- `getCustomArchetypePool()` union behavior and dedupe by card id.
- Flow: `startArchetypeSpreadDraw()` -> `playArchetypeShuffleThen()` -> `openArchetypeTarotSpread()` -> `renderArchetypeCard()`.
- Thresholds/timings:
  - spread reveal threshold (`outShift > 66`)
  - max spread cards (15)
  - list tap guard (`dx/dy/dt` limits)
- `fromView='custom'` must return to `renderArchetypeDeckBuilder()`.
- localStorage keys:
  - `archetype_favorites_v1`
  - `archetype_deck_keys_v1`

## Localization-safe changes

- Labels/copy (Hebrew wording).
- RTL alignment/spacing.
- Asset filename/path localization, as long as image resolution remains deterministic and behaviorally equivalent.

## Implementation sequence (careful mode)

1. Freeze contracts listed above (no behavior changes).
2. Confirm HE data-load strategy as intentional drift (manifest fallback due deployment topology) and keep guarded loading.
3. Validate Custom Deck states:
   - favorites-only
   - one realm
   - multiple realms
   - favorites + realms
4. Validate draw entry guard on empty selection.
5. Validate back navigation from card to custom deck.
6. Validate keyboard flip and drag reveal threshold behavior.
7. Validate visual states for selected/unselected rows and bulk actions.
8. Run final parity smoke checklist before deployment.

## Parity smoke checklist (current status)

- [x] Empty selection -> no draw, clear guard message.
- [x] Favorites-only selection draws from starred ids.
- [x] Realm-only selection draws from that realm.
- [x] Favorites + realm selection uses union, no duplicates.
- [x] Card opened from custom returns to custom deck on back.
- [x] Flip works with tap and keyboard (`Enter`/`Space`).
- [x] Drag reveal requires outward drag threshold.
- [x] No regressions in favorites persistence after refresh.
- [ ] RTL copy/layout remains readable and consistent (manual visual QA on live site).

## Open risk to close later

- Add EN runtime source file to repo for exact DOM/CSS one-to-one diff in future audits.
