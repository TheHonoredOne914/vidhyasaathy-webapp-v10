# V7 FIXTS
No git/npm. Fix TypeScript errors only, no visual changes:
- graphs/graphs.test.ts imports old validators that no longer exist; rewrite the test to cover the new arena validators in graphs/validators.ts (each level).
- newton: validators take numeric objects but are typed CheckpointAnswer; give them their own typed signatures (no casts through string records) and fix NewtonStage + newton.test.ts.
Run 'npx tsc --noEmit -p apps/web' mentally by reading types carefully.