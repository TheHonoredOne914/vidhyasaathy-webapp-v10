# CURSOR V2: LANDING PAGE ONLY (apps/web/src/routes/Landing.tsx + new apps/web/src/landing/** + apps/web/public/img/**, apps/web/src/ui/Logo.tsx, fonts setup). Do NOT edit SignIn, RegisterSchool, AuthForm or anything under apps/web/src/auth/.
Build the landing from refs 01 (dark, primary) with 02 as the light-mode feel. Sections, in order:
1. Nav (logo, For Students / For Teachers / For Parents / How it works anchors, Register a school, Sign in).
2. Hero: "Learning doesn't have to stop when the school bell rings." with mascot scene, two CTAs, "Already have an account? Sign in".
3. Role cards (4, tinted per role).
4. The learning loop (4 numbered steps).
5. NEW: "Inside VidhyaSaathy" product showcase using REAL screenshots from plan/v2/app: Saathy chat, learner model (4 learner groups, personalised learning), numerical game, AI board-examiner marking of handwritten answers.
6. NEW: "Learning games" gallery: Bio Quest (cell membrane), Atom Workshop 3D (isotopes), Reflection Lab (optics), Tinker; line "All these games are developed for the conceptual learning of students."
7. For parents & teachers: after-the-bell connection (daily teacher reports, parent dashboard, teacher-uploaded notes, friendly challenges).
8. School-connected AI + privacy and child safety.
9. Closing band with vision line "A school system where no child needs a coaching class to understand their own textbook." and CTAs. 10. Footer.
Copy must be plain, human, specific; no buzzwords.
## Shared direction (both agents)
The user hated the last version: "white paper with text", "vibe-coded", "AI-gen feel". Goal: classy, premium, hand-crafted, like a top UI/UX designer made it. Laptop (1280-1536px) is the priority; it must still work at 360px.
- References: plan/v2/refs/*.png. Match them closely: deep navy night scene (dark theme), cloud mascot at desk, cards with coloured tints per role (blue students, amber teachers, teal parents, violet admins), numbered learning-loop row, handwritten notes ("Better Learning, Brighter Futures").
- Logo: plan/v2/brand/logo-original.png (the real V with the open book and star). Use it everywhere; remove the old logo. Tagline "Learning, with you".
- Images: hero/mascot from plan/v2/brand/; real app screenshots from plan/v2/app/. Copy what you use into apps/web/public/img/ (compress to webp, max 1600px wide, lazy-load below the fold).
- Brand colours: Midnight #041D3D, Deep Academic Blue #193E69, Classic Blue #28517C, Cool Blue #517DAB, Warm Ivory #F9F6EE, Ice Blue #D6E2E6; accent sky #7FB3FF; warm peach/amber accent from the refs for highlights.
- Type: "Plus Jakarta Sans" (self-hosted via @fontsource, weights 400-800) for everything; "Caveat" only for the handwritten notes. Tight headline tracking, generous line height for body.
- Craft: real depth (layered image, subtle grain/vignette, soft inner borders), consistent 8px grid, crisp icons (lucide), refined hover/focus states, smooth 150-200ms transitions, prefers-reduced-motion respected. No generic gradient blobs, no emoji, no fake stats/testimonials, no dead links (link to real routes or in-page anchors).
- Keep existing routes, API calls, form logic and tests working. Do not touch apps/api or packages.
Finish: run web typecheck; update e2e/screenshots/landing-1280.png and landing-360.png.
