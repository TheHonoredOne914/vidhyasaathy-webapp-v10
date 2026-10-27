CURSOR - Phase P4 UI. Read plan/PHASES.md (your phase section), plan/SPEC_SUMMARY.md, plan/AGENT_RULES.md, plan/vs-design/TRD.md, plan/vs-design/USER_FLOW.md, plan/vs-design/DESIGN_SPEC.md. Follow the user flows in the docs exactly for every role. Visual style: match the current Sign-in/Register look (navy night + ivory, sky #7FB3FF, peach #FFB38A, Plus Jakarta Sans, Patrick Hand (via @fontsource/patrick-hand) for every handwritten/note accent instead of Caveat, apps/web/src/auth/auth.css tokens) - premium, hand-crafted, never plain white paper. No Supabase, no Android. Be token efficient.
Do ONLY the CURSOR part of P4 in apps/web and e2e, consuming the P4 contracts Codex just added in packages/contracts. If an API is missing, note it, do not fake data silently. Fix any failing tests including api ones caused by Codex (you may edit apps/api only to fix a failing test). Then run npm run typecheck, npx vitest run, npx playwright test only on the e2e specs you added or touched this phase until green (full suite runs at the end), then git add -A and git commit -m P4. Save 1280px screenshots of each new screen to e2e/screenshots/p4-*.png. End with a short summary.

SPEED: work fast and lean. Reuse existing components and styles, no exploratory refactors, minimal reading beyond your phase section.

ANTI-VIBE: read plan/vs-design/VIBE_TELLS.md and avoid every tell (no purple, no gradient text, no emoji icons, no glow/glass, no 3 identical icon cards, no 'seamless/unlock/empower' copy, no left-accent-border cards). Run its rg checklist on files you touched before committing.

FONT OVERRIDE (user, latest): use Patrick Hand EVERYWHERE in the app (headings, body, buttons, inputs) as the only font family; keep it readable (min 16px body, line-height 1.5). Remove Plus Jakarta Sans usage.

FIRST: switch the global font-family tokens (tokens.css, brand.css, vs-theme.css, auth/auth.css, landing/landing.css, index.html preload) to Patrick Hand and remove Plus Jakarta Sans imports.
