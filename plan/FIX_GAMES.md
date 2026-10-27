Fix games in apps/web/src/games. Be terse, minimal edits.
1. Register atom in engine/registry.ts (match how others export; check atom/index.ts export name and loadGame).
2. Cell game: shorten every narration bubble to <=64 chars (validator rule).
3. Fix syntax errors: cell/scenes/Scene2,3,4,6,7.tsx and engine/DemoScene.tsx (esbuild "Expected } but found ;").
Run web typecheck and cell/atom tests; fix. Commit only apps/web/src/games: git add apps/web/src/games; git commit -m "games: fixes".
