# CODEX RUN (read this header first)
You are Codex. Base: branch rebuild-local at commit {{BASE_COMMIT}}, which already contains Phases 1-3 (3A, 3B, 3C backend), the notebook redesign of every v10 mockup screen (polish2, polish3a, polish3b, polish3c) and Dhruv's 66 extra Motion questions. Your branch starts from that commit. Work only on your assigned items.
- Wherever docs/codex/cursor-phase-4.md or cursor-phase-5.md says "Cursor run(s)", read "Codex run(s)". Their "Cursor runs (sequential)" sections are REPLACED by the four parallel runs described here; follow THIS file's scope and ownership, and use the plan files only for detail.
- Where a plan file says "docs/mockups/ask-v1…", "games-v1…", "privacy-v1…" or "no teacher/parent mockups exist", that is out of date. The design source is now docs/mockups-v10-final/ (HTML wins, then png/). Where a plan's UI description and a v10 mockup disagree, the mockup wins.
- API shapes shared between the backend and frontend runs are fixed in docs/codex/contracts-phase4-5.md. Implement (backend) or consume (frontend) exactly those shapes. If you must change a shape, keep the documented fields and only ADD fields, and write the addition into your progress file.
- COMMIT EARLY AND OFTEN: commit after EVERY screen or meaningful backend unit, with `npm run typecheck` and `npm run test:unit` passing. Never leave more than ~30 minutes of uncommitted work. Earlier runs lost almost everything because they never committed.
- Write docs/codex/progress-phase-5b.md AS YOU GO (update it after each item and commit it with the item).
- Do not stop to ask questions; work autonomously to completion.

# VidhyaSaathy Phase 5 backend: teacher, parent and admin APIs, privacy wall, content generator (Codex run phase-5b)
Read AGENTS.md, docs/codex/cursor-phase-5.md (5A and 5B backend parts; 5C readiness is for the final sweep), docs/codex/cursor-phase-4.md Part C (content generator, yours), docs/codex/contracts-phase4-5.md (sections C and D are yours), docs/codex/ui-todo-3c.md (3C's teacher-home and parent-home endpoints: extend them, never duplicate), and docs/mockups-v10-final/teacher-home.html + parent-home.html.
Worktree: C:\Users\HP\vs-wt-5b. Branch: phase-5b. API port 3012, web port 5184 (only to boot demo.mjs; you build no UI).

## Scope and ownership (only these files)
New: apps/api/src/routes/teacher*.ts, parent*.ts (new files), admin*.ts, apps/api/src/school/privacy.ts, apps/api/src/content/generator/**, apps/api/src/teacher/** and apps/api/src/parent/** (new folders), apps/api/src/db/schema-phase5.ts, seed-phase5.ts, migrations 0050-0059, packages/core/src/{heatmap,teacher-suggest,reteach,parent-week,notify-cap,next-action-reteach}.ts, packages/contracts/src/{teacher,parent,admin,generator}.ts, apps/api/test/{teacher,parent,admin,privacy-wall,generator}*.test.ts, docs/codex/progress-phase-5b.md, ui-todo-phase-5b.md, needs-mockup-phase-5b.md.
Small edits allowed: the 3C teacher-home / parent-home endpoint files (extend to contract C/D), schema.ts (re-export line + the parent_link / audit_log columns), app.ts (one line per route file), main seed (one call line), next-action.ts (one hook line), notification sending code (to apply notify-cap), existing read routes only to call `assertCanRead`.
NOT yours: apps/web (never), apps/api/src/ai/**, ask/games routes and their tables (phase-4b). You READ phase-4b's `doubt_cluster_counter` and `doubt_escalation` through apps/api/src/teacher/doubt-source.ts: if the table does not exist in this branch (check sqlite_master), return an empty list; never create those tables yourself. Never touch apps/web/src/games/atom*.

## Tasks, in this order (commit after each)
1. **Schema + migration 0050**: per cursor-phase-5.md (reteach_assignment, reteach_target, student_concept_daily, parent_week_aggregate, ask_this_ack, exam_scope, parent_link status/approved columns, audit_log columns) plus `student_group` (id, section_id, label, sort) and `student_group_member`, `teacher_nudge` (teacher_id, student_id, reason_code, created_at), `content_draft` if 3C did not add it. Backup first. Seed: groups A-E for each demo section with real seeded students spread across them, approved parent links for the demo parents, a few `from school` remarks and `coming up` items (homework due dates come from real assignments).
2. **Privacy wall first**: school/privacy.ts `assertCanRead(actor, resource)` with the full matrix from cursor-phase-5.md; apply it to every teacher, parent and admin read. test/privacy-wall.test.ts: every role × every resource, including parent-of-other-child, unapproved parent link, teacher of another section, admin reading ask threads (must 403), and a response-key allowlist for parent payloads (no chats, no raw answers, no bands, no ranks, no classmates).
3. **Teacher home (contract C)**: extend the 3C endpoint: kpis, `mastery` with `view=group|student` (pct per concept × group or student from the student_concept mastery data, tint buckets, `'new'` for concepts not yet taught to the section), `suggestion` from core/teacher-suggest.ts (pure, tested: unit slips with "Sure" confidence etc., real counts), `reviewQueue` (content drafts + video clips waiting), `nudges` (students with no diagnostic, repeated slips, overdue homework; reasons in neutral words), `POST /teacher/nudges` (one per student per day, private friendly notification to the student that never says why, audit row). Priya and Aarav must land in different cells/lists.
4. **Teacher plan endpoints (no UI yet, contract-tested)**: `/teacher/morning`, heatmap full, cell drill, student evidence, reteach create + tracker (core/reteach.ts; reteach targets flow into the student's Today via core/next-action-reteach.ts + one hook line), doubt clusters (via doubt-source.ts), grading suggestions, homework assignment create/list if 3C has not built them ("New homework" button target).
5. **Content generator (cursor-phase-4.md Part C)**: contracts, `ContentGenerator` with `LocalTemplateGenerator` (default) and `HttpGenerator` (`CONTENT_GENERATOR=local|http`, `CONTENT_GENERATOR_URL`, `CONTENT_GENERATOR_TOKEN`, server-side only), validate pipeline (safe expression evaluator, key check, YouTube oEmbed check that skips offline, hygiene: no emoji, no mojibake), `content_draft` rows feeding reviewQueue, teacher draft routes (list, get, edit, approve, reject). Drafts never auto-publish; publishing requires a teacher approve call. Tests.
6. **Parent (contract D)**: extend the 3C parent-home endpoint to contract D (week aggregate from core/parent-week.ts, plain-language weekLine, gotIt / workingOn from mastery changes, askThis from a recent real learning event, fromSchool, comingUp), plus `/parents/children/:id/week`, `/report`, `POST /parents/ask-this/:eventId/had`, approved-link only. Nightly `parent_week_aggregate` job. Child switcher data (`children`).
7. **Admin (backend only)**: parent-link queue approve/reject, permissions read, audit CSV export, demo-reset (demo env only, guarded). Notification cap (core/notify-cap.ts) on every notification send, `exam_scope` CRUD for teachers.
8. Full pass: typecheck, test:unit, privacy-wall green, ui-todo-phase-5b.md complete (each endpoint, shape, which mockup consumes it or "no mockup yet"), progress file final.

## Rules for every parallel run (read carefully)
Four Codex runs work at the same time, each in its own git worktree and branch:
| run | worktree | branch | API port | web port | owns |
|---|---|---|---|---|---|
| phase-4b | C:\Users\HP\vs-wt-4b | phase-4b | 3010 | 5182 | backend: Ask Saathy, AI providers, games evidence |
| phase-4f | C:\Users\HP\vs-wt-4f | phase-4f | 3011 | 5183 | frontend: Ask Saathy screen, games board + in-game wiring, shared web files |
| phase-5b | C:\Users\HP\vs-wt-5b | phase-5b | 3012 | 5184 | backend: teacher, parent, admin, privacy wall, content generator |
| phase-5f | C:\Users\HP\vs-wt-5f | phase-5f | 3013 | 5185 | frontend: teacher home, parent home, whole-app audit |

- Work ONLY inside your own worktree folder. Never cd into, modify, or commit in C:\Users\HP\vidhyasaathy-webapp-v10-local or another run's worktree. Commit only on your own branch. Never merge, rebase, push, reset --hard or switch branches. Never run `git add -A` or `git add .`; stage the exact files you changed. Do not commit .playwright-mcp, scratch scripts, logs or databases.
- BACKEND RUNS (phase-4b, phase-5b) NEVER TOUCH apps/web, except apps/web/src/pages.test.ts for grep tests. Anything a screen needs goes into docs/codex/ui-todo-phase-5b.md (endpoint, response shape, states), one section per screen.
- FRONTEND RUNS (phase-4f, phase-5f) NEVER TOUCH apps/api, packages/core or packages/contracts. Missing data goes into docs/codex/data-gaps-phase-5b.md (field, the endpoint that should carry it).
- node_modules: frontend worktrees use junctions to the main repo (never npm install there); backend worktrees have their own installed node_modules (no new dependencies unless essential; if you add one, say why in your progress file).
- Dev servers: use ONLY your own ports. PowerShell: `$env:API_PORT='<api>'; $env:WEB_PORT='<web>'; $env:RATE_LIMIT_MAX='5000'; $env:AUTH_RATE_LIMIT_MAX='500'; node scripts/demo.mjs`. A screenshot of an error, loading, "Too many requests" or empty state does not count as verification of a screen.
- Demo logins: student Aarav PIN 2468 (use the PIN-login API if the UI stalls), teacher teacher@demo.invalid / Saathy@2026! (teacher PIN 1357), parents of Aarav, Priya and Rohan per seed. Priya is the struggling student: use her to prove data is real (her screens must differ from Aarav's).
- Screenshots: never use the Playwright MCP browser (runs share this laptop and its profile lock). Write a small node script with `playwright`'s chromium.launch() under e2e/ (e2e/shoot-phase-5b.mjs) and save PNGs to e2e/screenshots/phase-5b/<screen>-<width>.png.

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
- Small commits with clear messages ("phase-5b: <unit>"). `npm run typecheck` and `npm run test:unit` must pass before every commit. If test:unit crashes with exit code 3221225477 (native access-violation flake in the vitest thread pool), rerun it once; if it repeats, run `npx vitest run --pool forks` (for the failing workspace) and note it.
- Progress: docs/codex/progress-phase-5b.md (your own file, never progress.md).
- Mockup gaps: docs/codex/needs-mockup-phase-5b.md (your own file; the parent merges all of them into docs/codex/needs-mockup.md). Format per entry: screen or element, route, which story/plan section needs it, which API already serves it, what you did NOT build.
- Finish with a short summary: commits (hash + message), what is done, what is not done and why, and the scrollWidth numbers (frontend runs).

## Backend conflict rules (phase-4b and phase-5b run at the same time on apps/api)
- Migrations: phase-4b uses files `0040_*.sql` to `0049_*.sql`; phase-5b uses `0050_*.sql` to `0059_*.sql`. Append your entries to apps/api/drizzle/meta/_journal.json with `when` values phase-4b: 1800000000000 + n*1000, phase-5b: 1800100000000 + n*1000, so the merged order is deterministic. (The parent fixes the journal `idx` values at merge time.) Never edit an existing migration.
- New Drizzle tables go in a NEW schema file of your own (phase-4b: apps/api/src/db/schema-phase4.ts; phase-5b: apps/api/src/db/schema-phase5.ts), re-exported from schema.ts with ONE appended line. Columns added to existing tables (evidence, parent_link, audit_log, reteach_decision) are the only edits to schema.ts; keep them as small, separate blocks.
- New routes go in NEW route files of your own, registered in app.ts with ONE appended line per file. Do not reorder app.ts.
- Seeds: your own idempotent seed module (phase-4b: apps/api/src/db/seed-phase4.ts; phase-5b: apps/api/src/db/seed-phase5.ts), called from the main seed with ONE appended line.
- packages/core: new files only, plus the minimal edits named in your task list. packages/contracts: new files only (phase-4b: ask.ts, games.ts; phase-5b: teacher.ts, parent.ts, admin.ts, generator.ts) plus one export line each in the index.
- core/next-action.ts is the one shared hot spot: phase-4b adds the `followup_item` candidate, phase-5b adds the `reteach_target` candidate. Each adds ONE self-contained candidate-source function in its own new file (core/next-action-followup.ts, core/next-action-reteach.ts) and a ONE-line hook in next-action.ts. Keep that diff tiny.
- Every new route: school-scoped, role-guarded, positive and negative role tests in apps/api/test, no answer keys before answering, no bands/ranks/numeric levels in student or parent responses.
- Write docs/codex/ui-todo-phase-5b.md as you finish each endpoint, matching docs/codex/contracts-phase4-5.md (note any added fields).

## Rules the frontend runs follow (your API must make them possible)
- MOCKUP-EXACT RULE: nobody designs. You build no UI. If an endpoint you build serves a screen, drawer or sheet that has no mockup in docs/mockups-v10-final/, still build and test the endpoint, and list that screen in docs/codex/needs-mockup-phase-5b.md (screen, route, which endpoint serves it).
- REAL DATA RULE: every name, number, word, list and label the mocked screens show must come from your API for the signed-in user. Never return demo-shaped placeholder data or hardcoded mockup values ("Aarav", "Group A", "28 / 34"); seed real demo rows instead, so Aarav and Priya get genuinely different responses. Missing data returns empty arrays or null, never invented numbers.
- SIZING RULES (frontend; for awareness): min-width:0 on grid and flex children, main grid `minmax(0,1fr) clamp(260px,22vw,340px)`, rail stacks below 1180px, no fixed card heights, no overflow-x hack, scrollWidth <= innerWidth at 360/1024/1280/1440/1920. Keep labels short (titles ≤ 40 chars, reasons ≤ 60 chars) so they fit these layouts.
