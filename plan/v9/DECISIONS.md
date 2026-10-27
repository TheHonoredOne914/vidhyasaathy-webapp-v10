# Question-gate decisions (locked for phases 1–5)

## Auth
- Student: school select → roll/admission → find record (NO login) → one-time activation code → OTP to parent phone (DEV: OTP logged + returned in API response / shown on screen; no SMS provider) → set 4-digit PIN → next time PIN.
- Teacher: staff ID + temp password → forced PIN on first login.
- Parent: phone OTP (dev OTP shown/logged) → only linked children.
- Admin: email + password (≥12 chars existing rule).
- Shared device "Kaun ho aap?" profile switcher with PIN re-entry.

## Assessment
- Pass threshold default 60%, teacher-overridable per quiz.
- Confidence: 3 buttons — Pakka / Sochta hoon / Andaza (store on every response).
- Timer: auto-submit on expiry.
- Short answers: keyword auto-grade + teacher review queue; partial credit allowed.
- Attempts: 2 max, best score kept.
- Quiz auto-pick difficulty mix: 40% easy / 40% medium / 20% hard (L1/L2/L3).
- Editing published content after attempts: create new version row; in-flight students stay on old version.

## Notifications / publish
- In-app notifications only (WhatsApp backlog).
- Direct publish (no school-admin approval gate for now).

## i18n
- New user-facing strings via en + hi keys.

## Seed (phase 1 enrich, keep existing demos)
- Class 9-A and 9-B, Physics → Motion → Distance & Displacement → Speed & Velocity → Acceleration (prereq chain).
- Sharma Ma'am (Physics teacher), Aarav (strong), one struggling student, one absent student, linked parent, school admin.
- Session 3 opens 18:00, 5-question diagnostic quiz.
- Keep DEMSTUDENT22 in Class 9-A working.

## Stack
- Keep Fastify + SQLite + Drizzle. Additive migrations only (0008+).
