# polish3c data gaps

## Games
- `/student/home` supplies today's game but no full per-student game catalogue, unlock concept or personal best. Existing registry names and illustrations are used, with real chapter titles where available; no scores, stars or levels are invented. Need `GET /student/games` with game/chapter/concept links, unlock status and personal-best labels to replace legacy chapter-title matching.

## Notifications
- No separate school-notices preference exists. The fifth toggle uses the supported `notifyParentView` field and is labelled Parent updates, rather than pretending to save school notices. Quiet-hours copy uses the supported `quietAfter21` setting.
- The ruled sheet/topbar are shared, read-only files. Their existing graph-paper background and search width differ from the supplied mockup; no shared theme was changed.
## Settings
- `PUT /notification-settings` persists Reduce motion. Bigger text and Plain font persist only in this browser; restoring them on other routes after a fresh load needs shared-shell ownership. No read-aloud control is rendered.
- Needed: `GET/PUT /student/preferences` with explanationStyle, helpStyle, practiceLength, dailyMinutes, reminderTime, language, biggerText and plainFont. Unavailable choices stay disabled rather than pretending to save; the daily sticky uses actual `/student/home` task counts, not invented minutes.
- Needed: linked-parent display name in `/student/enrollment`, and an authenticated change-PIN endpoint. Change PIN currently opens existing recovery instructions; the profile uses real enrollment/school fields.

## Teacher home
- The dashboard lacks weekly diagnostic participation, weekly learning time and dated misconception totals. KPI cards use actual assigned students, completed sessions, pending answers and concepts needing practice; they do not claim weekly totals.
- Needed: per-student mastery grouping in the teacher dashboard, an AI lesson-draft review list and a private follow-up delivery endpoint. By student is disabled; Lesson review uses actual pending student answers from `/attempts?pendingOnly=true`; follow-up opens the existing review workspace, with delivery explicitly unavailable.
- Real concept rows and assigned class/section names replace the mockup's demo data. The shared ruled-sheet/topbar styling is still owned by polish3a; no shared background or palette was changed.
