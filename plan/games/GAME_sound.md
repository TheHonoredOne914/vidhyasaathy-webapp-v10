# GAME brief: Echo Corridor
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Science Ch 11 Sound. Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Sound from vibration; needs a medium; longitudinal compression/rarefaction; frequency/pitch and amplitude/loudness; speed in media; echo; range of hearing; ultrasound.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 The school bell vibrates. A bell-jar vacuum demo fades the sound: PREDICT what happens as air is removed.
2 A slinky shows compressions and rarefactions. TAP a compression.
3 Wave studio: SLIDERS for frequency and amplitude, with a pitch/loudness meter. Match a whistle vs a drum.
4 Echo in the school corridor: NUMERIC minimum distance (17.2 m at 344 m/s, 0.1 s).
5 ORDER the speed of sound in air, water and steel. Hearing range 20 Hz-20 kHz: sort bats, dogs and humans. Uses of ultrasound.
Focus check: tap the reflected wave.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.


## Files to touch
- apps/web/src/games/sound/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, sound.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:sound'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: sound" (git add only your files).
