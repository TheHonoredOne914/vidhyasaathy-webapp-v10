# GAME brief: Atom Builder (rebuild of Atom Workshop 3D)
Do not run npm, npx, or any install/test/build commands. Edit files only. The engine already exists in apps/web/src/games/engine (see plan/games/ENGINE.md). Use it and don't fork it.

NCERT reference: Science Ch 4 Structure of the Atom (4.1-4.6). Full map in plan/games/SYLLABUS_MAP.md. Source PDF text: plan/games/ncert/*.txt if present.

## Learning objectives
Identify p/n/e charges and where they sit; distribute electrons with 2n^2 and the outermost<=8 rule; work out valency; tell atomic number from mass number; recognise isotopes and isobars.

## Scene script (each scene <= 45s; checkpoints in CAPS)
1 Rubbing a comb on hair picks up paper bits (4.1 charged particles). Predict: what charge does the comb carry?
2 Thomson's watermelon model morphs into Rutherford's gold foil: alpha particles fire at the foil and most pass through. PREDICT before the reveal: what happens to most particles? Then the animation plays.
3 Bohr orbits K, L, M. DRAG electrons onto shells for C(6), Na(11) and Cl(17). Overfilling a shell bounces the extra electron back with the 2n^2 hint.
4 Valency: an atom 'wants' a full outer shell. TAP the electrons Na gives away and the gaps Cl fills, then a NUMERIC checkpoint for the valency of Mg, Al and O.
5 Nucleus zoom: SLIDER for the neutron count. Z stays fixed while A changes, and the label flips to 'isotope of C-12'. ORDER checkpoint: sort Ca-40/Ar-40 (isobars) vs C-12/C-14 (isotopes). Uses: C-14 dating, Co-60, I-131.
Focus check: one electron blinks between shells, tap it.
Interleaved question: Ch3 atomicity of O2.

## Rules
- Narration is by Saathy in short bubbles, simple Indian-classroom English, with a light Hinglish touch only in praise ("Shabaash!").
- Every checkpoint has a conceptId, specific feedback, a reteach replay of the relevant scene segment, and a hint.
- Finish with a 3-question recap and a stars summary. Unlock the next game card.
- Dark theme from engine/theme.css. Patrick Hand only. All art is hand-drawn inline SVG/React in this folder. No images from AI generators, no emoji, no glow or glassmorphism. Check plan/vs-design/VIBE_TELLS.md.
- Respect prefers-reduced-motion.
- Replace the Atom Workshop 3D card with this game, but keep the old component file for now behind registry flag legacy:true.

## Files to touch
- apps/web/src/games/atom/ (index.ts exporting GameDef, scenes/*.tsx, art/*.tsx, atom.test.ts)
- apps/web/src/games/engine/registry.ts (add one lazy entry only)

## Acceptance
- Plays start to finish with keyboard and touch. Every checkpoint is reachable, and a wrong answer triggers a reteach then a retry.
- Checkpoint results go to progress.ts with source 'game:atom'.
- Facts match the NCERT text exactly (numbers, examples).
- vitest unit test for the checkpoint validators. Write it but do not run it.
- Commit: "games: atom" (git add only your files).
