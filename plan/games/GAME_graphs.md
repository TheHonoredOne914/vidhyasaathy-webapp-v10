# GAME brief: Treasure Grid
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Maths Ch 3 Coordinate Geometry + Ch 4 Linear Equations in Two Variables. Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Plot (x, y); know quadrant sign rules; a linear equation ax+by+c=0 has infinitely many solutions; every solution is a point on its line.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 A classroom seating chart becomes a Cartesian plane (rows/columns to axes). TAP the seat (3, -2).
2 Treasure clues: DRAG the marker to the points. Quadrant sign checkpoint.
3 Story: 'notebooks cost 2 more than pens' becomes x - y = 2. Find 3 solutions (NUMERIC), plot them and watch the line form. PREDICT whether (5, 3) lies on it.
4 SLIDER for the line's a/b/c and match a target line.
Focus check: tap the origin.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.


## Files to touch
- apps/web/src/games/graphs/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, graphs.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:graphs'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: graphs" (git add only your files).
