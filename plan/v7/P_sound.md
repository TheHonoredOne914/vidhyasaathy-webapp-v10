# V7 PORT sound to the arena shell — match the detail/quality of games/atom and games/cell (attached refs). No git/npm. No landing. Do NOT edit games/arena/** or other games (read arena/README.md if present, and atom/cell as examples).
Rebuild apps/web/src/games/sound/ as an arena game (keep id 'sound' in registry).
Spec: Ch 12 Sound. World "Echo Canyon". Sim: speaker emitting compressions/rarefactions (particle wave), adjustable frequency/amplitude, oscilloscope trace, echo off cliff with distance and time. Levels: longitudinal waves, frequency/pitch, amplitude/loudness, echo (17.2 m rule) & SONAR. Meter: Loudness/pitch meter. Card2: audible range ladder (infrasonic/audible/ultrasonic).
Requirements, same as atom/cell:
- ≥4 levels, ?level=N jump; name in caps (e.g. "MATTER MOUNTAIN" style), breadcrumb with world + NCERT Class 9 + chapter.
- Stage: rich, detailed SVG simulation (gradients, labels, legend, control buttons on left of stage, dashed guides), real interactivity (drag/sliders/buttons) and live values; reduced-motion safe.
- Right column: YOUR TASK (title, Hinglish instruction, live data tiles + a meter), card2 ladder/score + Hint + gold primary action that validates, navy SAMJHO concept strip with gold key terms (Hinglish).
- Footer stats via shell API (Round, game stat, Streak, Time).
- Pure logic in validators.ts with vitest tests (sound.test.ts) covering each level's check. Remove/replace obsolete scene files and tests that break.