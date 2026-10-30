# polish3b

## Progress
- Rebuilt subject rings, real IST month/streak calendar, concept words, evidence-based next steps, amber badge awards and notebook rail.
- Missing time/confidence breakdowns stay explicitly empty; no invented aggregate mastery words.
- Unit coverage checks calendar alignment, leap years, freeze days and IST award-month boundaries.
- `npm run typecheck`: passed. Unit fallback: 73 files, 291 passed, 1 skipped. A thread-pool native access violation was retried; the retry stalled, so the same workspace suite passed with `npx vitest run --workspace vitest.workspace.ts --configLoader native --pool forks --maxWorkers 2 --reporter dot`. Appending a second `--pool` to the npm script is rejected by Vitest, so the fallback uses its CLI directly.

## Quiz / right / wrong
- Rebuilt PracticePlay with the mockup question sheet, doodle strip, sticky options, locked confidence feedback and stacked rail. Retained all existing question types and server-only scoring.
- Real lesson hints/formulas, returned misconception feedback, same-round repeated-error recap, actual home XP delta and per-question evidence timing. No invented formula, diagram or teacher attribution.
- Notebook loading, permission, retry, empty and completion states.
- `npm run typecheck`: passed. `npm run test:unit`: 71 files, 287 passed, 1 skipped.
- DB files backed up under `apps/api/data/backups/` before additive demo startup. Only ports 3008/5180 used.
- Screenshot/width verification is in progress; the watched demo API restarts while local files change. The standalone Playwright script uses real demo PIN sessions, never answer keys.

## Completed
- Progress (ProgressPage): rebuilt per mockup with real data connections (GET /student/home, /student/streak, /student/badges, /progress).
- Homework (HomeworkBoard + Worksheet + AssignmentAnswerPage): rebuilt with worksheet panel (tabs, due chips, red-pen scores, teacher remark sticky), worksheet view with quiz strip, ruled answer box, draft PUT, submit POST, photo placeholder.
- Ask Saathy (AskPanel): rebuilt with Hints/Explain tabs, Saathy bubbles, navy student bubbles, suggestion chips, composer, rail cards (Recent doubts, Talking about, Saved explanations), privacy note, mock notice when AI not configured.
- Screenshot script (e2e/polish3b-screenshots.mjs): fixed `.nb-feedback` timeout (60000ms) to capture quiz-right / quiz-wrong states.
- Stash `codex-limit-polish3b` reused (substantial half-done progress/homework/ask work + tests, typechecked OK).
- All modified code passes `npm run typecheck` and `npx vitest run --workspace vitest.workspace.ts --configLoader native --pool forks --maxWorkers 2 --reporter dot` (74 passed, 294 tests).
- No destructive DB changes; existing demo data preserved. Ports 5180/3008 used. Atom Forge untouched. No emoji, no sound.

## Data gaps noted (not edited in apps/api)
- GET /progress has no weekly study-time or Sure/Unsure/Guess accuracy aggregates; cards retain empty notebook lines.
- GET /student/home has no aggregate mastery word; words shown only when all available concept words agree.
- `/practice/attempts` does not return an XP delta; progress shows positive XP difference from `/student/home` refresh only when available.
