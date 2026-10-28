# VidhyaSaathy

Phase 1 API foundation: school registration, administrator password login,
student claim/PIN login, cookie sessions, and school/role authorization.
The web application and Playwright scenarios belong to the separate web track;
neither is present in this initial checkout. No roster import or claim-issuance
endpoint ships in this phase. API tests provision their own claim-code fixtures.

## Setup (PowerShell)

Use Node.js 24 or newer and npm 11. Install dependencies from the repo root:

```powershell
npm install
Copy-Item apps/api/.env.example apps/api/.env
npm run db:migrate -w apps/api
npm run dev -w apps/api
```

`npm run dev` starts both the web and API workspaces using `concurrently`,
once the web track has added `apps/web` and its `dev` script. For the web,
copy the public values in root `.env.example` into `apps/web/.env`. Its dev
proxy must forward `/api` to `VITE_API_PROXY_TARGET`, stripping `/api`, and
preserve the browser's `Origin` and session cookie. Do not enable Vite's
`rewriteWsOrigin` or rewrite the HTTP Origin header. Use same-origin requests
with `credentials: 'include'`; this API intentionally does not enable CORS.

## Environment

API configuration is loaded only from `apps/api/.env` and process environment.
Never put secrets in web environment variables. `.env` files, SQLite databases,
uploads, test output, and local npm caches are gitignored.

| API variable | Meaning/default |
| --- | --- |
| `NODE_ENV` | `development`, `test`, or `production`; defaults to `development` |
| `API_HOST`, `API_PORT` | Bind address/port; defaults `127.0.0.1`, `3001` |
| `APP_ORIGIN` | Required exact web origin, no path/trailing slash; HTTPS required in production |
| `DATABASE_PATH` | SQLite filename relative to API working directory; defaults `./data/vidhyasaathy.db` |
| `SESSION_COOKIE_NAME` | Defaults `vidhyasaathy_session` |
| `SESSION_TTL_SECONDS` | Absolute session lifetime, defaults 604800 (7 days) |
| `PIN_LOCKOUT_SECONDS` | Lockout after five failures, defaults 900 (15 minutes) |
| `RATE_LIMIT_MAX` | Per-IP request budget per minute for ordinary routes, defaults 120 |
| `AUTH_RATE_LIMIT_MAX` | Per-IP budget per minute shared by the public `/auth/*` credential routes, defaults 20 |

No session signing secret is needed: opaque 256-bit session tokens are generated
with Node crypto and only SHA-256 token hashes are stored. HTTPS origins set
`Secure` on cookies. Production must terminate HTTPS at a trusted same-origin
proxy; forwarded client IP headers are not trusted. Thus, requests behind a
proxy share its rate-limit budget until trusted proxy addresses are explicitly
configured. Keep the API bound to a private/loopback interface in that setup.

## Scripts and verification

```powershell
npm test -w apps/api -w packages/core
npm test -w packages/contracts
npm run typecheck
npm run lint
npm run deps:check
npm test
```

Root `npm test` runs all configured Vitest workspace projects, then Playwright.
Vitest uses native config loading and threads to avoid Windows config-loader
`spawn EPERM` failures. The Playwright runner allows zero tests while the web
track is absent; this is not an e2e acceptance pass. Once that track is available,
start web/API first, set `$env:E2E_BASE_URL` to the configured web origin, and
run `npm test`. Browser installation is `npx playwright install chromium`.
API tests use `fastify.inject`, isolated migrated SQLite databases, and a fake
clock rather than sleeps. A disk-backed test checks migration reapplication and
rate-limit persistence across restarts.

## Architecture and security

- `packages/contracts/src/index.ts`: strict Zod schemas and inferred DTO types;
  endpoint request/response details are in `packages/contracts/README.md`.
- `packages/core/claim.ts`: cryptographically random, unambiguous 12-character
  codes and a fail-closed expiry check (expiry is exclusive).
- `apps/api/src/app.ts`: injectable Fastify app, input/error handling, CSRF,
  persistent rate limiting, and default-deny session authentication.
- `apps/api/src/auth`: Argon2id credentials, hash-only sessions, audit events,
  and reusable `requireRole`/`requireSchool` pre-handlers.
- `apps/api/src/db`: Drizzle schema and SQLite initialization (foreign keys,
  WAL, busy timeout). Versioned SQL migrations live in `apps/api/drizzle` and
  are applied at startup or with `npm run db:migrate -w apps/api`.

The tables are `school`, `user`, `profile`, `claim_code`, `session`, `audit_log`,
and `rate_limit`. Composite foreign keys bind codes and sessions to the
profile's school. Phase 1 gives each user one profile. Registration creates an
administrator; student profiles are pre-provisioned and cannot self-select a
role. Claim codes are stored as SHA-256 hashes, expire, and are consumed in the
same transaction that sets the Argon2id PIN and creates a session. A second
code cannot reset an activated PIN. Concurrent redemption has only one winner.

`GET /me` returns the caller's school/profile. `GET /schools/:schoolId` returns
`SchoolSchema` only for an administrator of that exact school; other roles and
cross-school reads return 403. All other non-public routes require a session.
POSTs, including login, registration, and logout, require the exact configured
`Origin`. Logout revokes the server-side session; reauthentication rotates the
current cookie. Auth responses are not cacheable. Audit records contain event,
school/profile identifiers where authenticated, request ID, and time, never
passwords, PINs, raw codes, or session cookies. Unexpected errors are sanitized.

Lockout/expiry durations are reversible configuration defaults, not a finalized
school policy. Claim issuance will specify an expiry when roster provisioning
is added. Privacy, consent, retention, and DPDP review remain necessary before
using real student data.

## Dependency rationale

| Dependency | Purpose |
| --- | --- |
| `zod` | Shared request/response and API environment validation |
| `fastify` | API server and in-process HTTP injection tests |
| `@fastify/cookie` | Parse, set, and clear httpOnly session cookies |
| `@fastify/rate-limit` | Apply request budgets with a SQLite-backed store |
| `better-sqlite3` | Local transactional SQLite driver |
| `drizzle-orm` | Typed queries/schema and versioned migration execution |
| `argon2` | Argon2id password and PIN hashing/verification |
| `@vidhyasaathy/contracts` | API uses the same validation/types as web |
| `@vidhyasaathy/core` | API reuses claim expiry business logic |
| `tsx` | Run API TypeScript source and watch scripts without a separate build |
| `typescript` | Strict workspace type checking |
| `@types/node` | Node runtime declarations |
| `@types/better-sqlite3` | SQLite driver declarations |
| `vitest` | API, contracts, and core unit/integration tests |
| `@playwright/test` | Root browser acceptance-test runner |
| `concurrently` | PowerShell-compatible combined web/API development process |
| `eslint` | Static lint checks |
| `@eslint/js` | ESLint's recommended JavaScript checks |
| `typescript-eslint` | TypeScript-aware lint parser and rules |
| `depcheck` | Detect unused/missing dependency declarations |
