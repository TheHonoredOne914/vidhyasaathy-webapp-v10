# CURSOR: Phase 1 (web foundation)
Repo: /workspace/vidhyasaathy-webapp. Read plan/AGENT_RULES.md and plan/PHASES.md first.
You own apps/web/** and e2e/**. Don't edit apps/api, packages or root files; ask the orchestrator for changes. Import types and schemas from packages/contracts (Codex writes it first).
1. apps/web: Vite + React + TS strict + React Router + Tailwind with tokens in src/ui/tokens (brand palette, 6-10px radii, spacing scale, one shadow). Self-host Manrope. Add a PWA manifest and service worker.
2. Bring over from /workspace/vidhyasaathy-app: the logos, favicon, apple-touch-icon, og-image and the landing page (route "/").
3. src/ui, one file each: Button, Field, Dialog (Escape closes, focus trap), EmptyState, ErrorState, Skeleton, PageHeader.
4. Routes: /signin, /signin/student (PIN), /claim, /register-school, /recover, /admin, /teacher, /student, /parent (real empty states), /privacy, a custom 404 and access-denied. RoleGuard uses GET /me. Set a title and meta on every route.
5. api client: fetch with credentials:'include', base URL from VITE_API_URL, proxied in dev. Validate forms with the contracts schemas. Show inline field errors, rate-limit messages and network errors.
6. Playwright e2e against the real api: register school -> admin home; claim -> PIN login -> student home; student at /admin -> access-denied; axe on every route; fail on any console error; no horizontal scroll at 360, 768, 1024 and 1280px.
Run `npm test` until it's green. Save screenshots to e2e/screenshots. Commit with meaningful messages.
