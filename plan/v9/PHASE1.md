# PHASE 1 — Foundation: auth completeness, schema gaps, app shell, seed archetypes
Read plan/v9/HARD_RULES.md and plan/v9/DECISIONS.md first. DO NOT change landing or theme hex.

## Goal
Real persistent auth for all 4 roles matching DECISIONS; role guards; skeletal dashboards with REAL user data; seed archetypes. Keep Fastify+SQLite+Drizzle.

## Backend (additive)
1. Migration 0008 if needed: otp_challenge (phone, purpose student_verify|parent_login, code_hash, expires_at, attempts), ensure attempt has confidence/time fields if missing, ensure activation_code expiry/used_at, parent phone on profile/roster.
2. Auth APIs (Origin CSRF already required):
   - POST /auth/student/lookup {schoolId|slug, rollNo} → finds enrollment, returns masked parent phone + needsActivation; NEVER creates session
   - POST /auth/student/activate {lookupToken, activationCode} → validates one-time code, starts OTP to parent phone (dev: return/log otp)
   - POST /auth/student/verify-otp {otpToken, otp} → on success allow set PIN
   - POST /auth/student/set-pin {pinToken, pin} → sets pin_hash, creates session
   - Teacher: staff login + force PIN if pin_hash null
   - Parent: request OTP by phone → verify → session; children via parent_link only
   - Admin: email+password (existing)
   - Rate-limit all verification endpoints
3. Shared profiles endpoint for "Kaun ho aap?" device profiles (local device store + PIN reauth) — keep/extend PinSignIn.
4. Role middleware: student cannot hit teacher/admin routes (API 403 + client RoleGuard).

## Frontend (sign-in onward only)
- Student join/verify wizard matching the 4 steps; show DEV OTP clearly labelled.
- Teacher first-login PIN gate.
- Parent OTP sign-in.
- Shell nav per role (reuse Shell.tsx): Student Dashboard/My Class/Sessions/Homework/Ask AI/Progress; Teacher Dashboard/My Classes/Content/Sessions/Insights; Parent My Child/Progress/Updates; Admin Overview/Classes/Teachers/Students/Parents.
- Dashboards show real name, role, school, class from API — no hardcoded names.

## Seed (apps/api/src/db/demo.ts)
Keep existing demo school + DEMSTUDENT22. Add/ensure: 9-A/9-B, Physics Motion concepts with prereqs, Sharma Ma'am, Aarav strong, struggling+absent students, parent linked, Session 3 opens_at 18:00, 5-q quiz. Write credentials to scripts/DEMO_LOGINS.md (do not invent new password rules — use DEMO_PASSWORD/DEMO_PIN env).

## DoD (executor will verify)
- Admin login works; wrong password fails
- Full student flow: roll → code → OTP → PIN → session
- Roll alone grants nothing
- Teacher temp → PIN works
- Parent OTP shows only own children
- Session survives refresh; logout clears; cross-role blocked
- Profile switcher works
- 4 dashboards show real DB data
- Seed clean; demo users login

Changed files list only in reply. No typecheck/commit (executor does).
