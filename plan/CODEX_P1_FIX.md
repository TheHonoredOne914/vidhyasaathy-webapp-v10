Follow plan/AGENT_RULES.md. Fix only these, minimal changes:
1. `npm run typecheck` fails in apps/api: @fastify/rate-limit store types, `error` typed as unknown (narrow properly, no `any`), Vitest `fileParallelism` config. Make typecheck pass with no ts-ignore.
2. Root depcheck flags @axe-core/playwright, @vidhyasaathy/contracts, @vidhyasaathy/core, better-sqlite3 used by e2e. Declare them in the right package (e2e workspace or root devDependencies) or configure depcheck ignores correctly.
Do not change behavior. Commit as "fix: api typecheck and depcheck". Note anything you could not verify.
