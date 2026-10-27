# V7 PORT matter to the arena shell — match the detail/quality of games/atom and games/cell (attached refs). No git/npm. No landing. Do NOT edit games/arena/** or other games (read arena/README.md if present, and atom/cell as examples).
Rebuild apps/web/src/games/matter/ as an arena game (keep id 'matter' in registry).
Spec: Ch 1 Matter in Our Surroundings. World "Matter Mountain". Sim: particle box (solid/liquid/gas) with temperature slider and pressure piston; particles animate with speed by T; phase change at melting/boiling points (ice 0°C, water 100°C); latent heat plateau graph. Levels: states, diffusion race, heating curve, evaporation factors. Meter: Kinetic energy meter. Card2: phase ladder (Solid/Liquid/Gas with temps).
Requirements, same as atom/cell:
- ≥4 levels, ?level=N jump; name in caps (e.g. "MATTER MOUNTAIN" style), breadcrumb with world + NCERT Class 9 + chapter.
- Stage: rich, detailed SVG simulation (gradients, labels, legend, control buttons on left of stage, dashed guides), real interactivity (drag/sliders/buttons) and live values; reduced-motion safe.
- Right column: YOUR TASK (title, Hinglish instruction, live data tiles + a meter), card2 ladder/score + Hint + gold primary action that validates, navy SAMJHO concept strip with gold key terms (Hinglish).
- Footer stats via shell API (Round, game stat, Streak, Time).
- Pure logic in validators.ts with vitest tests (matter.test.ts) covering each level's check. Remove/replace obsolete scene files and tests that break.