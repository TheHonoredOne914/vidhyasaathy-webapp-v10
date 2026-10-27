# GAME brief: Bus Stop Graphs
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Science Ch 7 Motion (7.1-7.6). Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Tell distance from displacement; uniform vs non-uniform motion; speed and velocity; acceleration; read d-t and v-t graphs (slope and area); equations of motion; uniform circular motion.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 A school bus route on a map: distance vs displacement. NUMERIC checkpoint for both.
2 The bus drives while a d-t graph draws live. PREDICT the graph shape for a stop, a constant speed and speeding up.
3 DRAG the bus speed handle so it matches a target d-t graph (graph matching).
4 v-t graph: shade the area to get distance, and slope gives acceleration. NUMERIC with v = u + at and s = ut + 1/2 at^2 (brakes of the bus).
5 An athlete runs round a track: velocity changes while speed stays constant. TAP the velocity arrow direction at 3 points.
Focus check: the bus briefly reverses, tap it.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.


## Files to touch
- apps/web/src/games/motion/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, motion.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:motion'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: motion" (git add only your files).
