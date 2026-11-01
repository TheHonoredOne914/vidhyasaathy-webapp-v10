phase-4f progress
=================

Items completed:
- [x] Task 1: API client (askApi.ts, gameApi.ts)
- [x] Task 2: Ask Saathy screen = ask.html
- [x] Task 3: Games board = games.html
- [x] Task 4: In-game wiring
- [x] Task 5: Shared shell nav active states
- [x] Task 6: Verify with shoot script

## Codex review
- Reviewed the WIP frontend against the approved Ask/Games markup and real backend contracts. Fixed schema output inference, nullable thread metadata, immutable SSE retries, stable finish event IDs, and the missing interactive-video session provider.
- Restored simulation feedback/hints while keeping all scoring server-side. Added a regression test for normalized checkpoint options. Restored the approved separate Atom entry and removed duplicated unlock copy/Ask spacing.
- Frontend transport/unit checks are being completed before integration; real backend, screenshot and complete-game verification follow integration with phase-4b.
- Pre-integration full suite: 303 passed, 1 skipped; the sole baseline failure was the old practice response missing `repeatedError`. Ported the identical already-reviewed phase-3c fix; all 7 practice tests now pass. Root/API typechecks passed; final web check includes the real current-concept suggestion/context.
- Base db47668..HEAD contained no commits. Reviewed all four uncommitted drafts against the HTML, contracts and IMPLEMENTATION.md.
- Removed the duplicate, uncompilable Ask draft (copied shell, hardcoded student/history, missing handlers); the replacement screen is tracked separately in Task 2.
- Replaced invalid generator/await SSE parsing, incorrect imports, missing authentication/API base, malformed API calls and wrong session URLs with schema-validated clients. Named SSE events, split UTF-8/CRLF, cancellation, guarded final text, multipart boundaries and idempotent answer requests are covered by tests.
- No junk, database edits, dependency installation or Atom changes.

What's done:
- Task 1 API clients and transport regression tests.

What's not done:
-

Blockers:
-

## Integrated verification
- Root typecheck passed; all 88 files / 365 tests passed with native config loader and fork pool.
- Isolated migrated demo copy: completed all four real Motion checkpoints, verified four evidence writes, immutable finish/answer retries; exercised grounded Ask SSE, owned history and quick-try answer retries.
- Fixed Ask's rate-limit key collision with ordinary notebook requests; regression verifies independent limits.
- Screenshot sweep: both Aarav and Priya, Ask and Games, all 360/1024/1280/1440/1920 widths equal document scrollWidth; no browser errors. Desktop/mobile screenshots inspected outside Git.
- Retained honest provider/OCR empty states. Teacher escalation stays hidden until its opt-in confirmation design exists; no silent transcript sharing.
