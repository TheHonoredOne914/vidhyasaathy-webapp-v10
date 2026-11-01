# QA fixes (branch qa-fixes)

Worktree: C:\Users\jce\vs-qa. API on 3901, web on 5973, with its own DB copy. Not merged into rebuild-local.

## Fixes (each has a regression test)
- 48341bc S01/S05: student activation needs a verified, single-use PIN grant. Lookup tokens and unverified OTP tokens are rejected. Two concurrent set-pin calls: one wins. Ambiguous roll numbers return 409 until a section is chosen. Loose demo auth runs only with DEMO_LOOSE_AUTH=true and never in production.
- 94f59aa S03: origin-proxy rewrites Origin only for allow-listed origins (APP_ORIGIN, 127.0.0.1/localhost:WEB_PORT, ORIGIN_PROXY_ALLOWED_ORIGINS).
- 84cef15 vite CSRF: the dev proxy no longer forces Origin to APP_ORIGIN. Only same-host or VITE_ALLOWED_ORIGINS origins are mapped, so a foreign Origin now gets 403 CSRF_ORIGIN.
- ca502b3 S04: requesting a new OTP invalidates earlier live codes. Answer-key regression test: student payloads carry no answer keys.
- 45ad47d BUGS: parents no longer call the staff catalog on the From school page, so no more 403.
- 5182f95 UX01: each lesson attempt saves its own evidence row (attemptId). A wrong-then-right retry keeps both rows, and a replay is idempotent.
- fefbf75 UX02: home, progress, notifications, badges and streak reload after any saved answer.

## Checked, no change needed
- PIN lockout after 3 tries, OTP/activation limit of 5, /auth/* rate limit.
- Teacher section access goes through readSection/sectionAccess; announcements are scoped by role.
- No answer keys in about 60 student GET payloads.

## Deploy notes
- Loose auth is now off by default. The preview launchers need `set DEMO_LOOSE_AUTH=true`.
- If the browser origin differs from APP_ORIGIN, set APP_ORIGIN (or VITE_APP_ORIGIN). For tunnels, use VITE_ALLOWED_ORIGINS or ORIGIN_PROXY_ALLOWED_ORIGINS.

## Still broken (BUGS.md, owned by vs-backend)
- GET /student/catchup returns 404 when nothing is due.
- POST /student/warmup/start returns 409.
- POST /student/daily-challenge/:id/finish returns 409.
- Parent child progress and assignments tabs render the same ParentChild view.
- UX06/UX07 (outbox) not done.
- Bug sweep: on some panels the click locators time out (overlay or hidden nav at 1440px). Not triaged.
- QA env only: the 403 on @fontsource fonts comes from the node_modules junction to vs-preview, not from the app.
