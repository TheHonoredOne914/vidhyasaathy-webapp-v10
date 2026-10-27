# AUDIT — VidhyaSaathy repo (v9 baseline = commit 009c44e "v8: demo backend, alive shell, signin panel")

## Stack (KEEP — do not migrate)
- Monorepo npm workspaces
- apps/web: Vite + React + TypeScript
- apps/api: Fastify + better-sqlite3 + Drizzle
- packages/contracts, packages/core
- Tests: vitest (+ Playwright e2e)
- Demo: `npm run demo` → API :3001, web :5173
- Brand (KEEP): Patrick Hand; #041D3D #193E69 #28517C #517DAB #F9F6EE #D6E2E6

## Schema already present (apps/api/src/db/schema.ts + drizzle/0000–0007)
school, user, profile, claim_code, session, audit_log, rate_limit,
academic_year, class, section, subject, teacher_assignment, parent_link, invitation,
chapter, concept, concept_prereq, note, note_concept, learning_session, slide, item,
session_progress, assignment, assignment_item, attempt, student_concept_state,
sync_change, note_chunk, ai_cache, doubt, ai_draft_job, learning_evidence,
remediation_check, dashboard_job, class_concept_daily, misconception_daily,
reteach_decision, announcement, notification_setting, notification

## Routes / screens that exist
Landing, SignIn, PinSignIn, Claim, RegisterSchool, Recover, Onboarding, AcceptInvite,
Shell + RoleHome for admin/teacher/student/parent, admin wizard/classes/sections/subjects/claim sheet,
teacher home/insights/announcements, content chapter/concept/note/session form+player,
games arenas, AI chat surfaces.

## What is real vs hollow (v8 assessment)
- REAL: SQLite DB, migrations, seed/demo school, password/PIN claim flows, many API routes, role shells.
- GAPS vs phases 1–5 spec:
  - Student flow missing: school+roll → code → **OTP to parent phone** → PIN (current claim is code→PIN without OTP layer).
  - Parent phone-OTP login incomplete / thin.
  - Teacher temp-password → forced first-login PIN may be partial.
  - Admin CSV enrolment + distribution sheet may exist but needs DoD verification.
  - Session player sequential unlock + quiz-mandatory completion needs hardening.
  - Pakka Meter (confidence), why-wrong deep-links, short-answer review queue, attempt timing fields may be incomplete.
  - UI still feels slide-like in places: need denser shell, 4 states, no dead buttons.
  - Known: render loop "Maximum update depth exceeded" in 4 games.

## Design assets to KEEP
- apps/web/src/landing/** (locked)
- apps/web/src/theme/**, brand.css, vs-theme.css
- Games Atom Forge / Bio Quest style under apps/web/src/games
- AI chat UI under apps/web/src/ai

## v9 approach
Additive migrations 0008+, extend auth/content/assessment services, wire real UI flows,
seed archetypes (Aarav/struggling/absent/Sharma), i18n en+hi for new strings.
Stop after phase 5 DoD.
