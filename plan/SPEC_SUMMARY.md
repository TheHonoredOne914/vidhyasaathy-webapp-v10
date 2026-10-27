# VidhyaSaathy web app: merged spec (compact)
Sources: TRD v1 (13 Oct 2026), Product Blueprint PDF (feature IDs), earlier backend user-flow Page, existing landing page (/workspace/vidhyasaathy-app).

## Core loop (TRD §1, must work end to end on ONE chapter)
Teacher publishes lesson -> student studies (sequential slides) and is checked -> system flags missed concept -> student gets targeted plan -> teacher sees class-level gap.

## Stack decision and conflicts
TRD FIXES Kotlin Multiplatform: Android Compose app, Compose Desktop teacher app, Ktor API, Postgres+pgvector, R2, FCM.
User asked for a WEB app. TRD itself allows this: §6 "browser teacher dashboard against the same API" fallback, R1 "TypeScript backend with shared JSON schema" fallback; PDF Decision 14 lists "React or Next.js with Supabase/PostgreSQL" (OPEN).
Decided by user: WEB APP ONLY (no Android/desktop), NO Supabase, fully local stack.
- Monorepo, npm workspaces, Windows/PowerShell dev. `npm run dev` starts web+api; `npm test` runs vitest + playwright.
- apps/web: Vite + React + TS strict + React Router + Tailwind custom tokens, Manrope, brand palette, PWA (service worker, IndexedDB outbox).
- apps/api: Node + Fastify + TS, SQLite via better-sqlite3 + Drizzle (migrations), zod validation, @fastify/rate-limit, argon2 for passwords/PINs, httpOnly SameSite cookie sessions (session table), role-based authorization enforced server-side in every route (replaces RLS). Files stored on local disk (uploads/) behind auth.
- packages/contracts: zod schemas + inferred types shared by web and api (Codex writes first).
- packages/core: pure logic (claim codes, session unlock, mastery, remediation, sync, games) with Vitest.
- Job queue: SQLite jobs table polled by the api process.
- AI (phase 5): provider-agnostic `LlmProvider` interface; default `LocalStubProvider` returns a clearly labelled "AI not configured" response, never fabricated answers. Retrieval via SQLite FTS5 first; embeddings optional per provider.
- Tests: Vitest (core, api via fastify.inject), Playwright e2e, axe.
- Offline: outbox for attempts with client_event_id (unique index -> idempotent).
Dropped: Kotlin/KMP, Ktor, Postgres/pgvector, R2, FCM, Supabase.

## Data model (TRD §8)
school, academic_year, class, section, subject, chapter, concept, concept_prereq, user/profile (role: admin|teacher|student|parent), claim_code, teacher_assignment, parent_link, note, note_chunk(FTS5), session, slide, item(type mcq|match_pairs|short_answer|flashcard, concept_id, difficulty, options, source_ref), assignment, attempt(client_event_id unique, profile_id, item_id, concept_id, correct, chosen_option, time_ms, client_ts, server_ts), student_concept_state(leitner box, next_review, attempts), doubt, notification, announcement, audit_log.

## Requirements in scope (CORE unless noted)
- Auth/onboarding: AUTH-01..07, SCH-01..12, SCH-14, ONB-01..05. Students CLAIM accounts via one-time code (TRD F1), PIN sign-in (AUTH-04). AUTH-08/09 NEXT.
- Student: STU-01..10, STU-12; LES-01..06, LES-08; SES-01..05 (one idea per slide, sequential unlock, complete only after check: TRD F3, PDF Decision 8 PROPOSED=quiz).
- Assessments: ASM-01..08.
- AI: AI-01,02,03,04,06,07,08,09,10,11,13,15,16,19, AI-22 (teacher-approved drafts). Remediation F5: failed concept -> micro-lesson + 2-question check; recursive prereq query finds earliest weak prereq.
- Teacher: TCH-01..12; ANA-01, ANA-02 (+ misconception counts per wrong option, min-attempt confidence indicator).
- Parent: PAR-01..04, PAR-06, PAR-08 (no access to AI chats).
- Comms: COM-01,02,03,05,06,07.
- NEXT (only if time, phase 7): F6 interleaving, MOT-01..05 games on item schema, PRG-05 streaks (correct practice only, F13), AI-12, ANA-06/07, F12 focus mode.
- Out: ADVANCED/FUTURE/UNDECIDED (AI-18, 21, 23-44, ANA-03/04/05/08), COM-08, CV, video classes, AR/VR, leaderboards. Show none as built.

## Hard rules from sources
Role isolation server-side in api middleware (parent: own child only; teacher: assigned classes only; URL tampering -> access-denied ONB-05). AI answers only from teacher notes, hint-first, cites source note, says "not in your notes" otherwise. No AI content to students without teacher approval. Metrics = concept pass rates, never time spent. "Never blank": cached data + "updated at". WCAG AA, large tap targets. Light pages (text/SVG first, video on tap). DPDP: minimal data, consent flow flagged for legal review.

## OPEN decisions (not guessed; defaults used are marked reversible)
1 prototype scope (default: single loop, one chapter) · 2 student verification (default: activation/claim code, TRD F1) · 3 who uploads roster (default: admin or class teacher CSV) · 4 min evidence before gap (config constant, default 3 attempts, flagged) · 6 doubt visibility named vs counts (default counts) · 7 parent AI access (default none) · 10 parent update frequency · 11 retention · 12 offline in v1 · 13 recording consent (LES-07 skipped) · 14 stack (resolved by user: local web stack) · 17 signature AI feature · 18/AI-44 tutor persona (use "Saathy") · 20 quiet-hours default · claim-code expiry · upload size limits · LLM provider · hosting region.
