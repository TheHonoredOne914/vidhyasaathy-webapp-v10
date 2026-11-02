# Dashboard prototype status

All dashboard data is fictional and separate from school records. Branch: `proto-dash`.

| Feature | REAL/DEMO | Status | Route | Files | Test |
| --- | --- | --- | --- | --- | --- |
| Shared dataset and resettable browser store | DEMO | Complete | `/demo/*` | `apps/web/src/demo/data.ts`, `store.tsx`, `DemoLayout.tsx` | 5 data tests pass; browser persistence/reset checks pass |
| Parent workspace | DEMO | Complete: child switcher, period/subject filters, activity/time charts, progress, concepts, assignments, games/sessions drill-ins, Parent Translator | `/demo/parent` | `ParentWorkspace.tsx`, `Charts.tsx`, `demo.css` | Browser interactions, mobile overflow and WCAG A/AA checks pass |
| Teacher workspace | DEMO | Complete: class switcher, search, student details, weekly report, Classroom Radar, local assignments | `/demo/teacher` | `TeacherWorkspace.tsx`, `DemoDialog.tsx` | Browser interactions, shared assignment, mobile overflow and WCAG A/AA checks pass |
| Admin workspace | DEMO | Complete: classes/teachers/students/subjects, search/filter, add/edit, class activity chart | `/demo/admin` | `AdminWorkspace.tsx` | All four add/edit forms, duplicate validation, filtering and reset pass; mobile/WCAG checks pass |
| Sign-in role entries | DEMO/REAL | Complete: demo workspace links; Student uses existing API login for Aarav | `/signin`, `/signin/student` | `DemoEntryButtons.tsx`, `NotebookSignIn.tsx`, `App.tsx` | All four entries visible in browser; real Student login requires running API and seeded Aarav |

## Verification notes

- Node 24.22.2. Dependencies installed using Node's system CA store after a local certificate-chain error; TLS verification stayed enabled.
- `npm run typecheck`: PASS across API, web, contracts and core. Final web typecheck also PASS after table accessibility changes.
- `npm run test:unit -- --project web`: PASS, 39 files / 140 tests, including 5 new shared-data tests. API and full E2E suites were not run for this frontend-only scope.
- `npm run build -w apps/web`: PASS. Vite reports its large vendor chunk warning; no build errors.
- `node apps/web/scripts/demo-smoke.mjs`: PASS in Chrome at 1440px and 390px. Shared assignment propagation, refresh persistence, child/class switching, filters, reports, Radar, activity details, all four add/edit record forms, duplicate validation, Escape dismissal, reset isolation and sign-in entries checked. No browser page errors or horizontal mobile overflow. Axe WCAG A/AA: zero violations in all three tested workspaces (teacher reports view).
- Desktop/mobile JPEG screenshots are local artifacts under ignored `test-results/`; no AI images were created.
- Landing, authenticated workspaces, student learning pages, Saathy, games, API and databases remain unchanged.

## Run and review

1. Start the web app with Node 24 and the existing `VITE_API_PROXY_TARGET` configuration, then open `/signin` or any `/demo/parent`, `/demo/teacher`, `/demo/admin` route. Adult mock dashboards work without a running API.
2. To repeat the focused browser check, run `node apps/web/scripts/demo-smoke.mjs` from the repo root against a dev or preview server. Default: `http://127.0.0.1:5373`; override with `DEMO_URL`. The script uses installed Chrome by default (`DEMO_BROWSER_CHANNEL` can select another installed Playwright channel).
3. The browser script stubs only API requests; it never logs in or changes live school records. The Student entry is wired to the existing real demo-student listing and PIN-login endpoints, using Aarav's configured PIN. Its server integration was preserved, not replaced with fictional authentication.
4. Demo records use one versioned browser-storage key, `vidhyasaathy.dashboard-demo.v1`. Reset restores only that sample dataset and closes editors/filters; all other browser storage is retained. Adding a sample student creates no mastery or activity claims. The two linked parent children are Aarav and Priya.
