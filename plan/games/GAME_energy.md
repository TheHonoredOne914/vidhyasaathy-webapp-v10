# GAME brief: Energy Slide
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Science Ch 10 Work and Energy. Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
W = F s with zero-work cases; KE = 1/2 mv^2; PE = mgh; KE <-> PE conversion with conservation; power and the kWh.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 A student pushes a wall and does no work. PREDICT work yes/no for 4 cases.
2 A playground slide: a child climbs (PE bars rise) and slides (PE to KE). The bars animate, and a SLIDER for height predicts the speed at the bottom.
3 A pendulum or a ball dropped: ORDER the energy at points A/B/C.
4 Power: two students climb stairs in different times. NUMERIC power. Then the electricity bill: units = kWh for a fan.
Focus check: tap where KE is maximum.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.


## Files to touch
- apps/web/src/games/energy/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, energy.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:energy'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: energy" (git add only your files).
