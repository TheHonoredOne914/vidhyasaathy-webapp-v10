# Phase 3: Daily loop (Next-Action, warm-up, catch-up, daily challenge, Dushman, study plan, streaks, badges, radars, home/homework/notifications)

Read AGENTS.md first, especially "Carren's hard rules". Then read docs/spec/learning-flow.md, docs/spec/master-file-gap.md (Build plan step 7 and checklist 10.3 #1, #2, #17 and 10.8 #7-10), and docs/codex/progress.md, so you know exactly what Phase 1 and Phase 2 shipped. In docs/spec/master-file.txt, read 3.3, 4.2, 4.5, 4.6, 5.6, Part 6 E (VS-34), F (VS-41, VS-20), G (VS-95..97), Flow 2, Flow 3 and 11.3.
Mockups: docs/mockups/home-v4-1280/1440/360.png, homework-v1-1440/360.png and notifications-v1-1440/360.png, with their HTML sources in docs/mockups/src/.

> **Pre-flight (every run).** This spec was written against the v9 source plus the Phase 1/2 task specs. Names that Phase 1/2 introduced (evidence columns, level fields, block schema names, migration numbers) may differ slightly. Before coding, grep for the real names: `rg -n "learning_evidence|ladder|errorType|sourceClass|not_taught" apps packages`, then use the real ones. If something this spec assumes is missing, build the smallest version of it and record that in progress.md. Do not rename existing things.

## Goal
Every evening each child opens the app and sees one obvious next thing. That thing is the right thing for that child (Master File 3.3), and the habit loop keeps them coming back: streak with freezes, the daily 5-minute challenge, Dushman and badges. None of it uses ranks, bands or shame. The loop runs entirely on the Phase 1 evidence trail and writes back into it.

## Hard rules (Carren, non-negotiable; repeat them to yourself every run)
- **Keep data.** Migrations are additive only: new tables or nullable/defaulted columns. Never drop, rename or rebuild a table. Before running any migration, copy `apps/api/data/*.db` to `apps/api/data/backup/<YYYYMMDD-HHmm>/`. Back up from a script (`npm run db:backup`, which you add in Run 3A if it is missing), then migrate.
- **No new games.** Atom Forge is paused, so do not touch `apps/web/src/games/atom*` or its route. Never suggest Atom Forge or "Atom Workshop" anywhere. The mockup's "Play Atom Workshop" and "Play Atom Forge · shell practice" rows must come from real data and must never be atom.
- **Look and feel.**
  - Landing page, themes and colours unchanged. No dark mode.
  - No sound, audio or voice anywhere.
  - No bands, ranks, leaderboards or numeric levels shown to students. The only words allowed are "Let's fix this" (L1), "Almost there" (L2), "Mastered" (L3) and "Top form" (L4).
  - Notebook school vibe: ruled lines, red margin, Caveat/Patrick Hand headings, cream/navy/gold.
  - Full-width desktop layouts with side rails.
  - Colourful confidence UI: Sure green, Unsure amber, Guess sky blue, sticky-note options.
  - Line-art Saathy cloud only. Never 3D, even though the mockup PNG shows a shaded cloud.
  - No emoji. Nothing generic or AI-looking.
- **Content.** Real NCERT only, with misconception distractors. YouTube only with verified IDs, otherwise no video. No mojibake.
- **Scoring.** Scoring is server-side. Every answer writes evidence. Answer keys never reach the client.
- **Demo.** teacher@demo.invalid / Saathy@2026!, teacher PIN 1357, Aarav PIN 2468. Students are Aarav, Meera, Kabir, Priya (struggling, needs Hindi terms) and Rohan (absentee).
- **Process.** Node >= 24. Run `npm run typecheck` and `npm run test:unit` green at the end of each run. Make small commits. Append to docs/codex/progress.md.

## Archetype user stories (Master File 4.6, 8.4, 11.2)
- **Aarav (strong, 12-night streak).**
  - At 18:05 his home shows "Tonight's Physics: Acceleration · about 14 min". The radar is clear, so there is no warm-up offer.
  - He finishes, and his streak chip goes 12 → 13.
  - After a method error his Dushman queue gets "Average speed". The daily challenge is L2-L3, and an "MCQ Rush · 4 min" card is the optional last door.
- **Priya (struggling).**
  - Her Next-Action is a 10-minute repair on "Speed & average speed", opened mid-state. She sees Hindi terms (चाल, औसत चाल) under the English.
  - A warm-up offer appears because "Distance & displacement" is fading. She may skip it, and nothing nags her afterwards.
  - Her daily challenge is 5 L1 questions. A correct Guess is discounted, and nothing is ever red.
  - Her streak is 5 with one freeze saved. When she missed a night last week, a freeze covered it automatically.
- **Rohan (absent 3 days).**
  - Home shows a Catch-up card: "Good to see you. Let's take this in small steps." · about 20 min. Inside: the 2 most-decayed concepts (a small warm-up/repair each) and tonight's session in compact form.
  - Finishing writes a `recovery` event. He sees the gentle restart "Welcome back — day 1 starts today", unless a freeze covered the gap. He also earns Comeback King.
  - Phase 5's heatmap will read that event as "recovered".

## Data model and migration (Run 3A)
Create one additive migration, `apps/api/drizzle/00NN_daily_loop.sql`, where NN is the next free number after Phase 2's last migration. Mirror it in `apps/api/src/db/schema.ts`. Every table carries `school_id` and the usual composite FKs to `profile(id, school_id)`, following the existing pattern (see `doubt` and `notification`).

| Table | Columns | Notes (Master File) |
|---|---|---|
| `streak_touch` | profile_id, school_id, day TEXT (IST yyyy-mm-dd), act TEXT enum(session_part, game_round, warmup, daily_challenge, homework_submit, catchup, dushman), source_event_id, created_at | **UNIQUE(profile_id, day)**, so a double tap gives exactly one touch (G VS-95..96, 10.1 "touch_streak is idempotent"). |
| `streak_state` | profile_id PK, school_id, current_days, longest_days, last_day, freezes_held (0-2), updated_at | Derived cache. It can always be rebuilt from `streak_touch` plus `streak_freeze_ledger`. |
| `streak_freeze_ledger` | id, profile_id, school_id, kind enum(earned, consumed), day, reason, created_at | Append-only. Earn 1 per 5 streak days, hold at most 2, and auto-consume on a missed day. |
| `daily_challenge` | id, profile_id, school_id, day, item_ids JSON, status enum(served, completed, expired), correct, total, started_at, completed_at | **UNIQUE(profile_id, day)**. Every answer still goes to evidence. |
| `dushman_entry` | id, profile_id, school_id, concept_id, status enum(active, retired), queued_at, retired_at, reason | At most 3 active per student (F VS-41). |
| `dushman_event` | id, profile_id, school_id, concept_id, kind enum(queued, faced, victory, retired), evidence_id NULL, created_at | Append-only "defeat/victory events" (VS-41 data). |
| `badge_catalog` | id (fixed_it, comeback_king, dushman_slayer, boss_buster), name_en, name_hi, description_en, description_hi, icon_key (line-art SVG name) | Seeded (8.4). Never invent badges outside the catalog. |
| `badge_award` | id, profile_id, school_id, badge_id, scope_key (e.g. conceptId or chapterId), trigger_event_id, awarded_at, seen_at NULL | **UNIQUE(profile_id, badge_id, scope_key)**, so nothing is double-awarded (11.3 "rapid re-opens"). |
| `study_plan` | id, profile_id, school_id, goal TEXT, exam_date (IST day), minutes_per_night (default 25), status enum(active, archived), created_at, updated_at | VS-34. |
| `study_plan_item` | id, plan_id, school_id, night (IST day), concept_id, kind enum(repair, learn, revise, practice, warmup), est_minutes, order_idx, status enum(planned, done, folded, dropped) | Prerequisite order. |
| `plan_completion_event` | id, plan_item_id, profile_id, school_id, kind enum(done, missed, folded), created_at | Append-only. |
| `learning_event` | id, profile_id, school_id, kind enum(recovery_offered, recovery_completed, warmup_offered, warmup_skipped, warmup_completed, frustration_flagged, absence_detected), concept_id NULL, payload JSON, created_at | A non-answer event trail (3.5 append-only). If Phase 1 already has a generic event table, reuse it instead of creating this one. |
| `assignment_draft` | profile_id, school_id, assignment_id, item_id, answer JSON, updated_at | UNIQUE(profile_id, assignment_id, item_id). Powers homework "Save draft". |
| `assignment.late_until` | nullable INTEGER column | Powers "accepting late work till Fri". |
| `notification.topic` | nullable TEXT column | Holds session_open, homework_due, graded, streak, parent_viewed, game_of_day, reteach, badge. See the note below. |
| `notification_setting` | nullable/defaulted columns: notify_sessions, notify_homework, notify_streak, notify_parent_view, notify_game, quiet_after_21 (default 1) | Required by the notifications-v1 toggles. |

**Notification kinds.** If migration 0006 has a CHECK on `notification.kind`, do not rebuild the table. Keep `kind='content_publish'` (or `announcement`) and put the specific type in the new `topic` column.

**Backfill.** Seed `streak_touch` from existing correct attempts and evidence days, so that `core/streak.ts` history is kept. That is a deterministic and idempotent script, `apps/scripts/backfill-streaks.ts`.

**Demo seed.** Update demo.ts additively:
- Aarav: 12 consecutive touch days up to yesterday, 2 freezes held, Dushman "Speed & average speed".
- Priya: 5 days, one freeze consumed last week, 1 held. Average speed fragile; a warm-up is due on "Distance & displacement" (nextReview in the past).
- Rohan: last touch 4 IST days ago (3 full absent days), with decayed mastery on 2 concepts.
- Meera and Kabir: neutral.
- Badge catalog seeded.

## Engine logic (packages/core, pure functions with unit tests) (Run 3A)
All time is IST. Day boundaries come from school timezone (`Asia/Kolkata`), never from the device (11.3).
1. **`core/next-action.ts`: `pickNextAction(ctx, now)`** (3.3, 10.3 #2). The candidate order is:
   0. **Catch-up**, when `absentDays >= ABSENCE_DAYS` (default 3; see open questions). It wraps ranks 1-3 into one compact card.
   1. **Unfinished**: started and not completed. This covers session_progress without completedAt, a diagnostic in progress, a concept page with a saved step, and a homework draft.
   2. **Due**: required teacher session or homework, open window, due before the end of tomorrow IST, or overdue still within `late_until`.
   3. **Revision** of a decaying concept, from the revision radar.
   4. **New**: the next concept on the subject path, respecting prerequisites.
   5. **Games**: today's recommended game (step 9 below).

   It returns `{kind, title, conceptId, conceptName, estMinutes, href, resumeState}`. `href` opens mid-state, for example `/student/sessions/:id?step=3`. Ties break by dueAt, then by resume recency, then by id. Keep `buildStudyPlan` in core/study-plan.ts working: make it call or be called by this function, and do not delete its exports.
2. **`core/radars.ts`**.
   - **`revisionRadar(states, now)`** (5.6, 4.5): a concept is *fading* when `nextReview <= now`, or when decayed mastery (MASTERY_HALF_LIFE_MS in mastery.ts) falls below the threshold of its current L-level. Return fading concepts sorted by decay.
   - **`frustrationRadar(recentEvidence, sessionEvents)`** (5.6) flags any of:
     - ≥3 consecutive wrong answers, each under 8 s;
     - ≥2 re-submits within 5 s;
     - abandoning the same step twice within 10 min.

     These thresholds are our defaults, kept as named constants. The response is softer tone copy, the next set shrunk to 3 questions at ladder level −1 with bridge text, and a "Take a 2-minute break?" card. Never red. Write a `frustration_flagged` learning_event, which teachers see as a count only.
3. **`core/warmup.ts`: `buildWarmup(tonightConceptId, prereqs, radar)`** (Flow 3 step 2, learning-flow "warm-up 2 min"). Use up to 2 fading prerequisite concepts, 2-4 flashcards each from the Phase 2 flashcard decks, plus 1 quick L1 check question per concept (server-scored, writes evidence with `source='warmup'`), targeting about 2 min. Offer it only if the radar flags something. A skip writes `warmup_skipped` and suppresses the offer for that IST day. There is no guilt copy.
4. **`core/catchup.ts`: `buildCatchup(ctx)`** (4.6 Rohan, F VS-20).
   - **Detection**: no streak_touch for ≥ ABSENCE_DAYS full IST days.
   - **Path**: the 2 most-decayed concepts (≈5 min each: simple note variant recap plus 2 L1 questions), then tonight's session in compact form (≈10 min: standard variant key idea plus a 3-question check). That is about 20 min total.
   - Copy is exactly "Good to see you. Let's take this in small steps."
   - Write `recovery_offered` on serve and `recovery_completed` on finish. Missed session windows fold into tomorrow's plan (11.3), and the student never sees "missed".
5. **`core/daily-challenge.ts`: `buildDailyChallenge(ctx, band)`** (G VS-95, 10.8 "serves warm-up/Dushman content").
   - Five questions or 5 minutes, whichever comes first: up to 2 from fading concepts, up to 2 from active Dushman concepts, and the rest from tonight's concept at ladder level.
   - Band routing is internal (4.2):
     - 0-25: L1 only, sets of 3-5, Hindi terms prominent;
     - 25-50: L1-L2 mix;
     - 50-75: L2-L3;
     - 75-100: L3 plus board-format items with the timer visible.
   - Only items of seeded quality are used, with confidence chips on every one. Once per IST day; it counts as a streak touch.
6. **`core/dushman.ts`: `selectDushman(states, evidence)`** (F VS-41, 4.2).
   - Pick the 3 weakest concepts with ≥3 evidence rows that are not `not_taught` or `new`. Rank by lowest L-level, then the most Sure+wrong (misconception) in the last 10, then the oldest last-correct.
   - Retire at L3 → `retired` event plus a Dushman Slayer badge.
   - Band 0-25 gets Dushman from the first evening ("early"). Band 50-75 and up gets "own 3 weakest".
   - Re-skin only, as a title card "Today's Dushman: Average speed" with a line-art illustration. It reuses existing practice (`quick_revision_quiz` mode filtered to the concept). This is not a new game.
7. **`core/streak.ts` (extend; keep `streak()` exported and its tests green): `applyStreakDay(state, touches, freezes, today)`** (G VS-95..96).
   - Any meaningful act counts. Login alone does not.
   - One touch per IST day.
   - Each time `current_days` crosses a multiple of 5, earn 1 freeze, holding at most 2.
   - Each missed day auto-consumes 1 freeze, if one is held, and the streak continues.
   - A missed day with no freeze resets to 0, and the next touch shows "Welcome back — day 1 starts today".
   - Boundary tests to write:
     - day 4 → 5 earns a freeze;
     - with 2 held, reaching day 10 earns nothing more;
     - two missed days with 1 freeze → reset;
     - a midnight double touch (23:59:59 and 00:00:01 IST) gives two days;
     - a double tap in the same second gives one.
8. **`core/badges.ts`: `evaluateBadges(event, history)`** (G VS-97). Awards:
   - **Fixed It**: a concept moves L1 → L2. scope = conceptId.
   - **Comeback King**: `recovery_completed` after ≥3 absent days. scope = absence start day.
   - **Dushman Slayer**: a Dushman retires at L3. scope = conceptId.
   - **Boss Buster**: catalog-seeded but **not awarded in Phase 3**. See Phase 4 open question.

   Each award stores `trigger_event_id`.
9. **`core/study-plan.ts` (extend): `buildNightlyPlan({examDate, minutesPerNight=25, concepts, prereqGraph, levels}, today)`** (E VS-34, 5.4).
   - Weak concepts in prerequisite order: repair → learn → revise → practice.
   - Use `est_minutes` defaults: repair 10, learn 15, revise 5, practice 8, warmup 2.
   - Fill each night up to minutesPerNight. Never exceed it.
   - **`replanAfterMiss(plan, missedNight)`**: the missed items fold forward. If the total no longer fits before the exam, drop the lowest-priority `practice`/`revise` items first and mark them `dropped` with a reason. Never stack two nights into one. Write `missed` and `folded` events.
   - Test the 5.4 example: exam in 3 weeks, 6 shaky concepts, 25 min a night.
10. **`core/xp.ts`: `xpFromEvidence(rows)`.** The mockups show "340 XP" and "+10 XP". Derive XP from evidence; never store a level. Defaults: correct 10, correct+Guess 3, session completed 20, daily challenge completed 15. XP is never compared with anyone else, and there is no level, rank or "LV" anywhere.

## API (Fastify, apps/api/src/routes/daily.ts plus additions to existing routes) (Run 3B)
Every route follows the existing pattern: zod contracts in `packages/contracts/src/daily.ts`, `requireRole('student')`, the `scope()`/chapterAccess guards, `clientEventId` idempotency, and no band or answer key in any response.

| Method / path | Contract (response unless noted) |
|---|---|
| `GET /student/home` | One call (Flow 2 step 1, 10.1 "<300 ms on seed"). Returns `{ greeting:{name, dateIST, line}, nextAction, catchUp?, warmup?, streak:{currentDays, freezesHeld, touchedToday, week:[{date, state:'done'|'freeze'|'missed'|'today'|'future'}], restartCopy?}, xp, subjects:[{id, name, chapterLabel, done, total}], todaysGoal:{items:[{id, label, done, href}], done, total}, fromTeacher:[{id, title, subject, badge:'due_today'|'overdue'|'suggested'|'new', href}], todaysGame:{gameId, title, conceptName, estMinutes, href}?, learningPath:{subject, chapter, nodes:[{conceptId, name, word:'Let\'s fix this'|'Almost there'|'Mastered'|'Top form'|'New'|'Up next', note}]}, dailyChallenge:{status, href}, dushman:[{conceptId, name}], newBadges:[...] }`. Replace the current HomeDesk.tsx calls (5+) with this one. Write an API test that counts DB round-trips or asserts a single handler. |
| `POST /student/warmup/start` | → `{warmupId, cards:[{front, back}], checks:[publicItem]}`. Skipping is `POST /student/warmup/skip`. Done is `POST /student/warmup/:id/complete {ratings:[knew|almost|forgot]}`. Check answers go through the existing attempts path, which scores them and writes evidence `source='warmup'`. |
| `GET /student/catchup` · `POST /student/catchup/complete` | `GET` returns the compact path steps with hrefs and minutes. `POST /complete` validates that all steps are done server-side, writes `recovery_completed`, and evaluates badges. |
| `GET /student/daily-challenge` · `POST /student/daily-challenge/:id/answer` · `POST /student/daily-challenge/:id/finish` | Serves `publicItem()` only. Answers are scored with `markItem` and write evidence `source='daily_challenge'` with confidence and timeMs. Finish records the completion and touches the streak. A second `GET` on the same day returns the same challenge. |
| `GET /student/dushman` | Returns the active 3, each with an href into the existing practice player in Dushman skin: `/student/chapters/:chapterId/practice/quick_revision_quiz?concept=:id&skin=dushman`. |
| `GET /student/study-plan` · `POST /student/study-plan {examDate, minutesPerNight, goal}` · `POST /student/study-plan/items/:id/done` | The existing `GET /study-plan` stays as it is. Add a new path or extend it, and keep the old shape. |
| `GET /student/streak` | Detailed week and history plus freeze ledger, for the progress page. Keep `GET /practice/streak` working, backed by the new state. |
| `GET /student/badges` · `POST /student/badges/:id/seen` | The shelf, plus a celebration-seen flag. |
| `GET /student/homework?tab=all\|todo\|submitted\|graded` | Built on `assignment` and `attempt`: `[{id, title, subject, teacher, count, status, dueAt, lateUntil, score?, comment?}]`, with overdue first. `PUT /student/homework/:assignmentId/draft {itemId, answer}` saves a draft. Submit uses the existing `/attempts` path. |
| `GET /notifications` (extend) · `POST /notifications/read-all` · `PUT /notification-settings` (extend) | Grouped Today / Earlier this week, with actions (Open / Continue / Do it). `quiet_after_21` moves `deliverAfter` to 07:00 IST the next day. |

**Streak touch.** This is an internal service function `touchStreak(profileId, act, sourceEventId, now)`, not a public route. Call it from the evidence/attempt write path, session completion, game round completion, warm-up, daily challenge, catch-up and homework submit. It must be idempotent through UNIQUE(profile_id, day).

**Tests.** Add `apps/api/test/daily.test.ts` covering:
- next-action order for the 3 archetypes from seed;
- a double-tap streak touch → one row;
- a daily challenge the same day → same id;
- the answer key absent from every response (deep-scan JSON for `correct`/`answerKey`/`key` fields);
- a parent/teacher token gets 403 on student routes;
- the catch-up path for Rohan totals ≈20 min;
- the warm-up appears for Priya and not for Aarav.

## UI (apps/web, student shell) (Run 3C)
Reuse the notebook workspace CSS and tokens already in `student/home.css` and `student.css`. Desktop is full width: left nav rail, main column, right rail. At 360 px use bottom tabs (Home, Subjects, Games, Saathy, You). Every async surface gets loading skeleton, empty, error-with-retry and permission-denied states (11.1).

1. **Home**: `apps/web/src/student/HomeDesk.tsx`, matching `docs/mockups/home-v4-1440.png`, `-1280` and `-360`.
   - **Top bar**: search, the streak chip ("5 streak", with a small freeze snowflake line icon showing the freezes held), XP chip, notifications bell.
   - **Greeting**: date pill, "Namaste, Aarav" in Caveat, and one encouragement line from the server. The line-art cloud sits top-right in its *greeting* state, with a speech bubble "Let's keep going!". Use static line art from `games/engine/Saathy.tsx` styles if they are line-art; otherwise add a new line-art SVG component, `ui/SaathyCloud.tsx`, with the 8 states in 5.4. Only greeting, encouragement, resting and celebration are used here.
   - **Next-Action card** (the visual anchor, the big "Continue your learning" card): subject pill, title, the teacher's line, primary button ("Continue session →" / "Start" / "Start catch-up"), and a minutes pill. Rohan sees the Catch-up variant in the same card with the 20-min pill. If there is a warm-up, show an inline small sticky-note under the card: "Quick warm-up? Distance & displacement — fading · 2 min" with [Warm up] [Skip].
   - **Your subjects**: 4 cards with progress bars. They come from real chapters; use real counts or omit them.
   - **This week**: 7 dots. Done = gold, freeze = sky-blue ring with a snowflake line icon, today = navy, future = empty. Missed days are plain empty, never red.
   - **Today's game**: the recommendation from 5. Never atom.
   - **Your learning path**: concept nodes for the current chapter, using only the friendly words.
   - **Right rail**:
     - "Today's goal" checklist: tonight's study-plan items, or the next-action plus daily challenge and Dushman if there is no plan.
     - "Need help understanding? Ask Saathy" card, linking to /student/ask in Phase 4. Until Phase 4 it links to the existing AskPanel.
     - "From your teacher" with Due today / Overdue / Suggested pills. The amber/red pill colours come from the existing tokens; the overdue pill uses soft rose from the tokens, not alarm red.
   - **Additions not in the mockup** go as small cards below the learning path, styled like "This week":
     - Daily challenge card ("5-minute challenge · ready").
     - Dushman card ("Today's Dushman: Average speed").
     - New-badge toast/shelf link.
2. **Warm-up**: `/student/warmup`. Flashcards flip (CSS transform, reduced-motion = crossfade), then self-rating chips knew/almost/forgot, then 1-2 check questions with confidence chips. The finish copy is short. Skip lives on every screen.
3. **Catch-up**: `/student/catchup`. A stepper with 3 steps (concept A, concept B, tonight compact), each opening the real concept page or session player in compact mode (`?compact=1`) that Phase 2 built. On finish the cloud shows *celebration* (skippable, reduced motion) and the Comeback King badge.
4. **Daily challenge**: `/student/challenge`. The existing quiz player UI from Phase 1, with confidence chips and sticky-note options, plus a 5-minute soft timer (shown only for band 75-100, internal). End: a "why wrong" summary as in Phase 1, with XP earned.
5. **Dushman**: `/student/dushman`. Three sticky-note "enemy" cards, line-art with no gore, each showing concept name and friendly word. "Face it" opens the practice. A retired Dushman shows a stamp "Defeated" and the badge.
6. **Study plan**: `/student/plan`. A notebook timetable: nights as ruled rows, items as sticky notes. A form for exam date, minutes per night and goal. A missed night shows "Moved to Thursday", never "missed".
7. **Homework**: `/student/homework`, matching `docs/mockups/homework-v1-1440.png` and `-360`.
   - Header line "Three things to do this week. Start with the overdue one." is computed from the data.
   - Tabs All/To do/Submitted/Graded with counts. Rows have pills (Overdue · Mon / Today, 9 pm / Fri 30 Oct / Waiting for marks), and graded rows show the teacher's one-line comment and the score out of the total.
   - The answering pane on the right: question pager (1-5), "2 of 5 answered", answer box, "Stuck on valency? Ask Saathy for a hint →" (deep link to Phase 4 hint mode; until then the existing AskPanel with `socratic` on), Save draft, Submit.
   - Submit uses the existing attempt path. Objective items are server-scored; short answers wait for the teacher.
8. **Notifications**: `/student/notifications` (the existing `dashboard/NotificationsPage.tsx` restyled), matching `docs/mockups/notifications-v1-1440.png` and `-360`.
   - Groups Today and Earlier this week, plus "Mark all as read".
   - Rows have actor, text, meta, time and action button (Open/Continue/Do it/score chip).
   - Include the row "Papa looked at your weekly progress report · Parents can see progress, never your Saathy chats".
   - The right rail "Tell me about" toggles: New sessions, Homework due and marks, Streak reminders, When a parent views my report, Game of the day, and Quiet after 9 pm ("No pings at night, so you can sleep.").
   - Dispatch writes these notification topics: session_open at window open (server time), homework_due at 08:00 on the due day, graded, streak (at most one per day, only when today is untouched at 19:00, copy "Keep it going with 15 minutes today", never guilt), parent_viewed and badge.
9. **Progress page**: extend Phase 1's `/student/progress` with a badge shelf (amber only here, per VS-97) and the streak history with freezes.

All copy is English with Hindi terms where Phase 2 provides them, for Priya's level. No emoji: the mockup's 🔥 and ⭐ become line icons.

## Acceptance criteria
- [ ] One `GET /student/home` call renders the whole home, and HomeDesk makes no other fetches on first paint (10.3 #1).
- [ ] Next-Action order is proven by unit tests and by seed: Aarav → Acceleration, Priya → repair on average speed (warm-up offered), Rohan → Catch-up 20 min (10.3 #2, #17).
- [ ] Warm-up appears exactly when decay is seeded, and its skip is respected for the day (10.7 #14).
- [ ] Streak: idempotent touch; freeze earn/consume boundaries; gentle restart copy; midnight IST edge (10.1, 10.8 #7-8, 10.12).
- [ ] Daily challenge serves warm-up/Dushman content, at most 5 questions, once a day; evidence is written (10.8 #9).
- [ ] Dushman = the 3 weakest; retires at L3 with a badge (10.7 #16).
- [ ] Badges award on real trajectories only, with trigger_event_id, and are never double-awarded (10.8 #10, 11.3).
- [ ] Study plan generates realistic nights and shrinks after a miss (10.7 #16).
- [ ] Homework and notifications screens match the mockups at 1440 and 360.
- [ ] No band, rank, numeric level, leaderboard, emoji, audio or red-alarm colour on any new student screen. Add a grep test in `apps/web/src/pages.test.ts` that fails on `/band|rank|leaderboard|LV\s?\d/i` in student copy.
- [ ] Tests: unit tests in packages/core for every new module; `apps/api/test/daily.test.ts`; Playwright `e2e/phase3-daily.spec.ts`, which signs in as Aarav (PIN 2468), Priya and Rohan, screenshots home at 1440 and 360 into `docs/screens/phase3/`, and asserts each Next-Action title.

## Cursor runs (sequential; each one ends green, committed, with progress.md appended)
**Run 3A: Data and engine (about 1 run).**
- Pre-flight grep; add `db:backup` if missing; take the backup; write the migration and schema; seed and backfill script.
- Pure core modules: next-action, radars, warmup, catchup, daily-challenge, dushman, streak (extended), badges, study-plan (extended), xp. Full unit tests including the streak boundary cases.
- No UI.
- Commits: "3A migration+seed", "3A core engine", "3A tests".

**Run 3B: API.**
- `routes/daily.ts` plus extensions (home, warmup, catchup, daily-challenge, dushman, study-plan, streak, badges, homework, notifications).
- Wire `touchStreak` and `evaluateBadges` into the existing evidence/attempt, session-completion and practice write paths.
- Notification dispatch for the topics.
- `apps/api/test/daily.test.ts`, including answer-key leak checks and role negatives.

**Run 3C: Screens.**
- HomeDesk rebuild on `/student/home` (home-v4).
- Warm-up, catch-up, challenge, Dushman, plan, homework (homework-v1), notifications (notifications-v1), progress shelf, line-art SaathyCloud.
- The Playwright spec and the screenshot set.
- Last step: run the full `npm run typecheck`, `npm run test:unit` and the e2e for phase 3, then append to progress.md, including screenshots paths and anything deferred.

## Out of scope for Phase 3
Ask Saathy streaming and SnapDoubt, wiring arena games to evidence, the content generator (Phase 4), and teacher/parent/admin screens (Phase 5). Do not build Boss Level or Streak Challenge; see the Phase 4 open question.
