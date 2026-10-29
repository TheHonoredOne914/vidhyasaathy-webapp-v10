# Task: Phase 0 — Evidence trail v2

Read AGENTS.md first. Spec context: docs/spec/master-file-gap.md ("Build plan" row Phase 0, items 10.1 #8, 10.3 #12, 10.8 #2-3). Find the matching sections in docs/spec/master-file.txt (search "confidence", "Error DNA", "evidence") only as needed.

Implement:
1. Schema + Drizzle migration (re-runnable on fresh DB, keep existing migrations intact): add to attempt (and learning_evidence where it makes sense) nullable columns: confidence ('sure'|'unsure'|'guess'), error_family (text, nullable; values from the spec's Error DNA families), source (text: 'session'|'quiz'|'homework'|'practice'|'game:<id>'|'flashcard'|'diagnostic'), level (int 1-4, nullable), format (mcq|match|short|flashcard|build, nullable), time_ms, hints_used. Items: add level (1-4), format, provenance ('teacher'|'ncert'|'ai_approved') — backfill existing rows sensibly.
2. Append-only evidence: teacher grading (/attempts/:id/grade) must no longer UPDATE attempt.correct in place; write a new grade event row (new table attempt_grade or similar) and have mastery/progress read the latest grade. Keep existing API response shapes working.
3. Contracts (packages/contracts): optional confidence, source, timeMs, hintsUsed on submit schemas (assignment submit, /practice/attempts, session check, game checkpoint). Server stores them. Clients that don't send them still work.
4. Shared UI: one ConfidenceButtons component (text-only chips "Sure / Not sure / Guessing", notebook styling, ≥44px targets, keyboard accessible). If Atom Forge already created apps/web/src/games/engine/ConfidenceChips.tsx, reuse/move it — do not make two components. Wire it into the practice player (PracticePlay) and the session check.
5. Tests: vitest covering migration on fresh DB, confidence persisted, grade-as-new-event (original attempt row unchanged), and that answer keys still never reach the student.
Reply with changed files only.
