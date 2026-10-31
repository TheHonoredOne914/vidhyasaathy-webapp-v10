phase-4f progress
=================

Items completed:
- [x] Task 1: API client (askApi.ts, gameApi.ts)
- [ ] Task 2: Ask Saatty screen = ask.html
- [ ] Task 3: Games board = games.html
- [ ] Task 4: In-game wiring
- [ ] Task 5: Shared shell nav active states
- [ ] Task 6: Verify with shoot script

## Codex review
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

ScrollWidth numbers ( Aarav / Priya at 360/1024/1280/1440/1920 ):
- ask panel: 
- games board:
