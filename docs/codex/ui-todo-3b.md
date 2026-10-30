# UI to wire after Run 3B

The daily loop API is live. Screens stay in the notebook mockups (ruled lines, red margin, Caveat or Patrick Hand headings, cream, navy, gold). No emoji, no sound, no bands, ranks, or numeric levels. Friendly words only: Let's fix this, Almost there, Mastered, Top form, plus New and Up next on the path.

Every screen needs a loading skeleton, an empty state, an error with retry, and a permission-denied state.

## Home (`HomeDesk`)

`GET /student/home` is the only call for the first paint. The bell inbox is `GET /notifications` when that screen opens.

- Greeting: `greeting.name`, `greeting.dateIST`, `greeting.line`. Cloud speech can use the line.
- Next action: `nextAction` (title, estMinutes, href, kind). Catch-up uses the same card when `kind` is `catchup` (`catchUp.copy`, about 20 minutes).
- Warm-up sticky note only when `warmup` is set: name, 2 minutes. Warm up posts `POST /student/warmup/start`. Skip posts `POST /student/warmup/skip`. After a skip the same day, `warmup` is null.
- Subjects: `subjects` (name, chapterLabel, done, total). Omit a bar when `total` is 0.
- Week: `streak.week`. `done` gold, `freeze` sky ring, `today` navy, `future` and `missed` empty. Never red. Chip uses `streak.currentDays` and `streak.freezesHeld`. `streak.restartCopy` replaces the greeting line when it is set.
- XP chip: `xp`. Not compared with anyone.
- Today's game: `todaysGame`. Never atom.
- Learning path: `learningPath.nodes` and each `word`.
- Right rail: `todaysGoal`, then Ask Saathy (existing AskPanel until Phase 4), then `fromTeacher` pills `due_today`, `overdue`, `suggested`, `new`. Overdue uses the soft rose token.
- Small cards under the path: `dailyChallenge` (`/student/challenge`), `dushman` names, `newBadges` linking to the shelf.

Seed check: Aarav's next title is Acceleration and `warmup` is null. Priya's next title is the speed repair and `warmup` names Distance. Rohan's next kind is `catchup`.

## Warm-up `/student/warmup`

`POST /student/warmup/start` with `{ clientEventId }` returns `{ warmupId, cards, checks }`. Cards flip (reduced motion: crossfade). Then ratings `knew | almost | forgot` on `POST /student/warmup/:warmupId/complete`. Check questions are `checks` (public items only). Score them with the existing attempts path. Skip is on every step. Finish copy stays short. If start returns 409, the home note is already gone.

## Catch-up `/student/catchup`

`GET /student/catchup` returns `copy`, `estMinutes`, and `steps` (href, minutes). Rohan is about 20 minutes: two recaps then tonight's session, each `?compact=1`. `POST /student/catchup/complete` returns 409 until the server sees the step answers, then `{ done, badges }` (Comeback King when it applies). Celebration is skippable.

## Daily challenge `/student/challenge`

`GET /student/daily-challenge` returns the same `id` all day and public `items` only. Show the five-minute timer only when `showTimer` is true. Show Hindi terms from the concept lesson when `showHindi` is true. Answers: `POST /student/daily-challenge/:id/answer` with confidence and `timeMs`. The body comes back as `outcome` (`yes` or `not_yet`) and `why`. Finish: `POST /student/daily-challenge/:id/finish` returns `{ status, xp, answered }`.

## Dushman `/student/dushman`

`GET /student/dushman` returns up to three `entries` with `name`, `word`, and `href` into the existing quick-revision practice with `skin=dushman`. Line art, no gore. A retired row can show a Defeated stamp when `retired` is true.

## Study plan `/student/plan`

`GET /student/study-plan` returns `plan` or null. Nights are ruled rows. Items are sticky notes. `POST /student/study-plan` takes `examDate`, `minutesPerNight`, and `goal`. `POST /student/study-plan/items/:id/done` marks one note. A folded item's `note` is "Moved to Thursday" (or that weekday). Do not show the word missed.

## Homework `/student/homework`

`GET /student/homework?tab=all|todo|submitted|graded` returns `counts` and `items` (overdue first). Header line is computed from that list. Pills use `status`, `dueAt`, and `lateUntil`. Graded rows use `score.earned` / `score.outOf`. `comment` is null until a teacher comment column exists. Save draft: `PUT /student/homework/:assignmentId/draft` with `{ itemId, answer }`. Submit still uses `POST /attempts`. The right pane is the existing question card. The Saathy hint link stays on the existing AskPanel until Phase 4.

## Notifications `/student/notifications`

`GET /notifications` adds `groups.today` and `groups.earlier` plus `topic` and `action` (`open`, `continue`, `do_it`, `score`) on each row. The flat `notifications` list is unchanged in meaning. `POST /notifications/read-all` marks the inbox read. Toggles: `PUT /notification-settings` now accepts optional `notifySessions`, `notifyHomework`, `notifyStreak`, `notifyParentView`, `notifyGame`, and `quietAfter21`. Quiet after 9 holds delivery until 07:00 IST. Parent-view copy is already on the row. Streak copy, when it sends, is "Keep it going with 15 minutes today".

## Progress shelf

Extend `/student/progress` with `GET /student/badges` (amber shelf only) and `GET /student/streak` (week, history, freeze ledger). `POST /student/badges/:id/seen` clears a celebration. Boss Buster can sit on the shelf unawarded.

`GET /practice/streak` is unchanged so older clients keep the correct-answer streak. The freeze-aware numbers are `/student/streak`.
