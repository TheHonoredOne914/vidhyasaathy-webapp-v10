# Codex runs for VidhyaSaathy Phases 4-5 (prepared, NOT launched)

## Files
| file | what |
|---|---|
| codex-phase-4b-prompt.md | backend: Ask Saathy API (SSE pipeline, guards, budget, threads, quick try, saved, snap, escalation), pluggable AI provider (stub default / OpenAI-compatible / generic HTTP for Dhruv's Class 9 model, keys from env, server-side only), games → evidence |
| codex-phase-4f-prompt.md | frontend: Ask screen = ask.html, games board = games.html, in-game checkpoint wiring (non-atom), owns shared web files |
| codex-phase-5b-prompt.md | backend: teacher home data (KPIs, mastery by group/student, suggestion, review queue, nudges), teacher plan APIs (heatmap, drill, reteach, doubt clusters, grading, homework), content generator, parent week/report/ask-this, admin, privacy wall, notify cap |
| codex-phase-5f-prompt.md | frontend: teacher-home.html, parent-home.html, whole-app sizing + hygiene audit (fixes own files, logs the rest) |
| codex-final-sweep-prompt.md | optional, sequential, after all 4 merges: real-data verification, polish-todo, 5C readiness, screenshot set |
| contracts-phase4-5.md | API shapes shared by backend and frontend runs (copy into each worktree as docs/codex/contracts-phase4-5.md) |
Every prompt has: mockup-exact rule (never design; gaps → docs/codex/needs-mockup-<run>.md), REAL DATA RULE, sizing rules (min-width:0, `minmax(0,1fr) clamp(260px,22vw,340px)`, rail stacks <1180px, no fixed heights, no overflow-x hack, scrollWidth check at 360/1024/1280/1440/1920), Carren's hard rules, commit-per-piece with typecheck + tests (`--pool forks` fallback), progress-<run>.md, backend never touches apps/web.
Note: needs-mockup is per-run (`needs-mockup-<run>.md`) to avoid add/add merge conflicts between 4 parallel runs; the final sweep (or you) merges them into docs/codex/needs-mockup.md.

## Before launching (parent does this)
1. Merge polish3a, polish3b, polish3c and phase-3c into rebuild-local; put that commit in `{{BASE_COMMIT}}` in the 4 prompts.
2. Make sure the base has: docs/codex/cursor-phase-4.md, cursor-phase-5.md (from /workspace/plans), docs/codex/contracts-phase4-5.md (this folder), docs/mockups-v10-final/ (html + png + IMPLEMENTATION.md), docs/codex/ui-todo-3c.md (from phase-3c). Commit them on rebuild-local before creating worktrees.
3. Worktrees (PowerShell, from the main repo):
```
git worktree add C:\Users\HP\vs-wt-4b -b phase-4b {{BASE_COMMIT}}
git worktree add C:\Users\HP\vs-wt-4f -b phase-4f {{BASE_COMMIT}}
git worktree add C:\Users\HP\vs-wt-5b -b phase-5b {{BASE_COMMIT}}
git worktree add C:\Users\HP\vs-wt-5f -b phase-5f {{BASE_COMMIT}}
```
   Backend worktrees (4b, 5b): `npm ci` in each (they edit migrations/deps). Frontend worktrees (4f, 5f): node_modules junctions like vs-wt-a/b/c. Each worktree needs its own apps/api/data DB (copy the main data folder; never share a DB file).
4. Ports: 4b 3010/5182, 4f 3011/5183, 5b 3012/5184, 5f 3013/5185, final sweep 3014/5186.
5. Optional for 4f/5f real-data checks during the run: start 4b and 5b first so their APIs (3010, 3012) are up.

## Merge order
1. **phase-4b** → rebuild-local (migrations 0040-0049, schema-phase4.ts).
2. **phase-5b** → expected conflicts: drizzle/meta/_journal.json (keep both blocks, renumber `idx` sequentially, 4b entries before 5b; `when` values already ordered), schema.ts / app.ts / main seed (keep both appended lines), next-action.ts (keep both one-line hooks), evidence/parent_link column blocks. Then `npm run db:backup`, run migrations on a copy of the real DB, check row counts unchanged, run full tests incl. privacy-wall.
3. **phase-4f** (shared web files) → should be clean against backend.
4. **phase-5f** → only own files; should be clean. Then apply routes-todo-5f.md items that need shared files.
5. **final sweep** (codex-final-sweep-prompt.md) from the merged commit (`{{MERGED_COMMIT}}`).

## Screens for phases 4-5 that have NO v10 mockup (design these; Codex will not build them)
Student (Ask / games)
- Snap confirm sheet (preview photo + editable extracted text). Interim: extracted text goes straight into the composer.
- "Ask my teacher" escalation confirm sheet ("also tell my teacher" checkbox, teacher name, sent state). Interim: `ask_teacher` chip hidden.
- Save control on a Saathy answer bubble (+ saved/unsave state). Interim: Saved list shows API data only, no way to save from UI.
- "All doubts" page (Recent doubts → All) and the saved-explanation detail view.
- Homework-mode Ask (locked hints banner/state) if you want it to look different from the normal tabs.
- In-game checkpoint panel and game finish / personal-best card in notebook style (Interim: existing game UI with real numbers, LV/XP header removed).
- Teacher escalation inbox + reply (no mockup).
Teacher
- Class mastery full page (nav item) + cell drill drawer + student drill/evidence page.
- Reteach create sheet + reteach tracker.
- Doubt clusters page.
- Grading queue.
- Lesson review: content draft review (notes / questions) and video clip review in notebook style (Interim: Review/Watch link to existing draft routes).
- My classes, Sessions, Homework (list + "New homework" create) in notebook style; Notifications/Settings for teacher if they differ from the student versions.
Parent
- Progress report page (weekly report, effort bars, readiness lamp, print), Homework page, From school page.
- Multi-child switcher, "Mark as had" on What to ask at dinner, pending-link state (interim: one line in parent home head).
Admin (all): admin home, parent-link approval queue, permission matrix, audit log + CSV, demo reset, onboarding wizard gaps, claim slips.
Other: /privacy page in v10 notebook style (old privacy-v1 is not v10; left unchanged).

## Mockup conflicts already decided in the prompts
- games.html "Lvl 4" on Polynomial Factory → replaced with "Best 42 s" / "3 stars" / "Best 7/10" (no numeric levels rule).
- games.html game names differ from the registry → real titles from the API.
- ask.html tabs "Hints mode / Explain fully" replace the plan's "Hint mode toggle"; mic not built.
- Still open for you: the student top bar shows "340 XP" in every mockup; XP is kept as-is (not a rank), but confirm Carren is fine with it.

## Not done here
Nothing launched; laptop not touched (only read the two existing prompts). `{{BASE_COMMIT}}` / `{{MERGED_COMMIT}}` placeholders need filling.
