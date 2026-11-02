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
