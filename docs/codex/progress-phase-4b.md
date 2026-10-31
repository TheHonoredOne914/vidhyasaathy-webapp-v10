# phase-4b

Base: db47668. Backend only; no frontend/Atom Forge edits.

## Codex review
- No commits after the base; no prior branch progress file. Reviewed all five uncommitted files against the task and v10 Ask/Games contracts.
- Replaced invalid async iterators, duplicate exports, parsed-result return bugs, fake draft questions, import-time environment reads, credential-leaking upstream errors and placeholder streaming.
- Kept the grounded stub/HTTP provider intent; implemented cancellation, bounded SSE parsing, config-only registry and private vision providers.
- Restored unrestricted evidence source compatibility. The untracked, unapplied 0040 draft has invalid foreign keys, duplicate source ALTER and missing tables; replacing it in the additive-schema item, not running it.
- Backed up the local demo DB with SQLite's online backup API under ignored apps/api/data/backups/ before any migration.

## Items
- Provider registry implemented; verification pending.
- Schema, Ask pipeline/routes/safety, Today follow-ups and games: pending.

No UI built; scrollWidth: not applicable (backend run).
