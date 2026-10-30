# Phase 5: Teacher, parent, admin, privacy wall and release readiness

Read AGENTS.md first, especially "Carren's hard rules". Then read docs/spec/learning-flow.md, docs/spec/master-file-gap.md (Build plan step 10; checklists 10.4 #1-4, #13, 10.5 #1-10, 10.6 #4-6, #8, 10.10 #9 and 10.12 all) and docs/codex/progress.md, which tells you what Phases 1-4 actually shipped. In docs/spec/master-file.txt, read 2.3, 2.4, 4.1, 4.5, 4.6 (Rohan "recovered"), Part 6 H (VS-60..63, VS-10), I (VS-73..75), J (VS-79..87), Flows 1, 5 and 6, Part 10, and 11.1-11.4.
The only mockup is docs/mockups/privacy-v1-1440/360.png. **No teacher, parent or admin mockups exist.** Build those screens with the same notebook workspace tokens and layout primitives as the student screens: ruled paper, red margin, Caveat headings, cream/navy/gold, a left rail plus a main area plus a right rail on desktop. Do not invent a new visual language.

> **Pre-flight (every run).** Grep for the real names:
> - `rg -n "forbidden\(|requireRole|scope\(|chapterAccess" apps/api/src`
> - `rg -n "reteach|class_concept_daily|misconception_daily|doubt_cluster|recovery_completed|frustration_flagged" apps packages`
> - `rg -n "parent_link|audit_log" apps/api/src/db/schema.ts`
>
> Phases 3-4 produce `learning_event`, `doubt_cluster_counter`, `doubt_escalation`, `followup_item`, `streak_*` and `badge_award`. Use the names they actually shipped with.

## Goal
"Helps the teacher tomorrow and the parent on Sunday" (12.4). The teacher goes from the class picture to one child's evidence in three taps, and pushes a reteach that really lands in exactly the struggling students' evenings. The parent sees honest graphs over time and one real conversation starter. The admin can run the school's people and links safely. The privacy wall is proven by tests. The whole thing passes a readiness sweep with a full screenshot set.

## Hard rules (Carren)
- **Data and assets:**
  - Keep data: additive migrations only, and back up `apps/api/data/*.db` before migrating.
  - No new games. Do not touch `apps/web/src/games/atom*`.
  - Landing page, themes and colours stay unchanged. No dark mode: the Master File's 10.10 "night variant" item is explicitly **not** built and is marked N/A in the readiness doc.
- **Content shown to students:**
  - No sound, audio or voice.
  - No bands, ranks, leaderboards or numeric levels shown to students.
  - Bands are teacher-only (4.1) and appear as words, e.g. "Needs foundation support" (4.5).
  - Never put "rank" or classmate comparison on parent screens either (12.1).
  - Notebook vibe. Line-art cloud. No emoji.
- **Scoring and data handling:**
  - Scoring is server-side.
  - Every answer writes evidence.
  - Answer keys never go to the client.
  - Real NCERT content only.
- **Demo logins:**
  - Teacher: teacher@demo.invalid / Saathy@2026!, PIN 1357.
  - Aarav PIN: 2468.
  - Parents of Aarav, Priya and Rohan are seeded and approved (8.4).
- **Engineering:**
  - Node >= 24.
  - `npm run typecheck` and `npm run test:unit` must be green.
  - Make small commits.
  - Append to progress.md.

## Archetype user stories
**Teacher: Sharma Ma'am, Physics 9-A and 9-B**
- **07:40, morning dashboard** (Flow 5, VS-60). It shows:
  - Completion "9-A: 34/38".
  - The 3 reddest heatmap cells.
  - "17 doubts on acceleration, 9 on sign convention".
  - "5 submissions waiting".
  - ONE suggested action: "Push a reteach on Acceleration to 11 students in 9-B".
- **11:20, drill-down.**
  1. The heatmap cell "9-B × Acceleration" is critical.
  2. The drill shows the confidence pattern "Sure + wrong dominant" (misconception, not carelessness), the error families and the time pattern.
  3. Tapping a student (e.g. Priya) shows her evidence list for that concept: item stem, chosen option, correct or not, confidence, error family, time and source. Teachers may see their own students' answers (2.4). Parents and admins never can.
  4. One tap pushes a reteach to the struggling subset only.
- **Rohan** shows a "Recovered" tag on his row after his catch-up, from Phase 3's `recovery_completed` event.
- **Band moves** appear as plain teacher-only wording, e.g. "Aarav moved up: Building → Strong on Motion" (10.7, "moved 25-50 → 50-75" rendered in words).

**Students on the reteach**
- That night at 18:00 IST, each of the 11 students sees the reteach as a "due" Next-Action: "Acceleration: a fresh look · 12 min" (Phase 3 engine rank 2). It contains the bridge note, a predict-then-reveal block and 3 L1-L2 questions.
- None of them is ever told they were "the red ones" (Flow 5).

**Parents**
- **Aarav's father, Sunday morning.** He sees:
  - Effort bars Mon-Sun (sessions and minutes per night).
  - The mastery trend "Motion 62% → 71%".
  - Streak "12 nights".
  - The readiness lamp "Getting there".
  - A plain summary line.
  - The Ask This card: "Aarav fixed his acceleration graphs this week — ask him to show you how he reads one." It has a "Mark as had" button.
- **Priya's parent** sees:
  - "31% → 44%".
  - "5 nights · freeze saved".
  - Readiness "Needs support".
  - "Priya kept at her repair path even when it was hard — tell her you noticed."
- **Neither parent can reach** any chat, doubt or raw answer, by UI or by API (2.4, 10.5).

**Admin**
- **07:00** (11.2):
  - Signs in to a healthy dashboard.
  - Approves one pending parent link.
  - Exports a fresh activation-code batch.
  - The audit log shows both actions with actor, time and target.
  - The permission-matrix page shows the privacy row locked.

## Data model (additive migration `00NN_teacher_parent_admin.sql`)
| Change | Columns / notes |
|---|---|
| `reteach_assignment` (new) | id, school_id, section_id, concept_id, teacher_id, source enum(heatmap_cell, doubt_cluster, suggested), session_id (the generated or chosen learning_session), opens_at (default today 18:00 IST), closes_at (default next day 08:00 IST), status enum(scheduled, open, closed), created_at. Link it to the existing `reteach_decision` with a nullable `reteach_decision.assignment_id` column, so old decisions are kept. |
| `reteach_target` (new) | reteach_assignment_id, profile_id, school_id, delivered_at NULL, started_at NULL, completed_at NULL, outcome_level_before, outcome_level_after NULL. UNIQUE(reteach_assignment_id, profile_id). |
| `student_concept_daily` (new aggregate) | school_id, section_id, profile_id, concept_id, day, level, answered, correct, sure_wrong, guess_correct, avg_time_ms, error_family_counts JSON, recovered BOOL. Built nightly by the `dashboard_job` pattern so the heatmap is fast (10.1 "nightly aggregates"). |
| `parent_week_aggregate` (new) | school_id, student_profile_id, week_start (IST Monday), per_day JSON [{date, sessions, minutes}], mastery_by_subject JSON [{subjectId, start, end}], streak_days, freeze_used, readiness enum(not_ready, getting_there, ready, needs_support), summary_en, summary_hi, ask_this JSON {eventId, text_en, text_hi}, computed_at. Aggregates only (2.4). |
| `ask_this_ack` (new) | id, parent_profile_id, student_profile_id, event_id, marked_had_at. |
| `parent_link` (add columns) | status TEXT DEFAULT 'approved' (pending, approved, revoked), requested_at NULL, approved_by NULL, approved_at NULL, revoked_by NULL, revoked_at NULL. Existing rows stay approved. **Every parent read path must check status='approved'.** |
| `audit_log` (add columns) | target_type NULL, target_id NULL, details JSON NULL. The table stays append-only: add a test that there is no UPDATE or DELETE route or query on audit_log. |
| `exam_scope` (new, for the readiness lamp, F VS-47) | school_id, class_id, exam_name, exam_date, concept_ids JSON. Seed "Half-yearly" for Class 9 with the Motion chain and its date (see open questions). |

## Engine logic (packages/core, pure functions, unit-tested)
1. **`core/heatmap.ts`: `cellState(rows)` → safe | unstable | critical** (H VS-61; these thresholds are our defaults and should be named constants).
   - **Critical:** current level L1, OR ≥2 Sure+wrong in the last 10, OR mastery decayed below L1 threshold.
   - **Unstable:** L2, OR fading by revision radar, OR Guess-correct ≥30% of correct.
   - **Safe:** L3/L4 and not fading.
   - No evidence → "not started". not_taught → "not taught yet", which is never critical.
   - Recovered: a `recovery_completed` event in the last 7 days → a "Recovered" tag (4.6).
2. **`core/heatmap.ts`: `cellDrill(rows)`** returns:
   - Confidence pattern: % Sure-right, Sure-wrong, Unsure, Guess, plus a label: "misconception" when Sure-wrong is the largest wrong bucket, else "careless" or "guessing".
   - Error-family counts (Error DNA 5.2).
   - Time pattern: median time, and "rushing" when the median is under 8 s with wrong answers.
3. **`core/teacher-suggest.ts`: `suggestOneAction(dash)`** (VS-60). Priority:
   1. A critical cell with ≥5 students → reteach.
   2. A new doubt cluster ≥10 → reteach on its subtag.
   3. Submissions waiting ≥5 → grade.
   4. Otherwise publish tonight.

   It returns exactly one action.
4. **`core/reteach.ts`: `selectReteachTargets(cellRows)`** picks the students in that section × concept whose cellState is critical or unstable, minus anyone at L3+ (the "struggling subset", 10.4 #4). `buildReteachSession(concept, band)` composes:
   - A bridge note (Phase 2 simple variant).
   - One predict-then-reveal or slider block.
   - Three questions at L1-L2.
   - About 12 min in total.
5. **`core/parent-week.ts`**
   - `effortBars(evidence, sessions)` gives sessions and minutes per IST day. Minutes = summed session active time, capped per answer at 3 min to avoid idle inflation.
   - `masteryTrend(stateHistory)` gives the week start vs end per subject, as %.
   - `readinessLamp(levels, examScope, prereqDepth)` (VS-47): a mastery score weighted by prerequisite depth (deeper prerequisites weigh 1.5×). The cut-offs are our defaults:
     - Under 40% → Not ready (shown to parents as "Needs support").
     - 40-70% → Getting there.
     - 70% and above → Ready.
   - `plainSummary(week)`: template-based, honest about effort and distance to go, in EN and HI. No marks table, no rank.
   - `pickAskThis(events)` (VS-75) takes the most notable real event of the week, in this order: badge > level up (L1→L2 = "fixed") > Dushman defeated > streak milestone > steady effort. It must cite the event id. Never invent.
6. **`core/notify-cap.ts`** (VS-74): parent notifications at most 2 per week, for milestones and readiness shifts only. They are deduped by `dedupe_key`.

## API (Fastify; every route has a positive and a negative role test, 11.1)
| Method / path | Role | Contract |
|---|---|---|
| `GET /teacher/morning?sectionId=` | teacher (own sections) | `{completion:{done, total}, reddestCells:[{studentCount, conceptId, conceptName, state}] (3), clusters:[{conceptName, subtag, count, isNew}], submissionsWaiting, escalationsOpen, suggestedAction:{kind, label, href}}` |
| `GET /teacher/sections/:id/heatmap?chapterId=` | teacher | `{concepts:[{id, name}], students:[{id, name, roll, tags:['recovered'?]}], cells:[{studentId, conceptId, state, level, wordForTeacher}]}`. Names are visible to teachers. |
| `GET /teacher/sections/:id/heatmap/cell?conceptId=` | teacher | Class-level drill: `{confidencePattern, errorFamilies, timePattern, strugglingStudentIds}` |
| `GET /teacher/students/:id/concepts/:conceptId/evidence?limit=50` | teacher of that student's section and subject | `[{at, itemStem, chosen, correct, confidence, errorFamily, timeMs, source, syncedLate}]`. The answer key may be shown here to the teacher, never to students. **403 for parent and admin.** |
| `POST /teacher/reteach {sectionId, conceptId, source, targetIds?}` | teacher | Creates `reteach_assignment` plus targets (defaulting to `selectReteachTargets`) plus a generated session (reusing `learning_session`), and schedules notifications for 18:00 IST. Writes an audit entry. Returns `{id, targetCount, opensAt}`. Idempotent per (section, concept, day). |
| `GET /teacher/reteach?sectionId=` | teacher | `[{id, conceptName, targetCount, delivered, started, completed, avgLevelBefore, avgLevelAfter}]`. This is "did it land" (11.2 "next 07:30 greener"). |
| `GET /teacher/sections/:id/doubt-clusters?days=7` | teacher | From `doubt_cluster_counter`: `[{conceptName, subtag, count, snippets (anonymised)}]`, plus a one-tap `POST /teacher/reteach` with `source='doubt_cluster'`. **No student identity anywhere in this payload.** |
| `GET /teacher/grading?sectionId=` · `POST /attempts/:id/grade` (extend) | teacher | Short answers come with an AI-suggested mark (the existing provider, or a stub that gives keyword-overlap marks), shown as a suggestion. The teacher accepts or edits and adds one comment line. Edits to suggestions are logged for calibration (Flow 5 step 4, VS-17). |
| `GET /parents/children/:id/week?weekStart=` | parent with an **approved** link only | `parent_week_aggregate` shape. Aggregates only, with no item, answer, doubt or chat fields (a contract test enforces the allowed key set). |
| `GET /parents/children/:id/report` | parent | One-page report data, rendered client-side with print CSS (Flow 6 step 3). Browser "Save as PDF" is acceptable. |
| `POST /parents/ask-this/:eventId/had` | parent | Marks the conversation as had. |
| `GET /admin/parent-links?status=pending` · `POST /admin/parent-links/:id/approve` · `POST /admin/parent-links/:id/revoke` | admin | Each action writes an audit entry. Revoke takes effect immediately: the next parent request gets 403 (11.3). |
| `GET /admin/permissions` | admin | A static matrix generated from the same guard table the server uses (2.4). The privacy row comes back `locked:true`. **There is no write endpoint.** |
| `GET /audit-log?from&to&action&format=csv` (extend) | admin | Actor, time, action, target. CSV export. |
| `POST /admin/demo-reset` (dev/demo env only) plus `npm run demo:reset` | admin | Back up, then restore the seeded world (8.4). Write an audit entry. Refuse in production. |

**Existing endpoints to reuse instead of duplicating:** `/dashboard/teacher`, `/sections/:id/insights`, `/sections/:id/reteach` (keep it, and have it call the new service), `/parents/children/:id/summary`, `/admin/import-roster`, `/admin/claim-codes`, `/admin/link-parent`, `/audit-log`.

## Privacy wall (2.4, VS-87, 10.1, 10.5, 10.6)
- **Central guard.** Create one file, `apps/api/src/school/privacy.ts`, that exports `assertCanRead(viewer, resource)`. Resources are:
  - `chat`, `doubt` and `snap`: own student only.
  - `escalation`: own student, plus the named teacher.
  - `raw_answer`: own student, plus teachers of that section and subject.
  - `aggregate`: student, teachers of that section, parents with an approved link, and admin for the school-level view only.

  Every route touching these resources calls it. Use `forbidden()` from `dashboard/views.ts` for the response.
- **Negative test matrix.** Add `apps/api/test/privacy-wall.test.ts`. For each of parent, admin, other-section teacher and other student, attempt every read of chats, doubts, snaps, raw answers and evidence. All must be 403, and the attempts must be logged (10.1 "cross-role read attempt rejected in logs").
- **Student-facing privacy page.** Restyle `/privacy` (routes/Privacy.tsx) to match `docs/mockups/privacy-v1-1440.png` and `-360`: the plain-language "who sees what" table.
- **Notice when a parent is approved.** The student gets: "Your parent can now see your progress — never your chats." (Flow 1 step 5)

## UI (no mockups except privacy; use the notebook workspace system)
1. **Teacher morning** (`/teacher`, restyling `dashboard/TeacherDesk.tsx`). Four stat sticky-notes: completion, red cells, doubt clusters, waiting submissions. Below them, a single big "Suggested action" card with one button. The right rail lists escalations and announcements.
2. **Heatmap** (`/teacher/sections/:id/heatmap`, a rebuild of `dashboard/HeatMap.tsx`).
   - A grid with students as rows and concepts as columns. Cells use the existing token colours: safe = green tint, unstable = amber tint, critical = rose tint, never pure alarm red. Each cell also carries a line-icon pattern, so it isn't colour-only (accessibility).
   - The "Recovered" tag is a small gold stamp.
   - Clicking a column header opens the class-level drill drawer, with a "Push reteach to N students" button.
   - Clicking a cell opens the student × concept evidence drawer.
   - Sticky header and first column. Full width on desktop.
3. **Student drill** (`/teacher/students/:id`). Per-concept rows with the teacher wording (4.5), plus the band move history in words. Clicking a row gives the evidence table.
4. **Reteach tracker** (`/teacher/reteach`). Cards show delivered → started → completed counts and before/after level words.
5. **Doubt clusters** (`/teacher/doubts`). Cluster cards read "17 doubts on Acceleration · 9 on sign convention", each with anonymised snippets and a one-tap reteach. Opt-in escalations appear in a separate named list with a reply box.
6. **Grading queue** (`/teacher/grading`). Each card shows the submission, the AI suggestion (dashed border, "Suggested"), Accept or Edit, and one comment line.
7. **Parent weekly** (`/parent/children/:childId`, a rebuild of `dashboard/ParentChild.tsx`; layout from Flow 6 and the Master File parent mock description).
   - A Physics / Maths / All tab row.
   - Effort bars Mon-Sun drawn as SVG on ruled paper, with no chart library unless one already exists.
   - One mastery trend line per subject, labelled "62% → 71%".
   - Streak (with "freeze saved" when relevant).
   - The readiness lamp: a line-art lamp with 3 states.
   - The plain-language summary.
   - The "Ask This" card with "Mark as had".
   - A multi-child switcher showing linked, approved children only.
   - A print-report button.
   - Absent by design: marks tables, rank, chats.
8. **Admin.**
   - Wizard: verify that `routes/admin/Wizard.tsx` and roster import meet Flow 1. Fill only these gaps: the validation preview, per-row error naming, and printable claim slips per class (`ClaimSheet.tsx`).
   - New: the Parent-link queue (`/admin/parent-links`).
   - New: the Permission matrix page (`/admin/permissions`), where the privacy row shows a lock icon and has no toggle.
   - Audit log (`/admin/activity`, existing AuditPage): filters plus CSV.
   - Admin navigation is limited to the admin role (RoleGuard).

Every surface gets loading, empty, error-with-retry and permission-denied states (11.1). English plus the existing Hindi strings. See the open question on full Hindi parity.

## Readiness pass (Run 5C)
1. **`docs/codex/readiness.md`.** Walk every Part 10 item (10.1-10.13). Each one gets one of:
   - ✅ with evidence (a test name or screenshot path);
   - ❌ with a one-line note and the phase it goes back to;
   - N/A with the reason. For example, dark mode is N/A because of Carren's rule; Supabase RLS maps to our guards.

   Be honest (Part 10 rules of engagement).
2. **Playwright `e2e/phase5-acceptance.spec.ts`.** It implements the 11.2 full-day script on the seeded world, using a test clock (`TEST_NOW` env honoured by the server time helper, in test mode only). The steps:
   1. Admin approve plus export.
   2. Teacher morning, drill, reteach.
   3. Publish a session.
   4. 18:00: the session opens.
   5. Aarav's evening.
   6. Priya's evening, then her doubt.
   7. Rohan's catch-up.
   8. The parent views the week.
   9. Next morning: the heatmap is greener.
3. **`e2e/phase5-edges.spec.ts`.** This covers the 11.3 sweep:
   - kill mid-quiz and resume;
   - two tabs on the same quiz;
   - a missed window;
   - the midnight streak boundary;
   - flaky submit producing "synced late";
   - AI provider down;
   - an empty session publish being blocked;
   - wrong DOB three times giving a friendly lock;
   - a parent revoked mid-week;
   - rapid re-opens not double-awarding.
4. **Regression.** All earlier e2e (`e2e/phase1..7.spec.ts`, `v9-interim.spec.ts`, phase3/phase4 specs) must still pass, or carry an honest note.
5. **Audits:**
   - The grep audit (no band, rank, leaderboard, emoji, lorem, mojibake, audio or "LV" in student or parent UI).
   - An axe accessibility pass on the main screens (`@axe-core/playwright` is already a devDependency).
   - Touch targets of at least 44 px.
   - Every async surface has its states.
6. **Full screenshot set.** Use `scripts/capture-screens.mjs`. Capture every role's screens at 1440 and 360 into `docs/screens/final/<role>/<screen>-<width>.png`, with an index `docs/screens/final/README.md`.
   - Students: home, subjects, subject path, chapter, session player, concept page, diagnostic, quiz with confidence, why-wrong, progress, warm-up, catch-up, challenge, Dushman, plan, homework, notifications, ask, games, a game checkpoint, privacy and settings, for each of Aarav, Priya and Rohan where it differs.
   - Teacher: morning, heatmap, cell drill, student drill, reteach, doubts, grading, content drafts.
   - Parent: weekly and report.
   - Admin: home, wizard, import, claim slips, parent links, permissions, audit.

## Acceptance criteria
- [ ] The morning dashboard shows completion, red cells, clusters, the submissions queue and one action (10.4 #1).
- [ ] The heatmap is correct against the seed, and its colours follow the rules (10.4 #2).
- [ ] The cell drill shows the confidence pattern and error families (10.4 #3).
- [ ] A reteach reaches only the struggling subset, shows as a due Next-Action at 18:00, and the tracker shows its outcome (10.4 #4).
- [ ] Clusters are anonymised, and opt-in escalation is named (10.4 #13).
- [ ] Parent: graphs come from the real trail; summary, Ask This, privacy, multi-child, notification cap and printable report all work. The email digest is triaged per 9.4 unless Carren says otherwise (10.5 #1-10).
- [ ] Admin:
  - The permission matrix matches 2.4.
  - The privacy row is locked.
  - The audit log records actor, time and target.
  - Revoke cuts access immediately.
  - Demo reset restores the world.
  - Admin cannot read chats (10.6 #4-6, #8).
- [ ] The privacy-wall negative matrix test is green.
- [ ] 10.12: the full-day script and the edge sweep run green, both archetypes' evenings are visibly different in the screenshots, and the readiness doc is complete.
- [ ] `npm run typecheck`, `npm run test:unit` and `npm run test:e2e` are green, or failures are listed honestly in progress.md.

## Cursor runs (sequential; each ends green and committed, with progress.md appended)
**Run 5A: Teacher.**
- Migration (backup first).
- Nightly `student_concept_daily` job and seed.
- Core: heatmap, drill, suggest and reteach, all with tests.
- Teacher routes: morning, heatmap, cell, student evidence, reteach create and tracker, doubt clusters, grading suggestion.
- Reteach → `learning_session` plus `reteach_target`. Phase 3 next-action consumes it as "due" at 18:00 IST.
- Teacher screens 1-6.
- API tests with role negatives.

**Run 5B: Parent, admin and the privacy wall.**
- `parent_link` status columns and every parent read path checking `approved`.
- The `parent_week_aggregate` job, `core/parent-week.ts` with tests, parent routes, parent weekly screen and print report.
- Notification cap.
- Admin parent-link queue, permissions page, audit log columns plus CSV, demo-reset.
- `school/privacy.ts` central guard, the privacy-wall test matrix, and the privacy page restyled per privacy-v1.

**Run 5C: Readiness.**
- `readiness.md` walk-through.
- The acceptance spec with a test clock, and the edge-sweep spec.
- Regression run.
- Grep, axe and touch-target audits.
- Fixes in two rounds, following 11.4 order: data integrity, then security, then flows, then polish.
- The full screenshot set and its index.
- A final progress.md entry listing anything triaged.
