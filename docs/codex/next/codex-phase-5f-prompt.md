# CODEX RUN (read this header first)
You are Codex. Base: branch rebuild-local at commit {{BASE_COMMIT}}, which already contains Phases 1-3 (3A, 3B, 3C backend), the notebook redesign of every v10 mockup screen (polish2, polish3a, polish3b, polish3c) and Dhruv's 66 extra Motion questions. Your branch starts from that commit. Work only on your assigned items.
- Wherever docs/codex/cursor-phase-4.md or cursor-phase-5.md says "Cursor run(s)", read "Codex run(s)". Their "Cursor runs (sequential)" sections are REPLACED by the four parallel runs described here; follow THIS file's scope and ownership, and use the plan files only for detail.
- Where a plan file says "docs/mockups/ask-v1…", "games-v1…", "privacy-v1…" or "no teacher/parent mockups exist", that is out of date. The design source is now docs/mockups-v10-final/ (HTML wins, then png/). Where a plan's UI description and a v10 mockup disagree, the mockup wins.
- API shapes shared between the backend and frontend runs are fixed in docs/codex/contracts-phase4-5.md. Implement (backend) or consume (frontend) exactly those shapes. If you must change a shape, keep the documented fields and only ADD fields, and write the addition into your progress file.
- COMMIT EARLY AND OFTEN: commit after EVERY screen or meaningful backend unit, with `npm run typecheck` and `npm run test:unit` passing. Never leave more than ~30 minutes of uncommitted work. Earlier runs lost almost everything because they never committed.
- Write docs/codex/progress-phase-5f.md AS YOU GO (update it after each item and commit it with the item).
- Do not stop to ask questions; work autonomously to completion.

# VidhyaSaathy Phase 5 frontend: teacher home, parent home, whole-app polish audit (Codex run phase-5f)
Read AGENTS.md, docs/codex/cursor-phase-5.md (UI parts), docs/codex/contracts-phase4-5.md (sections C and D, which you consume), docs/mockups-v10-final/IMPLEMENTATION.md, teacher-home.html, parent-home.html and their PNGs.
Worktree: C:\Users\HP\vs-wt-5f. Branch: phase-5f. API port 3013, web port 5185. Backend for your screens: phase-5b on API port 3012.

## Scope and ownership (only these files)
routes/TeacherHome.tsx, routes/ParentHome.tsx, new files under apps/web/src/teacher/ and apps/web/src/parent/ (API clients, small components), student/notebook/pages/{teacher-home,parent-home}.css, e2e/shoot-phase-5f.mjs, e2e/audit-phase-5f.mjs, e2e/*teacher*.spec.ts + *parent*.spec.ts, apps/web/src/pages.test.ts (append grep tests only), docs/codex/progress-phase-5f.md, data-gaps-phase-5f.md, needs-mockup-phase-5f.md, polish-todo-5f.md, routes-todo-5f.md.
NOT yours: App.tsx, main.tsx, NotebookShell/ui/icons/Saathy, tokens/components/shell/live-fix/brand CSS and apps/web/src/api/* (phase-4f owns them: anything you need there goes to routes-todo-5f.md or polish-todo-5f.md, and you work around it inside your own files), AskPanel, GamesBoard, games/**, apps/api, packages/*.

## Tasks, in this order (commit after each)
1. **API clients** apps/web/src/teacher/teacherApi.ts, apps/web/src/parent/parentApi.ts per contract C/D.
2. **Teacher home = teacher-home.html exactly**: TEACHER_NAV (Home, My classes, Sessions, Homework, Insight label, Class mastery, Lesson review with count, Notifications, Settings) using the shared shell as it is; head with the date eyebrow "Friday, 30 Oct · Class IX-B · Physics" (real date IST, section, subject), greeting by time of day with the teacher's real name, buttons "New homework" and "Start session 3" linking to the existing homework-create and session routes (session number from the API; if no route exists, link to the existing teacher screen and log it in routes-todo-5f.md). Four KPIs from `kpis`. Class mastery card with "By group" / "By student" tabs (same `.heat` markup, `view` param; By student scrolls inside the card with sticky concept column if it is wider, never the page), pct cells with the 5 mockup tints and dashed "New" cells. "Saathy suggests" sticky (text only, no button, as mockup). Rail: "Lesson review" with "N waiting" and Review/Watch links to the EXISTING draft review routes (the notebook review screen has no mockup), "Could use a nudge · private to you" with Nudge → `POST /teacher/nudges`, button then shows "Nudged" disabled. Empty states for a teacher with no section, no evidence, no drafts.
3. **Parent home = parent-home.html exactly**: PARENT_NAV (Home, Progress report, Homework, From school, Settings), "Week of …" eyebrow, "<Child>'s week", subline (class · school · weekLine), 3 KPIs (time studied with delta line, homework with overdue note, days studied with usual time), Subjects card (word chips + bars, `nb-mastery` words only), "Got it this week" and "Working on" stickies, rail "What to ask at dinner", "From school" with "N new", "What you can see" (copy word for word: chats stay his/hers, no marks or ranks), "Coming up". Child switcher, Mark as had, print, effort bars and readiness lamp have NO mockup: do not build them; log them. Pending (unapproved) parent link → the parent home empty state with one line "Your school is checking your link to <child>. You'll see their week here once it's approved." in --nb-font-note, inside the same page head.
4. **Whole-app audit (read-only outside your files)**: e2e/audit-phase-5f.mjs signs in as student (Aarav, Priya), teacher and parent and visits every route in App.tsx at 360/1024/1280/1440/1920: records scrollWidth, console errors, failed requests, and greps the rendered text for emoji, "LV", "Lvl", "level", "rank", "band", "percentile", mascot.webp outside the landing page, and any audio/video element with sound. Fix what is inside your own files; everything else goes to docs/codex/polish-todo-5f.md (route, width, problem, owning file) for the final sweep. Append grep tests to pages.test.ts for teacher/parent pages (no ranks, no chats, mastery words only for parents).
5. **Verify**: shoot teacher home (By group, By student) and parent home (Aarav's parent, Priya's parent) at all widths; compare 1440 with png/teacher-home-1440.png and png/parent-home-1440.png; scrollWidth table; e2e: Nudge flows to the student's notifications (via API), parent of Aarav cannot load Priya (403 shown as the empty state, not a crash). If phase-5b's API on 3012 is down, verify states only and mark "real-data verification after merge".

## Rules for every parallel run (read carefully)
Four Codex runs work at the same time, each in its own git worktree and branch:
| run | worktree | branch | API port | web port | owns |
|---|---|---|---|---|---|
| phase-4b | C:\Users\HP\vs-wt-4b | phase-4b | 3010 | 5182 | backend: Ask Saathy, AI providers, games evidence |
| phase-4f | C:\Users\HP\vs-wt-4f | phase-4f | 3011 | 5183 | frontend: Ask Saathy screen, games board + in-game wiring, shared web files |
| phase-5b | C:\Users\HP\vs-wt-5b | phase-5b | 3012 | 5184 | backend: teacher, parent, admin, privacy wall, content generator |
| phase-5f | C:\Users\HP\vs-wt-5f | phase-5f | 3013 | 5185 | frontend: teacher home, parent home, whole-app audit |

- Work ONLY inside your own worktree folder. Never cd into, modify, or commit in C:\Users\HP\vidhyasaathy-webapp-v10-local or another run's worktree. Commit only on your own branch. Never merge, rebase, push, reset --hard or switch branches. Never run `git add -A` or `git add .`; stage the exact files you changed. Do not commit .playwright-mcp, scratch scripts, logs or databases.
- BACKEND RUNS (phase-4b, phase-5b) NEVER TOUCH apps/web, except apps/web/src/pages.test.ts for grep tests. Anything a screen needs goes into docs/codex/ui-todo-phase-5f.md (endpoint, response shape, states), one section per screen.
- FRONTEND RUNS (phase-4f, phase-5f) NEVER TOUCH apps/api, packages/core or packages/contracts. Missing data goes into docs/codex/data-gaps-phase-5f.md (field, the endpoint that should carry it).
- node_modules: frontend worktrees use junctions to the main repo (never npm install there); backend worktrees have their own installed node_modules (no new dependencies unless essential; if you add one, say why in your progress file).
- Dev servers: use ONLY your own ports. PowerShell: `$env:API_PORT='<api>'; $env:WEB_PORT='<web>'; $env:RATE_LIMIT_MAX='5000'; $env:AUTH_RATE_LIMIT_MAX='500'; node scripts/demo.mjs`. A screenshot of an error, loading, "Too many requests" or empty state does not count as verification of a screen.
- Demo logins: student Aarav PIN 2468 (use the PIN-login API if the UI stalls), teacher teacher@demo.invalid / Saathy@2026! (teacher PIN 1357), parents of Aarav, Priya and Rohan per seed. Priya is the struggling student: use her to prove data is real (her screens must differ from Aarav's).
- Screenshots: never use the Playwright MCP browser (runs share this laptop and its profile lock). Write a small node script with `playwright`'s chromium.launch() under e2e/ (e2e/shoot-phase-5f.mjs) and save PNGs to e2e/screenshots/phase-5f/<screen>-<width>.png.

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
- Small commits with clear messages ("phase-5f: <unit>"). `npm run typecheck` and `npm run test:unit` must pass before every commit. If test:unit crashes with exit code 3221225477 (native access-violation flake in the vitest thread pool), rerun it once; if it repeats, run `npx vitest run --pool forks` (for the failing workspace) and note it.
- Progress: docs/codex/progress-phase-5f.md (your own file, never progress.md).
- Mockup gaps: docs/codex/needs-mockup-phase-5f.md (your own file; the parent merges all of them into docs/codex/needs-mockup.md). Format per entry: screen or element, route, which story/plan section needs it, which API already serves it, what you did NOT build.
- Finish with a short summary: commits (hash + message), what is done, what is not done and why, and the scrollWidth numbers (frontend runs).

## How to build screens (frontend runs)
MOCKUP-EXACT RULE: you implement; you never design. The mockups in docs/mockups-v10-final/ are the design: `<screen>.html` (wins over everything), then `png/<screen>-<width>.png`, then IMPLEMENTATION.md. For each screen: copy the HTML's markup structure, class names, copy text, element order and the page-only CSS from its <style> block (into the existing apps/web/src/student/notebook/pages/<screen>.css), and build the React tree that produces exactly that markup with the shared components (IMPLEMENTATION.md section 4). Screenshot at 1440 next to the mockup PNG and fix every visible difference (layout, spacing, cards, colours, icons, stickies, washi tape, doodles, fonts).
- If a screen, page, drawer, sheet, modal or panel you need has NO mockup, build NOTHING for it: no new layout, no "reasonable" design. List it in docs/codex/needs-mockup-phase-5f.md and leave any existing route for it working and unchanged. The only things you may add without a mockup are listed explicitly in your task list below (they reuse an existing mocked component in an existing mocked card).
- Loading, empty and error states of a mocked screen are allowed: same card, same heading, a notebook-style skeleton or one short line in --nb-font-note, a Retry ghost button for errors. Never a raw error, never a new layout.
- Where a mockup element conflicts with Carren's hard rules (for example "Lvl 4" on a game card), the hard rule wins; use the variant this file specifies.

REAL DATA RULE: every name, class, subject, chapter, concept, progress number, mastery word, streak, XP, homework item, notification, question, option, doubt title, game best and teacher remark on screen comes from the API for the signed-in user. Nothing that is demo content in the mockup (Aarav, Sharma Ma'am, 36 km/h, 6 subjects, 28/34, "Group A", Riya Kapoor…) may be hardcoded. Fixed UI copy (headings, button labels, helper lines) is copied word for word from the HTML. Where the API has no data for an element, render that card's empty state, never invent numbers, and log the missing field in docs/codex/data-gaps-phase-5f.md.
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
