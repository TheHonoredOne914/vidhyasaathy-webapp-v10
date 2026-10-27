# V7 PORT motion to the arena shell — match the detail/quality of games/atom and games/cell (attached refs). No git/npm. No landing. Do NOT edit games/arena/** or other games (read arena/README.md if present, and atom/cell as examples).
Rebuild apps/web/src/games/motion/ as an arena game (keep id 'motion' in registry).
Spec: Ch 8 Motion. World "Motion Highway". Sim: road with car/bus, distance markers, live distance-time and velocity-time graphs drawn as it moves; set u, a, t sliders; area under v-t = distance. Levels: uniform vs non-uniform, speed, acceleration, equations of motion. Meter: Speedometer. Card2: equations ladder (v=u+at, s=ut+½at², v²=u²+2as).
Requirements, same as atom/cell:
- ≥4 levels, ?level=N jump; name in caps (e.g. "MATTER MOUNTAIN" style), breadcrumb with world + NCERT Class 9 + chapter.
- Stage: rich, detailed SVG simulation (gradients, labels, legend, control buttons on left of stage, dashed guides), real interactivity (drag/sliders/buttons) and live values; reduced-motion safe.
- Right column: YOUR TASK (title, Hinglish instruction, live data tiles + a meter), card2 ladder/score + Hint + gold primary action that validates, navy SAMJHO concept strip with gold key terms (Hinglish).
- Footer stats via shell API (Round, game stat, Streak, Time).
- Pure logic in validators.ts with vitest tests (motion.test.ts) covering each level's check. Remove/replace obsolete scene files and tests that break.