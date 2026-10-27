# VidhyaSaathy Web App: Design Spec (v1, built from the user's screenshots)

The reference images are in `refs/`. Where this spec and an image disagree, the image wins. Hex values were sampled from the PNGs; values marked ~ are estimated from anti-aliased text.

Image assets already on the box: `/workspace/vidhyasaathy/assets/{hero-scene.jpg,mascot.jpg,school.jpg}`. They show the cloud mascot at a laptop, the sunny window and the school building. Copy them into `apps/web/public/img/`.

## 0. Two surfaces, one brand
| Surface | Used for | Background | Feel |
|---|---|---|---|
| **Navy marketing** | Landing page and sign-in (refs 01, 02) | Midnight gradient | Dark glassy cards, mascot photography |
| **Light registration** | School registration and onboarding wizard (ref 03) | Ice `#E7EEF1` | Light card with a navy header and footer band |
| **Warm app** | Student, teacher and admin product screens (refs 04 to 07) | Ivory or peach | Calm cards with ice-blue headers, navy actions |

Do not put the dark theme inside the product screens. Do not put the warm ivory theme on the landing page.

## 1. Tokens (CSS variables)
```css
:root{
  /* brand */
  --midnight:#041D3D; --navy:#193E69; --navy-2:#28517C; --steel:#517DAB;
  --ivory:#F9F6EE; --ice:#D6E2E6;
  /* marketing (navy) */
  --mk-bg-top:#09213B; --mk-bg:#1C3D65; --mk-bg-deep:#0C2948;
  --mk-card:rgba(41,76,123,.55); /* sampled #233F66 to #294C7B */
  --mk-card-border:rgba(127,179,255,.18);
  --mk-accent:#7FB3FF;          /* the light-blue hero words, sampled #7BB1F9 to #7FB3FF */
  --mk-btn-grad:linear-gradient(180deg,#8DBDFF,#6EA6F5);
  --mk-text:#FFFFFF; --mk-muted:rgba(255,255,255,.72);
  --mk-input:#162F4A; --mk-panel:#0D284B;
  /* registration (light) */
  --rg-page:#E7EEF1; --rg-body:#F2F5F7; --rg-title:#1E4573;
  /* app (warm) */
  --app-bg:#FBF4EC;             /* mobile peach page */
  --app-bg-desk:#F9F6EE;        /* desktop main = ivory */
  --app-header:#FDF8F2;
  --card:#FFFFFF; --card-border:#F1D9C4;   /* peach border */
  --card-head:#EEF4FA;          /* ice-blue card header strip, also Saathy bubble */
  --divider:#DCE7F1;
  --text:#041D3D; --text-2:#46576D; --text-3:#99ABC0;
  --meta-brown:#8A4B1E;         /* ~ "Class 9-A · CBSE" subtitle */
  --peach:#FDEBDD; --peach-strong:#F2A27A; /* ~ the voice waveform */
  --success-bg:#D3E4D4; --success-text:#2F5E3A;
  --sidebar:#041D3D; --sidebar-active:#193E69;
}
```
- **Font:** Manrope 400/500/600/700/800 from Google Fonts. Fallback stack: `system-ui, "Segoe UI", sans-serif`. Do not use Onest.
- **Script accent:** Caveat 600 for the hero overlay notes only ("Better Learning. Brighter Futures.", "Same Dreams. Bigger Possibilities."), rotated about -8°, in `#3C64B0` on the image, with a peach underline `#F2A27A`. Use it on no more than two places in the whole app.
- Use `font-variant-numeric: tabular-nums` for counts, times and the "Q 3 of 5" style.

### Type scale
| Token | Desktop | Mobile | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| display (hero h1) | 56px | 36px | 800 | 1.08 | -0.02em |
| h2 (section) | 36px | 26px | 800 | 1.15 | -0.015em |
| h1-app (page title, e.g. "Same question, two kinds of answer") | 28px | 22px | 700 | 1.2 | -0.01em |
| h3 / card title | 18px | 17px | 700 | 1.3 | 0 |
| body | 16px | 16px | 400–500 | 1.55 | 0 |
| small | 14px | 14px | 500 | 1.45 | 0 |
| eyebrow / card label ("DAILY 5", "ASK SAATHY · CH 11") | 12–13px | 13px | 700 | 1.2 | +0.06em, uppercase |
| caption | 12px | 12px | 500 | 1.4 | 0 |

The mobile app type is large and readable: list body copy is about 17px and card labels are bold uppercase (ref 04).

### Spacing, radii, shadows
- **Spacing:** 4px base. The scale is 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64 / 96. Landing sections use 96px vertical padding on desktop and 64px on mobile. The marketing content container is 1120px max.
- **Radii:**
  - Pills and buttons: 999px (fully rounded).
  - Inputs: 10px.
  - App cards: 14px.
  - Marketing cards: 16px.
  - Auth and registration outer frame: 24px.
  - Chips: 8px.
- **Borders:**
  - App cards: `1px solid var(--card-border)`, the peach border.
  - App inputs and chips: `1px solid #E5D3C2`.
  - Marketing cards: `1px solid var(--mk-card-border)`.
- **Shadows:**
  - App cards: `0 1px 2px rgba(4,29,61,.04)`, very soft.
  - Marketing cards: `0 10px 30px rgba(0,0,0,.18)` plus an inner top highlight `inset 0 1px 0 rgba(255,255,255,.06)`.
  - Primary marketing button glow: `0 6px 20px rgba(127,179,255,.35)`.
  - Registration card: `0 20px 50px rgba(4,29,61,.10)`.

## 2. Components
**Logo lockup:** a white "V" mark with a small peach-orange tick on its left stroke. "VidhyaSaathy" is set in 700 18px, with "Learn · Grow · Together" in 11px at 70% opacity underneath. Build it as an inline SVG.

**Buttons:**
- **Marketing primary:** "Sign in to your school →". Pill, `--mk-btn-grad`, text `#041D3D` at 600 14px, 40px tall, 20px horizontal padding, with the glow shadow.
- **Marketing secondary:** "Register a school". Pill, transparent, `1px solid rgba(255,255,255,.35)`, white text.
- **Nav:** "Register a School" is the outline pill. "Sign in" is the light-blue gradient pill and the smaller of the two.
- **App primary:** "Start · 0 of 5". Full width inside the card, `--navy #193E69` background, white 700 18px text, 12px radius, 52px tall.
- **Registration primary:** "Next: Admin Information →". Pill, vertical gradient from `#28517C` to `#193E69`, white text.
- **Small tag button:** "PREVIEW", "Sign in →". White background, `1px solid var(--divider)`, `--steel` text, 600 12px uppercase.
- **Hover and focus:** primary buttons go 4% brighter on hover. Focus shows a 2px `--mk-accent` (marketing) or `--steel` (app) outline with a 2px offset. No scale bounces.

**App card ("labelled card", ref 04):**
- White body with a peach border and 14px radius.
- **Header strip:** `--card-head` background, 14px vertical × 18px horizontal padding.
- **Header content:**
  - Label: uppercase bold navy, e.g. "DAILY 5".
  - Meta after the label: " · Today, capped at 5 minutes", in 600 weight, not uppercase.
  - Right side: an expand icon (corners) in `--steel`, or a pill such as "Q 3 of 5".
- **Body rows:**
  - Each row has a small uppercase grey label (TODAY'S TOPIC / REVISION / PREREQUISITE / BONUS) in `--text-2`, then the item text in `--text`, with the right-hand meta ("today", "9 days ago", "weak link", "optional") in `--text-2` 14px.
  - Rows are separated by 1px `--divider`.

**Context chip:** "Ganita Manjari G9 · Ch 4 · §4.1 Cartesian Plane". White, peach border, 8px radius, 600 15px navy. It sits above the cards.

**Saathy chat bubbles (ref 05):**
- Saathy bubble: `--card-head` background, `1px solid #CFE0F0`, 14px radius. Starts with a bold "Saathy:" prefix, then the regular reply.
- Student text bubble (mobile): white with a light border, inset from the left by 12%, prefix "You:" or "You (spoken):".
- Student bubble (desktop, ref 06): solid `--navy` with white text, right-aligned, 10px radius.
- **Source citation:** a strip under an answer with a 3px left border in `--navy` and `--app-header` background: "From your teacher's notes · 11.4 Pressure, slide 4".
- **Hint line:** 13px `--steel`: "Hint 1 of 3 · Socratic mode set by your teacher for homework".
- **Voice row:** a 56px navy circle (mic or timer), a waveform of peach bars, and the elapsed time "0:07" on the right. Under it: "Text answer always available."

**Ask bar:** fixed at the bottom on mobile. White, 16px radius, peach border, 56px tall, placeholder "Ask Saathy anything…" in `--text-3`.

**Streak strip:** seven 40px-tall rounded tiles (8px radius) labelled M–S underneath.
- Done: `--steel #517DAB`.
- Missed: `--ice #D6E2E6`.
- Upcoming or weekend: `--peach #FDEBDD`.

Under the tiles goes a plain sentence: "Missed Wednesday, streak kept. Pauses for Diwali break. No reminders after 8 PM."

**Status tags:** `--success-bg` with dark green text, 6px radius, 600 11px uppercase (e.g. "AI-15 · CORE"). These are developer spec tags in the mocks. Do not ship them to users; use the same style for real statuses such as "Done" or "Due Fri".

**Icons:** Lucide line icons, 1.75 stroke, 18–20px. No emoji anywhere. The only flag allowed is the +91 India flag in the phone input.

## 3. Landing page (ref 01): section by section, with the real copy
The background is a vertical gradient: `#09213B` at 0 → `#1C3D65` at 30% → `#1A3A63` at 85% → footer `#0C2948`. All text is white unless noted.

1. **Nav (sticky, 72px):**
   - Background: transparent over the hero, turning to `rgba(9,33,59,.85)` with a backdrop blur after 24px of scroll.
   - Left: the logo lockup.
   - Centre links: For Students · For Teachers · For Parents · How it Works, in 500 14px at 85% white.
   - Right: [Register a School] (outline pill) and [Sign in →] (light-blue pill).
2. **Hero (desktop min-height 560px, two columns 45/55; the image bleeds to the right edge):**
   - Eyebrow: "Your school, beyond the classroom." (14px, 75% white)
   - H1: "Learning doesn't have to stop when the **school bell rings.**" "school bell rings." is set in `--mk-accent`.
   - Sub: "A connected learning space where students continue learning, teachers guide the next step, and parents understand how to help."
   - CTAs: [Sign in to your school →] (primary) and [Register a school] (secondary).
   - Small line: "Already have an account? Sign in with your school details." The link is in `--mk-accent`.
   - **Right side:** `hero-scene.jpg` (the cloud mascot at a V laptop, books, plant, sunset window).
     - It blends into the navy with a left-edge gradient mask: `linear-gradient(90deg,#09213B 0%,transparent 35%)`.
     - Caveat overlay at top right: "Better Learning. Brighter Futures."
3. **"One classroom. Different learning paths."** (centred h2). Sub: "One connected support system for learning at school and at home." Below it, four glass cards in a row (one per row on mobile, two per row on tablet). Each card has:
   - A 40px circular icon well (`rgba(127,179,255,.15)`).
   - A title in `--mk-accent` at 700.
   - Copy.
   - A small circular arrow button at the bottom right.

   Card titles and copy:
   - For Students: "Continue lessons, follow guided sessions, practise with quizzes and ask Saathy your doubts."
   - For Teachers: "Share learning material, create sessions and identify concepts that need attention."
   - For Parents: "Understand learning progress and discover practical ways to support your child."
   - For School Admins: "Manage your school, classes, teachers and students, all in one place."
4. **The learning loop:** one wide glass panel.
   - Left column: the h3 "The learning loop", the copy "From classroom to home, every step builds stronger understanding." and the link "Learn more →".
   - Right: four steps joined by "→" arrows. Each step has a 56px gradient circle icon (blue, teal, peach and violet tints, each soft) and a number.
     1. Teacher shares a lesson
     2. Student studies and practises
     3. Learning evidence highlights what needs attention
     4. Student gets a suitable next step, and the teacher can respond to the gaps

   On mobile the steps stack vertically with ↓ arrows.
5. **Two-up row:**
   - **Left, "Guided learning preview":**
     - A mini session card on the left, styled as a dark inset with an 8px radius:
       - Header: "Class 9 · Physics" and "Session 3"
       - Title: "Motion: speed and velocity"
       - Checklist: "Watch recap from class" (ticked), "Read teacher notes" (ticked), "Check: 5 quick questions" (open)
       - A progress bar at 60%
     - To its right: the title "Guided learning preview", the copy "Follow lessons step by step, from teacher notes and recordings to practice and quizzes, all in one place.", the chip "Class 9 · Physics · Motion" and a white pill button "See how guided learning works →".
   - **Right, "AI-assisted learning for students":**
     - `mascot.jpg` in a circle on the left.
     - Ticks: "Ask a question" / "Get an explanation grounded in your school's material" / "Practise and build confidence".
     - Outline pill: "Explore the learning approach →".
6. **Two-up info row:**
   - **"School-connected AI":** "Saathy uses school-approved notes and learning content as its source of guidance. When something isn't covered, it says so and keeps answers grounded and reviewable."
   - **"Privacy and child safety":** "Access is limited by role. Parents see progress summaries, never their child's private AI chats."
7. **CTA band:** a rounded 16px panel (`#294C7B`). `school.jpg` sits on the left and fades into the panel.
   - Title: "Bring your school's learning journey together."
   - Buttons: [Register a school] (primary pill) and "Already have an account? Sign in →".
8. **Footer:** `#0C2948` with a top border `rgba(255,255,255,.08)`. The logo sits on the left. Links on the right: About · How it Works · Privacy · Contact · Register a School. Below them: "© 2026 VidhyaSaathy. All rights reserved." in 12px at 60% white.

Do not add a stats band, logo wall, testimonials or pricing; none of these appear in the screenshots.

## 4. Sign-in (ref 02), route `/signin`
- **Page:** a radial navy gradient (`#163964` → `#0E2A50`). In the centre is a 1040px-wide frame with a 24px radius, `1px solid rgba(255,255,255,.08)` and a large shadow.
- **Left half:** `--mk-panel #0D284B`, 48px padding.
  - Logo, then the h1 "Welcome back!" (44px, 800), then the sub "Sign in to continue your learning journey."
  - Inputs, each 48px tall with `--mk-input` background, a 1px `rgba(255,255,255,.12)` border and a leading icon:
    - "Enter your school email or user name"
    - "Enter your password", with an eye toggle
  - Row: a "Remember me" checkbox and a "Forgot password?" link in `--mk-accent`.
  - A full-width gradient pill: "Sign in →".
  - An "or" divider.
  - Outline pills: "Continue with Google" and "Continue with Microsoft". Show them only if SSO exists; otherwise hide them, never show fake buttons.
  - Footer line: "Don't have an account? Register a school".
- **Right half:** `hero-scene.jpg` with object-fit cover, the "← Back to home" glass pill at the top right, and the Caveat note "Same Dreams. Bigger Possibilities." with a peach underline.
- **Mobile:** the image half is hidden. Instead, a 160px image strip sits above the form.

## 5. School registration and onboarding wizard (ref 03), routes `/register` and `/setup`
- **Page and frame:** the page is `--rg-page #E7EEF1`. The frame is 24px-radius.
  - Top band (80px): a navy gradient from `#0A2347` to `#4A6FA8` running left to right, with the logo and "← Back to home".
  - Body: `#F2F5F7`.
  - Bottom footer band: navy, matching the landing footer.
- **Left column:**
  - `school.jpg` with a soft fade at the bottom.
  - H1 "Let's set up your school on VidhyaSaathy" (36px, 800, `--rg-title`).
  - Sub: "Create a secure learning space for your teachers, students and parents, in just a few simple steps."
  - Three trust items with dividers between them: "Secure & Private: Your data is protected with care.", "Role-Based Access: Everyone sees only what they need." and "Made for Schools: Built around how schools teach."
- **Right column:** a white card with a 20px radius.
  - Header: "School Registration", with "Step 1 of 4" right-aligned in `--steel`.
  - A segmented 4-part progress bar (4px tall, done = `--navy`, todo = `#DCE3EA`).
  - Section eyebrow: "SCHOOL DETAILS".
  - Fields, each with an icon inside a 48px input with a 10px radius and white background:
    - School Name *
    - School Type * (select)
    - Board / Affiliation * (select)
    - School Email *
    - Phone Number *: a +91 prefix select plus the number
  - Primary button: "Next: Admin Information →".
- **Below the columns:** a full-width "Already have an account?" strip with a navy circle icon, the copy "If your school is already registered, you can sign in with your credentials." and an outline "Sign in →" pill.
- Reuse the same card style and stepper for the Phase 2 setup wizard (classes and sections, subjects, teacher invites, CSV roster, parent linking).

## 6. Student app (refs 04, 05, 07)
**Mobile (<768px):** this is the primary student surface.
- **Top bar (64px, `--app-header`):**
  - Hamburger on the left.
  - Mascot avatar (40px circle).
  - Title "Science · Ch 8 Motion" (700 18px, ellipsis) with the subtitle "Class 9-A · CBSE" in `--meta-brown` 500 15px.
  - Target/focus icon on the right.
- **Page:** `--app-bg` with 16px side padding and 12px gaps between cards.
- **Home stack:**
  - Context chip.
  - DAILY 5 card.
  - STREAK card.
  - YOUR LEARNING PROFILE card (ref 07): rows Difficulty / Pace / Explanation style / Voice, with the current values right-aligned and a "Last 4 weeks" meta.
  - NEXT FOR YOU card, with a navy CTA.
- **Ask Saathy:** the sticky bottom input on every student screen.
- **Bottom tabs:** Home, Study, Ask, Progress. These are text tabs with icons on `--app-header` and a 1px top divider; the active tab is navy 700.

**Saathy chat screen:**
- Card header: "VIVA · Oral practice · Motion" with a "Q 3 of 5" pill.
- Body: the bubble thread, then the voice row.
- A second card, "SO FAR · Against the marking points", holds the plain-text summary, e.g. "Correct: retardation, unit m/s². Missed: velocity vs speed. Your teacher explains it in Monday's recording at 18:40."

**Desktop (≥1024px, ref 06):**
- **Left sidebar (240px, `--sidebar #041D3D`):**
  - Logo at the top.
  - Nav items: Home, My subjects, Study sessions, Homework, Ask Saathy, My progress. These are 15px white at 85% opacity, 40px rows with an 8px radius. The active item has a `--sidebar-active #193E69` background.
  - At the bottom: user name and role ("Ananya Iyer / Student · 8B").
- **Main area:** `--app-bg-desk #F9F6EE` with 32px padding. Each page has:
  - An eyebrow in `--steel` uppercase, e.g. "ASK SAATHY · CH 11 FORCE AND PRESSURE".
  - An h1-app title.
  - A question or sub line in `--steel`.
- **Cards:** on desktop, cards drop the peach border for `1px solid #E3E6EA` on white. Use a 2-column grid for comparisons.
- The ask bar becomes part of the chat card, not fixed.

## 7. Teacher and admin shell
- **Teacher and admin** use the same desktop shell as the student (navy sidebar, ivory main, eyebrow + title header), with their own nav:
  - **Teacher:** Today, Classes, Sessions, Homework, Evidence, Reports.
  - **Admin:** Overview, Setup, Classes & sections, Teachers, Students, Parents, Settings.
- **Tables:**
  - White card, 14px radius.
  - Header row: `--card-head`, uppercase 12px 700 `--text-2`.
  - Rows: 52px tall, 1px `--divider`.
  - Status pills use the tag style, with green for done, peach `--peach` for pending and ice for draft.
  - Right-hand panels are 320px wide with a "Next steps" list.
- **Empty states:** a one-line explanation plus one navy button. No illustrations other than the mascot, and only on the student side.
- **Mobile (<1024px):**
  - The sidebar becomes an off-canvas drawer.
  - The top bar uses the mobile student pattern, but with an ivory background.

## 8. Responsive rules
- **Breakpoints:** 640 / 768 / 1024 / 1280.
- **Landing:**
  - Hero stacks below 900px, with the image above the text, 280px tall and cropped centre-right.
  - The 4 audience cards go to 2 columns at 640–1024 and 1 column below that.
  - The two-up rows stack.
- **Touch and motion:**
  - Touch targets are at least 44px.
  - Respect `prefers-reduced-motion`. The only motion is 150ms colour and opacity transitions and the nav blur.

## 9. Do not
- Do not use purple-indigo gradients, glow blobs, generic "AI-powered" badges, fake metrics or star ratings, or emoji.
- Do not centre-align body paragraphs in the app.
- Do not use more than one primary button per card.
- Do not let the dev spec tags in the mocks (AI-35, PRG-05, PREVIEW) reach production UI.
- Do not use Inter, Onest or Poppins; use Manrope only (plus Caveat for the two hero notes).
