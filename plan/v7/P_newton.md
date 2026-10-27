# V7 PORT newton to the arena shell — match the detail/quality of games/atom and games/cell (attached refs). No git/npm. No landing. Do NOT edit games/arena/** or other games (read arena/README.md if present, and atom/cell as examples).
Rebuild apps/web/src/games/newton/ as an arena game (keep id 'newton' in registry).
Spec: Ch 9 Force and Laws of Motion. World "Force Arena". Sim: cart on track with applied force arrow, friction, mass blocks; F=ma live; collision of two trolleys for momentum conservation; rocket recoil. Levels: inertia, F=ma, action-reaction, momentum. Meter: Net force meter. Card2: three laws ladder.
Requirements, same as atom/cell:
- ≥4 levels, ?level=N jump; name in caps (e.g. "MATTER MOUNTAIN" style), breadcrumb with world + NCERT Class 9 + chapter.
- Stage: rich, detailed SVG simulation (gradients, labels, legend, control buttons on left of stage, dashed guides), real interactivity (drag/sliders/buttons) and live values; reduced-motion safe.
- Right column: YOUR TASK (title, Hinglish instruction, live data tiles + a meter), card2 ladder/score + Hint + gold primary action that validates, navy SAMJHO concept strip with gold key terms (Hinglish).
- Footer stats via shell API (Round, game stat, Streak, Time).
- Pure logic in validators.ts with vitest tests (newton.test.ts) covering each level's check. Remove/replace obsolete scene files and tests that break.