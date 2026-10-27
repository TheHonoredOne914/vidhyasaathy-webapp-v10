# GAME brief: Cricket Lab
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Science Ch 8 Force and Laws of Motion. Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Balanced vs unbalanced forces; inertia and the first law; momentum p = mv and F = ma; the third law with action-reaction pairs.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 A tug of war between two classes. SLIDER for the team pulls shows balanced vs unbalanced.
2 A bus brakes and the passengers lurch forward. PREDICT the direction. Then the coin-on-card flick activity.
3 Catching a cricket ball: the fielder pulls their hands back. SLIDER for catch time shows the force bar dropping (F = change in momentum / t). NUMERIC with F = ma.
4 Third law: a gun recoils and a boy jumps off a boat. TAP the action-reaction pair.
Focus check: tap the ball when it leaves the bat.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.


## Files to touch
- apps/web/src/games/newton/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, newton.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:newton'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: newton" (git add only your files).
