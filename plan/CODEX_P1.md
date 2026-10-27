# CODEX: Phase 1 (api foundation)
Repo: /workspace/vidhyasaathy-webapp. Read plan/AGENT_RULES.md and plan/PHASES.md first.
You own: root workspace files (this phase only), apps/api/**, packages/contracts/**, packages/core/**. Don't touch apps/web or e2e.
0. Root: npm workspaces (apps/*, packages/*), tsconfig.base.json, `npm run dev` (concurrently: web + api), `npm test` (vitest workspaces, then playwright), .gitignore, .env.example. Everything must work in PowerShell.
1. FIRST, packages/contracts: zod schemas + types for Role, School, Profile, ClaimCode, RegisterSchool, Login, Claim, PinLogin, Me, and ApiError {code, message, fields?}. Commit this before anything else so Cursor can start.
2. apps/api: Fastify + TS, better-sqlite3 + Drizzle with migrations. Tables: school, user, profile(role), claim_code, session, audit_log.
3. Routes: POST /auth/register-school, /auth/login, /auth/claim, /auth/pin-login, /auth/logout; GET /me. Validate with the contracts schemas. Use argon2 hashing, httpOnly SameSite=Lax session cookies, @fastify/rate-limit, a CSRF origin check, and requireRole/requireSchool middleware. Lock PIN login after 5 failures. Write to audit_log. Send consistent ApiError JSON.
4. packages/core/claim.ts: one-time code generation (no ambiguous characters) and an expiry check.
5. Tests (vitest, fastify.inject): register then login; claim works only once; expired codes are rejected; lockout; cross-school read is denied; a student hitting an admin route gets 403.
Run `npm test -w apps/api -w packages/core` until it's green. Commit with meaningful messages (e.g. "feat(api): add claim-code redemption with expiry").
