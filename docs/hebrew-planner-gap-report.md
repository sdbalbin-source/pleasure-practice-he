# Hebrew Planner Gap Report

## Context
Parity review against:
- `scene-planner-embed-en.html` (English reference)
- `hypnocards-v2-he/מצפן התשוקות/index.html`
- `hypnocards-v2-he/מצפן התשוקות/script.js`
- Additional coverage check against product specification DOCX (used as a checklist, not source of truth).

## Closed in recent passes
- URL routing parity for embedded shell usage (`sessionId`, `startChapter`, `autoShare=pdf`).
- Session persistence to `planner_sessions_v1`.
- Shell integration callbacks (`planner_session_finished`).
- Slider behavior parity: moving activity slider auto-activates `yes` when status is empty/no.
- Pain threshold coupling: `tolerable >= desired`.
- Summary filters extended to include `no` and `unanswered`.
- Session name field parity (`sessionName`) in chapter 1 + summary.
- Info button coverage hardening with fallback + accessibility state (`aria-expanded`).
- Dynamic custom activity rows restored from saved session state.
- Defensive state hydration normalization for older/partial session payloads.

## Remaining known gaps (non-blocking for core flow)
- Not all inline info blocks from the English static HTML are represented 1:1 as dedicated nodes in Hebrew HTML; some are provided through dynamic per-item info in JS.
- Hebrew planner still uses print/WhatsApp/copy as share actions rather than the newer consolidated PDF-first flow from English production.
- Full visual parity for summary cards and chapter microcopy remains partially divergent by design.

## Risk notes
- If schema evolves, increase `SESSION_SCHEMA_VERSION` and add migration logic.
- Keep shell and planner session key aligned (`planner_sessions_v1`).

## Next focused tasks
1. Decide whether to adopt English PDF-first share UI in Hebrew planner now or later.
2. Run manual smoke over chapter transitions and summary filters on mobile viewport.
3. Add a minimal migration stub for future schema upgrades.
