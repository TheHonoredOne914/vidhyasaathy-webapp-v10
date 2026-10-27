# CODEX THEME PASS (runs in PARALLEL with Cursor). Read plan/vs-design/DESIGN_SPEC.md + images in plan/vs-design/refs/.
Cursor is editing at the same time: landing, sign-in, registration, setup wizard, admin screens, student screens, Saathy chat, the shared tokens/ui kit, and e2e/**. NEVER edit those files.
YOUR files only: create apps/web/src/theme/vs-theme.css (spec tokens as CSS variables, prefixed --vs-) and restyle these pages using it: teacher pages, parent pages, accept-invite, recover, privacy, 404, access-denied, onboarding, printable claim-code sheet. If a page doesn't exist yet, skip it. Desktop shell per spec: 240px Midnight sidebar.
Rules: no fake data, no dev tags, no dead buttons, axe clean, 360px no overflow, $ux-craft rules. Don't change API behaviour. No commits.
At the end, list every file you touched.
