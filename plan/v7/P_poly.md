# V7 PORT poly to the arena shell — match the detail/quality of games/atom and games/cell (attached refs). No git/npm. No landing. Do NOT edit games/arena/** or other games (read arena/README.md if present, and atom/cell as examples).
Rebuild apps/web/src/games/poly/ as an arena game (keep id 'poly' in registry).
Spec: Maths Ch 2 Polynomials. World "Poly Peaks". Sim: algebra tiles + graph of p(x) with draggable coefficients; zeros marked where curve crosses x-axis; remainder theorem evaluator. Levels: degree & terms, value p(a), zeros, factor theorem. Meter: Remainder meter. Card2: polynomial types ladder (linear/quadratic/cubic).
Requirements, same as atom/cell:
- ≥4 levels, ?level=N jump; name in caps (e.g. "MATTER MOUNTAIN" style), breadcrumb with world + NCERT Class 9 + chapter.
- Stage: rich, detailed SVG simulation (gradients, labels, legend, control buttons on left of stage, dashed guides), real interactivity (drag/sliders/buttons) and live values; reduced-motion safe.
- Right column: YOUR TASK (title, Hinglish instruction, live data tiles + a meter), card2 ladder/score + Hint + gold primary action that validates, navy SAMJHO concept strip with gold key terms (Hinglish).
- Footer stats via shell API (Round, game stat, Streak, Time).
- Pure logic in validators.ts with vitest tests (poly.test.ts) covering each level's check. Remove/replace obsolete scene files and tests that break.