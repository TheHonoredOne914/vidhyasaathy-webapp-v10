You are Codex working on VidhyaSaathy in C:\Users\jce\vs-saathy (Windows, PowerShell; GitHub TheHonoredOne914/vidhyasaathy-webapp-v10). Read AGENTS.md, README.md, docs/IMPLEMENTATION.md and the handoff docs first.

Dhruv built the real Saathy AI tutor in a separate repo, cloned at C:\Users\jce\dhruv-model (GitHub whodhruv7/Model; a Next.js app, read its README.md and worklog.md). Your job: bring ONLY Dhruv's model part into VidhyaSaathy and integrate it properly, replacing the current Ask Saathy panel. Don't touch anything else in Dhruv's repo, and don't import its unrelated app shell.

You are already on branch "saathy-model" (from master) in its own worktree; another Codex run is changing auth in a different folder at the same time, so stay away from sign-in/sign-up code. Use API port 3201 and web port 5273 for any servers you start (5173, 3101, 3001 are taken). node_modules is shared with another folder through a junction; only add packages you really need.

1. MODEL / BACKEND (port into apps/api, the Fastify + SQLite/drizzle API; not a second Next.js server):
- Port Dhruv's server/saathy logic: prompt.ts (identity, tier directives, level-check gate, artifact contract, honesty layer), books.ts (Ganita Manjari retrieval) + src/data/books/ganita-manjari.json, providers.ts (built-in provider + any OpenAI-compatible key, keys never logged), lib/saathy-types.ts and lib/saathy-meta.ts (meta-block parser and rescue).
- Replace context.ts with VidhyaSaathy's REAL data: the signed-in student's name, class, subjects, chapters, concepts, mastery/progress, streaks, homework, recent quiz answers and mistakes, the page they're on. Saathy must "understand the app": know what screens and features exist (home, chapters, practice, games, homework, doubts, reports) and be able to point the student to them.
- Endpoints under the existing API conventions: streaming chat (SSE), evidence (quick checks and level checks update VidhyaSaathy's mastery, not a separate DB), conversations history CRUD, export to HTML. Map Dhruv's prisma models onto drizzle tables in a new migration; keep all existing data.
- Make the backend strong: input validation with the shared contracts package, auth on every route, sensible errors and timeouts, a graceful fallback message if the provider is down, and tests.

2. UI / UX (apps/web):
- Saathy gets its OWN full chat page (e.g. /student/saathy, plus teacher/parent if the role makes sense), with conversation history in a sidebar, composer, streaming messages, math rendering, the Level Check cards, Quick Check MCQs with the hint ladder, and the interactive artifact cards. Port Dhruv's components (chat-app, level-check, quick-check, artifacts, message-bubble, composer, sidebar, markdown) and restyle them to VidhyaSaathy's notebook look.
- Replace the existing Ask panel / AskDock / PageAsk entry points with a clean way to open this Saathy chat (passing the current page/chapter as context). Remove dead Ask code that is fully replaced.
- VidhyaSaathy rules win over Dhruv's repo: notebook vibe; the Saathy cloud mascot is flat line art; no emoji anywhere (strip them from prompts and UI); never show bands, percentages or ranks to students; student-facing statuses only: Let's fix this / Almost there / Mastered / Top form / New; no sound; don't change the landing page, themes or colours; full width and height at every screen size.

3. VERIFY: typecheck, lint and tests green (vitest needs --pool forks; web: npx vitest run --configLoader native --pool forks). Start API and web in the background (never in the foreground; stop them after), sign in as a demo student and actually chat with Saathy: ask a concept question, complete a level check, answer a quick check, and confirm mastery updated in the DB. Save screenshots to docs/saathy-model/screens/.

Never reset --hard, stash or discard work. Commit in logical steps on saathy-model and push the branch to origin. Write docs/saathy-model/README.md explaining the integration, config (provider keys, env vars) and how to run it.

Finish by printing: what was ported, what you changed in VidhyaSaathy, test results, screenshots taken, anything not working, and exact run commands.


=== PASS 2 (read this first; it overrides the above where they differ) ===
A first Codex pass already ran on this branch. It committed de36163 "Integrate Saathy chat into student workspace" (chat entry points + real student context). The open-auth branch (demo-open-auth, b573c23) is now MERGED into saathy-model (commit 481d174): in local demo mode any PIN, password, new email or claim code signs straight in, so the browser flow is no longer blocked. You may now touch auth only if strictly needed for Saathy; otherwise leave it alone.

Start by reading git log, git diff 99c4f00..HEAD and docs/saathy-model/ to see what pass 1 did. Then FINISH every item pass 1 left undone:
1. Ganita Manjari corpus: port books.ts retrieval plus src/data/books/ganita-manjari.json from C:\Users\jce\dhruv-model into apps/api and wire it into the prompt/context.
2. Richer chat artifacts and the hint ladder: the interactive artifact cards and Quick Check MCQs with hints, ported from Dhruv's components and restyled to the notebook look.
3. Level Check: the gate in the prompt plus the Level Check cards in the UI; results update VidhyaSaathy mastery via the evidence endpoint.
4. Anything else from the original spec that is still missing (conversation history CRUD, export to HTML, SSE streaming, provider fallback, tests).
5. Browser flow: start API on port 3201 and web on port 5273 ONLY (in the background; stop them afterwards). Never use or stop ports 5173, 3101, 3001 or 3300, and never touch C:\Users\jce\vs-preview or C:\Users\jce\pitch-shots. Sign in as a demo student (e.g. Aarav, any PIN works), open the Saathy chat page, ask a concept question, complete a level check, answer a quick check with a hint, and confirm mastery changed in the DB. Use a separate DATABASE_PATH copy for this run.
6. Screenshots of the Saathy chat page (empty state, a streamed answer with math, level check, quick check with hint, an artifact card, history sidebar) saved to docs/saathy-model/screens/.
7. Verify: npm run typecheck (or the repo equivalent) and npx vitest run --pool forks (web: npx vitest run --configLoader native --pool forks). Fix failures. If a command stalls more than a few minutes, kill it and retry with --pool forks / narrower scope rather than waiting forever.
8. Update docs/saathy-model/README.md (what was ported, config, env vars, provider keys, run commands, known gaps).
9. Commit in logical steps and push saathy-model to origin.

VidhyaSaathy rules still win: notebook look, flat line-art Saathy cloud, no emoji anywhere, no sound, never show ranks, bands or percentages to students (only Let's fix this / Almost there / Mastered / Top form / New), landing page/themes/colours unchanged, keep all data, never reset --hard/stash/discard work.
