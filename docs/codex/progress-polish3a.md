# polish3a progress

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
