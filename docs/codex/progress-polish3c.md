# polish3c

## Games
- Rebuilt the featured card, subject tabs and illustrated grid; today's recommendation comes from `/student/home`, chapter access from the signed-in student's subjects and chapter statuses. Atom Forge remains a non-interactive coming-soon card; no game implementation or route changed.
- Added notebook loading/error/retry and empty-subject states. Five desktop tiles per row, three at tablet width, two on mobile; no fixed card heights. Existing sparse data is not padded with fictional games or scores.
- Backed up existing local `apps/api/data/*.db` before starting the prescribed demo runner on API 3009 / web 5181. No database is staged.
- `npm run typecheck`: passed. `npm run test:unit`: 71 files passed; 287 passed, 1 skipped.
- Chromium screenshots saved at 360, 1440 and 1920. Actual `innerWidth/document.scrollWidth`: 360/360, 1024/1024, 1280/1280, 1440/1440, 1920/1920. Compared 1440 with the mockup; corrected the featured-card width and five-column grid. Aarav's API currently returns no today's game; the honest fallback has no Play button.

## Notifications
- Student Today/Earlier cards use server groups, unread highlights, action enums and real timestamps. Mark-all posts to `/notifications/read-all`; every preference PUT includes the mandatory settings fields. Teacher/parent inboxes remain available.
- Added the five available notification toggles, quiet-after-21 toggle, blue sticky and reachability policy rail. No fabricated notices or unread counts.
- `npm run typecheck`: passed. `npm run test:unit`: 71 files passed; 287 passed, 1 skipped.
- Chromium Aarav and Priya: 360/360, 1024/1024, 1280/1280, 1440/1440, 1920/1920. Saved both users at 360/1440/1920 and compared 1440 with the mockup. Priya's preference toggle survived reload and was restored; mark-all persisted after reload. One screenshot retry followed a demo API watcher restart (`ECONNREFUSED`); retry passed.
