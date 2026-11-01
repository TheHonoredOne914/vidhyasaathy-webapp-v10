# review-3bc: Codex review

- Reviewed the original progress/homework/worksheet/Ask and teacher/parent/sign-in changes against approved notebook markup. Retained real-data rendering and the useful WIP fixes; no invented student statistics.
- Fixed worksheet drafts that claimed to save but disappeared on reload: added an owned, assignment-scoped read endpoint and hydrated text/matching answers. Regression coverage includes updates, peer isolation, role denial and invalid items.
- Corrected parent week boundaries to Monday midnight in India, with Sunday-boundary regression assertions.
- Ported the already-reviewed practice repeated-error response fix; retained upstream work.
- Before integration: root typecheck passed; 76 test files passed, 297 tests passed, one pre-existing skip (fork pool).
- Integrated visual and final regression checks follow the phase-4f merge. Missing backend confidence/time aggregates remain honest empty states, not mock data.
- Integrated typecheck passed; 90 files / 368 tests passed with the fork pool. Restored the complete upstream Ask component after resolving the integration conflict.
- Final browser QA: progress, homework, worksheet, Ask, teacher/parent home and all three sign-in screens at 390/1024/1280/1600/1920px: 45 measurements, no horizontal overflow or browser errors. Screenshots: `C:/Users/HP/review-3bc-shots`.
- Fixed progress cards shrinking to content width and made subject tiles fill the available row using the real subject count. Visually checked desktop progress/teacher/parent/worksheet and mobile homework/sign-in.
- Kept QA on a backed-up, isolated database. Preserved generated `apps/apps` outside the worktree in `C:/Users/HP/review-3bc-review-preserved`; no user data discarded.
