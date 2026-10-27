# GAME brief: Cell Gatekeeper (rebuild of Bio Quest)
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Science Ch 5 Fundamental Unit of Life (5.2.1-5.2.5). Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Explain the plasma membrane as selectively permeable; diffusion of CO2/O2 down a concentration gradient; osmosis with hypotonic/isotonic/hypertonic solutions; plasmolysis; organelle functions.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 Hooke's cork slice zooms into an onion cell (honeycomb). Narration covers the cell as the unit of life.
2 The student plays the membrane gate. Molecules drift in: O2, CO2, water, glucose, a large protein. TAP to open channels for only the ones that may pass. The Bio Quest open-channel mechanic is kept, but wrong passes trigger a reteach.
3 Diffusion: dots spread from high to low concentration. PREDICT the direction before playback, then a SLIDER for the concentration difference changes the speed.
4 Osmosis lab: a cell is dropped into three beakers. PREDICT swell/same/shrink for each, then the animation plays (the NCERT de-shelled egg and raisin activities). Plant cell variant: plasmolysis, where the membrane pulls from the wall.
5 Organelle city: DRAG labels onto nucleus, mitochondria ('powerhouse'), ER, Golgi, lysosome ('suicide bag'), plastids, vacuole. Then a 3-question mix-match of functions.
Focus check: a glucose molecule sneaks past, tap it.
Interleaved question: Ch1 diffusion in gases vs liquids.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.
- Replace the Bio Quest card; keep the old file behind legacy:true.

## Files to touch
- apps/web/src/games/cell/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, cell.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:cell'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: cell" (git add only your files).
