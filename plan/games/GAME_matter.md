# GAME brief: Particle Party
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Science Ch 1 Matter in Our Surroundings. Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Particles have space between them, move, and attract each other; solid/liquid/gas properties; change of state through temperature and pressure; latent heat; evaporation and its factors.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 Potassium permanganate dilution and ink in water: particles spread. PREDICT faster in hot or cold water.
2 Three boxes of particles. SLIDER for temperature drives ice to water to steam, and the thermometer plateaus at 0 and 100 C (latent heat). Checkpoint: why does the temperature not rise?
3 Pressure piston: compress a gas into liquid (LPG, dry ice).
4 Evaporation clothesline: SLIDERS for humidity, wind and surface area change how fast the clothes dry. Then a PREDICT on why water in an earthen pot (matka) stays cool.
5 ORDER states by interparticle force.
Focus check: one particle escapes the liquid surface.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.


## Files to touch
- apps/web/src/games/matter/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, matter.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:matter'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: matter" (git add only your files).
