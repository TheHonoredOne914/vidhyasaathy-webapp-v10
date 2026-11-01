# Phase 3C notebook API hand-off

All paths are API-relative. Use the session cookie and the existing mutation Origin/CSRF rules. Unauthenticated requests return 401; wrong roles return 403. Student data always belongs to the signed-in profile and school. Unknown/inaccessible resources return 404; unlinked parent children return 403. Empty arrays/nulls are real empty states, not demo placeholders. Do not derive or display numeric learning levels, bands or ranks.

## Student home
- Keep the existing `GET /student/home` and `GET /dashboard/student` integrations. The daily engine owns next-action priority, warm-up, challenge, streak and Dushman selection; do not reorder them in the client.
- Warm-up skips apply only to the current IST date. A challenge has at most five items; retry the same answer event rather than creating additional events. Empty/incomplete early finishes return 409. A previous day's challenge cannot accept answers.
- Existing seed expectations remain Aarav: Acceleration (14 minutes), Priya: Speed revision (10 minutes), Rohan: catch-up (20 minutes).

## Subject path
- `GET /student/subjects/:subjectId/path` -> `{subjectId,name,nextUp,chapters:[{chapterId,title,lockReason,stations,goal,atAGlance,nextUp}]}`.
- Station: `{conceptId,title,word,status,lockReason}`; status is `done|current|next|locked`. `nextUp` is a station or null. Words are `New`, `Let's fix this`, `Almost there`, `Mastered`, `Top form`.
- `goal:{done,total}` counts ideas at Mastered/Top form. `atAGlance:[{word,count}]` includes all five word buckets. Prerequisite order precedes dependent concepts; unfinished earlier chapters supply a lock reason. Prior-class bridge concepts are not new-chapter stations.
- Empty subject: `chapters:[]`, `nextUp:null`; all-done path has no next-up. Use server lock reasons, not guessed numeric thresholds.

## Subjects board
- `GET /student/subjects-board` -> `{subjects:[{subjectId,name,done,total,masteryPercent,word,nextIdea,weekMinutes,due}]}`.
- `nextIdea` is a station or null. `due` is null or `{assignmentId,title,dueAt,state:due|overdue}` for the earliest outstanding published assignment.
- `weekMinutes` sums recorded answer time since Monday in IST. `masteryPercent` is a concept-mastery aggregate, not a class position or an exam score. No enrollment gives `subjects:[]`; no time/evidence gives zero minutes/New.

## Progress
- `GET /student/progress` -> subjects-board fields plus `{month,calendar,ideasToLookAt,week,confidence,wins}`.
- `month` is IST `YYYY-MM`; `calendar:[{day,studied,frozen}]` covers every date in it. `week:[{day,minutes}]` always has seven Monday-Sunday entries.
- `ideasToLookAt:[{conceptId,title,word}]` excludes unintroduced concepts. `confidence:[{confidence:sure|unsure|guess,answers,accuracyPercent}]` excludes not-taught responses; accuracy is null with no answers.
- `wins:[{id,title,awardedAt}]` contains this month's earned badges only. Empty wins/ideas and an empty calendar are valid; do not invent activity.

## Lesson
- `GET /concepts/:conceptId/notebook-lesson` returns the existing public lesson plus `styles`, `priorClassBridge`, `outline`, `video`; `{found:false}` means the teacher has not shared a lesson.
- `styles:{notes:{text},story:{steps},diagram:{blocks},exam:{worked,summary}}` reuses authored NCERT lesson material, not fabricated variants. Diagram blocks may be empty.
- `priorClassBridge` is null or `{conceptId,title,sourceClass,minutes,repair}`. `outline` lists the available sections. `video:null` deliberately means no verified video segment is available; never substitute a YouTube search URL.
- Keep existing `POST /concepts/:id/lesson/checkpoint` and `/lesson/faded` answer submissions and remediation routes. Read responses omit checkpoint/faded answers and diagram label keys. Render feedback only after the answer response; do not ship answer keys in client content.

## Quiz
- `POST /chapters/:chapterId/quiz-rounds` with `{gameId?,limit?}` starts one persisted round of an existing game (default `quick_revision_quiz`, six questions).
- `GET /quiz-rounds/:roundId` -> `{id,chapterId,gameId,startedAt,completed,answered,total,correct,item,strip}`. `item` is the current public item, null when complete. `strip:[{itemId,state:correct|try_again|current|next}]` is server-owned and survives reloads.
- `POST /quiz-rounds/:roundId/answer` uses the existing practice event `{clientEventId,itemId,answer,timeMs,clientTs,confidence?}` -> `{round,answer}`. The answer includes `errorType`, `explanation` (why wrong), `fix`, `repeatedError`, and the answered item's `correctOption`. Only then may the UI show its solution.
- Retry with the same event/payload: no duplicate evidence or strip advance. Out-of-order answers return 409; another pupil cannot read the round. No published practice returns 409 `NO_PRACTICE`. Existing remediation requirements still apply.

## Diagnostic
- `GET /chapters/:chapterId/notebook-diagnostic` -> `{chapterId,offered,title,questions,soFar}`. Questions are public MCQs tagged `sourceClass`; only linked Class 6-8 prerequisites or tagged earlier same-class chapters are eligible. Banks below five valid questions are not offered; the cap is eight.
- Every question includes `Haven't learned this yet`. Submit all answers to existing `POST /chapters/:chapterId/diagnostic`; never mark that option wrong in the UI. It writes `notTaught` evidence but does not change mastery or earn a streak touch.
- `soFar:{answered,total,gotIt,workingOn,notTaught}` comes from saved diagnostic evidence. Before submission it is zero; use local answers for an unsaved running preview. After submission `offered:false`, `questions:[]`; repeat submission returns 409. New chapter concepts remain New.

## Teacher home
- `GET /teacher/home` -> `{kpis,heatTable,reviewQueue,nudges}` for assigned sections/subjects only.
- `kpis:{diagnostic:{done,total},handedIn:{done,total},studiedThisWeek:{done,total},commonMistake:{errorType,count}|null}`. Diagnostic totals count pupil-chapter checks; handed-in totals count pupil-assignments; studied counts pupils with recorded answer evidence this IST week.
- `heatTable:[{sectionId,name,concepts:[{conceptId,title,total,counts:[{word,count}]}]}]` uses word buckets, not student-facing numeric categories.
- `reviewQueue:[{id,chapterId,sectionId,status,createdAt,message}]` exposes review metadata, never unpublished draft answer keys. `not_configured` means no generation provider is configured, not a fabricated ready lesson.
- `nudges:[{profileId,name,sectionId,reason}]` is private teacher information (inactivity/help with an idea). No assignments yields empty arrays and zero counts.

## Parent home
- `GET /parents/children/:childProfileId/home` -> `{child,weekMinutes,homework:{done,total},streakDays,subjects,gotIt,workingOn,remarks,teacherRemark,comingUp}`.
- Subjects: `{subjectId,name,word,done,total}`. Got-it/working-on entries: `{conceptId,title,word}`. Working-on excludes New concepts.
- `remarks:[{id,title,body,sectionId,createdAt}]` are parent-visible school announcements for this child's section. `teacherRemark` reuses the existing confirmed teacher remark availability/text. `comingUp:[{assignmentId,title,dueAt}]` contains outstanding published work.
- Only linked children are accessible. No Saathy messages, private teacher nudges, numeric learning levels or draft answer keys are returned. No recorded work means zero time, empty lists and New words.

## Games board
- `GET /student/games` -> `{chapters:[{chapterId,title,subjectId,games:[{gameId,state,opensAfter}]}],todaysGame,atomForge}`.
- Only the five existing game IDs are listed. `state:open|locked`; `opensAfter` is null or a human-readable prerequisite/publication reason. `todaysGame` is null or `{chapterId,gameId}` from an open chapter.
- Atom Forge is always `{status:paused,label:Coming back soon}`, never today's recommendation. No new game implementation or Atom route changes.

## Settings
- `GET /student/settings` and `PUT /student/settings` use `LearningPreferencesSchema` from contracts. PUT saves the complete value (omitted fields reset to defaults).
- `{style:notes|story|diagram|exam,whenStuck:hint|example|simpler,questionsPerSet:3..10,dailyGoalMinutes:5..60,reminder:HH:mm|null,biggerText,plainFont,reduceMotion,language:en|hi}`.
- Defaults: notes, hint, five questions, 20 minutes, null reminder, accessibility flags false, en. Values persist per signed-in student; invalid values/unknown keys return 400. Reminder is a stored preference, not a new push scheduler.
