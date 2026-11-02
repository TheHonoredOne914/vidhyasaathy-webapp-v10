# Student learning prototype

Ownership: apps/web student learning UI only. Existing data, Atom Forge, landing, and staff/parent dashboards are preserved. API implementation belongs to proto-core; its committed routes were inspected without merging or changing the API.

| feature | REAL/DEMO | status | route | files | test |
|---|---|---|---|---|---|
| Shared learning types | REAL | Present in interrupted commit b63647b | — | packages/contracts/src/learning-proto.ts | Existing contracts |
| Learning API adapter | REAL | Implemented against proto-core endpoints; no client scoring or answer keys | /learning/* | apps/web/src/proto/adapter.ts | Typecheck pending |
| Student chapter, planning, six module types | REAL | In progress | /student/chapters/:chapterId/learn | apps/web/src/proto | Pending |
| Session resume, game return, summary | REAL | In progress | /student/learning/sessions/:sessionId | apps/web/src/proto | Pending |
| Contextual Saathy and mode chips | REAL | In progress | Learning session side panel | apps/web/src/proto | Pending |

Integration: this branch does not contain the proto-core API implementation. Until the branches are integrated by their owner, learning endpoints return an explicit retry state. No migration or demo database was run or changed here.
