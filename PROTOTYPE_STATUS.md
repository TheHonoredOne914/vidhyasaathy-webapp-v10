# Dashboard prototype

Scope: shared fictional dashboard dataset, Parent/Teacher/Admin demo workspaces, and sign-in demo entries. Student learning, Saathy, study sessions, games and API work belong to the other prototype runs.

| Feature | REAL/DEMO | Status | Route | Files | Test |
| --- | --- | --- | --- | --- | --- |
| Shared sample school, validated browser persistence, scoped reset | DEMO | Implemented | `/demo/*` | `apps/web/src/demo/data.ts`, `store.tsx`, `DemoLayout.tsx` | `data.test.ts`; verification in progress |
| Parent notebook, two linked children, filters, charts, Translator, drill-ins | DEMO | Implemented | `/demo/parent` | `apps/web/src/demo/ParentWorkspace.tsx` | Verification in progress |
| Teacher roster, reports, Radar, assignment creation | DEMO | Implemented | `/demo/teacher` | `apps/web/src/demo/TeacherWorkspace.tsx` | Verification in progress |
| Admin search/filter and add/edit for all four record types | DEMO | Implemented | `/demo/admin` | `apps/web/src/demo/AdminWorkspace.tsx` | Verification in progress |
| Four sign-in entries; existing API for Aarav, standalone demos for adults | REAL/DEMO | Implemented | `/signin`, `/signin/student` | `apps/web/src/demo/DemoEntryButtons.tsx`, `App.tsx`, `NotebookSignIn.tsx` | Verification in progress |

See [PROTOTYPE_STATUS-dash.md](PROTOTYPE_STATUS-dash.md) for the dashboard handoff and final validation results.
