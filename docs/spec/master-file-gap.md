# VidhyaSaathy v9: gap audit against the Product Master File

- **Audited:** laptop repo `C:\Users\HP\vidhyasaathy-webapp-v9`, HEAD f6aea03 plus untracked files. The source was copied to the box on 29 Oct 2026 (IST). The audit is read-only and no code was changed.
- **Stack mapping:** the spec assumes Supabase (RLS, RPCs, Edge Functions). Our app uses Fastify, SQLite and Drizzle, so each spec mechanism is judged by its equivalent:
  - "RLS" by the server-side `scope()`, `requireRole` and `chapterAccess` guards;
  - an "RPC" by a Fastify route.
- **Status key:**
  - **W** = Works.
  - **P** = Partial: the capability exists but falls short of the spec, or exists but has never been measured.
  - **M** = Missing.
  - **F** = Fake: UI only, with hard-coded or unpersisted data.
- **Evidence paths** are relative to the repo root.

## Summary counts

**170 items: Works 26 · Partial 78 · Missing 64 · Fake 2.** The detailed totals are at the end.

---

## 10.1 Backend & Database (16)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Full schema, 8 table groups | P | `apps/api/src/db/schema.ts` covers identity, school, content, assessment, AI, dashboard and notifications. There are no tables for game sessions, XP/badges, streak freezes, flashcard ratings, plans, diagnostics, bands, ladder or Dushman questions. |
| 2 | Concept prerequisite map seeded (Motion chain) | W | `apps/api/src/db/demo.ts` seeds `conceptPrereqs` as Distance → Speed → Acceleration. |
| 3 | RLS on every table | P | There is no DB-level RLS (SQLite). Access is enforced app-side by `school/access.ts` `scope()` and `auth/middleware.ts` `requireRole`, but no audit query exists. |
| 4 | Cross-role read rejected in logs | P | Wrong-role requests get 403 FORBIDDEN (`dashboard/views.ts` `forbidden()`), but the rejections are not logged to `audit_log`. |
| 5 | Answer keys never reach the student | W | `content/sessions.ts` `publicItem()` is used for students; `PublicItemSchema` carries no `answer` or `acceptedAnswers`. |
| 6 | Quiz scored server-side with per-question evidence | W | `assessment/service.ts` `markItem()` and `submitAttempt()` write one `attempt` row per item. |
| 7 | `touch_streak` idempotent | P | `core/streak.ts` derives the streak from attempts, so a double tap cannot double-count, and `clientEventId` dedupes. There is no stored streak or freeze state. |
| 8 | Evidence append-only; corrections are new events | P | `attempt` rows are unique by `clientEventId`, but teacher grading (`/attempts/:id/grade`) updates `correct` in place. `learning_evidence` holds only `correct` (no confidence, time or error type). |
| 9 | Storage private, signed URLs | P | `/notes/:id/file` is served through `noteAccess` auth checks from local disk. There are no signed URLs. |
| 10 | Demo seed in one command; reset restores it exactly | P | `npm run demo` seeds. `resetDemoLogins` only resets passwords; there is no full world reset. |
| 11 | Session open/close by server time | P | `releaseAt <= now()` is checked on the server, but sessions have no close time. |
| 12 | Migrations re-runnable on a fresh DB | W | `apps/api/drizzle` 0000–0010, plus `test/assessment-migration.test.ts`. |
| 13 | No secrets in repo | W | A grep for `sk-…` keys is clean; only `apps/api/.env.example` has a commented `OPENAI_API_KEY=`. |
| 14 | Hot-path indexes; student home under 300 ms | P | Indexes exist (e.g. `attempt_concept_profile_idx`). Home makes 5+ calls (`student/HomeDesk.tsx`) and has never been timed. |
| 15 | Audit log: imports, approvals, revocations, resets | P | `auth.audit()` covers imports, claims, AI drafts and reteach. There are no approval or revocation features to log. |
| 16 | Nightly aggregates job | P | `dashboard_job`, `class_concept_daily` and `misconception_daily` exist and feed insights. A nightly schedule is not proven. |

## 10.2 Auth & Onboarding (14)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Admin wizard: school → year → classes → sections → subjects | W | `/admin/setup` Wizard, plus `/auth/register-school`. |
| 2 | Teacher invite → link → password → shell | W | `routes/invitations.ts` `/admin/invite-teacher` and `/auth/accept-invite`, then teacher PIN setup. |
| 3 | Student activation: code + roll + DOB → password | P | `routes/auth-v9.ts` does roll → code → parent-phone OTP → PIN. There is no DOB step, and a PIN is used instead of a password (a sensible variant). |
| 4 | Wrong roll/DOB/expired code → friendly, no leak | P | Errors are generic ("could not find an activatable student record") and do not name which field was wrong. |
| 5 | Codes single-use and expiring | W | `claimCodes.redeemedAt` and `expiresAt` are checked in lookup and set-pin. |
| 6 | Parent link: OTP → pending → admin approval | M | The admin links the parent directly (`/admin/link-parent`). Parent OTP is login only; there is no pending state or queue. |
| 7 | Parent link revocation, audit-logged | M | `parent_link` has no delete or revoke route. |
| 8 | Forgot password by email, all roles | M | `apps/web/src/routes/Recover.tsx` says "Self-service password resets … are not available yet". |
| 9 | Refresh keeps role; logout kills session | W | The `session` table with cookie, `/me` and `/auth/logout`. |
| 10 | Role guard bounces wrong-role URLs | W | `App.tsx` `RoleGuard` plus `/<role>/*` → AccessDenied. |
| 11 | Auth screens bilingual EN/HI | M | There is no i18n layer anywhere (`grep i18n\|hi-IN` is empty). |
| 12 | First login greeted by the cloud companion; no empty states | P | `/student/welcome` (StudentWelcome) exists. The Saathy mascot is only inside the game engine. |
| 13 | CSV import: preview and per-row errors | W | `routes/roster.ts` validates the header and names each bad row while the good rows commit. |
| 14 | Activation-code slips per class | W | `/admin/claim-codes` ClaimSheet (printable). |

## 10.3 Student Experience (18)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Home in one call; Next-Action card is the anchor | P | `HomeDesk.tsx` calls `/study-plan`, `/progress`, `/practice/streak`, `/student/subjects` and each chapter list separately. |
| 2 | Next-Action order: unfinished > due > revision > new > games | P | `core/study-plan.ts` orders by due today > remediation > required > rest. It has no "unfinished first" rule and no games tier. |
| 3 | Diagnostic on first chapter open (5 questions) | P | `demo.ts` seeds "Session 3: Motion diagnostic" with 5 MCQs as an ordinary session. It is not offered automatically. |
| 4 | Diagnostic result routes content (Priya ≠ Aarav) | M | Nothing reads diagnostic results to branch content. |
| 5 | Session player resumes after app kill | W | `session_progress.viewedSlides` is held on the server (`routes/learning-sessions.ts` advance). |
| 6 | Concept notes formatted, plus Hindi | P | `NotePage.tsx` renders notes. There is no Hindi variant. |
| 7 | Checkpoints fire, score and explain inline | P | The session check is scored on the server but only at the end. Inline checkpoints exist only in the game engine (`games/engine/CheckpointPanel.tsx`). |
| 8 | "Explain simpler" swaps the note variant | M | There is one note body per concept and no variants. |
| 9 | Curated YouTube inline at the teacher's timestamps | M | The schema has `type: 'youtube'`, `startSec` and `endSec`, but the web app has no iframe or player. |
| 10 | Summary one-pager PDF | M | There is no summary entity or print route. |
| 11 | Flashcards flip; knew/almost/forgot logged | P | A `flashcard` item type exists (typed answer). There is no flip UI and no self-rating. |
| 12 | Confidence buttons on every question | M | `SubmitAttemptSchema` has no confidence field (`packages/contracts/src/assessment.ts`). |
| 13 | Quiz summary: "why wrong" plus a fix line per miss | P | A wrong answer routes to `/concepts/:id/remediation`. There is no per-miss explanation. |
| 14 | 60% completion rule; bridge path below it | M | `/sessions/:id/check` completes regardless of score. Remediation uses a 70% concept threshold (`core/remediation.ts`). |
| 15 | Mastery map with L1–L4 and friendly words | P | `ProgressPage` shows a per-concept % and evidence count. It has no L1–L4 levels and no "Almost there" style words. |
| 16 | No band labels, ranks or classmate scores | F | `games/arena/ArenaShell.tsx` header hard-codes the rank "WARRIOR · LV 5 · 1,180 XP · next LV 1500". |
| 17 | Shame-free Catch-up card for absent students (Rohan) | M | There is no absence detection and no Rohan seed. |
| 18 | Chapter history persists ("forgot acceleration?" reopens) | W | Attempts and evidence are never purged, and chapter and concept pages stay reachable. |

## 10.4 Teacher Experience (14)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Morning dashboard: completion, red cells, clusters, queue, one action | P | `dashboard/TeacherDesk.tsx` and `/dashboard/teacher` show completion, the review queue and per-chapter doubt counts. There are no red cells and no single recommended action. |
| 2 | Heatmap grid with safe/unstable/critical colours | P | `dashboard/HeatMap.tsx` is a per-concept list (class aggregate), not a student × concept grid. |
| 3 | Cell drill: confidence pattern plus error families | M | Neither confidence nor error type is captured. |
| 4 | One-tap reteach to the struggling subset only | P | `/sections/:id/reteach` stores a decision row and audit entry. It pushes nothing to students. |
| 5 | Session builder: suggested concepts; attach notes/video/summary | P | `SessionForm.tsx` lets a teacher pick concepts and a note per slide. There are no suggestions, video or summary. |
| 6 | Quiz auto-selection by concept and difficulty mix | M | `SaveAssignmentSchema.itemIds` is picked by hand. |
| 7 | Student preview uses the real player | M | There is no teacher preview route for sessions. |
| 8 | Publish in under 3 minutes | P | The publish flow exists (`/sessions/:id/publish` with `releaseAt`) but has not been timed. |
| 9 | Publish notification at the 18:00 opening | P | `releaseAt` scheduling works (the seed opens at 18:00). No notification is tied to the release time. |
| 10 | Question bank filters (concept/difficulty/format); provenance shown | P | Items carry `difficulty` 1–5 and `sourceRef`. There is no L-level, format or provenance tag, and filters are limited. |
| 11 | AI-drafted questions marked; approve/reject | P | `ai_draft_job` and `DraftReviewPage` approve/reject. With the default `LocalStubProvider`, no drafts are ever produced. |
| 12 | Grading queue: AI suggestion, accept/edit, comment, return | P | `ReviewQueuePage` and `/attempts/:id/grade` take correct true/false only. There is no AI suggestion and no comment. |
| 13 | Doubt clusters anonymised; opt-in named escalation | P | `doubtBatches` gives anonymous counts per chapter. Doubts are deleted after 24 h (`routes/ai.ts` cleanup) and there is no escalation. |
| 14 | Subject/section scoping (Sharma Ma'am) | W | `teacherAssignments` is checked in `assignmentFilter` and `sectionAccess`. |

## 10.5 Parent Experience (10)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Weekly graphs from the real trail | P | `ParentChild.tsx` shows real progress and assignments as text. There are no graphs. |
| 2 | Effort bars, mastery trend, streak, readiness lamp | M | None of these is in `/parents/children/:id/summary`. |
| 3 | Plain-language summary, updated weekly | P | `dashboard/views.ts` builds friendly sentences on demand. They are not weekly. |
| 4 | "Ask This" card grounded in a real event | M | Not present. |
| 5 | Privacy wall: no chats, doubts or raw answers | W | The parent summary returns aggregates only, and `/ask` and doubts are student-only. |
| 6 | Multi-child switch; only linked children visible | W | `/parent/children` and the `parentLinks` check (`views.ts:160`). |
| 7 | Notifications only for milestones/readiness | P | A generic `notification` system exists. It has no milestone-only rule. |
| 8 | Printable one-page report | M | Not present. |
| 9 | Weekly email digest (or triaged) | M | Not present. |
| 10 | Parent screens bilingual | M | No i18n. |

## 10.6 Admin Experience (10)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Wizard completes without docs (usability) | P | The wizard exists but has had no usability test. |
| 2 | CSV import: happy path plus one bad row | W | `routes/roster.ts`: named per-row error, and the valid rows commit. |
| 3 | Activation codes per class; export prints | W | `/admin/claim-codes` and ClaimSheet. |
| 4 | Parent-link approval queue; revoke cuts access | M | No queue and no revoke. |
| 5 | Permission matrix page matches Part 2.4 | M | No matrix page. |
| 6 | Privacy-wall rows hard-locked in the matrix | M | No matrix page. |
| 7 | Audit log: actor, time, target | W | `/audit-log` and `dashboard/AuditPage.tsx`. |
| 8 | Demo reset restores the world verbatim | P | Only `resetDemoLogins`. |
| 9 | Admin cannot read student AI chats | W | No admin route reads `doubts`; there are counts only. |
| 10 | Admin console nav limited to admin | W | Admin routes sit behind the admin RoleGuard (`App.tsx` 89–114). |

## 10.7 AI & Personalisation (16)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Full 11-step server sequence; keys never client-side | P | `routes/ai.ts` `/ask` runs about 8 steps: auth → scope → retrieve (FTS) → hint gate → cache → provider → verbatim-citation check → log. The key is server-only (`ai/provider.ts`). |
| 2 | Answers stream (SSE) with a thinking state | M | `/ask` returns one JSON object. |
| 3 | Same doubt, different depth (Priya vs Aarav) | M | No learner state goes into the prompt. |
| 4 | EN, HI and Hinglish answered in-language | M | Retrieval uses English FTS tokens, and no language handling exists. |
| 5 | Homework mode refuses direct answers (Socratic) | P | The `socratic` flag and 3 hint levels exist (`HINT_FIRST` gate). They are not forced on for homework. |
| 6 | Honest "I don't know" plus escalation | P | The `not_in_notes` reply says "Ask your teacher for help." There is no escalation action. |
| 7 | No fabricated citations | W | A quote must be a verbatim substring of a retrieved chunk, or the answer is rejected (`routes/ai.ts`). |
| 8 | Rate limit plus token budget | P | 10 requests per minute per profile, and `max_completion_tokens` 5000 per call. There is no daily or school budget. |
| 9 | SnapDoubt (photo → extract → confirm) | M | Not present. |
| 10 | Doubt clustering job ("17 on acceleration") | M | There are only per-chapter counts, and doubts are purged after 24 h. |
| 11 | Error DNA: 4 families drive 4 repair paths | M | No error-type capture. Remediation (`ai/remediation.ts`) has a single prerequisite-gap path. |
| 12 | Ladder 3-up/2-down with bridge text | M | Items have `difficulty` but nothing adapts it. |
| 13 | Band promotion logged and shown to the teacher | M | No bands. |
| 14 | Revision radar warm-up when decay is seeded | P | Leitner `nextReview` feeds `review` items in practice and the study plan (`core/interleaving.ts`). There is no warm-up surface. |
| 15 | Dushman queue: 3 weakest concepts, retires at L3 | M | Not present. |
| 16 | Study plan builds realistic nights and shrinks after a miss | P | `/study-plan` gives an ordered list with no time-boxed nights. |

## 10.8 Games & Motivation (12)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | All five spec games playable end to end | P | `core/games.ts` has `mcq_rush`, `match_the_concept` and `quick_revision_quiz` (close to Rapid Revision), plus timed and chapter modes. Streak Challenge and Boss Level are missing. The 10 arena or video games are separate. |
| 2 | Every game scores against concepts and writes evidence | P | `PracticePlay` posts `/practice/attempts`, which writes real attempts. Arena games send fake concept ids (`newton.arena.level-1`), which `engine/progress.ts` keeps "on this device only". **Atom Forge writes nothing.** |
| 3 | Confidence buttons inside games | M | Not present. |
| 4 | Ladder inside games | M | Not present. |
| 5 | Boss Level locked below 70% chapter mastery | M | No Boss game. |
| 6 | Boss defeat unlocks next-chapter preview and badge | M | Not present. |
| 7 | Streak from any learning act; freeze burns on a missed day | P | `core/streak.ts` counts correct attempts and session checks only. Its comment says "no grace days", and there are no freezes. |
| 8 | Freeze rules: 1 per 5 days, max 2 | M | Not present. |
| 9 | Daily 5-minute challenge | M | Not present. |
| 10 | Badges award on real trajectories | M | There is no badge table. Atom Forge XP is in-memory React state, and arena XP is hard-coded. |
| 11 | No leaderboard or classmate comparison | W | Grep shows none (the arena "rank" is self-only, but fake; see 10.3 #16). |
| 12 | Celebrations skippable; reduced motion in games | P | `engine/useReducedMotion.ts` is used by InteractiveVideo. Atom Forge's three.js Bloom/DoF scene has not been checked for reduced motion. |

## 10.9 Content & NCERT Data (12)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Motion chain: 3 concepts plus prerequisites | W | `demo.ts` motionConcepts and conceptPrereqs. |
| 2 | About 80 banked questions with 4 tags | P | Only 5 Motion MCQs. All are `difficulty: 1` with `sourceRef: null`, and none has an L-level or format tag. |
| 3 | Distractors map to real confusions | P | 2-option MCQs with weak distractors ("Temperature", "Mass"). |
| 4 | Notes: 3 concepts × 3 variants | P | `MOTION_NOTES` has 3 concepts × 1 variant. |
| 5 | 2–3 interactive checkpoints per concept, scored | P | A 5-question end check exists. Inline checkpoints live only in the games. |
| 6 | Motion summary one-pager; teacher-approved trail | M | Not present. |
| 7 | Flashcard decks: 8–12 × 3 concepts | M | None seeded. |
| 8 | Two curated videos with timestamps and reasons | M | None seeded. |
| 9 | Three archetypes per 8.4 | P | Aarav, Meera and Kabir are seeded with Class 6 fractions evidence. Priya and Rohan are not seeded and there is no Motion trail. |
| 10 | Doubt cluster history (17 / 9) | M | Not seeded, and it would be purged after 24 h anyway. |
| 11 | Badge/game/streak catalogs, bilingual | M | Not present. |
| 12 | Scope: NCERT 9–10 only | P | The demo also seeds Class 6 Mathematics Fractions. |

## 10.10 Design System & Polish (12)

Carren's design rules override several items here; see "Conflicts" below.

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Scholar Indigo tokens as the single source | P | Tokens exist, but they are our own cream/navy/gold theme (kept per Carren). Game CSS hard-codes colours (`games/*/…css`). |
| 2 | Hero gradient only on hero/auth | P | Not audited. The landing page is frozen per Carren. |
| 3 | Amber accent under 5% | P | Gold accent per our theme, not measured. |
| 4 | Loading/empty/error states on components | P | `ui/Skeleton` and `ui/ErrorState` exist. Game pages show bare "Loading game…" text. |
| 5 | Skeletons; no layout jump | P | Used on remote blocks, not everywhere. |
| 6 | Error plus retry with friendly copy | P | `ErrorState` and RemoteBlock exist. Coverage is not full. |
| 7 | 4-pt spacing grid | P | Tailwind scale, not audited. |
| 8 | Touch targets ≥ 44 px | P | Not audited. |
| 9 | Cloud mascot states wired | P | `games/engine/Saathy.tsx` has speech bubbles in games only. There is no 8-state cloud and none in chat. |
| 10 | No mascot animation during solving | P | Not verified. |
| 11 | Night variant (dark mode) | M | Zero `dark:` or `prefers-color-scheme` rules. |
| 12 | No lorem or placeholder text | F | The arena header shows fake "WARRIOR / LV 5 / 1,180 XP" to every student. |

## 10.11 Performance, PWA & India Layer (12)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Lighthouse mobile perf ≥ 80, a11y ≥ 90 | P | Routes are lazy-loaded (`App.tsx`). Never measured. |
| 2 | Usable on a 2-year-old Android over 3G | P | Never measured. Atom Forge loads three.js and postprocessing. |
| 3 | PWA installable; app shell cached | P | `public/manifest.webmanifest` and `sw.js` exist, but the service worker caches only 3 static files, not the app shell. |
| 4 | "Save for offline" for the current chapter | M | Not present. |
| 5 | Offline attempts to an outbox, synced on reconnect | P | `core/sync.ts` outbox with `/sync/attempts` for assignments. The games queue is in `engine/progress.ts`. Late-marking is not verified. |
| 6 | Data-saver mode | M | Not present. |
| 7 | Hindi parity check | M | No i18n. |
| 8 | Instant language switch | M | No i18n. |
| 9 | Hinglish in companion chat | M | Not present. |
| 10 | No giant images; lazy or compressed | P | Routes are lazy. `hero-scene.jpg` and the game assets have not been audited. |
| 11 | Battery and memory sane after 15 minutes | P | Not measured. Atom Forge Bloom plus DepthOfField is a risk on low-end phones. |
| 12 | Reduced motion honoured globally | P | Honoured in the games engine only. |

## 10.12 Testing & Acceptance (14)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Full-day acceptance script (11.2) run | M | Never run. |
| 2 | Three-archetype evening recorded | M | Missing archetypes. |
| 3 | Edge-case sweep (11.3) | M | Not done. |
| 4 | Both languages walked through | M | No Hindi. |
| 5 | Permission matrix negative tests | P | API tests and `e2e/phase*.spec.ts` cover role guards. There is no full matrix. |
| 6 | Double-submit and flaky-network consistency | W | `clientEventId` idempotency and `EVENT_CONFLICT` (`assessment/service.ts`, `test/assessments.test.ts`). |
| 7 | Streak idempotency across the IST midnight edge | P | `packages/core` streak is IST-based with unit tests. There is no freeze edge. |
| 8 | AI adversarial probes | P | `apps/api/test/ai.test.ts` covers ungrounded-citation rejection. There has been no 20-probe run. |
| 9 | Regression of Days 1–3 demos | P | `e2e/phase1..7.spec.ts` and `v9-interim.spec.ts` exist. Current pass status is not run here. |
| 10 | Fix rounds 1 and 2 closed | M | Not tracked. |
| 11 | Fresh-eyes walkthrough | M | Not done. |
| 12 | All of Part 10 ticked honestly | P | This document is the first honest pass. |
| 13 | Demo reset verified after final fixes | M | No full reset. |
| 14 | Part 1.5 sentence shown on a real phone | M | Not done. |

## 10.13 Launch & Demo Readiness (10)

| # | Item | Status | Evidence |
|---|---|---|---|
| 1 | Deployed HTTPS URL; env vars in hosting | M | Localhost only (`vite.config.ts` binds 127.0.0.1). |
| 2 | PDF metadata plus analytics and error reporting | M | Not present. |
| 3 | Runbook: deploy, reset, seed, rotate keys | P | `README.md` and `AGENTS.md` cover the local demo only. |
| 4 | Demo rehearsed on the deployed world | M | No deployment. |
| 5 | Demo accounts in one secure place | P | They are in the README and seed output, which is not a secure place. |
| 6 | Fallback offline demo plan | M | Not present. |
| 7 | AI spend cap plus rate limits | P | The rate limit is 10 per minute. There is no spend cap. |
| 8 | Post-launch backlog written | M | Not present. |
| 9 | Triage table known or printed | M | Not present. |
| 10 | Someone celebrated | M | Not done yet. |

---

## Top 10 gaps (plain words)

1. **Thin evidence.** Each answer saves only right or wrong and the time. There is no confidence ("sure / unsure"), no mistake type and no game source. Most of the spec's intelligence (Error DNA, the drill view, bands, the ladder) depends on these fields.
2. **No adaptive engine.** There are no L1–L4 levels, no 3-up/2-down ladder, no bands, and no diagnostic that changes what a child sees. Every child gets the same path.
3. **Games don't count.** Atom Forge saves nothing. The other 9 arena games save to the browser only, under made-up concept ids. Only the simple practice quizzes write real evidence.
4. **Spec games incomplete.** There is no Streak Challenge or Boss Level (and so no 70% gate), and no confidence buttons or difficulty ladder inside any game.
5. **Motivation layer missing.** There are no streak freezes, badges, daily 5-minute challenge or Dushman (weak-concept) questions. The fake "WARRIOR LV 5 / 1,180 XP" header breaks the spec's no-ranks rule.
6. **Not enough content.** There are 5 Motion questions instead of about 80, one note version per concept instead of three, and no flashcards, summary PDF or videos. The seeded archetypes are wrong (Class 6 fractions, no Priya or Rohan).
7. **Parent linking and recovery.** There is no OTP → pending → admin-approval flow, no revoke, no forgot-password, and no permission-matrix page.
8. **Teacher views are shallow.** The heatmap is a concept list, not a student × concept grid. Reteach only records a note, and nothing reaches students. There is no quiz auto-pick, no student preview, and no AI marks or comments in grading. Doubt clusters are wiped after 24 h.
9. **AI companion basics.** There is no streaming, no personalisation by level, no Hindi or Hinglish, no SnapDoubt and no token budget. The AI stays off unless an OpenAI key is set, so AI drafts never appear in the demo.
10. **India and launch layer.** There is no Hindi or i18n at all, no offline chapter, no data-saver and no dark mode. The service worker caches 3 files, and the app is not deployed or measured.

## What already works well (keep and build on it)

- Server-side marking with answer keys stripped from student responses.
- Idempotent attempts and an offline outbox.
- Grounded AI that refuses fabricated citations and has hint levels and a Socratic flag.
- Per-row CSV import, printable claim slips and the audit log.
- Teacher subject/section scoping and the parent privacy wall.
- Session resume, prerequisite remediation and the IST streak.

---

## Build plan (spec order: evidence trail and engine first)

Effort is for one focused developer with AI help (d = day).

| Phase | Scope | Effort |
|---|---|---|
| **0 · Evidence trail v2** | **Schema:** add `confidence` (sure/unsure/guess), `errorFamily`, `source` (session/quiz/homework/game:<id>/flashcard/diagnostic), `level` and `format` to attempt and evidence. Make it append-only: grading becomes a new `grade` event, not an update. Add `provenance` and `L` tags to items.<br>**API and UI:** add an optional `confidence` field to the submit schemas and a single `ConfidenceButtons` component. | 2 d |
| **1 · Learning engine** | **Levels:** L1–L4 per concept from mastery plus difficulty. Bands 0–25 / 25–50 / 50–75 / 75–100, stored server-side and never shown to students; band-change events go to the teacher. Friendly words in the UI.<br>**Ladder service:** start at L2, +1 after 3 correct, −1 after 2 wrong, with bridge text.<br>**Diagnostic:** 5 questions on first chapter open, routing the entry level.<br>**Next Action:** reorder to unfinished > due > revision > new > games.<br>**60% rule:** enforce it on the session check, with a bridge path below it. | 4 d |
| **2 · Content seed (Motion)** | **Questions and errors:** about 80 tagged questions with real distractors, each mapped to an Error DNA family. Error DNA classifier with 4 repair paths.<br>**Study material:** 3 note variants plus "Explain simpler"; 8–12 flashcards × 3 concepts with flip and knew/almost/forgot; summary one-pager (print CSS); 2 YouTube clips with timestamp embed.<br>**Demo world:** Priya, Aarav and Rohan archetypes; a doubt cluster of 17/9; drop or hide Class 6 fractions; a full `demo:reset` script. | 4 d |
| **3 · Games v2 (see below)** | **Shared engine:** a server game engine on the concept bank covering MCQ Rush, Match-the-Concept, Rapid Revision, Streak Challenge and Boss Level, with a 70% gate.<br>**Evidence:** wire Atom Forge and the arena games into evidence.<br>**Motivation:** XP, badges, streak with freezes, the daily 5-minute challenge and the Dushman queue. Remove the fake rank header. | 5 d |
| **4 · Teacher & parent worlds** | **Teacher:** a student × concept heatmap with safe/unstable/critical, and a cell drill showing confidence and error families. Reteach pushes a repair session to a subset. Quiz auto-pick by concept and difficulty, a student preview, AI-suggested marks plus a comment in grading, and doubt clusters kept for 14 days with opt-in escalation.<br>**Parent:** graphs (effort, mastery trend, streak, readiness lamp), "Ask This", a printable report and milestone-only notifications. | 5 d |
| **5 · Auth & admin gaps** | Parent OTP → pending → admin approve/revoke (audit-logged), forgot password (email via dev outbox), a permission-matrix page with locked privacy rows, and an optional DOB check at activation. | 2.5 d |
| **6 · AI companion** | SSE streaming with a thinking state, a learner-level-aware prompt, forced Socratic mode in homework, an escalation button, a daily token budget per student/school, and SnapDoubt (or triage it per 9.4). | 3 d |
| **7 · India layer & PWA** | i18n (EN/HI) with a key-parity test. App-shell service worker, "Save chapter offline" and a data-saver toggle. A global reduced-motion setting. Lighthouse pass. Dark mode is optional (see conflicts). | 4 d |
| **8 · Acceptance & launch** | Run the 11.2 day script and the 11.3 edge sweep, deploy over HTTPS, write the runbook, set the AI spend cap and rehearse the demo. | 3 d |

**Total: about 32 developer-days.** Phases 0–3 (about 15 d) give Carren the "app working properly" core: real evidence, adaptive levels, content, and games that count.

---

## Games section

### What exists now

**A. Practice modes** (`packages/core/games.ts`, `apps/web/src/practice/*`)
- The modes are `quick_revision_quiz`, `timed_concept_challenge`, `mcq_rush`, `match_the_concept` and `chapter_progress_challenge`.
- They use the real item bank (`/chapters/:id/practice`), are server-marked, and write `attempt` rows, so mastery and streak update.
- This is the only game path that produces real evidence.

**B. Interactive "arena/video" games** (`apps/web/src/games/*`, route `/student/chapters/:chapterId/practice/engine/:gameId`)
- There are 10 games plus a demo: atom, cell, matter, motion, newton, graphs, float, sound, energy and poly. All are visual only and none uses audio (grep confirms; "sound" is an SVG wave simulator).
- Arena games call `recordCheckpointResult` with made-up concept ids (e.g. `newton.arena.level-2`). These have no item mapping, so `engine/progress.ts` keeps them "on this device only".
- The header XP and rank are hard-coded.

**C. Atom Forge** (`games/atom/AtomForgeVideo.tsx` 379 lines, `AtomForgeScene.tsx` 871 lines)
- `InteractiveVideo.tsx:20` short-circuits `game.id === 'atom'` to `<AtomForgeVideo />` with **no props**.
- It is a five-episode three.js "interactive video": zoom → nucleus → shells K/L → sodium M → Na→Cl bond.
- **No persistence:**
  - XP is `useState` and is lost on reload;
  - nothing calls `recordCheckpointResult`;
  - there is no concept id mapping, although `atomGame.conceptIds` lists 4 string ids that are not concept UUIDs.
- **Free passes:** the "Snap to K", "Snap to M" and "Transfer to Cl" assist buttons call `succeed()` directly.

### What the five spec games need (shared foundation)

1. **One concept-tagged bank.** Every item has concept UUID, L-level (1–4), format (mcq/match/short/flashcard) and provenance (teacher/NCERT/AI-approved). All games draw from it via `/chapters/:id/practice?gameId=`.
2. **Confidence buttons.** "Sure / Not sure / Guessing" appear before or with each answer and go into `attempt.confidence`. They are text buttons only, with no sound.
3. **Ladder.** Start at L2, move up after 3 correct and down after 2 wrong, with bridge text on a drop ("Let's warm up with a simpler one"). It is server-side, so it is the same in games and quizzes.
4. **Evidence.** Every answer posts `/practice/attempts` with `source: game:<id>`, `confidence`, `timeMs` and `level`.
5. **XP and streak hooks.** XP comes from the server per evidence event, never from client state. Any learning act touches the streak, freezes are earned at 1 per 5 days (max 2), and badges are evaluated server-side on trajectories.
6. **Per-game rules:**
   - **MCQ Rush:** exists. Add the ladder and confidence.
   - **Match-the-Concept:** exists. Add confidence per round and evidence per pair-set.
   - **Rapid Revision:** rename or extend `quick_revision_quiz` to pull only Leitner-due and decayed concepts, so it serves the daily 5-minute challenge.
   - **Streak Challenge (new):** a run of consecutive correct answers. The best run is stored, with no leaderboard.
   - **Boss Level (new):** a mixed L3/L4 chapter test. It is locked while chapter mastery is under 70% (server check plus a negative test), and a win unlocks the next-chapter preview and makes the child a badge candidate.

### Atom Forge refinements (concrete)

| # | Change | Where | Effort |
|---|---|---|---|
| 1 | Accept `chapterId` and an `onCheckpoint` prop. Have `InteractiveVideo.tsx:20` pass `game` and the route params instead of `<AtomForgeVideo />`. | `engine/InteractiveVideo.tsx`, `atom/AtomForgeVideo.tsx` | 0.5 d |
| 2 | Map the 5 episodes to real concept UUIDs. Seed a Class 9 Ch 4 "Structure of the Atom" chapter with 4 concepts (charged particles, shells, atomic/mass numbers, isotopes/isobars) plus one published item per act, so `checkpoint.practice.itemId` exists. | `db/demo.ts`, `atom/index.tsx` `conceptIds` | 1 d |
| 3 | In `succeed()` and `fail()`, call `recordCheckpointResult()` with the real item id, `timeMs`, `hintUsed` and `attempts`. This writes server evidence and updates mastery and streak through the existing outbox. | `AtomForgeVideo.tsx` (around lines 215–245) | 0.5 d |
| 4 | When a student uses a "Snap to K/M/Cl" assist, save it as `hintUsed: true` evidence instead of counting it as a full pass. Credit mastery only after one unassisted retry. | `AtomForgeVideo.tsx` assist buttons (lines 330–350) | 0.25 d |
| 5 | Add a confidence prompt ("Sure / Not sure / Guessing", text chips) at each act before the result is revealed. | New shared `games/engine/ConfidenceChips.tsx` | 0.5 d |
| 6 | Replace local `xp` state with server XP and streak returned from the evidence post. Show "Day N streak" and freeze count as text. Remove the fake arena rank header across all arena games. | `AtomForgeVideo.tsx`, `arena/ArenaShell.tsx:68` | 0.5 d |
| 7 | Add an end-of-forge recap: 3 bank questions (MCQ/match) on the atom concepts, using the ladder. Below 70% it offers "Watch episode N again" instead of a fail screen. | Reuse `engine/RecapQuestions.tsx` | 0.5 d |
| 8 | Respect reduced motion. Disable Bloom, DepthOfField and Sparkles, and use a low-poly path when `useReducedMotion()` is set or on low memory (`navigator.deviceMemory <= 2`). | `AtomForgeScene.tsx` EffectComposer | 0.5 d |
| 9 | Keep it silent: no audio. All feedback stays as on-screen captions and branch text, as now. | n/a (verify in review) | 0 |
| 10 | Keep the Patrick Hand handwritten headings and cream/navy/gold palette so it matches the notebook workspace. | `atom-forge-video.css` | 0 |

Apply items 1–3 and 6 to the other 9 arena games too. Each arena level needs one real item mapping instead of `${game.id}.arena.level-N`. About 1.5 d for all of them.

---

## Spec items that conflict with Carren's rules (recommend keeping Carren's rules)

| Spec item | Carren's rule | Recommendation |
|---|---|---|
| 10.10 #1–3 "Scholar Indigo" tokens, hero gradient, amber under 5% | The landing page, themes and colours stay unchanged (cream/navy/gold). | **Keep ours.** Treat the item as "one token source" for *our* palette, and only remove hard-coded colours in game CSS. |
| 10.10 #11 Night/dark variant | Notebook workspace look (cream paper, ruled lines). | **Skip, or offer later as an opt-in "evening paper" tint.** Do not change the default. |
| Any audio, sound effects or celebration sounds in games (Part 6 G / celebrations) | No sound anywhere in games; visual text only. | **No audio.** Celebrations stay as text and visual only and can be skipped. The "Echo Corridor" sound game stays an SVG simulation. |
| Cloud companion with 8 animated states (Part 5) | Notebook design stays. | Use the existing Saathy mascot style inside the notebook frame with *text* state labels. No redesign of the workspace or side rails. |
| Landing/auth "hero gradient surfaces" (10.10 #2) | The landing page is untouched. | Do not touch the landing page. Apply hero styling to new auth screens only if it already matches. |
| Student activation by "password" (10.2 #3) | (Not a rule, but the current PIN flow works.) | Keep PIN plus parent-OTP. Add DOB as an extra check if the school wants it. |

---

## Totals

**170 checklist items: Works 26 · Partial 78 · Missing 64 · Fake (UI only) 2**

Groups audited: 10.1 (16), 10.2 (14), 10.3 (18), 10.4 (14), 10.5 (10), 10.6 (10), 10.7 (16), 10.8 (12), 10.9 (12), 10.10 (12), 10.11 (12), 10.12 (14), 10.13 (10). "Partial" includes items that exist but have never been measured (performance, usability).
