# Phase 1 — Evidence + learning engine (starting from v9 code)
Read AGENTS.md (especially "Carren's hard rules"), then docs/codex/phase-1.md for the original Phase 1 task, and docs/spec/master-file-gap.md "Build plan" Phase 1. Search docs/spec/master-file.txt for "ladder", "band", "Error DNA", "confidence", "60%" for the exact rules.

Build, with unit tests:
1. Additive DB migration for learning evidence (per answer: student, concept, item, level, correct, confidence, source, errorType, timeMs, answer) and per-concept mastery/ladder state; per-chapter hidden band (0-25/25-50/50-75/75-100) stored server-side, teacher-only.
2. packages/core learning engine (pure functions): L1-L4 mastery per concept; confidence Sure/Unsure/Guess weighting (correct+Guess is not mastery; wrong+Sure is a misconception flag); ladder start L2, up after 3 correct in a row, down after 2 wrong in a row, bounded 1-4, with bridge text on a drop; Error DNA classification (concept gap, careless, method, guess); 60% rule on session check with a bridge path; band calculation. Student API responses never include band.
3. Quiz/session UI: notebook-styled Sure/Unsure/Guess confidence chips on every question (light paper, NOT dark), answer writes evidence; after the quiz a "why wrong" summary listing each wrong answer with the misconception explanation; bridge text visible.
4. "My progress" page per docs/mockups/progress-v1-*.png with friendly level words per concept, no bands/ranks. Remove emoji from student home.
5. Demo data (additive, keep existing): students Aarav (PIN 2468), Meera, Kabir, Priya, Rohan with plausible evidence histories matching their archetypes; teacher PIN 1357. Write apps/scripts/DEMO_LOGINS.md.
6. Content: real NCERT Class 9 Motion questions (at least 20, across L1-L4, tagged by concept) with misconception distractors and short explanations; fix any broken characters; remove YouTube search links (verified IDs or none).
Finish with npm run typecheck and npm run test:unit green (do not skip/delete tests; note any pre-existing failures you could not fix). Commit. Append a summary to docs/codex/progress.md.
