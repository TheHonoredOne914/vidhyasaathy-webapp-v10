# CURSOR REDESIGN: match the user's own designs (own apps/web/** and e2e/** only)
Read plan/vs-design/DESIGN_SPEC.md fully and look at every image in plan/vs-design/refs/. These are the user's designs; match them closely (layout, colours, type, copy, spacing). Copy images from plan/vidhyasaathy/assets/ into apps/web/public/.
Rebuild: landing page (exact sections + copy from spec/ref 01), sign-in (ref 02), registration + Phase 2 setup wizard visual (ref 03), student home mobile + desktop shell (refs 04,06,07), Saathy chat layout (ref 05; UI shell only, real API states, "AI not configured" if none). Admin/teacher use the same desktop shell.
Keep all existing routes, API calls and behaviour working. No fake data/stats, no dev tags (AI-35 etc.), no non-working buttons (hide or disable with reason). Keep axe clean, no horizontal scroll at 360px.
Run nothing destructive. Update e2e screenshots (landing, signin, register, student 360/1280, admin).

## USER FLOW (mandatory)
Follow plan/vs-design/USER_FLOW.md exactly: screen order, entry points, next screens, error/empty/denied states per role. Don't add screens it doesn't list. Decisions on its conflicts: UI says "activation code"; no Google/Microsoft sign-in buttons; no streak card yet (PRG-05 later); web-only wording (no "download the app"); registration = 4-step layout from ref 03 plus a city field. For NOT IN DOCS items use the simplest plain option in the theme.

Also read plan/vs-design/TRD.md; its FIXED items (except the Android/Postgres stack, we are web + SQLite) override other docs.
