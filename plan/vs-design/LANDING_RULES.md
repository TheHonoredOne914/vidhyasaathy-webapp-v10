# VidhyaSaathy Landing Rules
I fetched 101 homepages on 25 Oct 2026. Static HTML from 82 of them could be parsed: H1, H2 order, image and video counts, CTA labels and font hints. Data is in `landing-research.csv`.

These 15 rendered only with JavaScript or blocked the fetch, so they are excluded: Duolingo, Calm, OpenAI, Perplexity, Spotify, Brainly, Edpuzzle, Gusto, MasterClass, Quizizz, Scrimba, Skillshare, Outschool, Teenage Engineering, mmm.page. Airbnb, Nike, Tesla and Khan Academy were also blocked.

Motion and colour findings below come only from markup signals such as `<video>` counts and font files. I did not view the pages visually.

## Structure
1. **Main H2 sections: 6–10.** The median was 9. Examples: Notion has 5, Raycast 7 and ClassDojo 6.
2. **Order the page Hero → proof → 3–5 capability sections → trust/safety → closing CTA.** Seen on Brex, Mercury, Seesaw and ClassDojo.
3. **The last section is a closing CTA band with a short line and one button.** 25 of 82 sites had one, e.g. ClassDojo's "Let's get growing", Supabase's "Build in a weekend, scale to millions" and Framer's "Your next idea starts here".
4. **Audience-segment sections come right after proof.** 11 sites had role sections. Seesaw uses Teachers / Admins / Families / Students; Prodigy and Brilliant use Teachers and Parents.
5. **A short FAQ goes just before the closing CTA (4–6 questions).** Seen on Synthesis, Babbel and Mathway.
6. **The top nav has 4–6 links, plus Log in and one filled CTA.** Seen on Stripe, Dropbox and Superhuman.

## Hero
7. **The H1 is 9 words or fewer.** 70 of 75 measurable H1s met this; the median was 6 words. Examples: Raycast "Your shortcut to everything.", Mercury "Radically different banking" and Kahoot "Make learning awesome!".
8. **A subline of 12–25 words sits under the H1.** Seen on Stripe, Brex and Seesaw.
9. **The hero has at most 2 CTAs: one filled, one ghost.** Stripe uses "Start now" and "Contact sales"; Dropbox uses "Sign up" and "Get app"; Retool uses "Start for free" and "Book a demo".
10. **The primary CTA is 2–4 words and is a verb.** Examples: "Get started" (Asana, Brex), "Try it for free" (Synthesis), "Start your project" (Supabase).
11. **A one-line proof sits under or inside the hero, either a number or a logo row.** Mercury says "Loved by 450K+…", Brex "Trusted by 35,000+…" and Dropbox "700 million…".

## Copy
12. **Each H2 is a benefit statement of 8 words or fewer, not a feature noun.** Raycast has "It's not about saving time."; Seesaw has "Most platforms show you data. Seesaw shows you learning."
13. **Each H2 gets one supporting sentence of 25 words or fewer.** Seen on Notion, Raycast and Craft.
14. **Use a contrast pattern ("X, not Y") once or twice per page.** Examples: Monzo "Spend your money on life, not your life on money", Mathway "the method, not just the answer" and Seesaw.
15. **Use the second person ("you" / "your child") in the hero.** Synthesis says "Your child's personal math tutor."; Brilliant says "Your personal tutor…".
16. **Avoid SEO-dump copy.** Vedantu's 17-word title H1 and its NCERT link walls are the anti-pattern. Keep SEO text on separate pages.

## Visuals
17. **Each section has one dominant product visual or illustration, never a grid of screenshots.** Seen on Notion, Raycast and Photomath (Scan / Solve / Learn as one image per step).
18. **When a product has several features, put them behind tabs or a stepper instead of showing every screenshot.** Superhuman uses tabs for Mail, Grammarly, Docs and Go; Supabase uses a product tab list; Photomath uses steps.
19. **A mascot or character is the emotional anchor in kid edtech.** Brilliant has Koji, ClassDojo uses its own display fonts and monsters, and Prodigy has its game world.
20. **Show the product in use, such as a "real lesson in action".** Seen on Synthesis and Brilliant (4 videos on its page).

## Motion
21. **Motion should be short, muted, looping video or animation used in 1–3 places, not on everything.** Brilliant has 4 `<video>` elements, Synthesis 14 and Notion 1; calm sites like Stripe and Mercury have 0–1.
22. **Scroll reveals stay subtle: under 400 ms, a fade plus 8–16 px of movement, and they respect `prefers-reduced-motion`.** This is a standard practice, not something I measured.

## Type & colour
23. **Use one sans family, plus at most one display or accent face.** ClassDojo pairs DojoText with Grandstander, Arc pairs a sans with Space Mono, and Superhuman pairs a sans with SuperSansMono.
24. **The handwritten or accent face is used only for annotations of 6 words or fewer.** Seen in ClassDojo's Grandstander accents.
25. **Use one brand accent colour for CTAs and one secondary for highlights.** Monzo uses a single "Hot Coral"; Stripe and Mercury are restrained. This is inferred from markup.

## Trust
26. **Use a quantified proof stat.** Prodigy: "91% of parents…"; Oura: "86% of members…"; Mercury: "450K+".
27. **Give privacy and safety a dedicated section for child products.** ClassDojo: "Privacy first—always"; Seesaw: "Safe for Students, Built For Districts". 17 of 82 sites had a security or privacy section.
28. **Testimonials name a real role.** Seesaw has "Maricar O.'s Lightbulb Moment"; Brilliant has "Students, parents, and teachers love us".
29. **For India, state the exact local fit (board, exam, language).** PW says "Bharat's Trusted & Affordable…"; Unacademy says "India's top educators"; Vedantu names CBSE/ICSE.

## Performance
30. **Keep the HTML small and ship images as AVIF/WebP with explicit sizes.** Lean pages include Mathway (3 images), Photomath (12) and Resend (12). Heavy ones are monday (391 images) and ClickUp (275).
31. **Serve the hero image under 200 KB and lazy-load everything below the fold.**
32. **Preload at most 2 font files, using `font-display: swap`.**
33. **Aim for LCP under 2.5 s on a 4G mid-range Android.** Most Indian parents use one.

## Edtech / kids-specific
34. **Give each audience its own path, with a role switcher or a card per role.** Seesaw, ClassDojo and Nearpod do this.
35. **Speak to the parent's outcome, not the features.** Synthesis has "For the whole family"; Prodigy cites parent stats.
36. **Make it feel like play: show the game world, not a dashboard.** Prodigy, Kahoot ("Make learning awesome!") and Discord's playful H2s.
37. **The B2B buyer (the school admin) gets its own CTA, such as "Register your school" or "Book a demo".** ClassDojo, Seesaw ("REGISTER FOR THE WEBINAR") and Google Classroom.

## Applied to VidhyaSaathy — "Day to Night"
**The brand:**
- **Colours:** navy #0F1B3D (night), ivory #FBF6EC (day), sky #7FB3FF (the line, links and focus), peach #FFB38A (the primary CTA, used only on CTAs and the 5 PM chips).
- **Fonts:** Plus Jakarta Sans (weights 400/600/800). Patrick Hand is used only for time stamps and arrow annotations (rule 24).

### Blueprint (8 sections plus the footer; rule 1)
0. **Nav:** the logo with "Learning, with you", then How it works · For schools · Games · Parents, then Log in, then a peach "Register your school" button.

1. **Hero (split, Day | Night).**
   - The left side is an ivory classroom; the right side is a navy desk with the cloud mascot. A glowing sky line runs left to right.
   - **H1 (7 words):** "Learning doesn't stop when the bell rings."
   - **Sub:** "VidhyaSaathy connects your school's classroom to every student's home study, with teacher notes, an AI study buddy, games and parent reports."
   - **CTAs:** "Register your school" (filled peach) and "I'm a student" (ghost).
   - **Proof line:** a real pilot number only. If there's no number yet, use "Built for CBSE & state boards · Grade 9".

2. **Roles strip (rule 34):** 4 tinted cards (Admin, Teacher, Student, Parent), each with a 1-line outcome and a link to its own path.
   - "Run your school from one place."
   - "Share notes once, see who understood."
   - "Your textbook, explained your way."
   - "Know how your child is doing, every night."

3. **"A student's day" scroll story.** The background goes from ivory to navy. Each stop has a Patrick Hand time stamp and one visual (rule 17).
   - **3 PM, the teacher shares notes:** "Today's lesson, already at home." Use the teacher-notes UI.
   - **5 PM, Saathy chat:** "Stuck? Ask Saathy, in Hinglish if you like." Use the saathy-chat visual.
   - **7 PM, games:** "Revise by playing." One tabbed panel (rule 18) holds Bio Quest, Atom Workshop 3D, Reflection Lab, Tinker and Maths War, with one image showing at a time.
   - **9 PM, parent report:** "A two-minute report, not a guessing game." Use the learner-model visual.

4. **Board Examiner:** "Practice with an examiner who marks like your board." One visual plus 3 bullets.

5. **Safety & privacy (rule 27):** "Safe for students. Built for schools." Covers no ads, school-owned data, parent visibility and DPDP-aware handling. State only what is true.

6. **Proof / testimonials (rules 26 and 28):** quotes from named roles (teacher, parent) from the pilot. Leave this hidden until real quotes exist.

7. **FAQ (5 questions):** Which boards? Does it work on low-end phones and offline? What does it cost the school? Who sees my child's data? Does it replace teachers?

8. **Vision band (closing CTA, rule 3):** a starry navy band with the mascot asleep on books.
   - "A school system where no child needs a coaching class to understand their own textbook."
   - Button: "Register your school".

9. **Footer:** product links, roles, privacy, contact, language.

### Dev checklist
- [ ] H1 ≤ 9 words; every H2 ≤ 8 words with one sentence ≤ 25 words.
- [ ] At most 2 CTAs in the hero, and only one filled CTA per viewport. Peach is used only for CTAs.
- [ ] 6–10 sections in total, ending with the vision CTA band.
- [ ] Exactly one visual per section. The 5 games sit in a single tabbed panel (keyboard-accessible, `role="tablist"`).
- [ ] Patrick Hand is used only on annotations ≤ 6 words.
- [ ] Two font families; preload ≤ 2 woff2 files with `font-display: swap`.
- [ ] The hero image is ≤ 200 KB AVIF/WebP with width and height set. Everything else uses `loading="lazy"`.
- [ ] Motion is ≤ 400 ms fade plus translate and is disabled under `prefers-reduced-motion`. There is no autoplaying video above the fold.
- [ ] Lighthouse mobile scores are ≥ 90 for both performance and accessibility. Text contrast is ≥ 4.5:1 on both ivory and navy.
- [ ] No invented stats or testimonials; those sections stay hidden until real data exists.
- [ ] Every role card links to its real flow (`/register-school`, `/signin?role=...`), following USER_FLOW.md.
