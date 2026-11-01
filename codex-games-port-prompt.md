# Codex task: port standalone HTML games into VidhyaSaathy (branch games-port)

You are in C:\Users\jce\vs-games (git worktree, branch `games-port`, based on `demo-open-auth` b573c23).
Work autonomously, fast, and commit in small steps. Medium effort; don't over-investigate.

## Environment
- Use Node 24: C:\Users\jce\node24\node-v24.22.2-win-x64 is first on PATH (the launcher sets it). node_modules and apps\web\node_modules are junctions to C:\Users\jce\vs-preview - do NOT run `npm install`/`npm ci` (it would modify the shared vs-preview folder). If better-sqlite3 has an ABI problem, report it in the README rather than rebuilding into the shared folder.
- Use ONLY ports API 3301 and WEB 5373 (`$env:API_PORT=3301; $env:WEB_PORT=5373; $env:VITE_API_URL='/api'; $env:VITE_API_PROXY_TARGET='http://127.0.0.1:3301'`).
- Use your own DB copy: `$env:DATABASE_PATH='C:\Users\jce\vs-games\apps\api\data\games-port.db'` (create it via the normal seed/migrations, or copy an existing seeded db into that path). Never write to other folders' DBs.
- Do NOT touch C:\Users\jce\vs-saathy, C:\Users\jce\vs-preview, C:\Users\jce\vs-gh working files, C:\Users\jce\pitch-shots, or ports 3101/5173/3201/5273/3300.
- Open auth is on in local demo: any student PIN works (e.g. Aarav 2468), teacher@demo.invalid / parent@demo.invalid with Saathy@2026!.

## Sources (all in C:\Users\jce\games-import)
- `zip\` (from Carren): maths-war.html, tinker.html, force-series.html, circleverse.html, chotu-motion.html. `zip\index-landing-ref.html` is an OLD LANDING PAGE, reference only, NOT a game.
- `chatgpt\` (GitHub TheHonoredOne914/chatgpt): Tinker.html, maths-war.html, final.html, VidhyaSaathy-Optics-Lab.html, README.md.
- `local\final.html` (from Dhruv's Downloads, dated 2026-10-29).
- Port EVERY game from both sources. Dedupe identical/near-identical copies (diff them; sizes differ slightly, likely line endings) and prefer the newer/better version. final.html is probably a newer Tinker build: compare with Tinker.html/tinker.html and port the better one as Tinker (one game, not two), unless it's actually a different game.
- Any atom game: IGNORE. The existing `atom` engine (Kurzgesagt-style Atom Forge) must NOT be modified or replaced.

## 1. Port each game as a proper in-app game
- Study each HTML file. Port into apps/web/src/games/<id>/ as a React/TS engine using the existing engine system (apps/web/src/games/engine/registry.ts, types.ts, GameSession, CheckpointPanel, progress.ts, etc.), same structure as existing engines (arena, cell, energy, float, graphs, matter, motion, newton, poly, sound).
- Mapping:
  - Maths War -> Maths, Grade 9 concept arena (map to the best-fitting Class 9 maths chapter(s), e.g. number systems / polynomials, by its content).
  - Circleverse -> Maths, Circles.
  - FORCE: The Series -> Physics/Science, Force and Laws of Motion.
  - Chotu ki Kahani: Motion -> Physics/Science, Motion.
  - Tinker (The Knowledge Quest) -> inspect content and choose the subject/chapter.
  - VidhyaSaathy Optics Lab -> Physics, light/optics. Not a Class 9 NCERT chapter: put it under Physics as an "explore" game or the closest chapter.
- If an existing engine covers the same concept (motion, newton), keep both or merge sensibly; never delete existing games.
- Each game must be reachable from its subject/chapter page (not only a demo URL) and record progress/mastery to the backend like the existing games.

## 2. Concrete wiring fixes (required)
1. apps/web/src/practice/PracticeList.tsx currently lists all games + 'demo' in every chapter. Filter to only the game(s) mapped to that chapter (from game-bank.ts / the API), and drop the 'demo' entry from real chapters.
2. apps/web/src/games/EngineGamePage.tsx must check the game belongs to the chapter (redirect or show a friendly message otherwise; keep the existing demo route working).
3. apps/web/src/student/notebook/screens/SubjectPathBoard.tsx shows one "Today's game" card from home data, so it can show a Physics game on Maths. Show that subject's games from /student/games filtered by subjectId.
4. Add `atom` to apps/api/src/db/game-bank.ts and GAME_TITLES (apps/api/src/routes/games.ts) under Chemistry "Structure of the Atom" so it's linked from that chapter. Keep the Atom Forge experience itself unchanged.
5. Add every newly ported game to game-bank.ts and seed-phase4.ts with checkpoint questions (update apps/api/test/seed-phase4.test.ts expectations accordingly).
- Also audit every existing game (arena, atom, cell, energy, float, graphs, matter, motion, newton, poly, sound) is wired into its correct subject/chapter and fix any that aren't.
- If a core NCERT Class 9 science/maths chapter still has no game, build a small, polished one for the most important missing ones (at most 3 new).

## 3. Diagnostic before first chapter visit (required)
Before a student opens a chapter for the first time, a short diagnostic quiz must appear. The app already has diagnostic pieces (apps/api/src/routes/diagnostic.ts, apps/web/src/routes/content/DiagnosticPanel.tsx, apps/web/src/student/notebook/screens/DiagnosticPage.tsx, diagnostic.css, docs/mockups-v10-final/diagnostic.html). Reuse them and wire them into chapter entry. If per-chapter support is missing, build a 4-6 question diagnostic per chapter from existing chapter questions, store the result server-side, set the starting mastery state, and skip it on later visits. Notebook look, no ranks shown.

## Rules
- Notebook look matching the app (reuse existing engine theme.css/notebook styles), full width and height at every screen size.
- No sound, no emoji.
- Never show ranks/bands to students. Use only: Let's fix this / Almost there / Mastered / Top form / New.
- Keep all existing data; additive seed changes only.
- Do not touch the landing page or themes.

## Verify, commit, push
- Run the typecheck (repo script, e.g. `npm run typecheck`) and `npx vitest run --pool forks`. Fix failures.
- Smoke-test in the browser on 5373 if possible: sign in as Aarav, open Maths and Physics subjects, confirm each chapter shows only its games, play each ported game to a checkpoint, confirm the diagnostic appears on first chapter entry and not after.
- Commit in small steps. `git push -u origin games-port`.
- Write docs/games-port/README.md: each game (source file used, which duplicate was chosen and why), its subject/chapter, route, what was wired/fixed, diagnostic flow, and anything not finished.


## RESUME NOTE
A previous run of this prompt was cut off mid-way (network drop). Run git status and git diff first, keep the uncommitted work that is good, and continue from where it stopped. Do not redo finished work.


## Added (Nov 1, 10 PM): integration requirements, don't stop early
- Every game must be reachable from its chapter's **Play** step (chapter page -> Play -> that chapter's games first), not only from the arcade.
- Every game must POST its result to the backend (score, per-question correct/incorrect, concept ids, confidence when asked) so it writes learning evidence and updates the student's status words; no localStorage-only scores.
- Each played game must show in the learning flow: the Play step on the chapter page marks done, and the next step (Fix or Master) updates.
- Atom Forge stays untouched. Finish every game and every wiring item, don't stop early.

