# Dashboard prototype

Scope: shared fictional dashboard dataset, Parent/Teacher/Admin demo workspaces, and sign-in demo entries. Student learning, Saathy, study sessions, games and API work belong to the other prototype runs.

| Feature | REAL/DEMO | Status | Route | Files | Test |
| --- | --- | --- | --- | --- | --- |
| Shared sample school, validated browser persistence, scoped reset | DEMO | Complete | `/demo/*` | `apps/web/src/demo/data.ts`, `store.tsx`, `DemoLayout.tsx` | 5 new data tests + browser persistence/reset pass |
| Parent notebook, two linked children, filters, charts, Translator, drill-ins | DEMO | Complete | `/demo/parent` | `apps/web/src/demo/ParentWorkspace.tsx` | Browser/mobile/axe pass |
| Teacher roster, reports, Radar, assignment creation | DEMO | Complete | `/demo/teacher` | `apps/web/src/demo/TeacherWorkspace.tsx` | Browser/mobile/axe pass |
| Admin search/filter and add/edit for all four record types | DEMO | Complete | `/demo/admin` | `apps/web/src/demo/AdminWorkspace.tsx` | Browser/mobile/axe pass |
| Four sign-in entries; existing API for Aarav, standalone demos for adults | REAL/DEMO | Complete | `/signin`, `/signin/student` | `apps/web/src/demo/DemoEntryButtons.tsx`, `App.tsx`, `NotebookSignIn.tsx` | Entries verified; Student requires existing API |

Validation: root typecheck PASS; web unit tests 39 files / 140 tests PASS; web production build PASS; focused browser checks PASS, zero page errors and zero tested WCAG A/AA violations. No full E2E run. Repeat browser checks with `node apps/web/scripts/demo-smoke.mjs` against a server on port 5373 (or set `DEMO_URL`).

See [PROTOTYPE_STATUS-dash.md](PROTOTYPE_STATUS-dash.md) for the dashboard handoff and final validation results.
