# Phase 3C backend progress

## Acceptance audit
- Existing seed tests cover Aarav/Priya/Rohan next actions; core tests cover freeze boundaries, IST midnight and nightly replanning.
- Added next-day warm-up skip, challenge evidence/double-submit, empty challenge completion, Dushman retirement and badge idempotency coverage.
- Fixed mastered concepts being selected as Dushman again; challenge answers are now idempotent per question, limited to their IST day, and empty finishes cannot earn XP/streak credit.
- Added an AST-based student workspace copy guard, excluding code identifiers/attributes and the public sign-in screen.
- Committed the audit as the first piece; restored the resumed working state (stash `codex-limit-phase-3c` was already applied to the worktree; verified patch equality before keeping it, and the stash is retained, not dropped).
## Notebook backend

- Added school-scoped subject paths, subjects board, progress, parent/teacher home and existing-games read models, with role-negative tests.
- Added persisted per-profile learning preferences and quiz rounds in additive migration 0014; database backups completed before migration work (three existing `.db` files).
- Added notebook lesson tabs, prior-class bridges, diagnostic source classes/summary and server-owned quiz strips/repeated-error feedback. Answer keys stay out of read models.
- Demo launcher defaults to 5000 requests / 500 authentication requests only when the corresponding environment variable is unset; production defaults are unchanged.
- Fixed notebook test enrollment: role-created pupils need `rollNumber` with `sectionId` (school trigger rejects otherwise), and matched the diagnostic expectation to the locked core contract — an all-"Haven't learned this yet" submission leaves every chapter concept's `masteryLevel` null (still "New"; the repair entrance comes from `diagnosticEntry`, covered by `packages/core/learning.test.ts`).
- Cleaned double indentation in the resumed edits (daily service, diagnostic route, tests, app registration). No logic changes.
- Verification: `npm run typecheck` green; full workspace suite with `npx vitest run --workspace vitest.workspace.ts --configLoader native --pool forks --reporter dot`: 72 files, 297 passed + 1 skipped.

