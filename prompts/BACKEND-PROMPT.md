# BACKEND PROMPT: VidhyaSaathy be-pass (backend only)

You are the **backend agent**. You work ONLY in `C:\Users\jce\vs-be` on branch `be-pass`. Ports: API **3102**, web **5174** (you run the web app only to preview; you never edit `apps/web`). Another agent (FE) works at the same time in `C:\Users\jce\vs-fe` on `apps/web/**`. You never edit its files. Read the whole file before you start. Then follow section 9 ("How to run this whole prompt").

Your job: make the backend the real "brain" behind the demo story. That means a working first Saathy answer, an adaptive plan with games, one "what next" endpoint, the session/flashcard/parent/teacher endpoints the new frontend needs, a reliable demo seed, and repo hygiene. Every endpoint you add gets a zod schema in `packages/contracts/src/student-flow.ts` (section 4), a route test, and a live `Invoke-RestMethod` check against your own API on port 3102.

## 1. What VidhyaSaathy is (read once, keep in your head)

VidhyaSaathy is a school learning web app for Indian Class 9 (NCERT): students, teachers, parents and a school admin. The centre is **Saathy**, a cloud-shaped AI study buddy that teaches one idea at a time with hints first. It never gives a rank to a student.

**Demo story** (what a judge sees in 5 minutes):
1. Sign in and click "Enter as Student". You are Aarav, Class 9-A, PIN 2468.
2. Home shows ONE clear next step.
3. Open Physics, then **Motion**. The chapter page shows a short path: Explore, Learn, Try, Fix, Play, Master.
4. Click "Plan my learning". Saathy builds a short personal plan (8-12 steps) that mixes concept cards, a worked example, an explorer, practice and the Motion Lab game.
5. Get one practice answer wrong. Saathy explains the exact misconception (repair) and gives one more try.
6. Open Saathy chat in the same context. It knows the chapter, the step and the last mistake.
7. The **Coordinate Geometry** chapter works the same way (second flagship).
8. Go to "Enter as Parent / Teacher / Admin". The dashboards show the same students: Aarav strong, Priya struggling, Rohan absent.

**Hard product rules (never break these):**
- Notebook look: cream paper, navy ink, sky blue and peach accents, ruled lines, sticky notes and tape. Handwritten headings in Caveat, notes in Patrick Hand, dense text in Inter. Use the Saathy cloud mascot (`apps/web/src/student/notebook/Saathy.tsx` and the `saathy/*.svg` files).
- The landing page, the themes and the colour tokens stay unchanged. Do not change any value in `apps/web/src/student/notebook/tokens.css` or `apps/web/src/ui/tokens.css`. You may ADD new tokens.
- No emoji in UI strings. No sound.
- Never show ranks, bands, tiers, levels or percentages-as-rank to a student. Students see ONLY these status words: **New**, **Let's fix this**, **Almost there**, **Mastered**, **Top form**. There is a fake "WARRIOR LV 5" style rank; it must not appear anywhere for a student. Teachers and parents may see numbers.
- Full width and full height at 1440x900 and 1920x1080. No floating, narrow centre column with empty sides.
- Keep all existing data. Never drop tables, never reset the DB, never delete seed rows. Add new data with migrations or seed additions.
- **Atom Forge is untouchable:** `apps/web/src/games/atom/**` and the `/student/games/atom` route. Do not edit, move or restyle it.
- Never touch anything outside this repo worktree. That includes the Fast Client Minecraft launcher, Roblox files, other worktrees (`vs-master`, `vs-proto-*`, `vs-saathy`, `vs-games`, `vs-study`, `vs-preview`, `vs-backend`, `vs-gh`, `vs-qa`, `vs-flow`), `C:\Users\jce\dhruv-model` (read-only reference), and `C:\Users\jce\proof\final-*`.
- Never print, log or commit an API key. `apps/api/.env` is gitignored and stays that way. The founder Gemini key is shown masked only (`AIza…abcd`).
- AI key order on the server: founder-settings key (saved in DB), then `GEMINI_API_KEY` env, then OpenAI (`OPENAI_API_KEY`), then the deterministic fallback. A new key must work without a server restart.

## 2. Repo facts (verified on master f954116, 2 Nov 2026; do not assume anything else)

- Monorepo with npm workspaces: `apps/api` (Fastify, drizzle and raw better-sqlite, zod), `apps/web` (React 19, react-router, Vite, Tailwind v4 tokens and plain CSS), and `packages/contracts` (zod schemas shared by both).
- Node 24 is at `C:\Users\jce\node24\node-v24.22.2-win-x64`. Put it first on PATH in every shell: `$env:PATH = 'C:\Users\jce\node24\node-v24.22.2-win-x64;' + $env:PATH`.
- DB: `apps/api/data/vidhyasaathy.db` (gitignored, one per worktree). Create it with `npm run db:migrate -w apps/api`, then `npm run db:seed -w apps/api`, with `DEMO_SEED=true DEMO_PIN=2468 DEMO_PASSWORD=Saathy@2026!`. The preview launchers do this for you.
- Demo login: `DEMO_LOOSE_AUTH=true` makes any credentials work for pin-login, login, register and claim. It also enables `POST /auth/demo/:role` (student|teacher|parent|admin), which creates a real session cookie. The sign-in page has "Enter as Student", which uses `/auth/demo/students` and then `/auth/pin-login` with Aarav and 2468. "Enter as Parent/Teacher/Admin" today link to the standalone mock dashboards at `/demo/parent|teacher|admin`, which read `apps/web/src/demo/data.ts`.
- The API is served under `/api` by the Vite proxy (`VITE_API_URL=/api`, `VITE_API_PROXY_TARGET=http://127.0.0.1:<api port>`).
- **Shared contract files. BE owns them; FE only reads and imports them:**
  - `packages/contracts/src/learning-proto.ts` (LearningContext, LearningPlan, LearningModule, LearningEvent, TutorResponse, GameRegistryEntry, TeachingMode)
  - `packages/contracts/src/ask.ts` (AskStreamSchema)
  - `packages/contracts/src/daily.ts` (student home, today)
  - `packages/contracts/src/dashboard.ts`
  - `packages/contracts/src/games.ts`
  - `packages/contracts/src/index.ts`
  - every other file in `packages/contracts/**`
- Live check on 2 Nov 2026 against the running master API (port 3101):
  - `GET /learning/games` returns 20 games, all `available:true`.
  - `GET /learning/modules?chapterId=<Motion>` returns 36 modules (6 topics x concept, guided_example, explorer, practice, repair, revision).
  - `POST /learning/plan` for Motion returns `status:"fallback"` with 36 steps and **no activityId (no games)**.
  - `POST /ask/stream` without `chapterId` returns `event: error` "Choose a chapter so I can use your notes."; with Motion's chapterId it returns a `levelCheck` event first.
  - `GET /student/home` works. `GET /student/today`, `/learning/sessions` (list) and `/student/revise` return 404 (they don't exist).
  - Proof run 7:24-7:35 AM IST on f954116 (5173): a new Saathy chat shows the Level Check failing with "Retry loading check", so no real answer comes. The chat chapter picker defaults to Biology / The Fundamental Unit of Life, not Motion. No game opens from the plan's Explore step for Motion. A chapter's Practice/Games page force-redirects to the chapter starting test. The first student dashboard screenshot was blank (5 KB). The vs-master demo DB was empty until seeded by hand (the demo.mjs seed step hangs).
  - `GET /health` returns 401 (no such public route).
  - `GET /student/catchup` returns 404 for Aarav (nothing to catch up) and 200 for Rohan.
  - The web renders `nextAction.resumeState` raw in `apps/web/src/student/HomeDesk.tsx:122`. An old screenshot shows `step=4` there.

## 3. Worktrees, branches and ownership (STRICT, no overlap)

| | FE agent | BE agent |
|---|---|---|
| Worktree | `C:\Users\jce\vs-fe` | `C:\Users\jce\vs-be` |
| Branch | `fe-pass` (from master f954116) | `be-pass` (from master f954116) |
| Ports (api / web) | 3103 / 5175 | 3102 / 5174 |
| Start API / web | `C:\Users\jce\vs-fe-api.cmd` / `C:\Users\jce\vs-fe-web.cmd` | `C:\Users\jce\vs-be-api.cmd` / `C:\Users\jce\vs-be-web.cmd` |
| May edit | `apps/web/**` (including `apps/web/public/**`), `prompts/FE-NEEDS.md`, and the "FE pass" section of `PROTOTYPE_STATUS.md` | `apps/api/**`, `packages/contracts/**`, DB migrations and seed (`apps/api/src/db/**`), root `.gitignore`, removing tracked junk at the repo root, and the "BE pass" section of `PROTOTYPE_STATUS.md` |
| Must NOT edit | anything in `apps/api/**`, `packages/**`, root config files, `.gitignore`, `e2e/**`, `scripts/**` | anything in `apps/web/**`, `e2e/**`, `prompts/FE-NEEDS.md` |
| Done marker | `C:\Users\jce\fe-pass.done` | `C:\Users\jce\be-pass.done` |

- Neither agent edits `package-lock.json` or root `package.json`, except BE when it adds a server dependency (and then only through `npm install <pkg> -w apps/api`). FE adds a web dependency only with `npm install <pkg> -w apps/web`, and only if it's truly needed (prefer zero new dependencies). If both change the lockfile, Grok resolves it at merge.
- Never run `git merge`, `git rebase` onto master, `git push --force`, or `git reset --hard` on a pushed commit. Never commit to `master`. Push your own branch only: `git push -u origin fe-pass` / `git push -u origin be-pass`. Retry on network errors (3 times, 20 s apart). If the push still fails, keep committing locally and note it in your status section.
- **FE to BE requests:** if FE needs an endpoint or field that doesn't exist on master, FE:
  1. writes a typed adapter in `apps/web/src/api/` (or next to the feature) that calls the planned endpoint and, on 404 or network error, returns a **typed mock** built from `apps/web/src/demo/data.ts` style fixtures, clearly marked `source: 'mock'`;
  2. appends the request to `prompts/FE-NEEDS.md` (method, path, request and response JSON shape, which screen uses it).

  BE reads `C:\Users\jce\vs-fe\prompts\FE-NEEDS.md` (read-only, it's in FE's worktree) at the start of every run. BE implements whatever matches its task list and writes the endpoint shape into `packages/contracts`. Both sides use the **exact endpoint names and shapes in the "Planned contracts" section below**, so they line up at merge without talking.

## 4. Planned contracts (both agents build against exactly these)

BE adds these zod schemas to a NEW file `packages/contracts/src/student-flow.ts` and re-exports it from `index.ts`. FE copies the same TypeScript shapes into `apps/web/src/api/student-flow-types.ts` (a local mirror, because FE can't edit contracts). When BE's branch is merged, Grok swaps FE's mirror for the contract import.

```ts
// GET /student/today  -> TodayPlan
type StatusWord = 'New' | "Let's fix this" | 'Almost there' | 'Mastered' | 'Top form';
type TodayAction = {
  kind: 'continue_session' | 'start_chapter' | 'fix' | 'revise' | 'homework' | 'catchup' | 'play';
  title: string;            // human text, never a debug string
  subtitle: string;         // e.g. "Physics · Motion · step 3 of 10"
  href: string;             // a real web route
  estMinutes: number;
  chapterId?: string; conceptId?: string; sessionId?: string; activityId?: string;
  status?: StatusWord;
};
type TodayPlan = { date: string /* IST yyyy-mm-dd */; greeting: string; primary: TodayAction; next: TodayAction[] /* max 3 */; streakDays: number; source: 'live' | 'mock' };

// GET /learning/sessions -> { sessions: LearningSessionSummary[] }   (newest first, the student's own)
type LearningSessionSummary = { id: string; chapterId: string; chapterTitle: string; subjectName: string;
  status: 'active' | 'completed' | 'fallback'; currentStep: number; totalSteps: number;
  updatedAt: string /* ISO */; nextStepTitle: string | null; words: { conceptId: string; name: string; word: StatusWord }[] };

// POST /learning/sessions/:id/events  gains type 'activity_finished' with
//   { id, type: 'activity_finished', moduleId, activityId, result: { score: number /*0..1*/, completed: boolean, seconds: number } }

// GET /student/chapters/:id/world -> ChapterWorld
type ChapterStop = { key: 'explore' | 'learn' | 'try' | 'fix' | 'play' | 'master'; title: string; state: 'locked' | 'open' | 'done';
  href: string; detail: string /* e.g. "2 of 6 ideas" */ };
type ChapterWorld = { chapterId: string; title: string; subjectName: string; stops: ChapterStop[];
  concepts: { conceptId: string; name: string; word: StatusWord }[]; games: { id: string; title: string; href: string }[];
  sessionId: string | null; source: 'live' | 'mock' };

// GET /student/flashcards/due -> { cards: Flashcard[] } ; POST /student/flashcards/:id/rate { rating: 'again'|'hard'|'good'|'easy' } -> { nextDueAt }
type Flashcard = { id: string; conceptId: string; chapterTitle: string; front: string; back: string; dueAt: string; intervalDays: 0 | 1 | 3 | 7 | 14 };

// GET /parents/children/:id/overview -> ParentOverview
type ParentOverview = { child: { id: string; name: string; className: string };
  effortMinutes7d: { date: string; minutes: number }[]; masteryTrend: { week: string; mastered: number; total: number }[];
  wordCounts: Record<StatusWord, number>; streakDays: string[] /* dates active */; readiness: 'green' | 'amber' | 'red';
  learnsBestWith: string; recent: { date: string; text: string }[] };

// GET /sections/:id/heatmap -> TeacherHeatmap
type TeacherHeatmap = { sectionId: string; concepts: { id: string; name: string }[];
  students: { id: string; name: string; cells: { conceptId: string; mastery: number /*0..1*/; attempts: number }[] }[] };

// POST /ask/stream gains optional fields (AskStreamSchema): sessionId?: string; teachingMode?: TeachingMode
//   and works WITHOUT chapterId (general mode).
```

## 5. Quality gates (run before every commit batch; all must pass)

Run each one separately. Never run a root `npm run typecheck`; it's slow and runs both.
```powershell
$env:PATH = 'C:\Users\jce\node24\node-v24.22.2-win-x64;' + $env:PATH
cd <worktree>\apps\api ; npx tsc --noEmit -p .          # BE must pass; FE runs it only to confirm nothing broke
cd <worktree>\apps\web ; npx tsc --noEmit -p .          # FE must pass; BE runs it to confirm contract changes don't break web
cd <worktree>\apps\api ; npx vitest run --pool forks --reporter dot     # BE
cd <worktree>\apps\web ; npx vitest run --pool forks --reporter dot     # FE
cd <worktree> ; npm run build -w apps/web                               # both, before each push
```
- If a gate fails because of the OTHER agent's area (impossible on a fresh branch, but possible after a contract change), BE fixes the contract so web still compiles. FE never edits contracts.
- New logic needs a test. FE: vitest unit tests (no DOM library is installed, so don't add one) for adapters, pure helpers and status-word mapping, like `apps/web/src/dashboard/format.test.ts`. BE: vitest route tests with `app.inject`, following the existing tests in `apps/api/test/`.

## 6. Repo hygiene (non-negotiable)

- Before each commit, run `git status --short` and read every line. Only stage files you meant to change: `git add <paths>`, never `git add -A` or `git add .`.
- Never commit: `node_modules/`, `dist/`, `build/`, `coverage/`, `.env*` (except `.env.example`), `*.db*`, `*.sqlite*`, `*.log`, screenshots or preview output (`C:\Users\jce\preview\**` lives outside the repo anyway), `.codex/`, `.cursor/`, `.playwright-mcp/`, `__pycache__/`, `*.pyc`, `test-results/`, `playwright-report/`, `*.done`, `*.tsbuildinfo`, temporary scripts, or scratch markdown at the repo root.
- No new files at the repo root. Agent notes go in `PROTOTYPE_STATUS.md` (your section only) or `prompts/FE-NEEDS.md` (FE only).
- No secrets anywhere: no keys, no tokens, no `CLAIM_CODE_ENCRYPTION_KEY` values in code, tests or docs.
- Small focused commits with conventional messages (`feat(web): chapter world page`, `fix(api): today plan never returns resumeState`). Aim for 1 commit per task or sub-task. Push after every 2-3 commits.
- Don't reformat files you aren't changing. Don't rename or move files unless the task says to.
- The untracked `e2e/final-explore.mjs` and `e2e/final-proof.mjs` in `vs-master` belong to another job. They don't exist in your worktree; never create files with those names.

## 7. Preview after EVERY run (mandatory, Dhruv checks these images)

The launchers and the screenshot script already exist **outside** the repo:
- `C:\Users\jce\vs-<fe|be>-api.cmd`: sets PATH, ports, `DEMO_LOOSE_AUTH=true`, `DEMO_SEED=true`, runs migrate and seed on this worktree's own DB, then starts the API. Log: `C:\Users\jce\vs-<fe|be>-api.log`.
- `C:\Users\jce\vs-<fe|be>-web.cmd`: starts Vite on this worktree with the proxy to the right API port. Log: `C:\Users\jce\vs-<fe|be>-web.log`.
- `C:\Users\jce\preview\shoot.mjs`: Playwright at 1440x900. Logs in as student with "Enter as Student", resolves `{MOTION}` and `{COORD}` chapter ids, and screenshots each route in a JSON list. Writes `C:\Users\jce\preview\<tag>-<yyyyMMdd-HHmmss>\NN-name.png` plus `index.md`.
- `C:\Users\jce\preview\routes-default.json`: the key demo path (15 screens). Make your own list at `C:\Users\jce\preview\routes-<fe|be>.json` = the default list + every screen you changed this run (copy the default, then add entries; supported keys: name, path, auth `student`|`none`, waitFor (regex text), wait (ms), click (button name regex), afterClick (ms), fullPage).

Steps at the END of every run (and after each P0 task if you can):
```powershell
$env:PATH = 'C:\Users\jce\node24\node-v24.22.2-win-x64;' + $env:PATH
# 1. start (only if your ports are not already listening)
if (-not (Get-NetTCPConnection -State Listen -LocalPort <API_PORT> -ErrorAction SilentlyContinue)) { Start-Process cmd -ArgumentList '/c','C:\Users\jce\vs-<fe|be>-api.cmd' -WindowStyle Hidden }
if (-not (Get-NetTCPConnection -State Listen -LocalPort <WEB_PORT> -ErrorAction SilentlyContinue)) { Start-Process cmd -ArgumentList '/c','C:\Users\jce\vs-<fe|be>-web.cmd' -WindowStyle Hidden }
# 2. wait until http://127.0.0.1:<API_PORT>/auth/demo/students and http://127.0.0.1:<WEB_PORT>/ answer (poll up to 180 s; /health does not exist on master)
# 3. shoot
$env:WORKTREE='C:\Users\jce\vs-<fe|be>'; $env:BASE='http://127.0.0.1:<WEB_PORT>'; $env:TAG='<fe|be>'; $env:ROUTES='C:\Users\jce\preview\routes-<fe|be>.json'
node C:\Users\jce\preview\shoot.mjs
```
4. Open `index.md` in the folder it printed (`PREVIEW_DIR ...`). Fill in "Agent notes" honestly: what changed, what looks wrong, what is still mocked. **Look at your screenshots** (open the PNGs). If a screen is blank, broken or shows an error, fix it and shoot again before you finish.
5. Leave your own servers running at the end so Dhruv can open `http://127.0.0.1:<WEB_PORT>` on the laptop.

Port rules: you may only start or stop processes listening on YOUR two ports. To restart, find the PID with `(Get-NetTCPConnection -State Listen -LocalPort <port>).OwningProcess` and stop only that PID. **Never kill ports 3101, 5173 (another job's preview), 3102/5174 if you are FE, 3103/5175 if you are BE, or 3201, 3300, 5183, 5273, 5373, 5973.** Never run `taskkill /IM node.exe` or `Stop-Process -Name node`.

## 8. Anti-hallucination rules

- Never claim something works unless you ran it in this run and saw it work (test output, curl or `Invoke-RestMethod` output, or a screenshot). "Should work" = not done.
- Before you change a file, open it and read the part you're changing. Don't guess function names, props, routes or endpoint shapes; `rg` for them.
- If the code differs from this prompt (line numbers moved, a file was renamed), trust the code and adapt. Note the difference in your status section.
- Keep honest status in `PROTOTYPE_STATUS.md` in your own section only (`## FE pass (fe-pass agent)` or `## BE pass (be-pass agent)`). For every task: `DONE (verified: <command or screenshot>)`, `PARTIAL (what is missing)`, `BLOCKED (why)` or `NOT STARTED`. Update it in the same commit as the work.
- Mocked data must be visibly marked in code (`source: 'mock'`) and listed in your status section. Never present mock data as live in a status line.
- If something is impossible without the other agent's files, don't touch their files: FE writes an adapter, a mock and an FE-NEEDS entry; BE adds the endpoint and a note in its status.

## 9. How to run this whole prompt

1. `git log --oneline -15` and `git status --short` in your worktree. Read `PROTOTYPE_STATUS.md` (your section) to see what earlier runs of you already finished. **Continue from there; don't redo finished tasks.**
2. If `node_modules` is missing in the worktree root, run `npm ci --no-audit --no-fund` once (it's gitignored). If `npm ci` fails on the lockfile, use `npm install --no-audit --no-fund` and **do not commit** the lockfile change.
3. Work through the tasks in order (P0, then P1, then P2). After each task: gates, commit, status update.
4. Preview (section 7) after the P0 block and again at the end.
5. Finish EVERYTHING. Don't stop early, don't ask questions (nobody is watching). If a task is blocked, mark it BLOCKED with the reason and move on.
6. At the very end: final gates, push your branch, final preview, then write the done marker: `Set-Content C:\Users\jce\<fe|be>-pass.done "done $(Get-Date -Format s) <last commit hash>"`.

## 10. Backend rules

- Every new route: authenticated with the existing session hooks (copy the pattern from `apps/api/src/routes/daily.ts`), school-scoped (`school_id` on every query), role-checked, rate-limited like its neighbours, request and response validated with the zod schema from contracts.
- Student-facing responses never contain rank, band, tier, level numbers or raw internal state (`resumeState`, `step=`). Mastery numbers become a `StatusWord` through ONE helper `statusWordFor(mastery, attempts)` in `apps/api/src/learning/status-word.ts` (with tests). Thresholds: attempts 0 → New; mastery < 0.4 → Let's fix this; < 0.7 → Almost there; < 0.9 → Mastered; otherwise Top form.
- Schema changes: add a migration in the existing style in `apps/api/src/db/` (`migrate.ts`) and make it idempotent (`CREATE TABLE IF NOT EXISTS`, guarded `ALTER`). The demo DB must upgrade in place without deleting data.
- Model calls: always through the existing provider chain (`apps/api/src/ai/proto-model.ts`, `schoolLearningModel`, `founder-provider.ts`). Key order: founder-settings key, then `GEMINI_API_KEY`, then OpenAI, then the deterministic fallback. Never log a key, never return it (only `geminiKeyMasked`). Tests must use the fake/fallback provider, never the network.

## 11. Tasks, in priority order

### P0-1 Saathy answers on the first message (BE part of the "Retry loading check" bug)
- Root cause found in the code: `apps/api/src/ai/ask-pipeline.ts:180-183` sets `levelCheck` whenever there's no `diagnostic_result` row for (student, chapter), and then REPLACES the answer with "Before we explore this chapter, let us check a few earlier ideas…". So a new student never gets an answer until the level check is finished, and if the check can't load (proof run, 7:24-7:35 AM IST: "Retry loading check"), Saathy never answers at all.
- Fix:
  1. The answer always comes first. When a level check is due, return the real answer AND a separate `levelCheck: { offered: true, chapterId }` flag in the final stream event, so the UI can offer the check under the answer. Never swap the answer for the check text.
  2. Add `POST /chapters/:id/diagnostic/skip` (student). It records a `diagnostic_result` row with `skipped=1` (add the column via migration) so the check is not offered again for 7 days. The mastery model ignores skipped rows.
  3. `GET /chapters/:id/notebook-diagnostic` and `/chapters/:id/diagnostic` (`apps/api/src/routes/` – `rg -n "notebook-diagnostic"`) must return 200 with `{offered:false, questions:[]}` for chapters with no diagnostic questions (BUGS #9: Biology chapters had none), never 4xx/5xx and never `offered:true` with 0 questions. Seed at least 5 diagnostic questions for each of: Motion, Coordinate Geometry, The Fundamental Unit of Life (they're the 3 chapters the demo can land on).
  4. `POST /ask/stream` with NO `chapterId` (general mode) must answer through the model instead of "Choose a chapter so I can use your notes". Use the student's grade and subjects as context; add `sources: []`.
- Tests: new chat for Aarav on Motion → the stream contains a non-empty answer and `levelCheck.offered=true`; after skip, `offered=false`; no-chapter question returns an answer; Biology diagnostic returns 200.
- Live verify on 3102: sign in as Aarav, ask "What is displacement?" with `chapterId` of Motion, and print the first 300 characters. If `GEMINI_API_KEY` or a founder key is present in your local `.env`, also print `ask/status` (provider name only) to prove a real model answered. If no key is configured, say so in the status section (don't fake it).

### P0-2 Adaptive learning plan (8-12 steps) with games
- Files: `apps/api/src/learning/proto-plan.ts` (`buildLearningPlan`), `apps/api/src/routes/learning-proto.ts` (or wherever `/learning/sessions` POST lives: `rg -n "learning/sessions" apps/api/src`), `apps/api/src/learning/` game registry (`rg -n "motion-lab|coordinate" apps/api/src`).
- Today (live check on 2 Nov): the Motion plan comes back as `status:'fallback'`, 36 steps = every module in order, with no activities, even though OpenAI is configured. Find out why the LLM plan is rejected (log the validation error at debug level, without the prompt text) and fix the validator or the prompt.
- New plan: input = chapter modules + chapter games + the student's concept mastery + level-check result + recent mistakes. Output = 8-12 steps: Explore (1 explorer module + 1 game), Learn (concept + guided example for each weak idea), Try (practice), Fix (repair for each "Let's fix this" idea), Play (1 game), Master (revision). Skip ideas already Mastered or Top form. The deterministic fallback must follow the same 6-stop shape (never "all 36 modules").
- Games inside plans: every plan for Motion must include at least one of `motion-lab` / Chotu ki Kahani: Motion; every plan for Coordinate Geometry must include Coordinate Graphs. Steps that are games carry `activityId` (the registry game id) and `href` to the existing game route (`rg -n "practice/" apps/web/src/App.tsx` to read the route; reading web files is allowed, editing is not).
- Fix wrong mappings in the registry: `quill-blade` is mapped to "Wind" and `optics-lab` to "Light - Explore"; map each game to the chapter it actually teaches (read the game's content to decide) and list the final mapping in your status section.
- Tests: plan for a fresh student = 8-12 steps, at least one game step; plan for a student with all ideas Mastered is shorter; fallback has the same shape.

### P0-3 `GET /student/today` (single "what next" brain)
- Shape: `TodayPlan` in section 4. New file `apps/api/src/routes/today.ts`, registered next to `daily.ts`.
- Logic, in this order: an active learning session → `continue_session` (title = next step title, subtitle "Physics · Motion · step 3 of 10"); else homework due within 2 days → `homework`; else a "Let's fix this" idea → `fix`; else flashcards due → `revise`; else catch-up (only if the student has missed days) → `catchup`; else the first not-started chapter → `start_chapter`. `next[]` = the next 3 of those, no duplicates. `href` is always a real web route.
- Also fix `GET /student/home`: never send raw `resumeState` text to the client. Map it to a human title or `null`. Keep the field for compatibility.
- Tests for each branch of the logic; a test that no string in the response matches `/step=|undefined|null|NaN/`.

### P0-4 Saathy session context and teaching modes
- `AskStreamSchema` (`packages/contracts`) gains optional `sessionId` and `teachingMode` (`'explain' | 'example' | 'quiz_me' | 'step_by_step' | 'real_life' | 'simpler'`; read `TEACHING_MODES` in `apps/web/src/ai/AskPanel.tsx` and use the same keys).
- The ask pipeline adds to the model context: the current plan step (title, module type, the concept), the last wrong answer in this session, and the last game result. The teaching mode changes the system instruction (structured, not pasted into the user's text). Keep the existing guardrails.
- Tests: with `sessionId`, the built context contains the step title; each teaching mode produces a different instruction.

### P1-1 Demo seed that always works (vs-master's DB was empty; the seed step hangs)
- Proof run: `data/saathy-demo.db` in vs-master had no demo students, and `scripts/demo.mjs` hung on the `db:seed` step. Find the hang: run `npm run db:seed -w apps/api` with `DEMO_SEED=true` and a fresh `DATABASE_PATH`, time it, and look for an un-awaited promise, an open DB handle or a pending timer that keeps Node alive (`apps/api/src/db/seed.ts`, `demo.ts`, `notebook-seed.ts`, `daily-seed.ts`, `seed-phase4.ts`). Fix it so the seed exits by itself in under 60 s. Don't edit `scripts/demo.mjs` (root scripts are out of scope); fix the seed.
- First boot self-seed: when `DEMO_SEED=true` (or `DEMO_LOOSE_AUTH=true`) and the DB has zero student profiles, the server seeds the demo school on startup (idempotent; never runs in production mode, never on a DB that has real data).
- Demo story data: Aarav (strong in Motion, an active Motion session at step 3), Priya (struggling: 2 "Let's fix this" ideas in Coordinate Geometry), Rohan (absent 4 days → catch-up). Same section and teacher, Aarav's parent linked. PIN 2468 for all demo students.
- Tests: seeding twice gives the same counts; a fresh DB + server start → `/auth/demo/students` lists Aarav, Priya, Rohan.

### P1-2 Sessions list + `activity_finished`
- `GET /learning/sessions` → `{ sessions: LearningSessionSummary[] }` (the student's own, newest first, max 20).
- `POST /learning/sessions/:id/events` accepts `type:'activity_finished'` (section 4). It records the result and updates mastery for the step's concept (score ≥ 0.8 → like a correct answer, < 0.5 → like a wrong one), then advances the step if the step was the game.
- Tests for both.

### P1-3 Flashcards (spaced revision)
- Migration: `flashcard` table (school_id, profile_id, concept_id, front, back, interval_days, due_at, last_rating). Generate cards from revision modules when a learning session completes a concept.
- `GET /student/flashcards/due`, `POST /student/flashcards/:id/rate` with 1/3/7/14-day spacing ('again' → 0 days, 'hard' → same interval, 'good' → next step, 'easy' → skip one step, cap 14). Seed 6 due cards for Aarav.

### P1-4 Parent and teacher endpoints
- `GET /parents/children/:id/overview` → `ParentOverview`, only for a parent linked to that child (403 otherwise; test it). `GET /sections/:id/heatmap` → `TeacherHeatmap`, only for that section's teacher or an admin.
- Check that the real parent pages work: proof runs showed 403 banners on parent screens. Sign in with `POST /auth/demo/parent` on 3102 and call every endpoint the parent pages use (`rg -n "useRemote\(" apps/web/src/dashboard apps/web/src/routes/ParentHome.tsx` to list them). Fix any 403 that is a permissions bug; list the result per endpoint in your status section.

### P1-5 Content depth for the demo chapters
- At least 3 practice questions per concept for Motion and Coordinate Geometry (today: 1), each with a misconception note for the repair step. Add them to the seed (`notebook-seed.ts` or the module seed). Tests: count per concept ≥ 3.

### P2-1 Public `/health`
- `GET /health` → `{ ok: true, db: true, version }` with no auth (today it returns 401). Keep it out of the auth hook; no internal details. Test it.

### P2-2 Repo hygiene (you own the root `.gitignore`)
- Add to `.gitignore`: `.playwright-mcp/`, `__pycache__/`, `*.pyc`, `test-results/`, `playwright-report/`, `*.done`, `*.tsbuildinfo`, `.codex/`, `.cursor/`, `data/*.db*`, `apps/api/data/*.db*`, `*.log`, `preview/`.
- Untrack (git rm --cached, keep nothing on disk that's needed) the root junk: `codex-*-prompt.md` files and any tracked `__pycache__`/`*.pyc`/`.playwright-mcp` (`git ls-files | rg -i "pycache|\.pyc$|playwright-mcp|codex-.*prompt"` to list them). Don't touch `docs/`, `e2e/` or `scripts/`.
- Commit separately: `chore: repo hygiene`.

### P2-3 Live Gemini verification
- `GET /founder/settings` and `PUT /founder/settings` exist. Verify on 3102: sign in as admin (`POST /auth/demo/admin`), PUT a key only if a real one is present in your local env (`GEMINI_API_KEY`, read via `process.env` in a scratch script; never print it), ask one Motion question as Aarav, and check `ask/status` shows Gemini. If no key is available, write "UNVERIFIED: no Gemini key on this machine" in your status. Never commit or print a key.

## 12. BE preview
Your preview proves the backend works through the real UI. Create `C:\Users\jce\preview\routes-be.json` = `routes-default.json` + `{ "name":"saathy-ask","path":"/student/saathy?chapterId={MOTION}","auth":"student","wait":3000 }` + any screen that shows your new data. In `index.md` Agent notes, also paste (as text) the `Invoke-RestMethod` results of: `/health`, `/student/today` for Aarav, `/learning/sessions`, the plan step count and game steps for Motion, and the first 300 characters of a Saathy answer.
