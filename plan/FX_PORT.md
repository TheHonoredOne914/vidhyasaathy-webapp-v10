APPLY APPROVED REFINEMENTS (keep it SUBTLE, do not overdo). Source: plan/vs-hero/fx.css, fx.js, landing.html, signin.html, register.html.
Port into apps/web: a shared <SchoolBackground/> component (lighter brand blue->ice->ivory gradient, few slow drifting hand-drawn clouds, ~8 low-opacity floating doodles: pencil, eraser, ruler, paper plane; respect prefers-reduced-motion; pointer-events none; cheap CSS transforms only). Use it on Landing, SignIn, RegisterSchool, student access, and as a very faint version in the app shell background.
Add small inline SVG icons beside role headers, auth tabs and form labels. Hover lift on note artefacts, wavy underline on links, scroll fade-in, gentle mascot bob.
Footer: bottom row full width: left "(c) 2026 VidhyaSaathy. All rights reserved.", middle About / How it works / Privacy / Contact, right "Learning with you".
Swap old colours (#13224A, peach, sky) for brand: Midnight #041D3D, Deep #193E69, Classic #28517C, Cool #517DAB, Ivory #F9F6EE, Ice #D6E2E6. Patrick Hand only.
Only touch Landing, auth, app-shell background, public/img and a new components/SchoolBackground. Keep logic/testids. Do not run npm. List changed files.
