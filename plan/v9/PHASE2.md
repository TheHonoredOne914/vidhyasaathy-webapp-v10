# PHASE 2 — Admin world: school setup, classes, enrolment
Read plan/v9/HARD_RULES.md + DECISIONS.md. Do not break Phase 1. No landing/theme changes.

## Goal
Admin fully sets up school: wizard, CSV enrolment + activation codes + distribution sheet, mid-year add, curriculum edit, dashboard counts, parent linking.

## Backend
1. Onboarding wizard API: progressive save (school profile board/city, academic year, classes/sections, subjects, teacher assigns, CSV). Resume from last step.
2. CSV enrol: validate per-row (dup roll, missing phone, bad phone) → transaction: all-or-nothing OR clear per-row errors with nothing half-imported for invalid batch (prefer: valid rows commit only if --strict false; default strict: reject whole file if any row invalid, return row errors).
3. Generate one-time activation codes (existing claim_code hash style /^[2-9A-HJKMNP-Z]{12}$/), distribution sheet endpoint (CSV/JSON download: name, roll, code plaintext once).
4. Single student add mid-year same code flow.
5. Board template: CBSE Class 9 Physics Motion skeleton chapters/concepts if empty; CRUD reorder chapters/concepts.
6. Admin dashboard aggregates: class counts, activated vs pending, parent-link status — structure only, no marks.

## Frontend
- Wizard UI 8 steps, resumable, uses existing admin Wizard if present — make each step save for real.
- CSV upload with error report table; download codes sheet.
- Mid-year add form.
- Curriculum editor for chapters/concepts.
- Admin home real counts.

## DoD
- Wizard E2E + resume
- CSV valid creates students; invalid → per-row errors; no half-import on strict
- Each student one-time code; sheet downloads
- Sheet student completes Phase 1 verify → right class
- Mid-year add works
- Chapter/concept edit persists
- Dashboard counts match DB
- Parent with 2 children sees both
- Phase 1 auth still works

Reply changed files only.
