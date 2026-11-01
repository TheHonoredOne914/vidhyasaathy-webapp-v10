# polish3a progress

## Integration review — 2026-11-01
- Integrated reviewed phase-3c prerequisite fixes; final typecheck passed and forks tests passed (77 files, 312 passed, 1 skipped). No fresh browser captures claimed in this review.
- Reviewed all session-player changes, local note isolation, public-question boundaries and mockup markup. Replaced raw server errors with retryable notebook copy, retaining remediation links; added a private-error regression assertion.
- Removed generated screenshots from the Git index only (local captures preserved).
- Study sessions currently aliases HomeworkBoard in the shared router; no unmocked replacement screen added. Missing diagram/teacher/timing API fields remain documented in data-gaps-polish3a.md.

## 1. Quick data fixes

- Home already renders `/student/home.todaysGoal`; subject path now uses the same source, with loading, retry and empty states.
- Subjects retain the Time this week card with an honest empty line; measured weekly minutes are unavailable (see data-gaps-polish3a.md).
- Path header explicitly labels completed ideas, distinct from the next station's ordinal, using the same concepts/mastery source.
- Verification: `npm run typecheck` passed; `npm run test:unit` passed (287 passed, 1 skipped). Screenshots/viewport checks follow the learn-flow rebuilds.

## 2a. Distance & Displacement lesson data

- Added the supplied source in the existing Motion lesson format, linked to the existing concept and prerequisites. Three checkpoints, six flashcards, worked/faded examples and existing interactive block types; no new game or schema change.
- Added API coverage for loading, Hindi terms, answer-key redaction and server checking. No demo database modified; tests use isolated databases.
- Verification: `npm run typecheck` passed; `npm run test:unit` passed (288 passed, 1 skipped).

## 2b. Lesson notebook

- Rebuilt the student ConceptPage around the lesson mockup: real style tabs, bridge, checkpoints, worked/faded examples, misconception, contents rail and page-scoped Ask. Teacher view retained.
- Preserved server checking, simpler explanations, explain-back, flashcard ratings and revision scheduling. Empty video card does not invent a video ID.
- Scoped the landing graph-paper background out of notebook grids; landing page is unchanged.
- Verification: `npm run typecheck` passed; `npm run test:unit` passed (288 passed, 1 skipped). Lesson viewport checks: 360/360, 1024/1024, 1280/1280, 1440/1440, 1920/1920 (scrollWidth/innerWidth). Final screenshots will be refreshed after all screens.

## 3. Diagnostic notebook

- Rebuilt the question sheet and rail from the diagnostic mockup, using only the API's prerequisite questions and source references. No marks or inferred correctness before submission.
- The not-taught option hides confidence and records `not_taught` through the existing no-penalty API. Back preserves answers; submission stays server-scored. Loading, unavailable, empty, retry and denied states retained.
- Verification: `npm run typecheck` passed; `npm run test:unit` passed (288 passed, 1 skipped). Diagnostic viewport checks: 360/360, 1024/1024, 1280/1280, 1440/1440, 1920/1920. Inspected populated 1440 and 360 screenshots; rail stacks rather than disappearing.

## Codex review (restart)

- Reviewed `b49dfcb..HEAD` (no newer commits), the preserved session-player changes and `codex-limit-polish3a`; retained the useful in-progress implementation without resetting or applying the older duplicate stash.
- Corrected the Study sessions return link, used notebook line icons, isolated cursor state by session, retained server-only checking and added regression coverage for empty/loading/error/check/completed states and every public question type.
- Slide notes are scoped to student/session/slide and explicitly device-local. Blocked storage reports an error rather than claiming a save. Teacher-only question content is never rendered.

## 4. Session player notebook

- Completed the grid-paper slide, real progress, teacher-note empty state/link, Back/dots/Next controls and rail with scoped Ask, per-slide note and available slides. Future slide content remains server-redacted; no invented diagram, remark or timing.
- The original demo database was opened read-only and copied to `apps/api/data/polish3a-verify.db` before attempting isolated verification; no migration or seed was run against the original.
- `docs/codex/routes-todo.md` is absent in this worktree; no pending route wiring was found.

## 5. Browser verification (restart)

- Demo started hidden on the assigned ports (API 3007, web 5179, RATE_LIMIT_MAX 5000); `apps/api/data/*.db` backed up first to `%TEMP%\opencode\db-backup-polish3a`. Screenshots via `e2e/shoot-polish3a.mjs` (playwright chromium, no MCP browser).
- Viewport checks (scrollWidth/innerWidth) pass at 360/1024/1280/1440/1920 for home, subjects, subject-path, lesson, diagnostic and session-player; Priya home at 1440 passes. No `[role=alert]` on any populated sheet; every screen has a populated `h1`.
- Smokes pass: lesson (style tabs, server checkpoint, simpler explanation), diagnostic (confidence hidden for not-taught, Back keeps answers, `not_taught` payload = `NOT_TAUGHT` marker, retryable network failure), session (device note survives reload, advance gate).
- Real-data findings handled: Aarav's session slide 1 is correctly gated by the server's remediation 409 (smoke now asserts the remediation link instead of assuming advance); diagnostic not-taught sends `Haven't learned this yet` with `timeMs`, which is the API's NOT_TAUGHT marker (script assertion corrected, client was right).
- Mockup parity fixes: subject-path subject heading is now the page `h1` (same `nb-h2` styling); session-player header gained the sky subject chip (`/student/subjects` via chapter subjectId; teacher name is a logged data gap) and the dot row now renders `total` dots with disabled placeholders for server-redacted slides.
- Verified screenshots against `docs/mockups-v10-final/png` for session-player, lesson and diagnostic at 1440.
