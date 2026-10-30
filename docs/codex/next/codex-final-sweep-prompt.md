# CODEX RUN (read this header first)
You are Codex. Base: branch rebuild-local at {{MERGED_COMMIT}}, which contains phase-4b, phase-5b, phase-4f and phase-5f merged. This is a SINGLE sequential run (nothing else is running), so you may edit any file, but you still never design: no screen without a mockup in docs/mockups-v10-final/.
- COMMIT after every fix with `npm run typecheck` and `npm run test:unit` passing (exit 3221225477: rerun once, then `npx vitest run --pool forks`). Progress in docs/codex/progress-final-sweep.md as you go. Don't stop to ask questions.
Worktree: C:\Users\HP\vs-wt-final, branch final-sweep, API 3014, web 5186. Same git rules as before: never merge/rebase/push/reset --hard/switch branch, never `git add -A`/`git add .`, never commit .playwright-mcp, scratch, logs or DBs. Screenshots via e2e/ chromium.launch() scripts only.

## Tasks
1. Merge the needs-mockup-*.md files into docs/codex/needs-mockup.md (dedupe; do not build any of them).
2. Real-data verification of every phase 4-5 screen against the merged backend: Ask (stream, quick try, snap not_configured, errors, recent/saved), Games board and one checkpoint per non-atom game, Teacher home (both views, nudge), Parent home (Aarav's and Priya's parents). Aarav and Priya must differ. Fix wiring bugs; log missing data in data-gaps-final.md.
3. Work through docs/codex/polish-todo-5f.md and routes-todo-5f.md (only items that touch mocked screens).
4. cursor-phase-5.md 5C readiness: docs/codex/readiness.md, the phase 4/5 e2e acceptance + edge-sweep specs, the privacy and hygiene audits, the screenshot set at 360/1024/1280/1440/1920 in e2e/screenshots/final/.
5. Final audit: scrollWidth <= innerWidth on every route at all 5 widths (table in progress file), no emoji, no sound, no LV/Lvl/rank/band for students or parents, mascot.webp only on landing, Atom Forge "Coming back soon", diagnostic prior-class only with not_taught no penalty, landing/themes unchanged, no data lost (row counts before vs after migrations).

The rules below apply unchanged (the parallel-run table is history; use your own worktree and ports above).

### Carren's hard rules (non-negotiable)
- Keep all data: migrations additive only; run `npm run db:backup` (back up apps/api/data/*.db) before any migration; seeds are idempotent and never delete or rename existing rows.
- No new games. Atom Forge is paused: never touch apps/web/src/games/atom* or its route, never suggest it, never wire it to evidence; on the games board it appears only with the "Coming back soon" sand chip and no button; every games API returns it as `state:'paused'` (never playable, 404 on its session routes).
- Landing page, themes, colours and vs-theme.css unchanged. No dark mode.
- No sound, audio, voice, TTS, mic input or video audio anywhere.
- No emoji anywhere (UI, copy, seed text, AI output: the tone guard strips them).
- Never show bands, ranks, percentiles, leaderboards, classmate comparison or numeric levels ("LV", "Lvl", "L2") to students or parents. Students and parents only see the mastery words: "Let's fix this", "Almost there", "Mastered", "Top form", "New". Bands are teacher-only and in words.
- Notebook school vibe; nothing generic or AI-looking. Saathy is always the flat line-art SVG (apps/web/src/student/notebook/Saathy.tsx), never mascot.webp outside the landing page.
- Never show Saathy chats, doubts, snaps or raw answers to parents or admins.
- Diagnostic tests only prior-class (Class 6-8) concepts; "I haven't learned this yet" is recorded as not_taught with no penalty and skips the confidence row; concepts with no evidence start as "New". Do not regress this.
- Scoring is server-side; every answer writes evidence; answer keys never reach the client before the answer is submitted.
- AI drafts never auto-publish. API keys stay server-side.
- Real NCERT content only; verified YouTube IDs or none; no mojibake.

### Process
- Small commits with clear messages ("final-sweep: <unit>"). `npm run typecheck` and `npm run test:unit` must pass before every commit. If test:unit crashes with exit code 3221225477 (native access-violation flake in the vitest thread pool), rerun it once; if it repeats, run `npx vitest run --pool forks` (for the failing workspace) and note it.
- Progress: docs/codex/progress-final-sweep.md (your own file, never progress.md).
- Mockup gaps: docs/codex/needs-mockup-final-sweep.md (your own file; the parent merges all of them into docs/codex/needs-mockup.md). Format per entry: screen or element, route, which story/plan section needs it, which API already serves it, what you did NOT build.
- Finish with a short summary: commits (hash + message), what is done, what is not done and why, and the scrollWidth numbers (frontend runs).

## How to build screens (frontend runs)
MOCKUP-EXACT RULE: you implement; you never design. The mockups in docs/mockups-v10-final/ are the design: `<screen>.html` (wins over everything), then `png/<screen>-<width>.png`, then IMPLEMENTATION.md. For each screen: copy the HTML's markup structure, class names, copy text, element order and the page-only CSS from its <style> block (into the existing apps/web/src/student/notebook/pages/<screen>.css), and build the React tree that produces exactly that markup with the shared components (IMPLEMENTATION.md section 4). Screenshot at 1440 next to the mockup PNG and fix every visible difference (layout, spacing, cards, colours, icons, stickies, washi tape, doodles, fonts).
- If a screen, page, drawer, sheet, modal or panel you need has NO mockup, build NOTHING for it: no new layout, no "reasonable" design. List it in docs/codex/needs-mockup-final-sweep.md and leave any existing route for it working and unchanged. The only things you may add without a mockup are listed explicitly in your task list below (they reuse an existing mocked component in an existing mocked card).
- Loading, empty and error states of a mocked screen are allowed: same card, same heading, a notebook-style skeleton or one short line in --nb-font-note, a Retry ghost button for errors. Never a raw error, never a new layout.
- Where a mockup element conflicts with Carren's hard rules (for example "Lvl 4" on a game card), the hard rule wins; use the variant this file specifies.

REAL DATA RULE: every name, class, subject, chapter, concept, progress number, mastery word, streak, XP, homework item, notification, question, option, doubt title, game best and teacher remark on screen comes from the API for the signed-in user. Nothing that is demo content in the mockup (Aarav, Sharma Ma'am, 36 km/h, 6 subjects, 28/34, "Group A", Riya Kapoor…) may be hardcoded. Fixed UI copy (headings, button labels, helper lines) is copied word for word from the HTML. Where the API has no data for an element, render that card's empty state, never invent numbers, and log the missing field in docs/codex/data-gaps-final-sweep.md.
- The backend for your screens is being built in parallel by another run (see the table above). Code against docs/codex/contracts-phase4-5.md. Put your API client functions in your own folder. When an endpoint is not in your branch yet (404), the card shows its empty state; that is expected, do not mock data in the UI.
- To verify real data while the backend run is working, you MAY point your web dev server's API proxy at that run's API port by HTTP only (phase-4f → 3010, phase-5f → 3012) if `http://127.0.0.1:<port>/health` (or the health route in scripts/demo.mjs) answers. Find the proxy target env var in apps/web/vite.config.* or scripts/demo.mjs. Never read or touch the other worktree's files. If it is not up, verify against your own API and note "verify again after merge" in your progress file.
- Every screen also needs correct behaviour for a user with less data than the mockup (Aarav may have 1 subject, Priya fewer games played): the grid must still look designed, with no stretched cards or giant empty areas.

SIZING RULES (non-negotiable):
- No max-width box on the shell. The ruled sheet (.nb-sheet, cream ruled paper with the red margin line) fills the full width and height of the viewport on every page; no white area below or beside it.
- `min-width: 0` on every grid and flex child.
- Main grid `grid-template-columns: minmax(0,1fr) clamp(260px, 22vw, 340px)`.
- The rail stacks under the main column below 1180px.
- Mobile layout (sidebar hidden, .nb-mnav shown) below 1024px.
- No fixed card heights: `align-items: start`; use .nb-grow only where the mockup ends a column flush.
- Tiles in auto-fill minmax grids (games: `repeat(auto-fill, minmax(220px, 1fr))` unless the mockup CSS says otherwise).
- Topbar pills never overflow; tabs never wrap (scroll on mobile).
- `overflow-x: hidden` (on html, body, .nb-app, .nb-main or .nb-sheet) is NOT an acceptable fix.
- Verify with your shoot script that `document.documentElement.scrollWidth <= innerWidth` on each of your routes at 360, 1024, 1280, 1440 and 1920, signed in as Aarav and as Priya (or teacher / parent for those screens). Put the table of numbers in your progress file.
