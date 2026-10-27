# CODEX FLOW CHECK (after all UI work). Read plan/vs-design/USER_FLOW.md and DESIGN_SPEC.md.
Walk every role's flow in apps/web routes and apps/api. List mismatches (screen missing, wrong order, wrong redirect, missing error/empty/denied state, off-theme page). Fix them in place, keeping the theme from plan/vs-design. No fake data, no dead buttons. No commits. End with a table: flow step | status | file touched.
## USER FLOW (mandatory)
Follow plan/vs-design/USER_FLOW.md exactly: screen order, entry points, next screens, error/empty/denied states per role. Don't add screens it doesn't list. Decisions on its conflicts: UI says "activation code"; no Google/Microsoft sign-in buttons; no streak card yet (PRG-05 later); web-only wording (no "download the app"); registration = 4-step layout from ref 03 plus a city field. For NOT IN DOCS items use the simplest plain option in the theme.

Also read plan/vs-design/TRD.md; its FIXED items (except the Android/Postgres stack, we are web + SQLite) override other docs.

## Must-fix visual bugs (from screenshots)
1. Landing hero at 1280px: headline is a narrow column and the hero image floats top-right. Match ref 01: two-column hero, text left, mascot image right, same vertical band.
2. Student home shows a raw UUID under the learning profile. Remove it from the UI.
3. Restyle wizard, admin home, class/section/subject, roster import and claim-sheet screen views to the theme (ref 03 card + progress bar for the wizard; desktop shell for admin). The print view stays plain black on white.
