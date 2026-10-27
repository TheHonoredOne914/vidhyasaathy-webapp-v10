# VidhyaSaathy — Workspace UI Inspiration Spec

**Scope:** in-app only (sign-in → student / teacher / admin). Landing page, cream+navy+gold theme, and Saathy cloud mascot are **locked — do not change**.
**Goal:** stop looking like HTML slides; feel like a real school learning app.
**Date:** 2026-10-27 (Asia/Calcutta)

Reference images: `/workspace/inspo/01-…` through `17-…` (+ `00-vs-*` game targets). Sources in `SOURCES.md`.

---

## 0. Locked theme tokens (use these everywhere inside the app)

| Token | Hex | Use |
|-------|-----|-----|
| `cream` | `#F7F1E8` | Page canvas |
| `creamSoft` | `#FBF7F0` | Card fill / elevated surface |
| `navy` | `#1B2A4A` | Headings, sidebar active, concept strip |
| `navyMuted` | `#3A4A6B` | Body text |
| `inkSoft` | `#6B7280` | Meta / secondary |
| `gold` | `#E8B84A` | Primary CTA, XP, highlights |
| `goldDeep` | `#C9962E` | CTA lip / pressed |
| `border` | `#E6DFD2` | Hairlines (1px) |
| `ok` | `#2F9E6B` | Correct / stable |
| `warn` | `#D97706` | Borderline |
| `bad` | `#C9433A` | Wrong / radioactive |
| `skyStage` | `#E8F2FB` | Simulation / lesson stage fill |

**Type stack:** system UI sans (Inter / SF / Segoe). No display / marketing fonts inside the app.
**Radius:** cards `16px`, controls `12px`, pills `999px`, inputs `10px`.
**Spacing scale (4px base):** `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48`.
**Shell:** left sidebar **240px** (collapses to **64px** icon rail < 1024px). Top bar **56px**. Content max-width **1120px**, padding **24px** (16px on phone).

---

## 1. What we borrow from each product

### Khan Academy — learner home + unit pages
**Borrow:** one obvious *next action*; Learning Queue sorted by due date; mastery / mission cards as glanceable progress; left nav for role pages.
**Do not borrow:** cluttered multi-mission noise; gem economy for v1.
**Concrete pattern:**
- Home opens on a **hero Continue card** (full content-width, 120–140px tall) with title, 1-line Hinglish subtitle, gold **Continue / Start** 48px button.
- Below: 3 equal **stat cards** (min-height 96px, padding 20px, number 28px/700 navy, label 13px inkSoft).
- Queue list: rows 64px, left status dot 10px, title 15px/600, due meta 12px, right chevron.

### Duolingo — home path + lesson feel
**Borrow:** guided path of nodes; full-screen lesson chrome; juicy CTAs with 4px lip; footer feedback banner (correct green / wrong red); celebration with XP cards; mascot speech bubble.
**Do not borrow:** green brand, hearts economy, uppercase shouty marketing type.
**Concrete pattern (remapped to our theme):**
- Lesson top: close (24px) · progress track 8px tall rounded gold fill on cream · optional streak pill.
- Footer action bar 72px, 1px `border` top, Skip left, primary right.
- Feedback sheet slides up 120px: icon 28px + title 22px/700 + explanation 15px + Continue matching state colour.
- Path nodes: 56px circles; active has 4px gold ring + "START" tooltip; locked = 40% opacity.

### Google Classroom — stream / classwork
**Borrow:** Stream vs Classwork mental model; topic filters; assignment row with status circle (todo coloured / done ghosted); teacher vs student views of same object.
**Do not borrow:** Material purple, empty banner art as decoration.
**Concrete pattern:**
- Class workspace tabs: **Stream | Classwork | People** (underline 2px navy, 14px/600).
- Classwork rows: 56px, left 12px status circle, title + due, right score/status chip.
- Teacher assignment detail: top strip with **Turned in / Assigned / Graded** counts as tappable navy numbers.

### Brilliant.org — interactive lessons
**Borrow:** one solvable at a time; unified submit → feedback → continue; retry without shame; bottom feedback banner; path of colour-coded nodes; streak/XP celebrations with motion.
**Do not borrow:** dark-only chrome; unrelated mascot IP.
**Concrete pattern:**
- Session player is **full-bleed cream**, no sidebar.
- Stage ≥ 60% viewport height; right or below: task card.
- Wrong → soft cream-red banner `#FDECEC` with navy explanation + **Try again**.
- Right → soft cream-green `#E8F6EF` + gold Continue + XP chip `+10 XP`.

### Seesaw / ClassDojo — school feel
**Borrow:** warm, classroom tone; Class Snapshot of "what needs you"; portfolio-style evidence; big friendly empty states; family-safe language.
**Do not borrow:** chaotic sticker spam; primary-school-only pastel overload.
**Concrete pattern:**
- Teacher home **Class Snapshot** strip: 3 chips (Posts to review · Messages · Overdue) 40px tall, gold badge count.
- Empty state: Saathy cloud 120px + 18px/600 title + 14px body + one gold CTA. Never a bare grey box.

### Notion / Linear — sidebar + density polish
**Borrow:** 224–240px sidebar, full-row hit targets, 8px grid, quiet hairlines, dense-but-calm tables, aligned columns, inverted-L chrome (sidebar + top bar).
**Do not borrow:** dark-first developer aesthetic; tiny 11px body as default.
**Concrete pattern:**
- Sidebar item: height **32px**, padding `0 12px`, radius **8px**, icon 18px, label 14px/500. Active = `navy` text on `#EDE6DA` fill.
- Section label: 11px/600 uppercase, letter-spacing 0.06em, inkSoft, margin-top 16px.
- Teacher tables: row 44px, hairline `#E6DFD2`, tabular nums, **no zebra**, **no decorative charts**. Insight cell → one-tap action.

---

## 2. Global app shell (every signed-in role)

```
┌────────240────────┬──────────────── content ────────────────┐
│ Saathy mark 32px  │ Topbar 56px: breadcrumb · bell · avatar  │
│ ─────────────     ├──────────────────────────────────────────┤
│ Home              │                                          │
│ Subjects          │   page header 28px/700 navy              │
│ Sessions          │   …                                      │
│ Games             │                                          │
│ Notifications     │                                          │
│ Settings          │                                          │
│ ─── flex grow ─── │                                          │
│ Profile / switch  │                                          │
└───────────────────┴──────────────────────────────────────────┘
```

- Sidebar bg `#FBF7F0`; right border 1px `border`.
- Topbar white/`creamSoft`, bottom hairline; page title **not** duplicated in topbar when page has its own H1.
- Bell: 20px icon + red 16px count badge when unread.
- **Never** put the landing day/night split or polaroid shelf inside the app.

---

## 3. Screen → pattern map (actionable)

### 3.1 Student Home
**Steal from:** Khan (Continue hero + queue) + Duolingo (path energy) + Seesaw (warm empty).
**Layout (1120 max):**
1. Welcome row: Saathy 48px + "Namaste, {name}" 22px/700 + class chip. **No squished banner; cloud never clipped.**
2. **Continue learning** hero — always filled if anything in-progress; else empty-state with gold "Pick a subject".
3. Stats row: 3 cards — Streak · XP · Sessions done (equal width, gap 16px). Numbers centred vertically (fix: no corner-stuck numbers).
4. **Today's path** — horizontal or vertical node strip (Duolingo): next 4–6 sessions/games; active node gold ring.
5. Queue list "Teacher ne diya" — Classroom-style rows.

**Empty Continue:** illustration + "Abhi kuch pending nahi — Subjects se shuru karo" + CTA.

### 3.2 My Subjects / Chapter
**Steal from:** Khan unit page + Classroom Classwork topics.
- Subject grid: cards 280×160, 16px radius, subject colour 4px left bar, title 16px/700, progress ring 40px (Brilliant/Khan mastery feel).
- Chapter page: sticky subhead "Ch {n} · {title}"; skill/concept list as 56px rows with mastery pill (Not started / Learning / Pakka).
- Right rail (desktop ≥1280): "Next up" card 280px sticky.

### 3.3 Study Sessions (list)
**Steal from:** Classroom Classwork + Khan Learning Queue.
- Filters chips: All · Due soon · Overdue · Done (height 32px).
- Rows 64px; overdue = soft `#FDECEC` bg; done = 50% title opacity + ghost status circle.
- Primary row action: gold text button "Open" — not a tiny icon-only control.

### 3.4 Session player
**Steal from:** Brilliant solvable + Duolingo lesson chrome.
- Full-screen; hide sidebar.
- Top: X · thin progress · optional timer.
- Body: section content (text / diagram / interactive) max-width 720px centred OR two-pane (stage 60% / task 40%) for sims.
- Inline questions: answer cards 12px radius, selected = navy border 2px + `#EDE6DA` fill.
- Footer: Skip · Check (disabled until selection) → then feedback banner → Continue.
- Autosave; on resume "Jahan chhoda tha wahin se".

### 3.5 Quiz + why-wrong
**Steal from:** Duolingo feedback + Brilliant explain + our Pakka/Sochta/Andaza.
- Question stem 20px/700; options 56px min-height.
- Confidence trio under options: three 40px pills — Pakka · Sochta hoon · Andaza (selected = gold outline).
- After submit:
  - Correct: green banner "Sahi!" + why (1–2 lines) + Continue.
  - Wrong: red banner "Galat — dekh" + **correct option highlighted** + short NCERT-tied reason + "Try similar" secondary.
- Results screen: big % 48px, XP card, missed-concepts list linking to reteach session.

### 3.6 Notifications
**Steal from:** Linear Inbox + Classroom stream.
- List denser: row 56px, type icon 20px, title 14px/600, time 12px inkSoft, unread = 8px gold dot + creamSoft bg.
- Filters: All · Assignments · Grades · School (chips).
- Empty: Saathy + "Koi nayi khabar nahi".
- Tap → deep-link to session/quiz (never a dead toast).

### 3.7 Settings
**Steal from:** Notion density + Khan settings clarity.
- Topbar height **56px only** (fix: no oversized header).
- Sections as cards gap 16px; row 48px; labels 14px; controls right-aligned.
- PIN / shared-device profiles: avatar stack + "Kaun ho aap?" switch entry.
- Privacy copy: **max-width 640px**, 15px/400, line-height 1.6 — never full-bleed paragraph.

### 3.8 Teacher dashboard
**Steal from:** Seesaw Class Snapshot + Linear calm density + Classroom counts.
- Snapshot strip (3–4 metric chips) then **Assigned classes** list.
- Per class card: name, subject, completion % bar 8px gold, "Needs attention" count.
- Dense table below for recent submissions: student · item · score · time · action.
- Every insight ends in an action button ("Nudge", "Open reteach").

### 3.9 Heat-map
**Steal from:** Khan mastery grid + Linear cell → detail.
- Grid: concepts (cols) × students or sections (rows); cell 36×28; colours ok/warn/bad/cream empty.
- Hover/focus: tooltip with % + n students.
- Click cell → side drawer 360px: student list + gold **Create reteach session** (pre-filled builder).
- No 3D charts; no rainbow.

### 3.10 Session builder
**Steal from:** Brilliant authoring consistency + Classroom assignment create + Linear two-pane.
- Two-pane: left outline (sections list 240px), right editor.
- Sticky bottom save bar 64px: Last saved · Discard · **Save draft** · gold **Publish**.
- Unsaved-changes guard on navigate.
- Publish fans out notifications (verified in student bell).
- Edit-after-publish = new version row; in-flight students keep old version.

---

## 4. Interactive video games (Brilliant / PhET style)

**Problem today:** games feel like static HTML posters; drag targets dead; "Check answer" can garble.
**Requirement:** each game is an **interactive video** — continuous motion + narrator + direct manipulation + instant animated feedback.

### 4.1 Structure (match approved Atom Forge / Bio Quest targets)
```
Topbar 56px: game mark · rank/XP
Breadcrumb 13px
Title 24px/700 "Level N · …" + Hinglish subtitle 14px
┌──────── stage (~62%) ────────┬──── right rail (~38%) ────┐
│ animated SVG/Canvas world    │ Task card                 │
│ always ticking (idle motion) │ Meter / ladder            │
│ drag/tap targets lit         │ Gold primary action       │
│                              │ Navy SAMJHO concept strip │
└──────────────────────────────┴───────────────────────────┘
Footer status: Round · key counts · streak · timer
```

### 4.2 Interaction rules (non-negotiable)
1. **Continuous animation:** idle bob/orbit/particles even when waiting; never a frozen poster.
2. **Narrated steps:** Saathy (or text+TTS later) speaks one instruction; then **pauses for input**.
3. **Direct manipulation:** drag neutron / tap organ / slide force — hit targets ≥ 44px; ghost preview while dragging.
4. **Instant animated feedback:** on drop/tap, world reacts in <100ms (meter needle, shell glow, wrong shake 200ms, correct pulse + gold particles).
5. **Why right/wrong:** concept strip updates with 1 Hinglish sentence tied to NCERT term.
6. **Check action:** validates state; never shows raw keys (`CAR.RAW` etc.); copy is human.
7. **Fail soft:** wrong move is reversible; Reset always visible.
8. **QA gate:** a real pointer-drag in Playwright/manual must move the object and change a meter before the game is "done".

### 4.3 Motion budget
- Idle loop 3–6s, ease-in-out.
- Success celebration ≤ 800ms then enable Continue.
- Prefer CSS/SVG/Canvas/Rive over MP4 overlays (keep interactive).
- Reduced-motion: keep state changes, drop ornamental loops.

### 4.4 Game ↔ product mapping
| Need | Steal from |
|------|------------|
| Direct drag + live readout | PhET |
| Step solvable + footer feedback | Brilliant + Duolingo |
| Juicy CTA + XP celebration | Duolingo lesson complete |
| Right-rail task/meter/concept | Our Atom Forge target |
| Warm school coach voice | Seesaw / ClassDojo tone via Saathy |

---

## 5. Anti-patterns (what made Carren's recording feel trash)

| Anti-pattern | Fix |
|--------------|-----|
| Squished welcome / clipped cloud | Fixed 48px mascot + flex row; never scale below |
| Stat numbers in corners | Flex centre; 28px tabular nums |
| Empty Continue gap | Always hero or designed empty state |
| Broken segmented control | 32px pill track, active navy fill white text |
| Error toast over skeletons | Replace skeletons with error card + Retry |
| Settings header too tall | Cap 56–72px page header |
| Privacy full-bleed text | `max-width: 640px` |
| Static game / dead drag | Interactive-video rules §4 |
| Garbled check copy | i18n keys resolved; human strings only |
| Slide-deck spacing (huge empty fields) | 16–24px gaps; content density like Linear |

---

## 6. Build checklist (workspace polish pass)

- [ ] Shell: 240 sidebar + 56 topbar on cream; active nav pill
- [ ] Student home: Continue hero + 3 stats + path + queue
- [ ] Subjects/chapter: cards + mastery pills + next-up rail
- [ ] Sessions list: filters + 64px rows + overdue state
- [ ] Session player: full-screen Brilliant flow + feedback banner
- [ ] Quiz: confidence pills + why-wrong banner
- [ ] Notifications: Linear-density inbox + deep links
- [ ] Settings/Privacy: compact header + 640px prose
- [ ] Teacher dashboard + heat-map + builder two-pane
- [ ] All 10 games pass §4 interactive-video QA (real drag)
- [ ] Landing untouched; theme tokens unchanged
- [ ] Screenshots at 1440 and 360 for each screen above

---

## 7. Priority order for implementation

1. **App shell + Student Home** (biggest "HTML slides" smell)
2. **Session player + Quiz why-wrong** (learning loop)
3. **Games interactive-video rebuild** (teaching seriousness)
4. **Teacher dashboard + heat-map + builder** (phase 5 tools)
5. **Notifications + Settings** polish

