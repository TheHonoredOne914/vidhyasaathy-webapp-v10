# VidhyaSaathy student notebook UI: implementation spec (v10 final)

**Build these screens exactly as shown. Do not make design decisions.** Every screen has an HTML file in this folder. Its PNGs are in `png/`. If this document and an HTML file disagree, the HTML file wins. Match the class names, copy, order and spacing.

Demo content: Class 9 NCERT, chapter 8 Motion. The student is **Aarav Mehta (IX-B, roll 17)**, the teacher is **Sharma Ma'am**, and the parent is **Mrs. Mehta**.

---
## 0. Hard rules (do not break)
1. Notebook vibe on every screen:
   - ruled cream paper with a red margin line
   - Caveat headings and Patrick Hand notes
   - washi tape, sticky notes, highlighter (`.nb-hl`), red pen (`.nb-redpen`) and line doodles
2. **No emoji anywhere. No sound.** All icons are inline line SVGs from `assets/icons.html` (24×24, stroke 1.8, `currentColor`).
3. **Saathy is always the flat line-art SVG** (`assets/saathy-{happy,think,cheer,oops,sleep}.svg`, or the inline markup in any HTML file).
   - Replace `apps/web/src/ui/Saathy.tsx`. It uses the 3D `mascot.webp`.
   - Use a component `<Saathy mood size />` that renders the inline SVG with class `nb-saathy`.
   - Delete every use of mascot.webp outside the landing page.
4. **Mastery words only:** `Let's fix this` (`.nb-mastery--fix`), `Almost there` (`--almost`), `Mastered` (`--mastered`), `Top form` (`--top`), `New` (`--new`).
   - Never show bands, ranks, percentiles or "Learning"/"Locked" as mastery.
5. **Confidence** is always three buttons, each with its line icon (see quiz.html):
   - Sure: green `.nb-confbtn--sure`
   - Unsure: amber `--unsure`
   - Guess: purple `--guess`
6. **Full width at every desktop size.**
   - There is no max-width box anywhere in the app shell.
   - The content grid stretches from the sidebar to the right edge, so no empty gutter is wider than 15%.
7. Do not touch the landing page, the theme colours, or `vs-theme.css` colour values.

## 1. Files to copy verbatim
Copy these into `apps/web/src/student/notebook/`. Do not edit them, do not run them through a formatter, and do not rename classes:

| from | to |
|---|---|
| `tokens.css` | `apps/web/src/student/notebook/tokens.css` |
| `components.css` | `apps/web/src/student/notebook/components.css` |
| `fonts/*` | `apps/web/src/student/notebook/fonts/` (keep the relative `url(fonts/...)` paths) |
| `assets/saathy-*.svg` | `apps/web/src/student/notebook/saathy/` |

Import both CSS files once in `main.tsx`, after `brand.css`: `import './student/notebook/tokens.css'; import './student/notebook/components.css';`.

Each HTML file has its page-only CSS in its `<style>` block. Copy that block to `<Screen>.css` next to the component, unchanged.

## 2. Global layout fix (must be done first)
The current build is boxed and leaves empty gutters. See `/workspace/shots/v10-local/layout-bug/*.png`. Fix it like this:

1. **`apps/web/src/theme/brand.css` line 1740** (inside `@media screen`): change
   `.app-main { max-width: 1280px; padding: 36px 40px 72px; }`
   to
   `.app-main { padding: 0; }`. Remove the `max-width` completely. Don't replace it with another value.
2. **`apps/web/src/student/home.css` line 2**: delete `.app-main:has(.vs-home) { max-width: none; background-image: none; }`. It is no longer needed.
3. This rule is already line 3 of `components.css`; keep it (it is the global layout rule):
   ```css
   html, body, #root { width: 100%; height: 100%; margin: 0; }
   ```
4. The student, teacher and parent shells are the `.nb-app` grid:
   ```
   .nb-app  = display:grid; grid-template-columns: var(--nb-sidebar-w) minmax(0,1fr); height:100vh
   .nb-side = sidebar (brand, nav sections, profile at the bottom)
   .nb-main = grid rows: auto (.nb-top) / 1fr (.nb-sheet, overflow:auto, ruled paper + margin line)
   ```
   Page content goes inside `.nb-sheet`. Most pages use `.nb-grid`, which is `minmax(0,1fr) var(--nb-rail-w)` with `min-height:100%`. The last card in each column is `.nb-grow`, so columns end flush at the bottom of the viewport.
   Variants:
   - `.nb-grid--wide-rail`: teacher home
   - `--halves`
   - `--5-7`: homework
   - `--3col`: subject path
5. **Breakpoint: 1023px**, the same as brand.css lines 1682–1695. At `max-width:1023px`:
   - the sidebar is hidden
   - `.nb-mnav` (fixed bottom tabs) is shown
   - grids become one column
   - Per-page CSS already includes this. Remove or align any old 640px student rules.
   - The current `.app-bottom-tabs` should either render the `.nb-mnav` markup or be hidden on notebook routes. Don't show both.
6. The fluid root size is already in tokens.css: `html{font-size:clamp(14px, calc(0.4167vw + 10px), 19px)}`. Size everything in rem. Don't hard-code px font sizes.

## 3. Tokens (from tokens.css; use the variables, never the hex values)
- **Paper:** `--nb-cream #F4EEE4`, `--nb-paper #FFFDF8`, `--nb-border #DDD4C4`
- **Ink:**
  - `--nb-navy #1B2A4A`
  - `--nb-navy-muted #3A4A6B`
  - `--nb-ink-soft`, `--nb-ink-faint`
  - `--nb-margin-ink`: the red margin line
  - `--nb-redpen #D0342C`
- **Accents:**
  - `--nb-gold #E8B84A`, `--nb-gold-deep #C9962E`
  - `--nb-ok #2F9E6B`, `--nb-ok-soft`
  - `--nb-bad-soft`
  - `--nb-blue #3D6FB8`, `--nb-sky`
- **Confidence:** `--nb-c-sure(-soft)`, `--nb-c-unsure(-soft)`, `--nb-c-guess(-soft)`
- **Stickies:** `--nb-sticky-yellow`, plus `.nb-sticky--pink | --blue | --green | --lilac`
- **Shape:**
  - `--nb-radius-sketch`
  - `--nb-shadow`, `--nb-shadow-lift`
  - `--nb-line 1.5px`, `--nb-line-strong 2px`
  - `--nb-rule 1.875rem`
- **Shell:** `--nb-sidebar-w 14.5rem`, `--nb-rail-w 20rem`
- **Spacing:** `--nb-s1 … --nb-s8`
- **Fonts:**
  - `--nb-font-hand`: Caveat, for headings, buttons, chips and labels
  - `--nb-font-note`: Patrick Hand, for notes and stickies
  - Inter for body text and inputs

## 4. Shared components → React
Build these once in `apps/web/src/student/notebook/components/`. Each one renders exactly the markup in the HTML files.

| React | classes | notes |
|---|---|---|
| `NotebookShell role nav active` | `.nb-app .nb-side .nb-nav .nb-nav__sec .nb-nav__item(.is-active) .nb-nav__badge .nb-main .nb-top .nb-search .nb-top__right .nb-sheet .nb-mnav` | `role` is student, teacher or parent. Nav lists are in `_build/lib.py` (`STUDENT_NAV`, `TEACHER_NAV`, `PARENT_NAV`, `MNAV`). The student top-right shows `.nb-pill--streak`, `.nb-pill--xp` and `.nb-bell`. Teacher and parent show only the bell. |
| `PageHead eyebrow title sub actions` | `.nb-head .nb-head__eyebrow .nb-h1 .nb-doodle(scribble) .nb-sub` | |
| `Card title meta` | `.nb-card .nb-card__head .nb-h3` (`--flat`, `--gold`, `--accent`) | |
| `Sticky color who tape` | `.nb-sticky(--pink/blue/green/lilac) .nb-sticky__who .nb-tape(--sky/--left)` | |
| `MasteryChip level` | `.nb-mastery--fix/almost/mastered/top/new` | Use only these 5. |
| `Chip tone` | `.nb-chip--green/orange/red/sand/sky/dashed` | due dates and status |
| `Button variant size` | `.nb-btn--primary/ghost/quiet/gold` `--sm/--lg` | |
| `Tabs` | `.nb-tabs .nb-tab(.is-active)` | Never wraps (`flex-wrap:nowrap`). Scrolls on mobile. |
| `Toggle on` | `.nb-toggle(.is-on)` | |
| `Saathy mood size` | `.nb-saathy` | flat line SVG |
| `SaathyTip` | `.nb-saathy-tip` | Saathy + text |
| `Bubble` | `.nb-bubble(--hand)` | speech bubble |
| `DoodleStrip states capL capR` | `.nb-strip .nb-strip__node(.is-right/.is-wrong/.is-current) .nb-strip__link` | Quiz progress. See quiz.html. |
| `QuestionCard` | `.nb-qcard .nb-q__num .nb-q__label .nb-q__text .nb-q__hint .nb-opts .nb-opt(.is-picked/.is-right/.is-wrong) .nb-opt__key .nb-opt__mark` | |
| `ConfidenceRow value locked` | `.nb-conf .nb-conf__q .nb-conf__row .nb-confbtn--sure/unsure/guess` | Each button has its line icon (check-circle, wave and dice, as in quiz.html). |
| `Feedback kind` | `.nb-feedback--right/--wrong .nb-feedback__title .nb-feedback__body .nb-whywrong .nb-redpen .nb-strike .nb-circle-pen .nb-xp-pop` | |
| `ProgressBar` | `.nb-bar > i` (inline `width` + `background:subject colour`) | |
| `Row` | `.nb-row .nb-row__t .nb-row__s` | list rows |
| `SubjectIcon subject` | `.nb-ico .nb-ico--{phy,chem,bio,math,eng,sst}` | SVGs in `_build/lib.py` `SUBJ` |

## 5. Screens
For every screen: route, HTML/PNG, component tree, and states. Use the copy word for word.

### 5.1 Sign in (`signin-student.html`, `signin-teacher.html`, `signin-parent.html`)
- **Route:** `/signin?role=student|teacher|parent`, replacing the current SignIn layout. `/signin/student` uses the student variant.
- **PNG:** `png/signin-{student,teacher,parent}-1440.png`, `png/signin-student-360.png`
- **Layout:**
  - No app shell, and **one header only**: the brand at top-left of the left panel plus "Back to home". Remove AuthLayout's extra header.
  - Full-screen split `.si`, grid `1.05fr 1fr`, 100vh.
- **Tree:**
  - `si-l` (ruled paper, ring holes `::before`, margin line)
    - `si-brand`
    - `si-form`
      - `h1`, scribble, sub
      - `.dividers`: 3 notebook-divider tabs `.dv`. The active tab is raised and coloured: student yellow, teacher sky, parent green. Each tab is a link to its role.
      - `.si-card`, filled with the active colour, containing the role form
  - `si-r`: navy night with a stars SVG, a moon outline, Saathy (13rem; `sleep` for student, `happy` otherwise), the h2 "9:00 pm. Saathy kept your place.", a role line, and 2 taped stickies
- **Forms:**
  - Student: class code as 6 letter boxes `.boxes span` (filled, `.f` focus ring, `.e` empty dashed), name (`nb-input--lined`), 4-box PIN, "Open my notebook", "Forgot PIN? Ask your teacher", "No email needed".
  - Teacher: school email, password, keep-me-signed-in toggle, Forgot password, "Go to my classes", School admin sign-in.
  - Parent: phone, 6-box OTP with "resend in 0:42", child code, "See the progress report".
- **States:**
  - Error: put a red-pen line under the field and red text below it in `--nb-font-hand`.
  - Pending: the button text becomes "Opening…" and is disabled.
- **<1024px:** the right panel is hidden and the left panel fills the screen.

### 5.2 Student home (`home.html`)
- **Route:** `/student` (`HomeDesk`). **PNG:** `png/home-1440.png`, `png/home-1920.png`, `png/home-1280.png`, `png/home-360.png`
- **Tree:** `NotebookShell(active=home)`, then `.nb-grid` containing:
  - **main**
    - PageHead: eyebrow date, "Namaste, Aarav" with the wave line icon, a "Let's keep going!" bubble with Saathy cheer
    - Continue card: tape; chip "Your next step · Physics"; title; reason line; Continue + "8 min left" + "Then a 3-question check"; v-t thumbnail on a blue ruled card
    - Your subjects: 4 subject cards, each with icon, mastery chip, chapter, bar, "x / y ideas" and Open
    - Your path · Physics: Motion: 5 nodes with mastery chips, dashed links, and the current node in gold with a halo
  - **rail** (spans all rows)
    - Today's goal: 3/5 bar and checklist with strikethrough done items
    - Daily challenge yellow sticky (cheetah 72 km/h, "Try it · +15 XP")
    - This week: 7 day dots (done gold with a tick, today navy, future empty)
    - From your teacher: 3 rows with due chips, plus a Saathy tip "Stuck on something?"
- **States:**
  - No continue item: show "Pick a subject to start" in the same card.
  - Loading: skeleton blocks in the same card sizes.
- **<1024px:** one column in this order: hero, continue, goal, challenge, subjects (2×2), path (vertical), week, teacher.

### 5.3 Subjects (`subjects.html`)
- **Route:** `/student?panel=subjects`.
  - Replace the current `lcard` / `subject-card-grid` boxed card **completely**. It must match approved subjects-v2.
- **PNG:** `png/subjects-1440.png`, `png/subjects-1280.png`
- **Tree:** `.nb-grid`
  - **main:** PageHead + tabs, then `.sj-grid`, a 3×2 grid with `grid-auto-rows:minmax(14rem,1fr)` that fills the height. Each card has: icon, due chip, name, chapter, "Next: idea", mastery chip, bar and count.
  - **rail:** Due soon; a pink sticky (Valency) with Saathy; Time this week bars.

### 5.4 Subject path (`subject-path.html`)
- **Route:** `/student/subjects/:subjectId` (Physics). **PNG:** `png/subject-path-1440.png`, `png/subject-path-1280.png`
- **Tree:** `.nb-grid--3col`
  - **left:** subject card, Jump to chapter list, colour legend
  - **centre:**
    - blue unit banner "Chapter 8 · Motion"
    - trail: absolutely positioned stations on an SVG path. Each station is a circle + label + mastery chip.
    - "Up next: Acceleration" popover card with Start
    - Saathy bubble
    - locked "Chapter 9 · Force and laws of motion" banner (dashed)
  - **right:** goal ring 6/15, Next due, Today's game (Cricket Lab), Fix-it sticky, Motion at a glance (counts per mastery word)
- Copy the station coordinates from the HTML.

### 5.5 Lesson (`lesson.html`)
- **Route:** `/student/chapters/:chapterId/concepts/:conceptId` (ConceptPage, student). **PNG:** `png/lesson-1440.png`
- **Tree:** `.nb-grid`
  - **main**
    - breadcrumb "Physics · Motion / Idea 5 of 8", New chip
    - h1 Acceleration; style tabs Notes/Story/Diagram/Exam style; "Explain simpler"
    - **Bridge** blue sticky: "Bridge · you already know this", Class 7 speed, "Revise Class 7 speed"
    - Ruled sheet with tape:
      1. What it means (highlighter), formula box `a = (v − u) / t`
      2. See it: v-t graph SVG with slope labels
      - **Checkpoint** (Quick check 1 of 2, "Doesn't count. Just for you."): 4 options, the picked right one green, explanation line
      3. Worked example, with red-pen annotations and the circled answer `−1 m/s²`, plus a dashed "Your turn" box
    - Misconception callout (`bad-soft`, Saathy oops)
    - Footer: back "Speed & velocity", primary "I've got it · take the 3-question check"
  - **rail:** On this page (dots: done green / current gold / todo empty); video card "Plays 3:12 to 5:40 only", "Checked by Sharma Ma'am"; Ask about this page (chips + lined input)
- **States:**
  - Checkpoint unanswered: neutral options.
  - Wrong answer: red strike + a hint line.
  - Style tabs swap the sheet content.

### 5.6 Diagnostic (`diagnostic.html`)
- **Route:** `/student/chapters/:chapterId/diagnostic`. This route is new; add it next to the practice routes. **PNG:** `png/diagnostic-1440.png`
- **Content:** only NCERT Class 6–8 prerequisites. Example: bus 120 km in 3 h.
- **Tree:** same as quiz, plus:
  - option e "I haven't learned this yet" (dashed, full row, its own icon)
  - "No marks. This only tells Saathy where to start."
  - **rail:** "So far" summary
- Picking "haven't learned" skips the confidence row.

### 5.7 Quiz / practice (`quiz.html`, `quiz-right.html`, `quiz-wrong.html`)
- **Route:** `/student/chapters/:chapterId/practice/:gameId` for the concept quiz. **PNG:** `png/quiz-1440.png`, `png/quiz-1920.png`, `png/quiz-360.png`, `png/quiz-right-1440.png`, `png/quiz-wrong-1440.png`
- **Tree:** `.nb-grid`
  - **main**
    - header with topic + XP
    - `DoodleStrip`, Q4 of 8
    - `QuestionCard` (36 km/h → m/s; a 10, b 129.6, c 3.6, d 100)
    - `ConfidenceRow` (Sure / Unsure / Guess, colourful with icons)
    - Check button
  - **rail:** round card, hint card (formula ladder)
- **States:**
  - `quiz`: answer picked, confidence not yet chosen.
  - `quiz-right`: a is green with a tick; Sure is locked; the green feedback says "+10 XP"; the strip node turns green.
  - `quiz-wrong`:
    - option b is struck through in red pen
    - red feedback with the why-wrong boxes "What you did" / "Fix it"
    - the red handwritten note "m/s is the bigger unit, so the number gets smaller!"
    - chip "Mistake type: unit conversion"
    - the rail card "Twice now" offers a recap
    - the strip node shows a red cross
- No sound and no confetti. The XP pop is a static `.nb-xp-pop`.

### 5.8 Session player (`session-player.html`)
- **Route:** `/student/sessions/:sessionId`. **PNG:** `png/session-player-1440.png`
- **Tree:** `.nb-grid`
  - **main:** session header (Session 2 · distance-time graphs, slide 3 of 6, progress); grid-paper slide with a d-t graph (Bus A 6 m/s, Bus B 3 m/s, legend); pink sticky from Sharma Ma'am; Back / dots / Next
  - **rail:** Ask Saathy about this slide, Your note sticky, slide list (done/current/todo)

### 5.9 Progress (`progress.html`)
- **Route:** `/student/progress`. **PNG:** `png/progress-1440.png`
- **Tree:**
  - **main:** 6 subject rings with mastery chips; October calendar (streak 26–30, today outlined); Ideas to look at
  - **rail:** Time this week bars; "How sure vs. how right" (Sure 86%, Unsure 61%, Guess 34% in the confidence colours); "Saathy noticed" green sticky; Wins this month
- Do not show any rank or band.

### 5.10 Homework (`homework.html`)
- **Route:** `/student?panel=homework`, plus `/student/assignments/:assignmentId` for the worksheet. **PNG:** `png/homework-1440.png`
- **Tree:** `.nb-grid--5-7`
  - **left:** tabs; To do list with due chips; Handed back with red-pen 9/10 and 8/10; Mr. Khan sticky
  - **right:** worksheet "Atoms and Molecules · sheet 2", strip, question, ruled answer box, "Add a photo of your working", Q1 / Next

### 5.11 Ask Saathy (`ask.html`)
- **Route:** `/student?panel=ask` (AskPanel). **PNG:** `png/ask-1440.png`
- **Tree:**
  - **main chat card:** mode tabs (Hints first / Explain fully); messages, where Saathy bubbles have the avatar and student bubbles are navy on the right; a diagram bubble (36 km/h); a quick-try quiz bubble; suggestion chips; composer
  - **rail:** Recent doubts; Talking about (concept chip); "How Saathy helps" lilac sticky with the privacy note; Saved explanations

### 5.12 Games (`games.html`)
- **Route:** `/student?panel=games` (new panel) → each card links to `/student/chapters/:chapterId/practice/engine/:gameId`. **PNG:** `png/games-1440.png`
- **Tree:**
  - PageHead + subject tabs
  - Featured "Today's game · Cricket Lab" card (art, copy, Saathy, "Play · 5 min")
  - `.gm-grid`, a 5×2 grid of game cards (`art` tile with a line drawing, name, topic, footer):
    - Cricket Lab is today's game, with a gold outline.
    - Atom Forge shows the "Coming back soon" sand chip and has no button.
    - Float or Sink, Energy Slide and Echo Corridor are locked: dashed and at 60% opacity, with "Opens after …".
- Copy the art SVGs from the HTML.

### 5.13 Notifications (`notifications.html`)
- **Route:** `/student/notifications`. **PNG:** `png/notifications-1440.png`
- **Tree:**
  - **main:** head + "Mark all read"
    - Today: new items have a yellow background
    - Earlier
    - Each row: round icon, title, meta, time, optional action
  - **rail:** Tell me about (5 toggles); Quiet hours (toggle, 9 pm to 7 am); blue sticky "9:00 pm. Saathy kept your place."; Who can reach you here

### 5.14 Settings (`settings.html`)
- **Route:** `/student/settings`. **PNG:** `png/settings-1440.png`
- **Tree:**
  - **main:** a 2×2 `.st-grid`
    - Learn your way: style, when stuck, questions per set
    - Daily goal: minutes, reminder, sticky
    - Easier to read: Bigger text, Plain font, **Reduce motion**, preview. There is **no read-aloud** option.
    - Language: English / हिन्दी / Hinglish / मराठी
  - **rail:** profile card (avatar, Change PIN); Account links (Privacy, Linked parent, Help, Sign out in red); Saathy privacy tip
- Reduce motion sets `data-reduce-motion` on `<html>`, which turns off transitions.

### 5.15 Teacher home (`teacher-home.html`)
- **Route:** `/teacher`. **PNG:** `png/teacher-home-1440.png`
- **Shell:** `role=teacher`, TEACHER_NAV, `.nb-grid--wide-rail`
- **Tree:**
  - **main**
    - head (date eyebrow, "Good afternoon, Sharma Ma'am", "New homework", "Start session 3")
    - 4 KPI cards: Diagnostic done 28/34 with bar; Handed in 25/34; Studied this week 31; Common mistake 11 (red-pen card)
    - Class mastery · Motion heat table (concept × group; 5 tints from `#F5D3CE` to `#C6E6CF`; the "New" cells are dashed blue)
    - "Saathy suggests" sticky
  - **rail:** Lesson review (3 waiting: notes, questions, video clip, with Review/Watch); "Could use a nudge" (private; 4 students with reason + Nudge)

### 5.16 Parent home (`parent-home.html`)
- **Route:** `/parent`. **PNG:** `png/parent-home-1440.png`
- **Shell:** `role=parent`, PARENT_NAV
- **Tree:**
  - **main**
    - head "Aarav's week"
    - 3 KPIs: time studied 2 h 27 m, homework 4 of 5, days studied 5 in a row
    - Subjects (6 rows: icon, name, bar, mastery chip)
    - 2 stickies: "Got it this week" and "Working on"
  - **rail:** "What to ask at dinner" sticky; From school remarks; "What you can see" (progress, homework, time, remarks; **no Saathy chats**; no ranks); Coming up
- **Never render Saathy chat content for parents.**

## 6. Acceptance checks (Cursor must run these before saying it's done)
1. Screenshot every route at 1280×800, 1440×900 and 1920×1080, and compare each with `png/*.png`:
   - no element has `max-width` on the shell
   - `.nb-sheet` content reaches within 2.5rem of the right edge
   - there is no horizontal scroll
2. At 360×800: there is no horizontal scroll, `.nb-mnav` is visible, and the sidebar is hidden.
3. `grep -rn "mascot.webp" apps/web/src | grep -v landing` returns nothing.
4. `grep -rnP "[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]" apps/web/src` returns nothing (no emoji).
5. No text says Learning, Locked, band, rank or percentile as a mastery label.

## 7. Source
- `_build/*.py` generates every HTML file (`python3 _build/s_home.py` etc.; `lib.py` holds the shell, icons, Saathy and nav).
- `_build/shot.mjs` renders the PNGs: `node _build/shot.mjs home:1440:900 quiz:360:800`.
- `assets/icons.html` shows every line icon.

## 8. Phase 4–5 screens (added 30 Oct 2026)
Generators: `_build/p45.py` (shared CSS/helpers), `_build/s_p45_ask.py`, `_build/s_p45_game.py`, `_build/s_p45_teacher.py`, `_build/s_p45_parent.py`.
All of them use the same grid as everything else: `minmax(0,1fr) clamp(260px,22vw,340px)`, the rail stacks under 1180px, and there are no fixed card heights.
The fixed **"Example data" pill is mockup-only. Do not ship it.** All names and numbers are example Class 9 NCERT data.

### 8.1 Snap confirm (`ask-snap-confirm.html`)
- **Route:** sheet over `/ask` (state, not a page). **PNG:** `png/ask-snap-confirm-1440.png`, `png/ask-snap-confirm-1024.png`
- **Tree:**
  - steps: Photo ✓ → Check text → Ask
  - photo with crop corners + Retake / Rotate
  - lined editable read-back with yellow `.unsure` marks on low-confidence tokens, plus a pink "Is this 72 or 12?" flag
  - detected chips (subject / chapter / concept)
  - 3 mode stickies (Hint me first is the default, then Check my working, then Explain fully). They stay 3 across down to 760px.
  - footer: privacy line, "Type it instead", "Looks right, ask Saathy"
- **API:**
  - `POST /ask/snap` (multipart) → `{id, status:'extracted'|'failed'|'not_configured', text, unsureSpans:[{start,end,alt}], subjectId, chapterId, conceptId}`
  - `POST /ask/snap/:id/confirm {text, mode:'hint'|'check'|'explain'}` → the chat message
- **States not drawn:**
  - `failed`: same sheet, empty read box, "Couldn't read that. Retake or type it."
  - `not_configured`: hide the camera button. Clicking it says "Type your doubt instead".
- The image is never served by URL, and it is deleted after 24 h.

### 8.2 Ask my teacher (`ask-teacher-sheet.html`)
- **Route:** sheet over `/ask`. **PNG:** `png/ask-teacher-sheet-1440.png`
- **Tree:** Saathy's unsure line; the quoted question + chips + source; teacher card (Sharma Ma'am); "Ma'am will see / won't see"; consent checkbox; Not now / Send to Ma'am
- **The checkbox starts UNCHECKED and Send stays disabled until it is ticked.** The PNG shows it ticked so you can see the enabled state.
- **API:** `POST /ask/escalate {messageId, alsoTellTeacher:true}` → `{escalationId, teacherName}`. Then the toast "Sent to Sharma Ma'am. You'll see her reply here."

### 8.3 All doubts (`doubts-all.html`)
- **Route:** `/ask/doubts`. **PNG:** `png/doubts-all-1440.png`. **Shell:** student, active=ask
- **Tree:**
  - tabs: All / Waiting on Ma'am / Saved
  - subject chips
  - week groups. Each row shows a status chip: Solved with Saathy, Waiting on Ma'am, or Ma'am replied.
  - "chat cleared" note on old rows
  - one expanded row: the saved explanation + the teacher's red-pen reply
  - **rail:** Saved explanations; What I ask about (topic bars, own data only); Where chats go
- **API:** `GET /ask/doubts?status=&subjectId=` → `[{id, title, subjectId, conceptId, askedAt, status:'solved'|'waiting'|'replied', saved, chatCleared, reply?:{teacherName, text, at}}]`

### 8.4 Game checkpoint + finish (`game-checkpoint.html`, `game-finish.html`)
- **Route:** `/games/:slug/play` (one route, two states). **PNG:** `png/game-checkpoint-1440.png`, `png/game-finish-1440.png`
- **Checkpoint tree:**
  - timer pauses at a checkpoint
  - question card with options + Sure / Unsure / Guess
  - "counts toward Speed & velocity"
  - Lock it in
- **Finish tree:**
  - time + "New best!" (old best struck out), XP, paper confetti (SVG, no sound)
  - checkpoint recap
  - "What this race did": mastery word moves only
  - **rail:** own times chart ("Only you see your times"); Try next
- **API:**
  - `POST /games/:slug/runs` → `{runId, checkpoints:[{itemId}]}`
  - `POST /games/runs/:runId/answer {itemId, optionId, confidence, timeMs}`
  - `POST /games/runs/:runId/finish {totalMs}` → `{best:{kind:'time'|'stars'|'score', value}, isNewBest, xp, masteryMoves:[{conceptId, from, to}], recapSessionId?}`
- Best is "Best 42 s" or "3 stars". Never "Level". `games.html` Polynomial Factory changed from "Lvl 4" to "2 stars".

### 8.5 Teacher class mastery (`teacher-class-mastery.html`)
- **Route:** `/teacher/mastery?section=&subject=&chapter=`. **PNG:** `png/teacher-class-mastery-1440.png`, `png/teacher-class-mastery-1024.png`. **Shell:** teacher, active=mastery
- **Tree:**
  - section tabs + subject / chapter / period selects
  - suggested-reteach card
  - legend
  - student × concept grid with a sticky header row and a sticky first column; one cell per state. Each tint also has a pattern (dots / hatching / ring), so it isn't colour-only. The "Recovered" gold stamp sits on the name.
  - whole-class summary row
  - evidence table for the clicked cell
  - **rail (drill for the clicked column):** confidence bar, mistake types, time pattern, struggling names, Push reteach; "Did the last reteach land?"; band moves in words
- **Teacher words (proposal, mapping tint to the 4.5 wording):** 1 Needs foundation support · 2 Developing · 3 Progressing · 4 Consistent · 5 Advancing (= "Consistent — advancing to next concept") · New. These are words only. No numbers or ranks.
- **API:**
  - `GET /teacher/mastery` → `{concepts:[{id,name,taughtAt}], students:[{id,name,roll,tags:['recovered']}], cells:[{studentId,conceptId,state,level,wordForTeacher}]}`
  - `GET /teacher/mastery/drill?conceptId=` → `{confidencePattern, errorFamilies:[{name,count}], timePattern, strugglingStudentIds}`
  - `GET /teacher/mastery/evidence?studentId=&conceptId=` → `[{at,itemStem,chosen,correct,confidence,errorFamily,timeMs,source,syncedLate}]`
  - `POST /teacher/reteach {sectionId,conceptId,source:'heatmap'|'doubt_cluster',targetIds?}` → `{id,targetCount,opensAt}`. It opens at 18:00 IST. Students see "<concept>: a fresh look · 12 min" and are never told why.
  - `GET /teacher/reteach` → `[{delivered,started,completed,avgLevelBefore,avgLevelAfter}]`. Show the before/after as words.

### 8.6 Teacher doubts inbox (`teacher-doubts-inbox.html`)
- **Route:** `/teacher/doubts`. **PNG:** `png/teacher-doubts-inbox-1440.png`. **Shell:** teacher, active=doubts
- **New nav item:** "Student doubts" goes in TEACHER_NAV under Insight, after Class mastery. In the mockup, `s_p45_teacher.py` adds it at runtime. `teacher-home.html` was not regenerated, so add it in React.
- **Tree:**
  - main: named escalations only (opt-in). Each card shows the question sticky + concept chip and a lined red-pen reply box with Send. There's a Replied list.
  - **rail:** anonymous clusters ("17 doubts on Acceleration · 9 of them on sign convention") with snippets and a one-tap reteach
- **API:**
  - `GET /teacher/escalations?status=open|replied` → `[{id,studentId,studentName,roll,at,conceptId,question}]`
  - `POST /teacher/escalations/:id/reply {text}`: the reply appears in the student's thread + notifications
  - `GET /teacher/doubt-clusters?sectionId=&days=7` → `[{conceptId,count,subPattern,snippets[],reteachPending}]`. Snippets are anonymised server-side.

### 8.7 Parent report (`parent-report.html`)
- **Route:** `/parent/children/:childId/report`. **PNG:** `png/parent-report-1440.png`. **Shell:** parent, active=report
- **Tree:**
  - A4 sheet:
    - letterhead
    - 3 facts (time, days + freeze saved, homework)
    - Mon–Sun effort bars on ruled lines (future days dashed)
    - term trend per subject "31% → 38%" with the mastery word; Physics / Maths / All tabs
    - readiness lamp (Needs support / Getting there / Ready)
    - plain summary
    - "Ask this at dinner" with a "We talked about it" button
    - teacher remark
    - "Not in this note" line
  - **rail (screen only):** child switcher (approved links only), week picker, "What this is not"
  - Print / Save as PDF = `window.print()`. `@media print` hides the shell and rail.
- **API:**
  - `GET /parents/children/:id/week?week=` → `parent_week_aggregate {per_day:[{date,sessions,minutes}], mastery_by_subject:[{subjectId,start,end,word}], streak_days, freeze_used, readiness, summary, ask_this:{eventId,text}}`
  - `POST /parents/ask-this/:eventId/had`
- Never show marks tables, ranks or chats.

### 8.8 Privacy (`privacy.html`)
- **Route:** `/privacy` (from Settings). **PNG:** `png/privacy-1440.png`. **Shell:** student, active=settings
- **Tree:**
  - who-sees-what table (You / Teachers / Parent / Admin × chats, photos, sent doubts, answers, progress words, time & streak, homework)
  - lock line
  - 3 "kept for how long" stickies
  - **rail:** We never; Linked parent; Download my data / Ask to delete
- The table must match the server guards. Chat/doubt/snap: own student only. Escalation: the student + the named teacher. Raw answers: the student + the section's teachers. Aggregates: the student, teachers, approved parents, and the admin as school totals. `GET /admin/permissions` returns the privacy row with `locked:true`.
- When a parent is linked, the student gets the notification "Your parent can now see your progress — never your chats."
- **To confirm:** the 24 h chat retention and the "deleting needs a parent's okay" rule are assumptions taken from the snap rule. Check them against the backend before shipping.
