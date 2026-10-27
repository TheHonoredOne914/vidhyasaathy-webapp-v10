# GAME brief: Polynomial Factory
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Maths Ch 2 Polynomials. Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Degree and type; zeroes of a polynomial; remainder and factor theorems; factorisation by splitting the middle term; algebraic identities.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 Conveyor belt: sort expressions into polynomial vs not, then by degree (ORDER).
2 Zero hunter: SLIDER for x with a live p(x) meter, find the zeroes of x^2 - 5x + 6.
3 Remainder theorem: PREDICT the remainder of p(x)/(x-1) before long division animates.
4 Area tiles: DRAG algebra tiles to build (a+b)^2 and factorise x^2 + 5x + 6.
Focus check: tap the tile that just flipped sign.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.


## Files to touch
- apps/web/src/games/poly/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, poly.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:poly'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: poly" (git add only your files).
