# Dashboard prototype status

All dashboard data is fictional and separate from school records. Branch: `proto-dash`.

| Feature | REAL/DEMO | Status | Route | Files | Test |
| --- | --- | --- | --- | --- | --- |
| Shared dataset and resettable browser store | DEMO | Implemented | `/demo/*` | `apps/web/src/demo/data.ts`, `store.tsx`, `DemoLayout.tsx` | Invariant, persistence and date-boundary tests added; execution pending |
| Parent workspace | DEMO | Implemented: child switcher, period/subject filters, activity/time charts, progress, concepts, assignments, games/sessions drill-ins, Parent Translator | `/demo/parent` | `ParentWorkspace.tsx`, `Charts.tsx`, `demo.css` | Verification pending |
| Teacher workspace | DEMO | Implemented: class switcher, search, student details, weekly report, Classroom Radar, local assignments | `/demo/teacher` | `TeacherWorkspace.tsx`, `DemoDialog.tsx` | Verification pending |
| Admin workspace | DEMO | Implemented: classes/teachers/students/subjects, search/filter, add/edit, class activity chart | `/demo/admin` | `AdminWorkspace.tsx` | Verification pending |
| Sign-in role entries | DEMO/REAL | Implemented: demo workspace links; Student uses existing API login for Aarav | `/signin`, `/signin/student` | `DemoEntryButtons.tsx`, `NotebookSignIn.tsx`, `App.tsx` | Verification pending |

## Verification notes

- Node 24.22.2 selected. This worktree initially had no `node_modules`.
- First dependency installation hit a local certificate-chain error. Retrying with Node's system CA store; no TLS verification bypass.
- Landing, authenticated workspaces, student learning pages, Saathy, games, API and databases remain unchanged.
