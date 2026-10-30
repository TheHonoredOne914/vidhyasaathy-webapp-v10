# Progress log

## Phase 1

Learning evidence, the concept ladder, and teacher-only chapter bands are stored in an additive migration. The pure learning engine scores L1-L4 with Sure/Unsure/Guess weights, moves the ladder, classifies Error DNA, applies the 60 percent session rule, and keeps new-chapter concepts at "New" until the student answers them. Session checks, practice, homework, remediation, and the Class 7 prerequisite diagnostic write evidence. Students see friendly words and a why-wrong summary on light paper. Demo students Aarav, Meera, Kabir, Priya, and Rohan have Motion histories. Logins are in apps/scripts/DEMO_LOGINS.md.

## Phase 2

Concept lessons store three note depths, Hindi terms on the simple note, checkpoints, faded practice, explain-back, flashcards, and a one-page summary. The server scores those answers and queues revision at 1, 3, and 7 days. Interactive blocks are rejected unless the numbers match the formulas, including a = (v − u) / t and speed = distance / time. Motion pages cover uniform and non-uniform motion, speed and velocity, acceleration, and distance-time and velocity-time graphs. A not_taught answer does not change mastery. Students see the subject path, chapter, diagnostic, concept page, and session on the ruled notebook. `npm run typecheck` and `npm run test:unit` passed (260 tests, 1 skipped).

## Phase 3 run 3A

Migration `0013_daily_loop` adds the daily-loop tables and nullable columns: `assignment.late_until`, `notification.topic`, and the notification-setting toggles (`quiet_after_21` defaults to 1). The `notification.kind` check was left as it is. `assignment.late_until` is on the assignment response as null until a homework screen sets it. Backup before the migration: `apps/api/data/backup/20261030-1328/` (`npm run db:backup`). The three local databases were then migrated in place. `apps/scripts/backfill-streaks.ts` turned past correct attempts and evidence into one streak touch per IST day and skipped today.

Pure modules in `packages/core`: `next-action`, `radars`, `warmup`, `catchup`, `daily-challenge`, `dushman`, `badges`, `xp`, plus `applyStreakDay` on `streak` and nightly planning on `study-plan`. `buildStudyPlan` is unchanged aside from a numeric resume tie-break.

Demo seed (`ensureDailyLoop`) is additive and idempotent:
- Aarav: 12 touch days through yesterday, 2 freezes held, and an active dushman on the existing concept **Speed & Velocity** (that is the Motion concept for average speed; concept titles were not renamed).
- Priya: touches on T-14 through T-10, a miss on T-9 that consumes the freeze, a miss on T-8 that resets the streak, then touches on T-5 through T-1. The cache is 5 days with 1 freeze held and one consumed ledger row. Distance & Displacement has `nextReview` in the past. Speed & Velocity stays at ladder level 1 only when no ladder row exists yet.
- Rohan: one touch four IST days ago. `current_days` is 0 and `last_day` stays on that touch, so `absentDays` is 3. Distance & Displacement and Speed & Velocity carry decayed mastery. `onConflictDoNothing` leaves a later ladder or concept state alone.
- Meera and Kabir: no narrative touches.
- Badge catalog: Fixed It, Comeback King, Dushman Slayer, Boss Buster. Boss Buster is catalog-only and is not awarded.

`last_day` is the last day the streak was still alive (a touch, or a missed day covered by a freeze). A reset does not slide it forward through later empty days. Catch-up still means no `streak_touch` for 3 full IST days.

`recordAnswer` touches the streak for a taught answer and awards Fixed It when mastery moves from L1 to L2. A dushman retirement hook is in `applyLearningAwards`. Home, warm-up, catch-up, challenge, and notification routes are Run 3B. `answer_evidence.source` cannot add `warmup` or `daily_challenge` without rebuilding the table, so that check stays deferred. Frustration flags are computed in core and are not written to `learning_event` until those routes exist. `npm run typecheck` and `npm run test:unit` passed (280 tests, 1 skipped).

## Polish 2 sizing

The notebook shell already filled the width. The right rail was still a fixed column beside the page below 1180px, so at 1024px the Due soon card and the streak and XP pills were clipped, and a single subject tile stretched to the full height of the sheet. The main grid is now `minmax(0, 1fr)` and `clamp(260px, 22vw, 340px)`, grid and flex children use `min-width: 0`, and below 1180px the rail stacks under the main column. Subject tiles use `repeat(auto-fill, minmax(min(220px, 100%), 1fr))` and cards align to the start. Practice uses the notebook question card, doodle strip, and Sure / Unsure / Guess buttons. Game tiles use the line drawings from the mockup. Screenshots are in `e2e/screenshots/polish2/`. Aarav and Priya home headings differ (Namaste, Aarav / Namaste, Priya). `document.documentElement.scrollWidth` stayed within the viewport at 360, 1024, 1280, 1440, and 1920 on the signed-in routes. `mascot.webp` remains only on the landing page. The emoji grep still matches existing landing, auth, and game-engine marks; those files were left alone. `npm run typecheck` and `npm run test:unit` passed (280 tests, 1 skipped).


