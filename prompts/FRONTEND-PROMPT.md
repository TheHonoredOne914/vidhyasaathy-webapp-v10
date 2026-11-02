# FRONTEND PROMPT: VidhyaSaathy fe-pass (frontend only)

You are the **frontend agent**. You work ONLY in `C:\Users\jce\vs-fe` on branch `fe-pass`. Ports: API **3103**, web **5175**. Another agent (BE) works at the same time in `C:\Users\jce\vs-be` on the backend. You never edit its files, and it never edits yours. Read the whole file before you start. Then follow section 9 ("How to run this whole prompt").

Dhruv's verdict: "the frontend sucks." This pass is a **real visual and UX overhaul** of the student app plus the adult dashboards. It is not a polish of what exists. Every screen must look like the approved notebook mockups in `docs/mockups-v10-final/*.html`: open them in the browser at 1440x900 and screenshot them as your reference. Also study `docs/mockups-v10-final/png/` and `docs/mockups-v10-final/IMPLEMENTATION.md`.

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

## 10. Design system rules (apply to EVERY screen you touch)

Use the existing tokens in `apps/web/src/student/notebook/tokens.css`. Don't change values; add tokens only if needed.

**Type scale (use the vars, never raw px):**
- Page title: `--nb-font-hand`, `--nb-fs-h1` (2.6rem), weight 700, navy `--nb-navy`, with the gold underline stroke used on Home ("Namaste, Aarav").
- Section/card heading: `--nb-font-hand`, `--nb-fs-h2` (1.65rem), weight 700.
- Card sub-heading: `--nb-font-hand`, `--nb-fs-h3` (1.35rem).
- Saathy speech, teacher remarks, notes: `--nb-font-note`, `--nb-fs-lead`.
- Dense reading text, options, numbers, tables: `--nb-font-ui`, `--nb-fs-body`, line-height 1.55. Small meta: `--nb-fs-small`, colour `--nb-ink-soft`.
- Never use more than 3 sizes in one card. Never put Caveat on paragraphs longer than one line.

**Spacing and layout:**
- Use the shell grid: sidebar `--nb-sidebar-w`, main, optional right rail `--nb-rail-w`, gutter `--nb-gutter`. Main content fills the width. At 1440 the main column is about 760-900px with a rail; at 1920 it grows (everything is rem-based, `html{font-size:clamp(...)}`).
- Vertical rhythm is in multiples of `--nb-s4` (1rem). Cards have padding `--nb-s5`/`--nb-s6` and a gap of `--nb-s5` between cards.
- At most ONE primary (navy filled) button per screen region. Secondary = ghost. Tertiary = link.
- Cards: `--nb-radius-sketch`, `--nb-line` border `--nb-border`, `--nb-shadow`, paper `--nb-paper`. Sticky notes (`--nb-sticky-*`) only for Saathy tips or the daily challenge; at most 2 per screen.
- Status words always render with the existing chip colours (`--nb-m-fix`, `--nb-m-almost`, `--nb-m-mastered`, `--nb-m-top`, `--nb-m-new`). Write ONE helper `statusWord(mastery, attempts)` in `apps/web/src/student/status.ts` with a unit test, and use it everywhere. Remove any band, tier, rank, level or "LV" text shown to students (`rg -n -i "warrior|\bLV\b|rank|band|tier" apps/web/src` and fix every student-facing hit, except Atom Forge).
- Empty states: Saathy mascot (`Saathy.tsx`, mood `sleep` or `happy`) + one sentence + one action. Never "Nothing here".
- Loading: skeleton blocks in the card's shape, never a blank page. Errors: a friendly card with "Try again", never raw error text, never a debug string.
- Accessibility: every button has a visible label or `aria-label`; focus ring = the existing peach offset shadow; contrast AA; nothing covered by the floating AskDock.

## 11. Tasks, in priority order

Each task lists: what to build, files, acceptance criteria and how to verify. Verify = run it and screenshot it.

### P0-1 Student shell and navigation (one Saathy door)
- Files: `apps/web/src/student/notebook/NotebookShell.tsx` (nav arrays at about lines 15-19 and 51), `apps/web/src/routes/Shell.tsx` (student nav at about lines 46-56), `apps/web/src/routes/StudentHome.tsx` (`panel=ask` redirect), `apps/web/src/student/HomeDesk.tsx:194`, `apps/web/src/ai/AskDock.tsx`.
- Build: sidebar order per spec: Home, My subjects, Study sessions, Homework | PLAY: Games, Revise | Ask Saathy | YOU: My progress, Notifications, Settings. Every "Ask Saathy" link goes straight to `/student/saathy` (no `?panel=ask` anywhere: `rg -n "panel=ask" apps/web/src` must return only the legacy redirect in StudentHome.tsx). Add "Revise" → `/student/revise` (route added in P1-3).
- Mobile (<= 768px): a bottom tab bar with Home, Subjects, Revise, Saathy, Me. The sidebar collapses.
- Acceptance: the active nav item is highlighted on every student route, including chapter, learn and session pages. There's one Saathy entry point in the nav. AskDock is hidden on `/student/saathy` and on the learning player (it has its own contextual Saathy).

### P0-2 Student Home rebuild (`/student`)
- Reference: `docs/mockups-v10-final/home.html`. Files: `apps/web/src/student/HomeDesk.tsx` (rewrite), `apps/web/src/student/home.css`, `apps/web/src/routes/RoleHome.tsx`.
- Data: new adapter `apps/web/src/api/today.ts` → `GET /student/today` (shape in section 4). On 404, derive a TodayPlan from the existing `GET /student/home` (`nextAction`, `catchUp`, `warmup`, `streak`), mark it `source:'mock'`, and add an FE-NEEDS entry.
- Layout at 1440: left main column = greeting row (date pill, "Namaste, Aarav" h1, Saathy cloud with a one-line speech bubble), then ONE hero card "Your next step" (title, subtitle, estimated minutes, one navy Continue button, a small mini-visual on the right), then "Your subjects" grid (4 cards, progress bar, "x of y ideas", status chip), then "Your path" for the current chapter (the stops strip from P0-3, compact). Right rail = Today's goal checklist (max 3 = `next[]`), the daily challenge sticky note, This week streak dots, and From your teacher.
- Remove: the four competing "next" widgets; any `resumeState` raw text (the `step=4` bug at `HomeDesk.tsx:122`; NEVER render `resumeState`); duplicate "Today" blocks.
- Blank first render (proof run: a 5 KB blank screenshot): render the shell and skeletons immediately. Never return `null` while queries load. Check that `RoleHome.tsx` doesn't wait on a slow call before painting, and that a failing call (e.g. catchup 404) doesn't blank the page.
- Acceptance: one primary action; screenshot `student-home` is not blank within 4 s; no text matches `/step=|undefined|null|NaN/`; the subjects grid fills the width.

### P0-3 Chapter World page (replaces the CMS-style chapter list)
- Reference: `docs/mockups-v10-final/subject-path.html` + LEARNING-FLOW-PLAN (6 stops). Files: `apps/web/src/routes/content/ChapterDesk.tsx` (student branch), `apps/web/src/student/notebook/screens/SubjectPathBoard.tsx`, new `apps/web/src/student/chapter/ChapterWorld.tsx` + `chapter-world.css`, `apps/web/src/proto/LearningChapter.tsx`.
- Data: adapter `apps/web/src/api/chapterWorld.ts` → `GET /student/chapters/:id/world`. Fallback: build it from `/learning/modules?chapterId=`, `/learning/games` (filter by chapterId) and the existing chapter concepts, `source:'mock'`.
- Layout: header band (subject · chapter, h1, "x of y ideas", status-word legend). Under it, a horizontal path of 6 stops: **Explore** (explorer modules + game), **Learn** (concept + guided example), **Try** (practice), **Fix** (repair; only shown as "open" when there is a Let's fix this concept), **Play** (chapter games from the registry), **Master** (revision + a short check). Each stop is a notebook card: icon, title, one-line detail, state (locked/open/done) and one action. Below: "Ideas in this chapter" list with status chips, and a right rail with "Plan my learning" (primary) and "Ask Saathy about this chapter" (opens `/student/saathy?chapterId=<id>`).
- Teachers and admins keep the existing CMS view in `ChapterDesk.tsx`. Only the student branch changes.
- Acceptance: Motion and Coordinate Geometry both render 6 stops with real module counts; the Play stop lists Motion Lab and Chotu ki Kahani: Motion for Motion, and Coordinate Graphs for Coordinate Geometry (from `/learning/games`); every action navigates somewhere real.

### P0-4 Learning Player redesign + games inside the plan (FE part of "no game opens from Explore")
- Files: `apps/web/src/proto/LearningPlayer.tsx`, `apps/web/src/proto/ModuleView.tsx`, `apps/web/src/proto/ContextualSaathy.tsx`, `apps/web/src/proto/learning.css`, `apps/web/src/proto/LearningChapter.tsx`, `apps/web/src/games/ChapterPlaySteps.tsx`, `apps/web/src/games/EngineGamePage.tsx`, `apps/web/src/games/ported/*.tsx` (navigation props only; don't restyle game internals), and the `/student/learning/sessions/:sessionId` route.
- Layout: a left progress rail of steps (module type icon + short title + status), a centre "slide" card for the current module (concept = big idea + one diagram/visual from `apps/web/src/ai/visuals/`; guided example = numbered worked steps; explorer = interactive or the game card; practice = MCQ with confidence buttons; repair = misconception card in the red-pen style + "try again"; revision = flashcard), a bottom bar with Back / Next (Next disabled until the API allows it: STEP_ORDER / ANSWER_REQUIRED 409s show as a friendly hint), and a right contextual Saathy panel.
- Games: when a plan step has `activityId`, OR the step is an `explorer` module and `/learning/games` has a game for this chapter, show a "Play <game title>" card that opens the game route with `?returnTo=/student/learning/sessions/<id>&step=<n>`. On game finish or exit, return to exactly that URL (Back must go to the plan step, not to Home or the chapter test). Post `activity_finished` (section 4) through an adapter; on 400/404, store it locally and continue. Note it in FE-NEEDS.
- Acceptance (verify with the screenshot route list): Motion plan, then the Explore step shows Motion Lab, which opens the game, and Back/finish returns to the same step. Same for Coordinate Graphs in Coordinate Geometry. A wrong practice answer shows the repair card, then a retry.

### P0-5 Saathy chat (`/student/saathy`): working first answer, right chapter, parity
- Files: `apps/web/src/ai/AskPanel.tsx`, `apps/web/src/ai/SaathyLevelCheck.tsx`, `apps/web/src/ai/LearningStudio.tsx`, `apps/web/src/ai/StudyHome.tsx`, `apps/web/src/ai/ask-v2.css`, `apps/web/src/ai/saathy-studio.css`. Keep parity notes in your PROTOTYPE_STATUS FE section, not in docs/.
- **Level Check failing (proof run: "Retry loading check" on a new chat, so no real answer).** `SaathyLevelCheck.tsx:15` loads `/chapters/:id/notebook-diagnostic`. A live check on 2 Nov returned 200 with questions for Motion, so the failure is in the client. The most likely cause: `OfferSchema` uses the strict `PublicItemSchema` with `sourceClass: z.number()`, and the API sends `sourceClass` as null or as an extra key, so parsing fails and the UI shows "Retry loading check". The empty Biology diagnostic (BUGS #9) is a second cause. NOTE: another job was fixing exactly this in vs-master on 2 Nov (uncommitted when this prompt was written: nullable `sourceClass` peeled off before `PublicItemSchema.parse`, plus a "Skip, just answer me" button). First run `git log master --oneline -5 -- apps/web/src/ai/SaathyLevelCheck.tsx`; if that fix is on master, `git merge` is NOT allowed, so re-implement the same idea on your branch and say so in your status. Reproduce in your preview, read the network response, and fix the FE side: tolerate `offered:false` and an empty `questions` array; on any error show "Skip for now" (primary) + "Try again" (ghost). Skip MUST let the question go through to `/ask/stream`. Add a permanent small "Skip level check" link. (BE fixes the empty-diagnostic data and makes general chat answer; you don't touch the API.)
- **Wrong default chapter (proof run: picker defaults to Biology / The Fundamental Unit of Life).** `AskPanel.tsx:105` uses `params.get('chapterId') ?? ''` and then falls back to the first chapter. New order: `?chapterId=` → the chapter of the student's active learning session (`/learning/sessions` adapter, or `/student/home` nextAction) → the last chapter used in Saathy (localStorage `vs.saathy.chapter`) → "No chapter (general question)". Never silently pick the alphabetically first subject.
- Send `sessionId` and `teachingMode` with `/ask/stream` when known (section 4). The teaching-mode chips (`TEACHING_MODES`) must not paste "Mode label: topic" into the text box; send the mode as a field and show it as a small chip on the message. Until BE merges, keep the text fallback behind the adapter.
- **Settings sheet** (port from `C:\Users\jce\dhruv-model\src\components\saathy\settings-sheet.tsx`, read-only reference): language (English/Hinglish/Hindi), explanation style, hints vs explain, font size. Plus a **Founder settings** link to a new route `/founder` (`apps/web/src/founder/FounderSettings.tsx`). Don't swap the student's session in the chat. The `/founder` page: if the current session isn't admin, show "Founder unlock", which (only when the API reports demo loose auth, i.e. `POST /auth/demo/admin` succeeds) signs in as admin in that tab. The form: GET `/founder/settings` → shows `geminiConfigured`, `geminiKeyMasked`, `geminiModel`, `source`; PUT `/founder/settings` `{geminiApiKey?, geminiModel?}`; "Remove key" sends `geminiApiKey: ''`; never echo the typed key back after save; input `type=password` with autocomplete off.
- Parity with dhruv-model (`src/components/saathy/*`, `src/components/learn/*`): message bubbles, composer with stop, quick-check card, video kit card + YouTube card (render from links in the answer; no autoplay, no sound), artifact cards (`apps/web/src/ai/visuals/artifact-card.tsx` exists), and the Learning Studio (slides, flashcards, quiz paper, concept map, flow chart). For each dhruv-model component, write in your status section: PORTED / PARTIAL / MISSING with the file.
- Layout: left history column (collapsible, 18rem), centre chat (max reading width 46rem, centred in its column, ruled paper), right rail (the current chapter card, "Learning modules", Recent doubts). Remove the static "Model information / Trained on" marketing card from the rail.
- Acceptance: on a fresh student, `/student/saathy` → type "What is displacement?", then either the level check (with Skip) or the answer appears. After Skip, a real answer streams (with BE merged) or the honest fallback message. The chapter shown = Motion when the student has a Motion session. The founder form saves a key and shows it masked only. Screenshot all three.

### P1-1 Practice and Games pages must not force the chapter test
- File: `apps/web/src/games/ChapterEntryGate.tsx` (lines 10-15 redirect with `<Navigate replace>` when `offer.data.offered`).
- Build: never auto-redirect. Show an inline, dismissible card at the top: "Want a 3-minute warm-up check first?" with Start check / Not now. "Not now" is remembered per chapter (localStorage). Games and practice are always reachable.
- Acceptance: `/student/chapters/{MOTION}/practice` and `/student/chapters/{MOTION}/practice/<gameId>` open directly (screenshot both).

### P1-2 Study Sessions (`/student?panel=study`) and PlayLab (`/student?panel=games`)
- Files: `apps/web/src/student/notebook/screens/StudySessionsBoard.tsx`, `apps/web/src/proto/ContinueLearning.tsx`, `apps/web/src/student/notebook/screens/GamesBoard.tsx`, `apps/web/src/student/notebook/pages/games.css`.
- Study Sessions: adapter `GET /learning/sessions` (fallback: the existing local shortcuts + `GET /learning/sessions/:id`). Cards: chapter, subject, "step 3 of 10", next step title, status words for its ideas, Resume (primary), Summary (ghost, uses `/learning/sessions/:id/summary`). Empty state → "Plan my learning" for the current chapter. Never show Homework on this page (BUGS #1).
- PlayLab: all games from `/learning/games` grouped by subject → chapter, each a card with title, one-line description, chapter, the student's status word for that chapter, and Play. Atom Forge keeps its existing link and card exactly. Remove the fake rank or level header.
- Acceptance: 20 games visible, grouped, every Play opens the game, and Back returns to PlayLab.

### P1-3 Revise page (`/student/revise`)
- New files: `apps/web/src/student/revise/RevisePage.tsx`, `revise.css`, adapter `apps/web/src/api/flashcards.ts` (`GET /student/flashcards/due`, `POST /student/flashcards/:id/rate`). Fallback: build cards from revision modules of chapters with sessions, with a local schedule (1/3/7/14 days) in localStorage, `source:'mock'`.
- UI: big flashcard (front in Caveat, back in Inter), flip on click or Space, four buttons Again/Hard/Good/Easy, a "due today" count, and "Done for today" with the mascot.
- Add the route in `apps/web/src/App.tsx` inside the student guard.

### P1-4 Parent, Teacher and Admin dashboards with real charts
- Files: `apps/web/src/demo/Charts.tsx` (7 lines today, so rebuild it), `apps/web/src/demo/ParentWorkspace.tsx`, `TeacherWorkspace.tsx`, `AdminWorkspace.tsx`, `demo.css`, `apps/web/src/demo/data.ts` (keep all existing data, add fields only), plus the real routes `apps/web/src/routes/ParentHome.tsx`, `apps/web/src/dashboard/ParentChild.tsx`, `apps/web/src/routes/TeacherHome.tsx`.
- Charts: hand-written SVG (no chart library), notebook style (pencil strokes, Caveat labels): effort bars (7 days), mastery trend line, status-word donut, streak calendar, readiness lamp, "learns best with" note. Teacher: concept × student heatmap with a "By concept / By student" toggle that is actually clickable (BUGS #13), a roster, and a "Reteach" action. Admin: school counts, classes, the Founder settings link.
- Parent tabs Overview / Progress / Homework must show different content (BUGS #7). The real `/parent/children/:id` screens use the `ParentOverview` adapter (section 4) with a mock fallback.
- One-click demo login per role: in `apps/web/src/demo/DemoEntryButtons.tsx`, keep "Enter as Student" exactly as it is (the screenshot script depends on its name). Add, for parent, teacher and admin: try `POST /api/auth/demo/<role>` and navigate to `/parent`, `/teacher` or `/admin`; if that fails, fall back to the current `/demo/<role>` link.
- Acceptance: screenshots of all 3 demo dashboards and the real parent and teacher homes show charts with data, no 403 banners, and Aarav/Priya/Rohan names consistent with the student side.

### P1-5 Remaining student screens: consistency pass
- Restyle to the same system (titles, cards, empty states): `WarmupDesk.tsx`, `CatchupDesk.tsx` (404 = "You're all caught up" card, not an error), `ChallengeDesk.tsx`, `DushmanDesk.tsx`, `apps/web/src/dashboard/ProgressPage.tsx` (status words only for the student, no percentages-as-rank), `HomeworkBoard.tsx`, `SubjectsBoard.tsx`, `routes/Welcome.tsx` (stop duplicating Home: make it a 3-step first-run onboarding: pick language → meet Saathy → start Motion), `NotificationsPage`, `SettingsPage`.
- Remove the always-in-DOM "Sign out?" heading (BUGS #15: render the dialog only when open).

### P2-1 Hindi toggle
- New `apps/web/src/i18n/en.json`, `hi.json`, `apps/web/src/i18n/index.ts` (a tiny `t(key)` + React context, no new dependency). A language switch in Settings and the Saathy settings sheet, stored in localStorage. Translate: shell nav, Home, Chapter World, Learning Player chrome, Saathy chrome, Revise, status words (Hindi forms: नया, चलो ठीक करें, लगभग हो गया, पक्का, टॉप फ़ॉर्म). Content (module text) stays English unless the API sends Hindi.

### P2-2 Polish and a11y sweep
- BUGS P3: covered or unlabeled buttons, the AskDock overlapping footers, focus order. Splash: no long splash (BUGS #8); show the shell immediately.
- Run `@axe-core/playwright` (already a root devDependency) on Home, Chapter World, Learning Player and Saathy from a scratch script OUTSIDE the repo (`C:\Users\jce\preview\axe-fe.mjs`, same `createRequire` trick as shoot.mjs). Fix serious and critical issues.

## 12. FE routes file for the preview
Create `C:\Users\jce\preview\routes-fe.json` = `routes-default.json` + `{ "name":"revise","path":"/student/revise","auth":"student" }`, `{ "name":"motion-practice","path":"/student/chapters/{MOTION}/practice","auth":"student" }`, `{ "name":"founder","path":"/founder","auth":"none" }`, `{ "name":"saathy-ask","path":"/student/saathy?chapterId={MOTION}","auth":"student","wait":3000 }`, and any screen you changed. Add new tokens to shoot.mjs only if needed (it's outside the repo; keep it backward compatible).
