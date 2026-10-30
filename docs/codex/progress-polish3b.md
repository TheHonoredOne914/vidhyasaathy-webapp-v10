# polish3b

## Quiz / right / wrong
- Rebuilt PracticePlay with the mockup question sheet, doodle strip, sticky options, locked confidence feedback and stacked rail. Retained all existing question types and server-only scoring.
- Real lesson hints/formulas, returned misconception feedback, same-round repeated-error recap, actual home XP delta and per-question evidence timing. No invented formula, diagram or teacher attribution.
- Notebook loading, permission, retry, empty and completion states.
- `npm run typecheck`: passed. `npm run test:unit`: 71 files, 287 passed, 1 skipped.
- DB files backed up under `apps/api/data/backups/` before additive demo startup. Only ports 3008/5180 used.
- Screenshot/width verification is in progress; the watched demo API restarts while local files change. The standalone Playwright script uses real demo PIN sessions, never answer keys.

## Remaining
- Progress, homework/worksheet, Ask; final screenshot and numeric width audit.
