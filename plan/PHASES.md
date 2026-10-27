# Build phases
Repo: /workspace/vidhyasaathy-webapp (npm workspaces, Windows/PowerShell friendly scripts, no bash-only commands).
Ownership by directory; never edit the other track's dirs.
- CODEX: apps/api/** (schema, migrations, routes, api tests), packages/contracts/**, packages/core/**, root workspace files (P1 step 0 only).
- CURSOR: apps/web/**, e2e/**.
Contract-first: each phase Codex lands packages/contracts changes first; Cursor consumes them. Contract changes requested by Cursor go via the orchestrator.
Every phase: `npm test` (vitest + playwright) green, meaningful commits.

## P1 Foundation, auth, roles (AUTH-01..07, ONB-04/05, SCH-02)
CODEX: root workspace + `npm run dev` (concurrently web+api) + `npm test`; contracts (Role, School, Profile, ClaimCode, auth DTOs, ApiError); Drizzle schema school, user, profile(role), claim_code, session, audit_log, rate_limit; routes POST /auth/register-school, /auth/login, /auth/claim, /auth/pin-login, /auth/logout, GET /me; argon2, httpOnly cookie sessions, CSRF check, rate limits, requireRole middleware; core/claim; api tests for cross-school isolation, expiry, lockout.
CURSOR: web scaffold, tokens, ui kit, routes + RoleGuard via GET /me, sign-in/claim/register/recover pages, 404, access-denied, privacy, meta/favicon/OG, landing moved in, PWA manifest; e2e.
Accept: admin registers -> admin home; student claims -> PIN login -> student home; student at /admin -> access-denied (UI) and 403 (API); axe clean; zero console errors.

## P2 School setup (SCH-01, 03..12, AUTH-02/03/05, ONB-01..03, TCH-03, TCH-11)
CODEX: academic_year, class, section, subject, teacher_assignment, parent_link, invitation; routes invite-teacher, accept-invite, import-roster (CSV -> claim codes, per-row errors), link-parent; teacher-only-assigned-class authorization + tests.
CURSOR: 8-step wizard, admin home, class/section/subject screens, roster import preview, printable claim-code sheet, onboarding screens; e2e.
Accept: wizard -> teacher invited -> accepts -> sees only own class; bad CSV rows reported.

## P3 Content and sessions (LES-01..06, LES-08, SES-01..05, TCH-04..06, STU-04/05, AI-03 data)
CODEX: chapter, concept, concept_prereq, note, session, slide, item tables; authenticated local file upload (type/size checks); publish + timed release; core/session (sequential unlock, completion after check) + tests.
CURSOR: lesson editor, upload, concept tagging, session builder, student chapters, notes viewer, session player; e2e.
Accept: student can't open before release or skip slides; completion only after check.

## P4 Homework, quizzes, attempts, sync (ASM-01..08, TCH-07/08, F14)
CODEX: assignment, attempt (unique client_event_id), student_concept_state; auto-marking; /sync pull with cursors; core/sync (outbox, backoff+jitter), core/mastery (recency-weighted, Leitner) + tests.
CURSOR: question bank, homework/quiz builder, assignments list, answering, review queue, IndexedDB outbox, offline banner + "updated at"; e2e.
Accept: offline answer -> reconnect -> exactly one attempt row; scores visible.

## P5 AI engine (AI-01,02,04,06,07,08,09,10,11,13,15,16,19,22; F5)
CODEX: LlmProvider interface + LocalStubProvider (labelled "AI not configured", never invents answers) + one real provider adapter behind env key; note_chunk FTS5 retrieval; /ask (hint-first, citation, refuses outside notes, cache, per-profile rate limit); draft job (teacher approval required); recursive CTE prereq gap; core/remediation + study plan.
CURSOR: Ask Saathy UI (hint ladder, Socratic toggle, citation link, clear "AI not configured" state), micro-remediation flow, concept map, today's plan/continue card, draft approval screen; e2e.
Accept: no-note question -> "not in your notes"; failed concept -> micro-lesson + 2-question check; drafts invisible until approved.

## P6 Dashboards and comms (TCH-01/02/09/10/12, ANA-01/02, PAR-01..04/06/08, STU-09/10/12, PRG-01/02, COM-01..03,05..07, SCH-14)
CODEX: aggregate tables refreshed by job; misconception counts; min-attempt confidence; notifications + quiet hours + delivery failure; parent summary; parent-own-child authorization; audit log.
CURSOR: teacher home/class detail, heat map (counts not names default), reteach decision, announcements, parent home/child view, progress, notification centre, settings; e2e.
Accept: views change after new attempt; parent A gets 403 for child B.

## P7 Hardening + NEXT if time (IND-04, IND-06, AUTH-09, F6, MOT-01..05, PRG-05)
CODEX: interleaving, core/games (GameModule on item schema), streaks on correct practice, demo seed ("Demo school"), README, backup script.
CURSOR: profile chooser, games UI, 768-1024 pass, Lighthouse/bundle budget, reduced-motion + anti-pattern audit.
Accept: full core loop across 4 roles on one chapter; Lighthouse a11y >= 95; no horizontal scroll at 360px.
