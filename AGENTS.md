# Codex rules (token-efficient)
- Read only files you need. Use rg to find things; never read whole dirs, lockfiles, plan/games/ncert, or *.png.
- Specs: plan/PHASES.md, plan/SPEC_SUMMARY.md, plan/vs-design/DESIGN_SPEC.md, plan/vs-design/VIBE_TELLS.md. Open only the section you need.
- Stack: npm workspaces. apps/web = Vite+React+TS, apps/api = Fastify+SQLite+Drizzle. Tests: vitest, Playwright e2e.
- Font: Patrick Hand only. Brand: #041D3D #193E69 #28517C #517DAB #F9F6EE #D6E2E6. No AI images.
- Keep edits minimal and scoped; don't reformat untouched code. No long explanations in replies, just list changed files.
- Verify with: npm run typecheck and npx vitest run (only the affected package). Full e2e only when asked.

## Carren's hard rules (ALWAYS follow; they override docs/spec/*)
- Keep ALL existing data and work (demo DB, seeded content, existing features). Never wipe or reseed destructively; migrations must be additive. Back up apps/api/data/*.db before any migration.
- Atom Forge: being rebuilt on branch atom-kz per docs/atom-kz/ (Carren approved 2026-10-30). Only the atom-kz run edits apps/web/src/games/atom*.
- Landing page, themes and colours unchanged. No dark mode, no new palette.
- No sound/audio/voice/speech anywhere.
- Never show bands, ranks, leaderboards or numeric levels to students. Friendly words only: "Let's fix this" (L1), "Almost there" (L2), "Mastered" (L3), "Top form" (L4).
- Student workspace design = the approved notebook mockups in docs/mockups (PNG + src/*.html): ruled lines, red margin, Caveat/Patrick Hand headings, cream/navy/gold, calm and airy, full-width desktop with side rails. Reuse existing workspace CSS. Nothing generic or AI-looking. No emoji in the UI.
- Diagnostic rule: the diagnostic ONLY tests prior-class prerequisite concepts (NCERT Class 6-8, or earlier Class 9 chapters) that the chapter builds on, linked via conceptPrereqs and tagged with source class. For Class 9 Motion use Class 7 "Motion and Time" plus units, ratios and reading graphs. 5-8 questions per chapter. Every diagnostic question has a "Haven't learned this yet" option recording not_taught with NO penalty. Concepts of the new chapter start as "new", never "weak". A smart student must never be rated lower for something not yet taught.
- Content: real NCERT content only. Questions use distractors built from real misconceptions. Videos: verified YouTube video IDs only, or no video. Never YouTube search links. No mojibake/broken characters.
- Real data only: scoring server-side, every answer writes evidence, answer keys never reach the student client.
- Demo logins: teacher teacher@demo.invalid / Saathy@2026! with teacher PIN 1357; student Aarav PIN 2468; demo students Aarav, Meera, Kabir, Priya (struggling, Hindi terms help), Rohan (absentee, needs catch-up).
- Node >= 24. Verify with: npm run typecheck and npm run test:unit. Commit work in small commits on the current branch.
- Spec: docs/spec/master-file.txt (full Product Master File), docs/spec/master-file-gap.md (gap audit + build plan), docs/spec/learning-flow.md (the learning flow). Read only the sections you need.
