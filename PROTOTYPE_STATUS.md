# Student learning prototype

Ownership: apps/web student learning UI only. Existing data, Atom Forge, landing, and staff/parent dashboards are preserved. API implementation belongs to proto-core; its committed routes were inspected without merging or changing the API.

| feature | REAL/DEMO | status | route | files | test |
|---|---|---|---|---|---|
| Shared learning types | REAL | Present in interrupted commit b63647b | — | packages/contracts/src/learning-proto.ts | Existing contracts |
| Learning API adapter | REAL | Implemented against proto-core endpoints; no client scoring or answer keys | /learning/* | apps/web/src/proto/adapter.ts | Typecheck pending |
| Student chapter, preferences and plan | REAL | Implemented; preserves subject path and chapter notes | /student/chapters/:chapterId/learn | apps/web/src/proto/LearningChapter.tsx | Verification pending dependency installation |
| Six module types, practice and repair | REAL | Implemented; scoring and every accepted answer are server-owned | /student/learning/sessions/:sessionId | apps/web/src/proto/ModuleView.tsx | Resume/API regression tests added |
| Session resume, game return, summary | REAL | Implemented; browser shortcuts, server position and evidence | /student/learning/sessions/:sessionId, /student?panel=study | apps/web/src/proto/LearningPlayer.tsx, ContinueLearning.tsx | Verification pending |
| Contextual Saathy and all 12 mode chips | REAL | Implemented; chat stays in memory; bank questions scored on server | Learning session side panel | apps/web/src/proto/ContextualSaathy.tsx | Verification pending |

Integration: this branch does not contain the proto-core API implementation. Until the branches are integrated by their owner, learning endpoints return an explicit retry state. No migration or demo database was run or changed here.
