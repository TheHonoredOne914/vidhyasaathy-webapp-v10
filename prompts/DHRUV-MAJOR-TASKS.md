# Dhruv: major tasks (fe-pass + be-pass)

Audited against the code on master f954116 and a live check on 2 Nov 2026. The two agents never touch each other's files:
- FE = branch `fe-pass`, worktree `C:\Users\jce\vs-fe`, prompt `prompts/FRONTEND-PROMPT.md`, launcher `C:\Users\jce\run-fe-pass.cmd`
- BE = branch `be-pass`, worktree `C:\Users\jce\vs-be`, prompt `prompts/BACKEND-PROMPT.md`, launcher `C:\Users\jce\run-be-pass.cmd`

Grok merges (be-pass first, then fe-pass). Small tweaks are inside the two prompts.

| # | Pri | Owner | Task |
|---|---|---|---|
| 1 | P0 | BE | Saathy answers on the first message: the answer comes first and the level check is offered under it (today it replaces the answer); add Skip; diagnostics return 200 even when empty; no-chapter questions get a real model answer. |
| 2 | P0 | FE | Saathy chat: Level Check gets Skip/Try again and never blocks chat; the chapter picker defaults to the current chapter (Motion), not Biology; one "Ask Saathy" door (`/student/saathy`). |
| 3 | P0 | BE | Adaptive 8-12 step plan (uses level check and mastery, not "all 36 modules"); Motion and Coordinate Geometry plans include real registry games; fix wrong game-to-chapter mappings. |
| 4 | P0 | FE | Learning Player redesign; the Explore/Play steps open the chapter game, and Back/finish returns to the same plan step. |
| 5 | P0 | BE | `GET /student/today` as the one "what next" brain; never send raw `resumeState` (`step=4`). |
| 6 | P0 | FE | Rebuild Home to the mockup: one hero from `/student/today`, no debug strings, no blank first render (skeletons). |
| 7 | P0 | FE | Chapter World page with 6 stops (Explore, Learn, Try, Fix, Play, Master). |
| 8 | P0 | BE | Saathy context: current plan step, last wrong answer, last game result; teaching modes as a structured field. |
| 9 | P1 | BE | Demo seed always works: fix the hanging seed, self-seed on first boot, story data for Aarav (strong), Priya (struggling), Rohan (absent). |
| 10 | P1 | FE | Practice/Games pages stop force-redirecting to the chapter test (optional warm-up card instead); real Study Sessions page; PlayLab with all 20 games grouped by chapter. |
| 11 | P1 | BE | Sessions list, `activity_finished` feeding mastery, flashcards on 1/3/7/14-day spacing, 3+ practice questions per idea for Motion and Coordinate Geometry. |
| 12 | P1 | FE | Saathy settings sheet + `/founder` page for the Gemini key (masked); Revise page; dhruv-model parity incl. video/YouTube cards. |
| 13 | P1 | BE + FE | Parent overview and teacher heatmap endpoints (BE); real SVG charts and one-click role login on dashboards (FE). |
| 14 | P2 | BE | Public `/health`, repo hygiene (.gitignore gaps, untrack root `codex-*-prompt.md`, pycache, .playwright-mcp), live Gemini check. |
| 15 | P2 | FE | Hindi toggle, mobile bottom tabs, accessibility sweep. |

## Your own checks
1. Run `C:\Users\jce\run-be-pass.cmd` and `C:\Users\jce\run-fe-pass.cmd` (two windows; they can run together).
2. After each run, open the newest `C:\Users\jce\preview\be-*\index.md` / `fe-*\index.md` and the PNGs next to it. Live previews stay up: BE at http://127.0.0.1:5174, FE at http://127.0.0.1:5175.
3. When `C:\Users\jce\be-pass.done` and `fe-pass.done` both exist, ask Grok to merge be-pass first, then fe-pass.
4. Paste the Gemini key once in Founder settings (masked; no restart needed).
5. Decide about `e2e/final-proof.mjs` and `e2e/final-explore.mjs` in vs-master (left untracked on purpose while the proof job uses them).
