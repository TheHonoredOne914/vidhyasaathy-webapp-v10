# polish3a progress

## 1. Quick data fixes

- Home already renders `/student/home.todaysGoal`; subject path now uses the same source, with loading, retry and empty states.
- Subjects retain the Time this week card with an honest empty line; measured weekly minutes are unavailable (see data-gaps-polish3a.md).
- Path header explicitly labels completed ideas, distinct from the next station's ordinal, using the same concepts/mastery source.
- Verification: `npm run typecheck` passed; `npm run test:unit` passed (287 passed, 1 skipped). Screenshots/viewport checks follow the learn-flow rebuilds.
