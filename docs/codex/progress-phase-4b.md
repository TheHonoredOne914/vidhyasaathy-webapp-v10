# phase-4b

Base: db47668. Backend only; no frontend/Atom Forge edits.

## Codex review
- No commits after the base; no prior branch progress file. Reviewed all five uncommitted files against the task and v10 Ask/Games contracts.
- Replaced invalid async iterators, duplicate exports, parsed-result return bugs, fake draft questions, import-time environment reads, credential-leaking upstream errors and placeholder streaming.
- Kept the grounded stub/HTTP provider intent; implemented cancellation, bounded SSE parsing, config-only registry and private vision providers.
- Restored unrestricted evidence source compatibility. The untracked, unapplied 0040 draft has invalid foreign keys, duplicate source ALTER and missing tables; replacing it in the additive-schema item, not running it.
- Backed up the local demo DB with SQLite's online backup API under ignored apps/api/data/backups/ before any migration.

## Items
- Provider registry implemented; verification pending.
- Schema, Ask pipeline/routes/safety, Today follow-ups and games: pending.

No UI built; scrollWidth: not applicable (backend run).

## Codex integration review — 2026-11-01 (NOT merge-ready)
- Integrated reviewed phase-3c/polish3a from rebuild-local, preserving both notebook and phase-4 routes/contracts and the additive migration sequence. Atom is not yet integrated here.
- Fixed seed compilation and removed fabricated cross-topic game mappings (for example cell questions mapped to fractions and coordinate geometry mapped to motion). Only exact chapter/concept MCQs are mapped, without editing existing content; added an in-memory idempotency/content-preservation regression. Missing coverage is not fabricated.
- Preserved untracked apps/apps/ and seven scratch scripts outside Git at C:/Users/HP/phase-4b-review-preserved; no DB migrated, reseeded or deleted during this review.
- BLOCKERS: games routes still use fake concept IDs and incorrect snake_case/camelCase raw SQL; start/answer/finish lack robust idempotency, ownership/game pairing and published chapter gating. Answer writes bypass canonical learning/mastery and streak handling; XP and personal-best computation are incorrect. All nine real games need authored checkpoint coverage, 0.5-weight evidence with no game-only mastery promotion, and route regressions. Do not expose or merge these routes yet.
- BLOCKERS: Ask quick-try marking, opt-in teacher escalation and teacher-own-section retrieval are unfinished. Snap capability status is hardcoded false; cancellation, citation enforcement, concurrent replay and parent/admin privacy need stronger tests. Provider/schema work is retained, not declared complete.
- phase-4f and review-3bc have NOT been reviewed or merged. Resume with phase-4b; do not skip these blockers merely because typecheck/unit tests pass.
- Verification of this partial review: `npm run typecheck` passed; native/forks workspace Vitest passed 81 files, 331 tests, with one pre-existing skipped test. Logs: %TEMP%/vs-4b-types-review.log and %TEMP%/vs-4b-tests-review.log. This does not establish games/Ask completion; the missing coverage above remains a merge blocker.

## Completed backend integration review
- Integrated the approved atom-kz changes. Atom remains exploratory and available; its scored-session endpoints remain 404. The old paused-Atom instruction is superseded by the current approved work.
- Replaced fabricated game routes with owned, published-section-gated, frozen real checkpoints; transactional start/answer/finish replay; server scoring; historical personal best and canonical XP. Board links use the actual chapter/engine route, not a nonexistent games route.
- Added 36 authored NCERT checkpoints across the nine existing games. Demo seeding is additive/idempotent and preserves existing content and mappings. No existing DB was migrated or seeded in this integration review.
- Routed game and Ask answers through canonical evidence, weighted mastery, streaks and awards. Half-weight answers cannot alone establish/promote mastery or move the ladder, including learner rebuilds. Ask uses the existing compatible `practice` source with additive `source_detail='ask'`, avoiding a destructive CHECK/table rebuild.
- Finished owned, expiring quick tries, wrong-answer follow-ups, explicit teacher escalation and current-section/subject-authorized replies. Replies survive raw-message expiry. Added the documented item-specific quick-try endpoint, retained the old alias, and returned real concept/chapter/subject metadata and earned XP.
- Added request cancellation/timeouts, guarded whole-response SSE, actual snap capability, concurrent Ask replay protection and privacy-preserving doubt aggregation. Retained the provider, injection/homework/PII/budget tests from the earlier review.
- Added route regressions for replay collisions, ownership, roles, incomplete rounds, pre-answer key exclusion, weighted writes, follow-ups and teacher replies. UI integration requirements are in `ui-todo-phase-4b.md`.
- Final verification passed: full workspace typecheck; native/forks workspace Vitest, 86 files and 354 tests. The final concept-context fallback and privacy-expiry regression also passed API typecheck and all three games/Ask integration tests. Tests run serially with 60-second test/hook limits because this laptop timed out concurrent files at the default 15 seconds; assertions are unchanged.
- The historical blockers above are resolved by this integration review. Ready for phase-4f integration; existing demo databases remain untouched until backed-up deployment migration.
