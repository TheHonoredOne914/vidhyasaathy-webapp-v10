# VidhyaSaathy v9 â€” HARD RULES (override phase prompts)

1. **Landing page MUST NOT change** â€” keep approved day/night split, Saathy cloud (no blue patch), polaroid games shelf, tilted phone. Do not touch apps/web/src/landing/** except trivial bugfixes unrelated to layout.
2. **Theme/colours MUST NOT change** â€” keep existing tokens (#041D3D #193E69 #28517C #517DAB #F9F6EE #D6E2E6, Patrick Hand). Do NOT adopt Scholar Indigo hex (#4338CA etc). Map Scholar Indigo *rules* onto existing tokens: flat in-app buttons (no gradient CTAs inside app), 4 UI states (loading/empty/error/success), 4pt spacing discipline, amber/gold reserved for achievement moments only, restrained motion 150â€“250ms.
3. **Keep** Saathy cloud, games (Atom Forge / Bio Quest style), AI chat design.
4. **Improve only in-app UI/UX** from sign-in/registration onward: real nav shell, every flow end-to-end, no dead buttons, no fake data in components, four states on async surfaces.
5. **Stack stays**: Vite+React+TS (apps/web), Fastify+SQLite+Drizzle (apps/api), packages/contracts + packages/core. NO Supabase/Next migration.
6. **Backend first** every feature: additive Drizzle migrations â†’ API â†’ UI. Server-side grading; correct answers never sent before submit; role guards on API + routes.
7. **Only phases 1â€“5**, then STOP for user check.
8. **Token-efficient Codex**: read only needed files; use rg; minimal diffs; reply with changed files list only.
9. Codex sandbox cannot typecheck/vitest/commit â€” executor does those.
10. Keep demo accounts working (DEMSTUDENT22 in Class 9). Fix render-loop in 4 games if touched.


See plan/v9/PHASE3_UX_HARD.md — v8 recording shell/games fixes are mandatory before phase 4.

## Workspace inspo + games teach (2026-10-27)
- Follow plan/v9/inspo/WORKSPACE_INSPO.md for phase 3 screens + games.
- Follow plan/v9/GAMES_TEACH.md — TEACH via play, not quizzes. Living sims, juice, 4 levels, Playwright drag + video/GIF.
- Also plan/v9/PHASE3_UX_HARD.md.

