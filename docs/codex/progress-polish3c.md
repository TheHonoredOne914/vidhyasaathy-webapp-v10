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
## Settings
- Rebuilt the four settings cards and profile/account rail. Existing staff settings remain intact. Reduce motion persists through `/notification-settings` and sets `data-reduce-motion` on `<html>`; browser-local Bigger text and Plain font survive reload. Unsupported preferences are clearly unavailable, not fake saved values.
- Chromium: 360/360, 1024/1024, 1280/1280, 1440/1440, 1920/1920. Saved 360/1440/1920; compared 1440 with the mockup and flattened the page head. Verified all three accessibility toggles through reload, restored original values, and checked enlarged text at 360px.
- `npm run typecheck`: passed. The unit thread pool crashed twice with native access violation `3221225477`; `npx vitest run --workspace vitest.workspace.ts --configLoader native --pool forks --maxWorkers 2 --reporter dot` passed: 71 files, 287 passed, 1 skipped. Passing `--pool forks` through the npm script duplicates its existing pool option, so the identical Vitest command was run directly.
- Corrected the local loading/error helper to render nothing after a successful load; refreshed Games, Notifications (both students) and Settings screenshots. All five widths remain equal to document scroll width. Screenshot checks now fail on uncaught page errors.
