# Future-agent handoff

## Start here

- Read root `AGENTS.md` first. Work on `rebuild-local`, the integrated app, not an old WIP snapshot.
- Stack: npm workspaces; `apps/web` React/Vite/TypeScript, `apps/api` Fastify/SQLite/Drizzle, shared `packages/contracts` and `packages/core`. Node >=24.
- `docs/IMPLEMENTATION.md` was absent from this checkout. Use the scoped implementation/progress documents under `docs/codex`, approved `docs/mockups-v10-final` and `docs/atom-kz` instead.
- The original review prompts and specifications remain in the repository. Read only relevant sections, not whole content directories or lockfiles.

## Integrated work

Reviewed and merged, in order: `phase-3c`, `polish3a`, `atom-kz`, `phase-4b`, `phase-4f`, `review-3bc`.
Each has `docs/codex/progress-<branch>.md` recording fixes and verification.
Atom includes all six beats, tilted orbits, unobscured title/nucleus, one zoom hint, accessible back control and symmetric particle smiles.
Ask/games use real server-owned threads, scoring and evidence; worksheet drafts reload through an owned assignment-scoped endpoint.
Latest integrated review: root typecheck green; 90 test files / 370 tests passed with forks; web production build passed.
Review screenshots covered nine screens at 390/1024/1280/1600/1920px: no horizontal overflow or browser exceptions.
Other branch-specific game/Ask/Atom visual and live API checks are recorded in their progress files.

## Run and verify

```powershell
npm install
npm run demo
# In another terminal:
npm run typecheck
npx vitest run --workspace vitest.workspace.ts --configLoader native --pool forks --maxWorkers 2 --reporter dot
npm run build -w apps/web -- --configLoader native
```

See root README for demo PINs and ports. Use `--configLoader native` on Windows.
Start agent-owned servers hidden/in the background; record PIDs and stop them afterward.
Do not run destructive seed/reset operations. Before every migration back up existing database/WAL files;
the demo launcher additionally takes a verified SQLite online backup before migration.

## Non-negotiable

- Preserve all existing data and work. Never reset hard, stash/discard another agent's changes, wipe databases or destructively reseed.
- No secrets, database files, uploads, node_modules, screenshots, build output or generated junk in Git.
- Match approved full-width notebook layouts; do not change landing page, themes or palette. No emoji or audio.
- Student states: Let's fix this / Almost there / Mastered / Top form / New; never ranks, bands or numeric levels.
- Real backend data only. Server scoring and owned evidence writes; never send answer keys to students.
- Diagnostics test prior-class prerequisites only, include Haven't learned this yet with no penalty; new chapter concepts start New.
- No new games. Atom edits follow its approved design, not unrelated game rebuilds.
- Keep changes scoped; stage exact paths; run typecheck and fork-pool tests before committing.

## Remaining limitations — do not fake completion

- No AI/OCR provider was configured locally. Grounded extractive fallback works; provider/OCR-dependent flows cannot be claimed verified.
- `docs/codex/needs-mockup-phase-4f.md`: approval needed for All doubts destination, message save control, teacher-escalation confirmation and notebook finish/personal-best card.
- Missing confidence/study-time backend aggregates remain honest empty states, not invented statistics.
- Class-code sign-in and worksheet photos are not implemented; current UI explicitly says so. Production activation and messaging deployment need their own end-to-end acceptance.
- `docs/codex/next/` describes later phases, not work already completed.

## Local-only material

Existing SQLite data, private backups and visual screenshots are intentionally not uploaded.
Demo seeding recreates fixtures on a clean clone; real local learning histories require securely transferring a backup separately.
Windows worktree paths, external screenshots and preserved junk paths in old progress files are historical QA references, not portable setup requirements.
