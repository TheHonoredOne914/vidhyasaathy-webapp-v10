# API operations — P7

Local Fastify/SQLite backend; no Supabase or Android. Run commands below from `apps/api` after installing the existing workspace dependencies. Copy `.env.example` to `.env` and set a private `CLAIM_CODE_ENCRYPTION_KEY` and `APP_ORIGIN`. Never commit `.env`, databases, uploads or backups.

```powershell
node --env-file-if-exists=.env --import tsx src/db/migrate.ts
node --env-file-if-exists=.env --import tsx src/server.ts
```

## Explicit demo seed

Use a separate development database. Set `DEMO_SEED=true`, `DEMO_PASSWORD` (12–128 characters) and `DEMO_PIN` (four digits), then run:

```powershell
node --env-file-if-exists=.env --import tsx src/db/seed.ts
```

The command refuses production and never runs at startup. It creates **Demo school**, class 6/A, Mathematics → Fractions, two prerequisite-linked concepts, approved notes, slides, six shared-schema questions and published homework. No invented attempts, mastery or AI output. Rerunning preserves credentials and all existing data.

- Admin: `admin@demo.invalid`; teacher: `teacher@demo.invalid`; parent: `parent@demo.invalid`. Use the explicitly supplied password through `/auth/login`.
- Student: **Demo student**, roll `1`; use its profile ID and the supplied PIN through `/auth/pin-login`. The admin roster API exposes the profile ID. No public profile directory is added.
- The demo teacher is assigned only to 6/A Mathematics; the demo parent is linked only to Demo student. Demo identities are pre-activated/pre-linked for local walkthroughs, not an alternate production onboarding flow.
- Student loop: published lesson → homework → incorrect answer → existing prerequisite/remediation check → retry → mastery update. Parent reads only the linked child's summary; teacher sees only assigned class data. Optional games reuse released items; they never extend deadlines. See `packages/contracts/PRACTICE.md` for the practice API. LLM routes still require the configured provider; the seed does not bypass it.

## Backup and restore

Set `BACKUP_DIRECTORY` to a private directory outside the live data directory:

```powershell
node --env-file-if-exists=.env --import tsx src/db/backup-cli.ts
```

Uses SQLite's online backup (including committed WAL pages), unique filenames and integrity/FK checks; never migrates or overwrites the source. Restrict directory access (Windows ACLs / Unix permissions), encrypt off-host copies and schedule daily using your OS scheduler. Retention is operator-controlled; no automatic deletion.

**Database-only backup:** also back up `UPLOAD_DIRECTORY` and retain `CLAIM_CODE_ENCRYPTION_KEY` separately in a secret store. Stop writes while taking the database + upload snapshot when a consistent full restore is needed. Restore into a new directory with the server stopped: copy the selected snapshot as `DATABASE_PATH`, restore matching uploads/key, then run migrations and verify `PRAGMA integrity_check` / `PRAGMA foreign_key_check` before restarting. Never replace a live database or reuse stale `-wal`/`-shm` sidecars. Test restores regularly.

## Verification without npm

From the repository root:

```powershell
node node_modules/typescript/bin/tsc --noEmit -p packages/contracts/tsconfig.json
node node_modules/typescript/bin/tsc --noEmit -p packages/core/tsconfig.json
node node_modules/typescript/bin/tsc --noEmit -p apps/api/tsconfig.json
node node_modules/vitest/vitest.mjs run --config apps/api/vitest.config.ts --configLoader native --pool threads --reporter dot
```
