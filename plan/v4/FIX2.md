Do NOT run git/npm. Edit only apps/web/src/games/newton/** and apps/web/src/games/energy/** (and other game folders listed below if they have errors). Terse.
1) apps/web/src/games/newton/index.ts contains JSX (tsc: '>' expected). Move JSX into a .tsx file or rename index.ts to index.tsx and fix imports so the engine registry still resolves. Fix every other type error in newton.
2) energy.test.ts 'reviews earlier work and keeps checkpoints interleaved' fails: fix energy scenes so a later checkpoint reviews an earlier conceptId per engine rules.
3) Files with tsc errors: apps/web/src/games/newton/index.ts
