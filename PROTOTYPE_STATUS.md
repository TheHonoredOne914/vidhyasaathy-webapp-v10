| feature | REAL/DEMO | status | route | files | test |
|---|---|---|---|---|---|
| Shared learning contract | REAL | Implemented; public questions exclude keys | package export | packages/contracts/src/learning-proto.ts, index.ts | npm run typecheck passed (all workspaces) |
| Gemini and provider fallback | REAL | Gemini first; OpenAI then deterministic fallback; key resolved per call | /learning/tutor, /learning/plan; existing tutor routes | apps/api/src/learning/proto-model.ts, ai/provider.ts, ai/founder-provider.ts | learning-model.test.ts passed; full suite passed (412 tests) |
| Founder key settings | REAL | Admin-only, school-scoped server store; masked GET/PUT; saving takes effect immediately | GET/PUT /founder/settings | apps/api/src/routes/founder-settings.ts, learning/proto-settings.ts | learning-proto.test.ts passed; full suite passed (412 tests) |
| Twelve teaching modes and slides | REAL | Grounded prompts and slide structure adapted from dhruv-model | POST /learning/tutor | apps/api/src/learning/proto-tutor.ts, proto-content.ts | learning-proto.test.ts passed; full suite passed (412 tests) |
| Structured chapter plans | REAL | Zod validation, registry ID replacement, one retry, labelled deterministic fallback | POST /learning/plan | apps/api/src/learning/proto-plan.ts | learning-proto.test.ts passed; full suite passed (412 tests) |
| Chapter modules and scoring | REAL | Motion and Coordinate Geometry banks; generic modules for other chapters; server-only keys | GET /learning/modules?chapterId=; GET /learning/modules/:id; POST /learning/modules/:id/answers | apps/api/src/learning/proto-content.ts, routes/learning-proto.ts | learning-proto.test.ts passed; full suite passed (412 tests) |
| Game registry | REAL | Existing engines mapped to chapter/concept IDs; availability follows scoring mappings | GET /learning/games | apps/api/src/learning/proto-games.ts | learning-proto.test.ts passed; full suite passed (412 tests) |
| Study sessions and evidence | REAL | Durable plans, answers, events, progress, resume, summary; additive schema with backup | POST /learning/sessions; GET /learning/sessions/:id; POST /learning/sessions/:id/events; GET /learning/sessions/:id/summary | apps/api/src/learning/proto-store.ts, routes/learning-proto.ts | learning-proto.test.ts passed; full suite passed (412 tests) |
| Loose demo authentication | DEMO | Opt-in DEMO_LOOSE_AUTH=true, disabled in production; four one-click roles | POST /auth/demo/:role; existing login/register endpoints | apps/api/src/routes/password.ts, auth/demo-loose.ts | learning-proto.test.ts passed; full suite passed (412 tests) |

Backend ownership: apps/api, packages/contracts; apps/web untouched. Existing data preserved.

Founder UI integration contract: GET `/founder/settings` returns `{ geminiConfigured, geminiKeyMasked, geminiModel, source }`; PUT accepts `{ geminiApiKey?, geminiModel? }`. Omit the key to retain it; send null or an empty string to clear the saved key and use the environment/fallback. Requires the existing admin session and Origin header. Frontend changes belong to proto-ui and are outside this worktree's ownership.

Gemini live check: Skipped: no Gemini key in founder settings for LEARNING_SCHOOL_ID (default demo school), process environment or apps/api/.env.

Final regression pass: 41 tests in learning-proto, learning-model, ask, ai and ai-provider passed. Public provider names stay stable; key revisions invalidate only the internal response cache. Unfamiliar-content skips preserve prior assessed concept status. Complete unit-suite rerun passed: 97 files, 412 tests.

Final verification (Node v24.22.2): npm run typecheck; npm run test:unit -- --maxWorkers 1 --fileParallelism false. Both passed. Browser/e2e tests were not run.


---

# Dashboards (proto-dash)

# Dashboard prototype

Scope: shared fictional dashboard dataset, Parent/Teacher/Admin demo workspaces, and sign-in demo entries. Student learning, Saathy, study sessions, games and API work belong to the other prototype runs.

| Feature | REAL/DEMO | Status | Route | Files | Test |
| --- | --- | --- | --- | --- | --- |
| Shared sample school, validated browser persistence, scoped reset | DEMO | Complete | `/demo/*` | `apps/web/src/demo/data.ts`, `store.tsx`, `DemoLayout.tsx` | 5 new data tests + browser persistence/reset pass |
| Parent notebook, two linked children, filters, charts, Translator, drill-ins | DEMO | Complete | `/demo/parent` | `apps/web/src/demo/ParentWorkspace.tsx` | Browser/mobile/axe pass |
| Teacher roster, reports, Radar, assignment creation | DEMO | Complete | `/demo/teacher` | `apps/web/src/demo/TeacherWorkspace.tsx` | Browser/mobile/axe pass |
| Admin search/filter and add/edit for all four record types | DEMO | Complete | `/demo/admin` | `apps/web/src/demo/AdminWorkspace.tsx` | Browser/mobile/axe pass |
| Four sign-in entries; existing API for Aarav, standalone demos for adults | REAL/DEMO | Complete | `/signin`, `/signin/student` | `apps/web/src/demo/DemoEntryButtons.tsx`, `App.tsx`, `NotebookSignIn.tsx` | Entries verified; Student requires existing API |

Validation: root typecheck PASS; web unit tests 39 files / 140 tests PASS; web production build PASS; focused browser checks PASS, zero page errors and zero tested WCAG A/AA violations. No full E2E run. Repeat browser checks with `node apps/web/scripts/demo-smoke.mjs` against a server on port 5373 (or set `DEMO_URL`).

See [PROTOTYPE_STATUS-dash.md](PROTOTYPE_STATUS-dash.md) for the dashboard handoff and final validation results.



---

# Saathy UI port (proto-ui)

# Student learning prototype

Ownership: apps/web student learning UI only. Existing data, Atom Forge, landing, and staff/parent dashboards are preserved. API implementation belongs to proto-core; its committed routes were inspected without merging or changing the API.

| feature | REAL/DEMO | status | route | files | test |
|---|---|---|---|---|---|
| Shared learning types | REAL | Present in interrupted commit b63647b | ΓÇö | packages/contracts/src/learning-proto.ts | Existing contracts |
| Learning API adapter | REAL | Implemented against proto-core endpoints; no client scoring or answer keys | /learning/* | apps/web/src/proto/adapter.ts | API failure, event retry and owner-scoping regression tests pass |
| Student chapter, preferences and plan | REAL | Implemented; preserves subject path and chapter notes | /student/chapters/:chapterId/learn | apps/web/src/proto/LearningChapter.tsx | Web typecheck, production build and scoped lint pass |
| Six module types, practice and repair | REAL | Implemented; scoring and every accepted answer are server-owned | /student/learning/sessions/:sessionId | apps/web/src/proto/ModuleView.tsx | All six renderers, wrong-answer repair, New/not-taught and correct-answer restoration pass |
| Session resume, game return, summary | REAL | Implemented; browser shortcuts, server position and evidence | /student/learning/sessions/:sessionId, /student?panel=study | apps/web/src/proto/LearningPlayer.tsx, ContinueLearning.tsx | Resume pointer, practice restoration and API tests pass; live API integration pending proto-core |
| Contextual Saathy and all 12 mode chips | REAL | Implemented; chat stays in memory; bank questions scored on server | Learning session side panel | apps/web/src/proto/ContextualSaathy.tsx | Teaching-mode/context rendering test and scoped lint pass |

Integration: proto-core is now merged; the learning API, slides, durable evidence and session endpoints are available on this branch.

Verification uses Node v24.22.2. `npm run test:unit -- --project web`: 39 files / 143 tests passed. Additional targeted `npx vitest run --project web --configLoader native --pool forks apps/web/src/proto/adapter.test.ts apps/web/src/proto/rendering.test.ts`: 2 files / 17 tests passed (includes 8 tests already present in the broader run). `npm run build -w apps/web`, ESLint for changed frontend files, and repository-wide `npm run typecheck` all passed. Full e2e was not run, as instructed.

Student entry points: Home > Continue learning; My subjects > Learn with Saathy; chapter > Plan my learning; Study sessions > Your learning journeys. Teacher-released study sessions remain available below the new journey shortcuts. Preferences choose the initial teaching mode without scoring chapter familiarity. New attempts, repair feedback, plan position and summaries come from the learning API; only session shortcuts are stored locally. Games open in an iframe with an explicit Back to my plan button. Atom Forge is not advertised by this new player and its files are untouched.

## Integrated backend status

| feature | REAL/DEMO | status | route | files | test |
|---|---|---|---|---|---|
| Shared learning contract | REAL | Implemented; public questions exclude keys | package export | packages/contracts/src/learning-proto.ts, index.ts | npm run typecheck passed (all workspaces) |
| Gemini and provider fallback | REAL | Gemini first; OpenAI then deterministic fallback; key resolved per call | /learning/tutor, /learning/plan; existing tutor routes | apps/api/src/learning/proto-model.ts, ai/provider.ts, ai/founder-provider.ts | learning-model.test.ts passed; full suite running |
| Founder key settings | REAL | Admin-only, school-scoped server store; masked GET/PUT; saving takes effect immediately | GET/PUT /founder/settings | apps/api/src/routes/founder-settings.ts, learning/proto-settings.ts | learning-proto.test.ts passed; full suite running |
| Twelve teaching modes and slides | REAL | Grounded prompts and slide structure adapted from dhruv-model | POST /learning/tutor | apps/api/src/learning/proto-tutor.ts, proto-content.ts | learning-proto.test.ts passed; full suite running |
| Structured chapter plans | REAL | Zod validation, registry ID replacement, one retry, labelled deterministic fallback | POST /learning/plan | apps/api/src/learning/proto-plan.ts | learning-proto.test.ts passed; full suite running |
| Chapter modules and scoring | REAL | Motion and Coordinate Geometry banks; generic modules for other chapters; server-only keys | GET /learning/modules?chapterId=; GET /learning/modules/:id; POST /learning/modules/:id/answers | apps/api/src/learning/proto-content.ts, routes/learning-proto.ts | learning-proto.test.ts passed; full suite running |
| Game registry | REAL | Existing engines mapped to chapter/concept IDs; availability follows scoring mappings | GET /learning/games | apps/api/src/learning/proto-games.ts | learning-proto.test.ts passed; full suite running |
| Study sessions and evidence | REAL | Durable plans, answers, events, progress, resume, summary; additive schema with backup | POST /learning/sessions; GET /learning/sessions/:id; POST /learning/sessions/:id/events; GET /learning/sessions/:id/summary | apps/api/src/learning/proto-store.ts, routes/learning-proto.ts | learning-proto.test.ts passed; full suite running |
| Loose demo authentication | DEMO | Opt-in DEMO_LOOSE_AUTH=true, disabled in production; four one-click roles | POST /auth/demo/:role; existing login/register endpoints | apps/api/src/routes/password.ts, auth/demo-loose.ts | learning-proto.test.ts passed; full suite running |

Backend ownership: apps/api, packages/contracts; apps/web untouched. Existing data preserved.

Founder UI integration contract: GET `/founder/settings` returns `{ geminiConfigured, geminiKeyMasked, geminiModel, source }`; PUT accepts `{ geminiApiKey?, geminiModel? }`. Omit the key to retain it; send null or an empty string to clear the saved key and use the environment/fallback. Requires the existing admin session and Origin header. Frontend changes belong to proto-ui and are outside this worktree's ownership.

Gemini live check: Skipped: no Gemini key in founder settings for LEARNING_SCHOOL_ID (default demo school), process environment or apps/api/.env.

Final regression pass: 41 tests in learning-proto, learning-model, ask, ai and ai-provider passed. Public provider names stay stable; key revisions invalidate only the internal response cache. Unfamiliar-content skips preserve prior assessed concept status. Final complete unit-suite rerun pending.


## BE pass (be-pass agent)

Not started. The be-pass agent updates only this section. Task list: prompts/BACKEND-PROMPT.md.

## FE pass (fe-pass agent)

- P0(a) PARTIAL: optional prerequisite check tolerates nullable/missing sourceClass and empty offers; permanent Skip and error retry; chat stays usable. Skip resends the original question without inventing diagnostic evidence. First real answer still requires BE ask-pipeline answer-first change.
- Reference limitation: `C:\Users\HP\dhruv-model` is absent; parity must use existing repo components. Gemini is UNVERIFIED (stub provider, no key). No push; laptop overrides apply.
- P0(a) follow-up: Skip is available during streaming and does not resend an already answered question. Verification: web typecheck and unit suite (see local commit gates). Answer-first server work remains BE-owned.
- P0(b) DONE: chapter context follows explicit chapter/concept, then current learning path; Physics/Motion is the default rather than first Biology entry. Unit tests cover current/default selection.
- P0(c): explorer steps use the chapter game registry, with direct game links carrying the saved session/step; game exit and confirmed finish return to that plan. Server-confirmed game results feed activity_finished; 400/404 compatibility queue is session-local, never mastery. Browser verification pending.
- Remaining P0/P1: in progress.
- P0(d): Home paints a notebook loading state before session/home queries finish, uses one next-step hero from /student/today (typed source:mock fallback from /student/home), never renders raw resumeState. Removed the competing ContinueLearning widget; goal rail is capped at three. Browser verification pending.

