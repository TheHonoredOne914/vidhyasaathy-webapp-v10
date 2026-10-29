# Task: remake Atom Forge as a genuinely playable game

Read AGENTS.md first (hard rules: no sound, notebook theme, real server evidence, no fake stats).
Context: docs/spec/master-file-gap.md section "Atom Forge refinements" and "Games section". Current code: apps/web/src/games/atom/ (AtomForgeVideo.tsx, AtomForgeScene.tsx), apps/web/src/games/engine/InteractiveVideo.tsx (line ~20 short-circuits game.id==='atom' with no props), engine/progress.ts (recordCheckpointResult).

The owner says the current Atom Forge "looks vague, AI-generated and like a video". She wants real interactivity so a student can actually PLAY it properly. Replace the five-episode "interactive video" with a hands-on game:

## Gameplay
- A workbench: a nucleus in the centre and visible shells K, L, M (2/8/8 rule for the first 20 elements). A tray of particles: proton (+), neutron (0), electron (−).
- The student directly builds atoms: drag (pointer + touch) OR click-to-select-then-click-target to place protons/neutrons into the nucleus and electrons onto a shell. Also allow removing a particle (drag out / click to remove). Keyboard accessible (tab to tray item, Enter to place) .
- Immediate visible reactions on every action: live readouts of atomic number Z, mass number A, charge, electron configuration (e.g. 2,8,1), the element name/symbol updating as protons change (a periodic-table strip for H..Ca that highlights the current element), shell-full indicator, "unstable/wrong shell" warnings. Placing an electron in the wrong shell (e.g. M before L is full) is shown and explained in text right there, not silently blocked.
- Clear goal per level shown as a card ("Build Carbon-12", etc.) with a Check button. On check: correct → success state; wrong → show exactly what's wrong ("You have 7 protons, that's Nitrogen. Carbon has 6.") and let them fix it.
- Levels (at least 10, progressive), e.g.: 1 Build Hydrogen; 2 Helium-4; 3 Lithium (first electron in L shell); 4 Carbon-12; 5 Oxygen-16; 6 Sodium-23 (2,8,1); 7 Make Na+ ion (remove the right electron); 8 Make Cl− (gain one); 9 Isotopes: build C-12 then C-14 (what changed?); 10 Valency puzzle: given configuration, pick/build an atom with valency 2; 11 Isobars (Ar-40 vs Ca-40); 12 Boss: mystery atom from clues (Z, A, charge). Each level maps to one of 4 concepts below.
- Hints: a Hint button per level with 2 graded hints; hints used are counted and saved.
- Confidence: before the result is revealed on Check, show text chips "Sure / Not sure / Guessing" (shared component apps/web/src/games/engine/ConfidenceChips.tsx, reusable by other games).
- Progression: level map/list with locked/unlocked/completed states, stars or ticks based on (no hints, first try). Unlocks persist server-side. A clear win state at the end (recap screen with what they learned, plain text) — skippable celebration, no sound.
- Mistakes are explained; never a dead-end fail screen.

## Look
- Crisp, handcrafted, legible. Notebook theme: cream paper with ruled lines + red margin around the play area, Caveat/Patrick Hand headings, navy ink, gold accents, matching docs/mockups/games-v1-1440.png and docs/mockups/src/games-v1.html.
- Either clean SVG/2D canvas or Three.js, but NO fog, bloom, depth-of-field, sparkles or glow. Particles are clearly distinguishable by colour AND label (+, 0, −). Smooth but short animations (electrons orbiting slowly is fine). Respect reduced motion (useReducedMotion): no orbit animation, instant placement.
- Works at 1440 desktop (full width, side panel for goal/readouts, centre workbench) and 360 mobile (stacked, big touch targets ≥44px).
- NO audio of any kind.

## Real data
- Seed (apps/api/src/db/demo.ts) a Class 9 Science chapter "Structure of the Atom" with 4 concepts: charged particles (protons/neutrons/electrons), electron shells & configuration, atomic number & mass number (incl. ions/valency), isotopes & isobars. One published item per level (format appropriate, answer key server-side) so each level has a real itemId. Hook the atom game to this chapter (check how games are attached to chapters in the existing code and the route /student/chapters/:chapterId/practice/engine/:gameId).
- Pass chapterId and game props from InteractiveVideo into the new Atom Forge component.
- On Check: send the built state (Z, neutrons, electrons per shell, charge or the chosen answer) to the SERVER which validates it against the level's key and records an attempt/evidence row (correct, timeMs, hintsUsed, attempts, confidence) using the existing attempt/evidence path (recordCheckpointResult or /practice/attempts — extend server schemas as needed; confidence optional field sure|unsure|guess). Do not validate only on the client. If a level is passed with hints, record hintUsed=true.
- XP and streak shown in the game come from the server response (or existing server streak endpoint). Remove local useState XP.
- Level unlock/progress is derived from server evidence (so reload keeps progress).

## Done when
- npm run typecheck passes; add a vitest for the server-side atom validation (at least: correct Na, wrong proton count, Na+ ion, isotope) and it passes.
- Remove the old video episode code that is no longer used (AtomForgeVideo / AtomForgeScene if replaced) and the three.js postprocessing import if unused.
- Reply with the list of changed files and how to reach the game in the demo (which login, which URL).
