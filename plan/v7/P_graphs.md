# V7 PORT graphs to the arena shell — match the detail/quality of games/atom and games/cell (attached refs). No git/npm. No landing. Do NOT edit games/arena/** or other games (read arena/README.md if present, and atom/cell as examples).
Rebuild apps/web/src/games/graphs/ as an arena game (keep id 'graphs' in registry).
Spec: Maths Ch 3 Coordinate Geometry. World "Graph Garden". Sim: Cartesian plane with quadrants, draggable point showing (x,y), plot targets (treasure hunt), quadrant signs. Levels: axes/origin, quadrants, plot points, distance along axes. Meter: Accuracy meter. Card2: quadrant ladder (+,+ / -,+ / -,- / +,-).
Requirements, same as atom/cell:
- ≥4 levels, ?level=N jump; name in caps (e.g. "MATTER MOUNTAIN" style), breadcrumb with world + NCERT Class 9 + chapter.
- Stage: rich, detailed SVG simulation (gradients, labels, legend, control buttons on left of stage, dashed guides), real interactivity (drag/sliders/buttons) and live values; reduced-motion safe.
- Right column: YOUR TASK (title, Hinglish instruction, live data tiles + a meter), card2 ladder/score + Hint + gold primary action that validates, navy SAMJHO concept strip with gold key terms (Hinglish).
- Footer stats via shell API (Round, game stat, Streak, Time).
- Pure logic in validators.ts with vitest tests (graphs.test.ts) covering each level's check. Remove/replace obsolete scene files and tests that break.