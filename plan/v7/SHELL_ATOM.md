# V7 SHELL + ATOM — match plan/gameref/atom-forge.png (attached image) nearly pixel-for-pixel
You cannot run git/npm. Do not touch apps/web/src/landing/** or routes/Landing.tsx.

## 1. Shared "Arena" shell (new): apps/web/src/games/arena/
- types: add optional `arena?: ArenaDef` to GameDef (engine/types.ts). ArenaDef = { name (e.g. 'ATOM FORGE'), world ('Atom Valley'), chapterLabel ('Ch 4 Structure of the Atom'), levels: ArenaLevel[] }. ArenaLevel = { title, subtitle (Hinglish), Stage: React component receiving shared ArenaApi (round, setStats, reportResult(correct), hintRequested, onCheck registration) }. Design the API cleanly yourself.
- InteractiveVideo route/wrapper: when game.arena exists render <ArenaShell game/> instead of the scene player (keep the old player for other games). Still record results with the same CheckpointResult/progress code (source `game:<id>`) so backend progress keeps working.
- Layout (1440x900 desktop, responsive stack < 1000px), font Inter/system sans for the game UI only:
  - Page bg cream #F7F3EA. Top bar white-ish w/ bottom border: VidhyaSaathy logo (reuse existing logo asset/component), game NAME bold navy #13294B, under it "BY VIDHYASAATHY · GRADE 9 ARENA" small gold #D4A017 caps. Right: rank pill (pale gold bg, shield icon, "WARRIOR", "LV 5 · Atom Apprentice") + XP bar (gold fill, "1,180 XP · next LV 1500"). Derive XP/level from existing rewards.ts if possible.
  - Breadcrumb small gray: Worlds › **World** › NCERT Class 9 › Ch label.
  - H1 ~28px bold navy "Level N · Title", subtitle gray 14px.
  - Left: big white card radius 16, subtle border/shadow, stage area (pale blue-white #F4F7FC), footer row with 4 stats: Round x/5, game stat, Streak, Time mm:ss (live timer).
  - Right column ~360px: cards (white, radius 12, border #E7E1D3): YOUR TASK (gold caps label, bold title, Hinglish text, slot for game tiles + meter), second card slot (ladder/score) with row of [Hint (outline)] [primary gold button], then dark navy #13294B "SAMJHO · CONCEPT STRIP" card, white text, key terms gold bold (accept ReactNode).
- Game supplies the slots per level: stage, taskTitle, taskText, taskBody, card2, primaryLabel, onPrimary, concept.
- Level progression: success on primary → toast/feedback, next level; after final level show a summary card (score, accuracy) with Replay / Back to chapter.

## 2. ATOM rebuild (apps/web/src/games/atom/) using arena — see image
- Levels (≥4): 1 Build Hydrogen/Helium (add protons/electrons), 2 Fill shells (K=2,L=8 electron placement), 3 Mass number, 4 "Keep the Nucleus Stable" (isotopes C-12/13/14) — level 4 must look exactly like the image. Start the game on level 1 but allow `?level=4` query to jump.
- Stage SVG: 3D-shaded spheres (radialGradient) protons red, neutrons blue-gray packed cluster; tilted elliptical orbits (K dashed thin, L solid navy) with gold electron spheres that orbit (respect reduced motion); labels "K shell · 2e⁻", "L shell · 4e⁻", "Nucleus · 6p + 7n"; floating draggable neutron with "Neutron · 0 charge" pill and dashed path to nucleus (drag into nucleus OR + Neutron button adds); left buttons + Neutron, − Neutron, Reset atom; NOTATION card bottom-right (A top, Z bottom, big symbol); legend bottom; soft ground shadow.
- Right: tiles Protons(Z), Neutrons (6 → 7 with change in gold), Mass number A = p + n "6 + 7 = 13", Isotope "Carbon-13". STABILITY METER gradient (red Radioactive / yellow Borderline / green Stable) with marker. Card2: ISOTOPE LADDER · CARBON rows C-12 6p,6n STABLE; C-13 highlighted; C-14 RADIOACTIVE. Task: reach target isotope; "Check nucleus" validates.
- Real interactivity, all values live. Keep/replace validators + atom.test.ts so tests pass (pure logic in validators.ts with tests: mass number, isotope name, stability).
- Make sure registry & any game validator test still pass (scenes may stay as fallback or be removed if test updated).