# review-3bc: Codex review

- Reviewed the original progress/homework/worksheet/Ask and teacher/parent/sign-in changes against approved notebook markup. Retained real-data rendering and the useful WIP fixes; no invented student statistics.
- Fixed worksheet drafts that claimed to save but disappeared on reload: added an owned, assignment-scoped read endpoint and hydrated text/matching answers. Regression coverage includes updates, peer isolation, role denial and invalid items.
- Corrected parent week boundaries to Monday midnight in India, with Sunday-boundary regression assertions.
- Ported the already-reviewed practice repeated-error response fix; retained upstream work.
- Before integration: root typecheck passed; 76 test files passed, 297 tests passed, one pre-existing skip (fork pool).
- Integrated visual and final regression checks follow the phase-4f merge. Missing backend confidence/time aggregates remain honest empty states, not mock data.
