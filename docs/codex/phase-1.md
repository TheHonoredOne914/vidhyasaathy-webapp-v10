# Task: Phase 1 — Learning engine

Read AGENTS.md first. Spec context: docs/spec/master-file-gap.md "Build plan" Phase 1 and items 10.3 #2-4, #14-15, 10.7 #12-13. Search docs/spec/master-file.txt for "ladder", "band", "diagnostic", "Next Action", "60%" for the exact rules.

Implement server-side (packages/core for pure logic with unit tests, apps/api for routes/storage):
1. Levels L1–L4 per concept per student, computed from evidence (mastery + item difficulty/level). Friendly words for students (e.g. "Getting started", "Building", "Almost there", "Strong") — never show the number band.
2. Bands 0–25/25–50/50–75/75–100 stored server-side per student per chapter; band-change events recorded and visible ONLY on teacher endpoints/views (add to teacher dashboard data). Student API responses must not include band.
3. Ladder service: start at L2, +1 after 3 correct in a row, −1 after 2 wrong in a row, bounded 1–4, with bridge text on a drop ("Let's warm up with a simpler one"). State stored server-side per student per concept; exposed via the practice next-question endpoint so games and quizzes share it.
4. Diagnostic: on a student's first open of a chapter that has a diagnostic set, offer a 5-question diagnostic (seeded for Motion; convert the existing "Session 3: Motion diagnostic" into a real diagnostic). The result sets the entry ladder level per concept and routes what the student sees first (strong student → skips ahead; weak → starts with prerequisite/basics). Writes evidence with source 'diagnostic'.
5. Next Action ordering in core/study-plan.ts: unfinished > due > revision > new > games. Unit tests.
6. 60% rule on session check: below 60% the session is not marked complete and the student gets a bridge path (remediation on the missed concepts, then retry). Server-enforced + test.
7. Student UI: show friendly level words on progress / subject path (match docs/mockups/progress-v1 and subject-path-v1 look); diagnostic screen in notebook style; bridge text visible in practice.
Tests for ladder, bands hidden from student responses, diagnostic routing, 60% rule. Reply with changed files only.
