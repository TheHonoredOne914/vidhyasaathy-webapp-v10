# CODEX P2: School setup (read plan/AGENT_RULES.md, plan/PHASES.md P2, plan/SPEC_SUMMARY.md)
Own only: packages/contracts/**, packages/core/**, apps/api/**.
1. Contracts first: AcademicYear, Class, Section, Subject, TeacherAssignment, ParentLink, Invitation, RosterImportRow/Result (per-row errors), ClaimCodeSheet DTOs.
2. Drizzle schema + migration: academic_year, class, section, subject, teacher_assignment, parent_link, invitation (hashed token, expiry, single use). All rows scoped by school_id.
3. Routes (admin unless noted, CSRF + requireRole): CRUD academic-years/classes/sections/subjects; POST /admin/invite-teacher; POST /auth/accept-invite (public, token); POST /admin/import-roster (CSV text -> creates student profiles + claim codes, returns per-row errors, no partial garbage: valid rows commit, invalid listed); POST /admin/link-parent; GET /admin/claim-codes?sectionId.
4. Authorization: teachers read only sections in their teacher_assignment; cross-school 404/403.
5. Also: add claim-issuance route used by roster import; set playwright trace to retain-on-failure is NOT yours (skip).
Tests (vitest): invite expiry/reuse, accept-invite creates teacher, bad CSV rows reported with row numbers, teacher sees only own class, cross-school isolation.
Do not run npm install/tests if sandbox blocks; just write code. No commits.
