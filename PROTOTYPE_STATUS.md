# Student learning prototype

Ownership: apps/web student learning UI only. Existing data, Atom Forge, landing, and staff/parent dashboards are preserved. API implementation belongs to proto-core; its committed routes were inspected without merging or changing the API.

| feature | REAL/DEMO | status | route | files | test |
|---|---|---|---|---|---|
| Shared learning types | REAL | Present in interrupted commit b63647b | — | packages/contracts/src/learning-proto.ts | Existing contracts |
| Learning API adapter | REAL | Implemented against proto-core endpoints; no client scoring or answer keys | /learning/* | apps/web/src/proto/adapter.ts | API failure, event retry and owner-scoping regression tests pass |
| Student chapter, preferences and plan | REAL | Implemented; preserves subject path and chapter notes | /student/chapters/:chapterId/learn | apps/web/src/proto/LearningChapter.tsx | Web typecheck, production build and scoped lint pass |
| Six module types, practice and repair | REAL | Implemented; scoring and every accepted answer are server-owned | /student/learning/sessions/:sessionId | apps/web/src/proto/ModuleView.tsx | All six renderers, wrong-answer repair, New/not-taught and correct-answer restoration pass |
| Session resume, game return, summary | REAL | Implemented; browser shortcuts, server position and evidence | /student/learning/sessions/:sessionId, /student?panel=study | apps/web/src/proto/LearningPlayer.tsx, ContinueLearning.tsx | Resume pointer, practice restoration and API tests pass; live API integration pending proto-core |
| Contextual Saathy and all 12 mode chips | REAL | Implemented; chat stays in memory; bank questions scored on server | Learning session side panel | apps/web/src/proto/ContextualSaathy.tsx | Teaching-mode/context rendering test and scoped lint pass |

Integration: this branch does not contain the proto-core API implementation. Until the branches are integrated by their owner, learning endpoints return an explicit retry state. No migration or demo database was run or changed here.

Verification uses Node v24.22.2. `npm run test:unit -- --project web`: 39 files / 143 tests passed. Additional targeted `npx vitest run --project web --configLoader native --pool forks apps/web/src/proto/adapter.test.ts apps/web/src/proto/rendering.test.ts`: 2 files / 17 tests passed (includes 8 tests already present in the broader run). `npm run build -w apps/web` and ESLint for changed frontend files passed. Repository-wide `npm run typecheck` is completing its remaining workspace checks. Full e2e was not run, as instructed.

Student entry points: Home > Continue learning; My subjects > Learn with Saathy; chapter > Plan my learning; Study sessions > Your learning journeys. Teacher-released study sessions remain available below the new journey shortcuts. Preferences choose the initial teaching mode without scoring chapter familiarity. New attempts, repair feedback, plan position and summaries come from the learning API; only session shortcuts are stored locally. Games open in an iframe with an explicit Back to my plan button. Atom Forge is not advertised by this new player and its files are untouched.
