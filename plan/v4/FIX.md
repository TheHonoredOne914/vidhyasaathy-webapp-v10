Read plan/POLISH.md first and follow it. Do NOT run git/npm. Edit only listed paths. Terse.

Fixes:
1) Atom game (apps/web/src/games/atom/**) fails engine validation at runtime: "Interleave a checkpoint from an earlier concept." Read the engine validator in apps/web/src/games/engine/ to learn the rule, then adjust atom scenes (add recall/review of an earlier conceptId at the required positions) so it validates. Add a test in atom.test.ts that runs the engine's validator on the atom game and expects no error. Do not loosen the engine rule.
2) Cell game (apps/web/src/games/cell/**): raise text contrast in the right task panel (labels, 'Concept step', meter labels >= 4.5:1 on dark); stage must not be overlapped by Play/Replay/Continue controls: fix stage sizing in cell art/scenes (stage fits its box with aspect-ratio, controls sit below). If the overlap comes from engine theme.css, you may edit apps/web/src/games/engine/theme.css minimally.
3) Landing (apps/web/src/routes/Landing.tsx, apps/web/src/landing/**): right-edge overlap/clipping of the dark panel, phone preview and polaroids at 1440 and 1024 widths; nothing cut off, no overlapping text; keep design.
4) Typecheck errors: apps/web/src/examiner/ModerationSummary.tsx(15) 'attempts.data' possibly null; PaperReview.tsx(23) indexing a possibly-null array. Fix with proper null handling.
