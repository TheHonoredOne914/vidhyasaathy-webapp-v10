# VidhyaSaathy — Final Prompt File (All Pending Tasks)

> Paste these prompts one at a time into your AI builder (Cursor / Claude Code), in order.
> Each prompt is self-contained; attach the Product Master File when asked.
> Rule from the checklist: one phase at a time — verify its tick-list before moving to the next.
> Working rules that apply to EVERY prompt below: no mock data · server-side truth · honest-gap copy when a feature is deferred · zero new hardcoded colours · both languages the moment a string ships.

---

## PROMPT 1 — Fix the Next-Action routing (S1, do this first)

```
In apps/api/src/daily/service.ts the home payload emits hrefs that the React router does not have,
so the student home's Next-Action card and several cards dead-end on the AccessDenied page
(screenshot evidence: /student/concepts/:id → AccessDenied).

Fix at the SOURCE (API), not by adding catch-all routes:

1. Revision / study-plan / catch-up recap steps (daily/service.ts:273,333,508):
   emit "/student/chapters/<chapterId>/concepts/<conceptId>" instead of "/student/concepts/<id>".
   chapterId is already available in sessionFocus/radar context — thread it through.
2. Due homework (daily/service.ts:250,265,345): emit "/student/assignments/<id>"
   instead of "/student/homework/<id>".
3. Add three small student screens, wired to the existing API (no new endpoints needed):
   - /student/catchup  → renders GET /student/catchup cards (shame-free copy, ~20 min)
   - /student/warmup   → renders warm-up cards and CALLS POST /student/warmup/:id/complete
     when finished (that endpoint exists but no screen ever calls it)
   - /student/challenge and /student/dushman → render the daily challenge / dushman
     rounds through the existing PracticePlay component with the
     concept + skin query params APPLIED (see PROMPT 2 for the re-skin contract).
4. Update HomeDesk.tsx warm-up "start" to navigate to /student/warmup after
   POST warmup/start instead of window.location.assign.
5. Update AtomForgeVideo.tsx:139 "Back to games" to "/student?panel=games".

ACCEPTANCE:
- Every nextAction/goal/challenge href on /student/home opens a real screen.
- Warm-up can be started AND completed from the UI; evidence row appears.
- No AccessDenied reachable from any card on the student home.
```

## PROMPT 2 — Make the motivation loop real (dushman re-skin, challenge, warm-up UI)

```
Fix three half-wired motivation features (all API exists, UI is fake or missing):

1. DUSHMAN RE-SKIN (law: recognition must not masquerade as mastery):
   - PracticePlay.tsx must READ the ?concept= and ?skin=dushman query params.
   - When skin=dushman: restrict served items to that concept only, add the
     "Dushman" framing header, and after the round call the retirement check so
     L3 concepts leave the queue (also retire on queue read: daily/service.ts:669-705
     currently never re-checks — a mastered L4 concept still sits active).
2. DAILY CHALLENGE SCREEN: build the /student/challenge screen on the existing
   GET /student/daily-challenge + answer + finish endpoints (currently zero web
   consumers — playable only via curl). Show 5 questions / 5 min, confidence
   buttons REQUIRED per answer.
3. CHALLENGE EMPTY-POOL BRICK (daily/service.ts:583-601): if buildDailyChallenge
   returns 0 items, DO NOT persist the served row; backfill from the unfiltered
   seeded pool for that chapter (ignore band only for the fill-up).
4. SEED: add ~10 match_pairs items to the Motion chapter so Match-the-Concept
   is playable (currently 409 NO_PRACTICE — zero pairs in the bank).

ACCEPTANCE: challenge/dushman/warmup are fully playable from the student UI;
a dushman round only serves its concept; completing it can retire the entry;
no day can get bricked by an empty challenge.
```

## PROMPT 3 — Session windows + release honesty (server time is law)

```
Implement the 18:00–08:00 IST session window as product law (currently zero code):

1. In daily/service.ts (windowOpen candidates at :243,252,274,280,297) and
   learning-sessions.ts advance/check: enforce open/close with SERVER time
   (IST day math already exists in streak code). Sessions publishable by teacher
   open at releaseAt (default 18:00) and close 08:00 next morning.
2. Fix tonightSession (daily/service.ts:173): a session releasing LATER TODAY
   must NOT be advertised as open. Emit a distinct card state
   { kind: "locked", opensAt } with copy "Unlocks at 6 pm — your evening plan is ready."
3. learning-sessions.ts: when check-submit arrives with an empty answers array
   because slides are incomplete, return 403 CHECK_LOCKED (clearer) instead of
   400 VALIDATION_ERROR — validate slide completion BEFORE body parsing.
4. GET /student/home currently WRITES on every load (notification dispatch
   :371, frustration events :364-370). Move those writes behind explicit POST
   routes or idempotent guards; home must be read-only.

ACCEPTANCE: at 14:00 a released-at-18:00 session shows the locked card, not an
error; advance/check reject outside the window with a friendly server-time message;
/home causes zero DB writes across 10 refreshes.
```

## PROMPT 4 — Confidence buttons everywhere + board formats (assessment law)

```
Close two assessment-law gaps:

1. CONFIDENCE ON EVERY QUESTION:
   - Worksheet.tsx:65 (homework) must render the same ConfidenceChips used in
     PracticePlay and require a value before submit; remove the server's silent
     'unsure' default (assessment/service.ts:139) for notebook clients —
     missing confidence = 400 VALIDATION_ERROR.
   - games/engine/progress.ts:53-56 must pass confidence through for engine games.
2. BOARD-FORMAT TAGS: add format: enum['mcq','assertion_reason','case_based',
   'numerical','short_answer'] to SaveItemSchema + PublicItem
   (packages/contracts/src/content.ts); tag the Motion bank items; expose a
   format filter on GET /chapters/:id/items and add filter controls
   (concept/difficulty/format) to the teacher question bank UI.
3. LADDER TRANSITIONS APPEND-ONLY: add an append-only ladder_transition event
   (from_level, to_level, bridge text, at) written on every stepLadder change so
   teachers can replay "Aarav moved 25-50 → 50-75 on Motion, Tuesday".
4. Clamp difficulty tags to L1/L2/L3 (schema allows 1..5 today).

ACCEPTANCE: submitting homework without confidence fails with a friendly error;
board-format sets can be filtered in the teacher UI; ladder history is replayable
from the event log.
```

## PROMPT 5 — Teacher world completion (heatmap, reteach, suggested action, preview)

```
Complete the teacher world to Master File spec:

1. STUDENT × CONCEPT HEATMAP MATRIX: new endpoint
   GET /sections/:id/heatmap → rows=students, cols=chapter concepts, cells from
   answer_evidence aggregates with a three-colour scale (safe/unstable/critical).
   Drill: per-student confidence pattern + error families. (Today HeatMap.tsx
   renders per-concept cards only.)
2. ONE-TAP RETEACH THAT ACTUALLY PUSHES: POST /sections/:id/reteach must enqueue
   a bridge-path remediation assignment for the struggling subset ONLY (level ≤ 2
   on that concept), visible on those students' Next-Action. (Today it only
   records a decision row.)
3. MORNING DASHBOARD: add "last night's completion %" and derive the THREE
   reddest cells + ONE suggested action string from existing aggregates
   (contracts/dashboard.ts TeacherDashboardSchema: add fields; TeacherDesk.tsx
   renders them).
4. SESSION BUILDER STUDENT PREVIEW: a "Preview as Aarav" button in SessionForm
   that renders the REAL SessionPlayer read-only for a chosen student of the
   section (the rule: what Sharma sees is exactly what Aarav gets).
5. QUIZ AUTO-SELECTION: in AssignmentForm, auto-suggest N questions per concept
   by difficulty mix (L2 default, ladder-aware), still editable before publish.
6. SECTION SCOPING: chapter create must require a SECTION-scoped assignment
   (content/access.ts:22-28 checks class only today) and note publish must
   notify only the teacher's own sections (content.ts:154-161).

ACCEPTANCE: heatmap matches seed truth; reteach reaches only struggling students;
publish flow < 3 min with preview; Sharma cannot create/publish for section B.
```

## PROMPT 6 — Parent world completion (graphs, Ask This, printable report)

```
The parent API is ahead of the UI — finish the screens:

1. WEEKLY DASHBOARD: build /parent weekly view on the ORPHANED endpoint
   GET /parents/children/:id/home (returns weekMinutes, streakDays, gotIt,
   workingOn, comingUp — no screen consumes it today). Render: effort bars
   (minutes per night), mastery trend sparkline per subject, streak health,
   three-state exam readiness lamp.
2. "ASK THIS" CARD: grounded in one REAL event of that child (reuse
   latestResult/currentFocus): "Aarav fixed his acceleration graphs this week —
   ask him to show you how he reads one."
3. PRINTABLE ONE-PAGE REPORT: /parent/children/:id/report with print CSS +
   window.print() (the app already prints student sheets — same pattern),
   matching the teacher's truth (aggregates only).
4. Fix nav dead-ends: "Progress report" / "Homework" rows in the parent shell
   link to /parent itself — point them at the real routes.
5. Keep the privacy wall copy; never render chat/doubt/raw-answer data (it is
   already unreachable server-side — do not add any such fetch).

ACCEPTANCE: graphs MOVE from the child's real events after one evening session;
report prints on one page; no raw answers anywhere.
```

## PROMPT 7 — AI companion upgrade (band depth, languages, streaming)

```
Upgrade /ask from the honest stub toward the Master File's AI (keep every honest
behaviour — no fabrication, Socratic homework mode):

1. BAND DEPTH: read chapterBands (table exists, unused) for the asking student's
   concept and prepend a tone/depth directive to the provider prompt
   (Band-1 → analogy-first simple; Band-4 → formula-forward concise). With the
   LocalStubProvider, select quote variants accordingly (seed a simple AND a
   standard note variant per concept so this is demonstrable).
2. LANGUAGE: detect HI/Hinglish queries — strip Hindi/Hinglish stopwords
   (kya/hota/hai/batao/nahi/...) before term-scoring in ai/retrieval.ts so
   "polynomial kya hota hai?" no longer returns not_in_notes; answer in the
   question's language; add language to the log row.
3. SSE STREAMING when a configured provider is present (text/event-stream with
   the cloud's thinking state); keep deterministic JSON for the stub path.
4. Emit status:'not_configured' from /ask when the provider is missing AND notes
   cannot answer, so the existing gentle UI copy (ask.ts:4) becomes reachable.
5. Keep: 10/min rate limit, hint ladder, 24h purge, anonymised cluster counters,
   zero key exposure. Server-side only — nothing new in the client bundle.

ACCEPTANCE: same doubt → visibly different depth for two students in different
bands (side-by-side screenshots); Hinglish question answered in Hinglish;
streaming observed with a real key; all negative behaviours still honest.
```

## PROMPT 8 — Auth completion (forgot password, DOB, approvals, staff-ID)

```
Close the identity gaps vs the Master File (school-anchored identity):

1. FORGOT PASSWORD (all roles): request-reset (email → signed one-time token,
   30-min TTL) + confirm-reset endpoints; Recover.tsx wire-up replacing the
   "not available yet" copy. For students (no email): teacher-mediated PIN reset
   (teacher generates a reset claim for the roll number; student sets a new PIN
   via the existing set-pin path).
2. DOB IN STUDENT ACTIVATION: add dob to profiles + StudentLookupSchema
   verification step (roll + DOB must match; 3 wrong DOB = friendly lock with
   "ask your class teacher", no account lockout spiral).
3. PARENT-LINK APPROVALS: parent_link gets status (pending/active/revoked);
   parent-initiated link request (OTP → pending); admin approval queue UI +
   revoke endpoint (cuts access immediately, audit-logged). /parents/children
   returns only ACTIVE links.
4. STAFF-ID on teacher invites (InviteTeacherSchema + form field + audit line).
5. GLOBAL LOGOUT: POST /auth/logout?all=true deletes every session row for the
   user; Settings gets "Sign out everywhere".

ACCEPTANCE: each flow demoed end-to-end + one negative test each (wrong DOB ×3,
revoked parent cut off mid-session, reset token reuse rejected).
```

## PROMPT 9 — Admin world completion (approvals UI, matrix, demo reset)

```
1. STANDALONE PEOPLE PAGE (admin): students/staff/parents lists with activation
   state, beyond the Wizard steps.
2. APPROVALS page: parent-link queue from PROMPT 8 + audit entries.
3. PERMISSION MATRIX page: render Part 2.4 read-only with the privacy rows
   HARD-LOCKED (visual lock icon + tooltip "Privacy wall — no exceptions").
4. DEMO RESET: one command (npm run demo:reset) that wipes and re-seeds the demo
   school VERBATIM (same ids/logins via the existing DEMO_SCHOOL_ID scheme) and
   prints the canonical logins. Also purge QA residue: schools "QA Test Public
   School", "QA9 Security Probe School", notes "QA7 probe*", chapter "Intruder",
   announcement "QA4 test announcement", reteach decision 8efe8baa.
5. Clean the logout 400: POST /auth/logout with Content-Type json + empty body
   should 204 (accept empty JSON object).

ACCEPTANCE: reset run twice produces the same world; approvals + revocation
audit-logged; matrix matches Part 2.4 exactly.
```

## PROMPT 10 — Content surfaces completion (PDF, YouTube, variants)

```
1. CHAPTER ONE-PAGER PDF: server-side generator (pdfkit) from the chapter's
   lesson summaries + formulas + mini concept map + 2 classic exam patterns;
   GET /chapters/:id/summary.pdf (auth: own class); download button on the
   chapter desk; cache the file in the SW when saved offline.
2. CURATED YOUTUBE: render <iframe> embed with start/end when note.type==='youtube'
   in NotePage + ConceptLearn ("Watch the bit that matters" — currently a
   hardcoded empty state); POST /notes/:id/watched engagement event (logged as
   engagement, NEVER mastery); add type/startSec/endSec/reason inputs to the
   teacher note form; seed 2 real Motion YouTube notes with timestamps.
3. SCHOOL-NOTES VARIANTS: add variants JSON (simple/standard/concise) to notes;
   render per student band; "explain simpler" on school notes; key-term
   highlighting (<mark> on keyTerms) in both notes and lessons.
4. Fix checkpoint evidence overwrite: use append-only ids
   learn:{profile}:{itemId}:{ts} so retries keep history; make
   "Explain simpler" a two-way toggle.
5. RAPID REVISION: 2-minute flashcard sprint mode (existing decks + flip +
   self-rating endpoints) reachable from the chapter desk and as the
   revision-radar recommendation.

ACCEPTANCE: one-pager downloads and prints cleanly; a seeded video plays at its
trim range inline and logs one engagement row; Aarav and Priya see different
note variants for the same school note.
```

## PROMPT 11 — Games completion (Boss Level, Streak Challenge, Rapid Revision)

```
1. BOSS LEVEL: mixed exam-format boss round on the chapter bank, gated at ≥70%
   chapter mastery (negative test: below gate = locked card with friendly copy);
   defeat unlocks the next-chapter preview + Boss Buster badge candidacy.
2. STREAK CHALLENGE: bank XP or risk it — bounded downside, banked portion
   survives a wrong risk; uses the shared bank + confidence buttons.
3. Add "Rapid Revision" as the flashcard-sprint game door (reuses PROMPT 10.5).
4. Server-side round deadline for 60s games (rounds.ts accepts answers anytime
   today — client-only deadline is a cheat vector).
5. Evidence source per game ('game:mcq_rush', 'game:boss', ...) instead of the
   blanket 'game:practice'; flashcard decks seeded to 8-12 cards per concept.
6. Delete the fake rank chip in ArenaShell.tsx:68 ("WARRIOR LV 5 · 1180 XP" —
   dead code that violates the no-rank law and would bypass pages.test.ts).
7. School timezone column (default Asia/Kolkata) used by streak day-math
   instead of the hardcoded timezone.

ACCEPTANCE: five doors on the arcade (four engines + boss), boss gate proven
both ways, every round writes per-game evidence, no rank UI anywhere.
```

## PROMPT 12 — Hindi + PWA + data-saver (the India layer)

```
1. i18n LAYER: lightweight dictionary + useT() hook; locales en.ts/hi.ts; move
   EVERY student/parent-facing string through it (auth screens included).
   Zero missing keys enforced by a test (parity check en↔hi). Wire the existing
   language selects (SettingsPage.tsx:88, StudentSettings.tsx:78) to it;
   in-place switch preserving state; set <html lang> dynamically. Seed the full
   Motion student loop translated as the parity reference.
2. PWA OFFLINE READ: replace sw.js (caches 3 files) with a real app-shell
   precache (index.html + hashed assets via vite-plugin-pwa or manual manifest)
   + navigation fallback; "Save for offline" caches the current chapter's
   lesson payloads in IDB; airplane-mode read works on reload. Keep the
   existing attempt outbox untouched; add a 'syncedLate' flag when ack delay
   > 5 min (surface the tag to the teacher).
3. DATA-SAVER: settings toggle that swaps three.js game renders for the PDF
   summaries + text-first lesson mode (lazy-load @react-three only when
   data-saver is off).
4. beforeinstallprompt handler + install button in settings.
5. Token consolidation: move the 366 hardcoded hex values into tokens.css;
   single token system (--nb-*); Scholar-Indigo hero gradient ONLY on
   hero/auth surfaces; amber ONLY on achievement.

ACCEPTANCE: parity test green (0 missing keys); mid-session switch keeps quiz
state; airplane-mode chapter read works; Lighthouse mobile ≥80 perf / ≥90 a11y
on the low-end profile; no hex outside tokens.css (lint rule).
```

## PROMPT 13 — Deployment hardening (before anyone else gets the link)

```
1. trustProxy: set deliberately for the deployment topology (behind the preview
   proxy, IP-keyed rate limits currently form ONE global budget — self-DoS).
   Key rate limits by (proxy-forwarded IP, profileId when present).
2. Keep DEMO_LOOSE_AUTH env-gated (it is correctly double-gated today) — add a
   startup warning log when it is on.
3. Uniform 202 for /auth/parent/request-otp in production (no phone enumeration).
4. Regression test: student /assignments/:id payload must never contain
   answer/acceptedAnswers/pairs (currently enforced only by construction).
5. Write RUNBOOK.md: deploy, seed, reset, rotate keys, known limits, demo
   accounts pointer (apps/scripts/DEMO_LOGINS.md).
6. Set CLAIM_CODE_ENCRYPTION_KEY + (optional) OPENAI_API_KEY with spend cap in
   hosting env — never commit.

ACCEPTANCE: rate limits per-client behind the proxy; suite green incl. the new
payload test; runbook reviewed by someone who didn't write it.
```

---

## Suggested order (fastest demo value first)

| Wave | Prompts | Why first |
|---|---|---|
| 1 | 1, 2, 3 | The student home becomes fully clickable — demo stops embarrassing itself |
| 2 | 5, 6 | Teacher + parent worlds hit their Master-File promises |
| 3 | 4, 8, 9 | Law compliance + identity completeness |
| 4 | 7, 10, 11 | AI depth + content + games = the delight layer |
| 5 | 12, 13 | India layer + deploy hardening → launch-ready |

*Every prompt above traces to a finding in `VidhyaSaathy_Test_Report.md` — update that file's ticks as phases land, and never tick what you didn't see running.*
