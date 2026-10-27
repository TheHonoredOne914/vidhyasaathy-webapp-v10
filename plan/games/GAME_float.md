# GAME brief: Float or Sink
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Science Ch 9 Gravitation (9.1-9.6). Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Universal law F = Gm1m2/d^2; free fall and g; mass vs weight (Moon 1/6); thrust vs pressure; buoyancy; float/sink by density; Archimedes' principle.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 A stone and a feather fall in a vacuum tube. PREDICT which lands first.
2 Weigh a schoolbag on Earth and on the Moon. NUMERIC (1/6).
3 Thrust and pressure: a school bag's wide vs thin strap, pins and nails. SLIDER for area changes pressure.
4 A bucket of water: PREDICT float/sink for a cork, an iron nail, a ship and an egg in salt water, then play each. Density meter.
5 Archimedes: a stone on a spring balance goes into water and the reading drops by the weight of displaced water. NUMERIC.
Focus check: the bubble leaving the stone.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.


## Files to touch
- apps/web/src/games/float/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, float.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:float'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: float" (git add only your files).
