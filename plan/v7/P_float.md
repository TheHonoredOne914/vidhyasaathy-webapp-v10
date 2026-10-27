# V7 PORT float to the arena shell — match the detail/quality of games/atom and games/cell (attached refs). No git/npm. No landing. Do NOT edit games/arena/** or other games (read arena/README.md if present, and atom/cell as examples).
Rebuild apps/web/src/games/float/ as an arena game (keep id 'float' in registry).
Spec: Ch 10 Gravitation (floatation & buoyancy). World "Float Harbor". Sim: tank of liquid with objects (cork, iron, ice), spring balance, displaced water overflow into beaker; density slider; buoyant force arrow. Levels: g & free fall, weight vs mass (moon), thrust & pressure, Archimedes. Meter: Density vs liquid meter. Card2: sink/float ladder of materials with densities.
Requirements, same as atom/cell:
- ≥4 levels, ?level=N jump; name in caps (e.g. "MATTER MOUNTAIN" style), breadcrumb with world + NCERT Class 9 + chapter.
- Stage: rich, detailed SVG simulation (gradients, labels, legend, control buttons on left of stage, dashed guides), real interactivity (drag/sliders/buttons) and live values; reduced-motion safe.
- Right column: YOUR TASK (title, Hinglish instruction, live data tiles + a meter), card2 ladder/score + Hint + gold primary action that validates, navy SAMJHO concept strip with gold key terms (Hinglish).
- Footer stats via shell API (Round, game stat, Streak, Time).
- Pure logic in validators.ts with vitest tests (float.test.ts) covering each level's check. Remove/replace obsolete scene files and tests that break.