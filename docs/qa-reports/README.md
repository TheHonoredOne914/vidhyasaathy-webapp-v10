# VidhyaSaathy — QA & UX Deliverables

Work products from the full review pass on branch `atom-kz` (loose-auth prototype preview).

| File | What it is |
| --- | --- |
| `VidhyaSaathy_Test_Report.md` | Full test report: 30–50 parallel-agent test pass results, bugs found, tweaks list |
| `VidhyaSaathy_UX_Checklist_Report.md` | UI/UX checklist with per-screen findings and issue severity |
| `VidhyaSaathy_Final_Prompt_File.md` | Consolidated final prompt file: everything fixed, everything still open, ready to hand to a future dev/agent session |
| `screenshots/` | 8 numbered captures of the app state during the review (landing, student home, broken next-action, subject path, concept lesson, games board, teacher home, parent home) |

## Related code commits on this branch

- `bd16524` — demo: loose sign-in for prototype preview (env-gated `DEMO_LOOSE_AUTH`)
- `f4cda8e` — demo: release seeded Motion session 1h in the past (preview-friendly)
- `1e4de3e` — preview: one-command `npm start` (web `:3000`, origin-proxy CSRF hop, demo seed + loose auth)

## Demo login (loose auth, preview only)

| Role | Credentials |
| --- | --- |
| Student | any name + any 4-digit PIN (e.g. `Aarav` + `9999`) |
| Teacher | `teacher@demo.invalid` + any password |
| Parent | any 10-digit mobile + any OTP |
| Admin | `admin@demo.invalid` + any password |
