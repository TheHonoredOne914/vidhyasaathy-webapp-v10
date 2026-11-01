# VidhyaSaathy — The Master Build Checklist

> **From where we stand today to the dream product — one honest tick at a time.**
> This is the execution tracker that sits on top of the **Product Master File** (the *what*) and the **Build Prompts 01–10** (the *how*). Every feature we already have, every feature we must make real, every flow from sign-in to final testing, every rule we may never break — all in one tickable file.

**Companion files:**
- `VidhyaSaathy_Product_Master_File.pdf` / `.md` — the product truth (read Part 9 + Part 10 alongside this file)
- `VidhyaSaathy_Build_Prompts/00…10 .md` — the prompts you paste into Cursor / Claude Code, in order

**For the team (Hinglish note):** yeh file aapka roz ka kaam hai. Subah kholo, dekho aaj kaunse phase ke boxes tick hone hain, raat ko sirf wahi tick karo jo aapne **asli app me chalte hue dekha** — "AI ne bola ho gaya" ya "kal chal raha tha" count nahi karta. Agar koi cheez phati hai to uske saath ek line ka note likho aur usse uske Build Prompt phase pe wapas bhej do. Tracker kabhi jhooth nahi bolta — demo din bhi nahi bolega.

**Scoreboard (update as you tick):**

| Section | Items | Status |
|---|---|---|
| 0.1 Paper & design assets | 8 | ✅ all done |
| 0.2 Static screens (interface only) | 14 | ✅ exist — being re-born wired |
| 0.3 The honest gap list | 12 | ⬜ the build closes these |
| Day 0 preparation | 12 | ⬜ |
| Day 1 foundation | 35 | ⬜ |
| Day 2 learning loop | 32 | ⬜ |
| Day 3 intelligence | 40 | ⬜ |
| Day 4 delight & launch | 38 | ⬜ |
| Feature completion (all 35, groups A–K) | 35 | ⬜ |
| The 7 flows (27 steps) | 27 | ⬜ |
| Global definition of done | 6 | ⬜ |
| Acceptance + edge cases + fix rounds | 15 | ⬜ |
| Launch & demo readiness | 10 | ⬜ |
| The dream roadmap (post-launch) | 10 | ⬜ |
| The final gate (one sentence) | 1 | ⬜ |
| **TOTAL** | **295** | **22 done · 273 to go** |

*Full QA depth (170 observed-behaviour items in 13 groups) lives in the Master File Part 10 — this tracker references its key gates and adds the build steps, features, flows and dream roadmap around them.*

---

## How to Use This Tracker (the rules)

1. **A tick means OBSERVED.** You personally saw it working in the real app, in the right role. Code-written, AI-claimed and worked-yesterday do not count.
2. **One phase at a time.** Paste one Build Prompt, answer its QUESTION GATE, say GO, let it build the whole phase, verify its checklist — only then the next. Stacking phases is how the static-HTML chaos was born; do not revive it.
3. **The day ends at its EXIT DEMO gate.** If the exit demo fails, the day is not over (or the triage table in §5.7 was applied explicitly and on the record).
4. **Failed item = one-line note + back to its phase.** Never delete a failed item; annotate it.
5. **No regressions.** Before calling any day done, re-run the previous days' exit demos (5 minutes each).
6. **Progress = ticked ÷ total, by section.** The numbers live at the top of each section. When a section hits 100%, it is frozen — changes there need a reason written down.
7. **When Master File and anything else disagree, the Master File wins.**

**Legend:** `[x]` = done & observed · `[ ]` = to do · **(S)** = static screen already exists (interface only, mock data, no real flow) · **(B)** = brand new build, nothing exists yet

---

## Part 0 — Where We Stand Today

*Honest inventory before the first brick. Two kinds of "have": paper assets (thinking, decided, written) and static screens (beautiful, fake, unwired). Both are real progress — neither is a product yet.*

### 0.1 — Paper & Design Assets (DONE — this is the foundation nobody has to re-think)

- [x] Full product specification mined and consolidated — 100 features registered with IDs (VS-01..VS-100), flows, and deliberate cuts (`VidhyaSaathy_Breakthrough.final.txt`)
- [x] Colour & UX direction decided — **Scholar Indigo (C-01)** chosen as the design system, with full tokens, contrast reports and 6-screen mockup validation (`VidhyaSaathy_Color_UX_Design.pdf`)
- [x] **Product Master File written** — 12 parts, 7 flows, 35 catalogued features, four-band engine, 4-day plan, 170-item QA tracker (this is the "what")
- [x] **11 Build Prompts written** — 1 master + 10 phases with question gates and 155 Definition-of-Done items (this is the "how")
- [x] Brand identity fixed — cloud mascot spec (8 restrained states, no flashing, no animation during solving), friendly language map, tone guardrails
- [x] Prototype scope locked — NCERT Class 9 & 10 only, one demo school, Class 9-A Physics "Motion" three-concept anchor chain
- [x] The four student bands defined with the definitive routing table (0-25 / 25-50 / 50-75 / 75-100%) + friendly student-facing vocabulary
- [x] This execution checklist created — the file you are reading

### 0.2 — Screens That Exist Today (static HTML — interface only) (S)

*These exist as pages. `[x]` here means "the screen exists and looks right" — it does NOT mean it works. Every one of them gets re-born wired to the real backend in Days 1–4.*

- [x] Student app screens — home, class workspace, concept pages (S)
- [x] Quiz player interface (S)
- [x] Flashcards interface (S)
- [x] School notes view (S)
- [x] Interactive notes view (S)
- [x] Summary notes / one-pager PDF screen (S)
- [x] Curated YouTube suggestions view (S)
- [x] Games arcade screens / models (S)
- [x] Cloud-mascot AI chat interface (S)
- [x] Study-plan / "remove the chaos" concept screens (S)
- [x] Teacher screens (S)
- [x] Parent dashboard screens with graphs & charts (S)
- [x] Admin screens (S)
- [x] "4 kinds of students" concept present in the interface (S)

### 0.3 — The Honest Gap List (what is fake today — tick each only when it becomes REAL)

*This is the section that closes during the build. When all 12 are ticked, the static app has become the product.*

- [ ] Sign-in / sign-up actually works per role (no mock logins anywhere)
- [ ] A real database behind every screen (no placeholder JSON, no hardcoded arrays)
- [ ] Row-level security ON — a parent query on student chats is REJECTED by the database
- [ ] Quizzes scored on the SERVER (answer keys never reach the client)
- [ ] The diagnostic really routes (the same session serves Priya ≠ Aarav ≠ Rohan differently)
- [ ] The AI cloud companion really answers (server-side keys, streaming, band depth)
- [ ] Games really score against concepts and write evidence
- [ ] Parent graphs move because of the child's real events (not demo data)
- [ ] Notifications really arrive (session open, milestones)
- [ ] Hindi toggle really switches every string (zero missing keys)
- [ ] App installable + current chapter readable offline (PWA)
- [ ] Demo world re-loadable in one command (reset script)

---

## Part 1 — Day 0 (Evening Before): Preparation

*Four-day builds die of logistics more than code. This evening is a real work block.*

- [ ] Supabase project created; keys stored in env vars — never committed (grep the repo clean before sleeping)
- [ ] AI provider key provisioned **with a spend cap** and rate limits noted
- [ ] Git repo audited: existing static screens inventoried file-by-file (this is Build Prompt 01's first instruction — do it with the AI, not for it)
- [ ] Decide the keep/merge/replace call per static screen (which Scholar-Indigo shell each maps into)
- [ ] Content pack staged and ready to load: teacher-authored notes × 3 concepts, simple/standard/concise variants, Motion summary one-pager, flashcard decks (8–12 cards × 3), 2 curated YouTube links with real timestamps + one-line reasons, ~80 banked questions with the four mandatory tags, Hindi translations of every student-facing string
- [ ] Concept prerequisite map confirmed for the Motion chain (distance & displacement → speed & average speed → acceleration)
- [ ] Demo accounts decided and written in one secure place: admin, Sharma Ma'am (Physics), maths teacher, Aarav / Priya / Rohan, two parents
- [ ] The 11 Build Prompt .md files + Master File open and in the same Cursor/Claude Code chat plan (one chat, phases in order)
- [ ] Team schedule agreed: who builds, who tests as a real user (fresh eyes), when are the two daily test windows
- [ ] One low-end Android phone charged and reserved for testing (the real target device)
- [ ] Triage table (§5.7) read by everyone; the NEVER-DEFER row memorised
- [ ] Night agreed: no building after the exit demo passes — rest is a Day-4 feature

**Day 0 exit:** every box above ticked → sleep. Nothing half-staged survives to morning.

---

## Part 2 — Day 1: Foundation

> **Paste:** `00_MASTER_PROMPT.md` first (with the Product Master File .md attached), then phases `01_DATABASE_FOUNDATION.md` → `02_AUTH_REGISTRATION.md` → `03_APP_SHELL_DESIGN_SYSTEM.md`. One at a time, question gate honoured.

### 2.1 — Phase 01: Database Foundation (morning) (B)

- [ ] Full schema migration runs on a fresh project without error: all 8 table groups (identity/membership, academic structure with the concept prerequisite map, content, assessment with server-side keys, evidence/progress, AI/doubts, communication/motivation, ops)
- [ ] `question_options.is_correct` lives server-side only — confirmed it never appears in any client-facing SELECT
- [ ] RLS policy matrix implemented on every table (the Part 2.4 permission matrix, enforced in the database)
- [ ] `submit_quiz` RPC: scores server-side, writes per-question evidence rows (answer + confidence + time-to-answer + error family)
- [ ] `touch_streak` RPC: idempotent (double-tap tested → single increment)
- [ ] Evidence trail is append-only — corrections create new events, nothing overwrites history
- [ ] Storage buckets private, signed-URL access only
- [ ] Demo seed loads in one command: Green Valley School (CBSE), classes 9-A/9-B, Sharma Ma'am + maths teacher, Motion chapter with 3-concept chain, tonight's session published 14:00 / open 18:00–08:00, ~80 banked questions, 3 student archetypes + 2 linked parents, badge/game/streak catalogs, the 17-doubt acceleration cluster
- [ ] Nightly aggregates job scheduled (heatmap + parent data fresh by morning)
- [ ] Indexes on hot paths — `student_home` query under 300 ms on seed data

### 2.2 — Phase 02: Entry System — Sign-in / Sign-up for Real (afternoon) (S→real)

- [ ] Admin setup wizard works end-to-end: school → academic year → classes 9 & 10 → sections A/B → subjects → teacher-subject-section assignments (all audit-logged)
- [ ] Teacher invite: staff ID + email → one-time expiring link → password set → lands in teacher shell with classes pre-listed
- [ ] Student activation: code + roll number + DOB → password → student shell; wrong roll no / DOB / expired code gives a named friendly error (no leak)
- [ ] Activation codes single-use and expiring; second attempt rejected
- [ ] Parent link: OTP → pending → admin approval → parent world for that child ONLY
- [ ] Forgot-password flow completes by email for every role
- [ ] SSR sessions: refresh keeps role; logout kills the session everywhere
- [ ] Role guards: student hitting `/admin` bounces; every role lands in its own shell
- [ ] Auth screens fully bilingual — EN/HI switch live on the auth flow itself
- [ ] First student login greets via the cloud companion; zero empty states

### 2.3 — Phase 03: App Shell & Design System (evening) (S→real)

- [ ] Scholar Indigo tokens implemented as the single source of truth — no hard-coded colours anywhere (audit clean)
- [ ] Hero gradient (`linear-gradient(135deg, #4338CA, #6D5BD0)`) appears ONLY on hero/auth surfaces
- [ ] Amber accent (#B45309) reserved for achievement/badges only, < 5% of visual area
- [ ] Component kit built with ALL states: buttons, inputs, cards, modals, skeletons, empty states, error+retry, toasts — loading/empty/error for every async surface
- [ ] The four role shells: student (bottom 5-tab bar, thumb-first), teacher (sidebar/top-drawer), parent (simple top-nav, 3 entries max), admin (sidebar, admin-only sections)
- [ ] Notification infrastructure live with Realtime unread counts (teacher doubts/submissions)
- [ ] i18n skeleton: every string through the translation layer from day one — no hardcoded English that will need hunting later
- [ ] "Continue where you left off" works from real resume pointers

### 2.4 — Day 1 Learnings (the laws that make everything after this honest)

- **Backend-first, always.** A screen that consumes real data is a feature; a screen over mock JSON is a liability wearing a costume.
- **RLS on day one.** Retrofitting security onto a working app is how demos leak children's data.
- **The evidence trail is the moat's raw material** — it is built BEFORE any screen that displays it, because the heatmap, parent graphs, band routing and AI context are all just queries over it.
- **Server time is authoritative** — session windows and streaks ignore the client clock (spoof test required).
- **Seed = truth.** Every later test and the whole acceptance demo run on the seeded world; sloppy seed means a Day 4 you cannot demo.

### 2.5 — Day 1 Verification Checklist

- [ ] All four roles sign in with real credentials and land in their real shells
- [ ] A student's class workspace reads real seeded data (chapters, teacher, sessions — from the DB, network tab verified)
- [ ] No mock logins anywhere in the codebase (grep: no `mock`, no `fake`, no `demo=true` login paths)
- [ ] Cross-role read attempt REJECTED in logs (e.g. parent session → student chats)
- [ ] Reset script restores the seeded world verbatim (run it twice, same world both times)
- [ ] Migrations re-runnable on a fresh Supabase project without error

### 2.6 — DAY 1 EXIT DEMO (must pass to sleep)

- [ ] **Exit demo passed:** all four roles sign in with real credentials, land in their real shells, a student's workspace reads real seeded data, no mock logins anywhere, RLS proven by a rejected cross-role query — observed by a human, in both languages at least once

---

## Part 3 — Day 2: The Learning Loop

> **Paste:** `04_STUDENT_CORE_LOOP.md` (morning) → `05_TEACHER_WORLD.md` (afternoon). Evening = buffer: fix the day's failures, run Flow 3 manually as Aarav, deepen the seed if time allows.

### 3.1 — Phase 04: Student Core Loop (morning) (S→real)

- [ ] `student_home` single-call RPC returns classes, subjects, chapters, pending items and streak state in ONE round trip
- [ ] **Next-Action card** computed server-side with the fixed priority order: unfinished session > due-tomorrow > revision of decaying concept > new content > games; one tap enters the activity mid-state
- [ ] Session engine: open/close windows enforced by SERVER time (18:00–08:00); resume pointer works after app kill (no double-submit)
- [ ] Session completion rule: all parts + quiz ≥ 60%; below that → bridge path offered, never a bare "fail"
- [ ] Diagnostic offered on first chapter open: ~5 friendly questions from the prerequisite chain + 2 new-concept probes; zero marks language; result seeds per-concept mastery and the entry band
- [ ] Skipping the diagnostic defaults the student to Band-2 content until evidence arrives
- [ ] **Confidence buttons (Sure / Unsure / Guess) on EVERY question** — tapped before reveal, logged on every response row
- [ ] Quiz engine server-scored; summary shows "Why I got it wrong" per miss: concept tag + error family + the one-line fix
- [ ] Concept page: school notes render with formatting + Hindi; interactive checkpoints fire, score server-side, explain inline; "explain simpler" swaps to the simple variant of the same idea
- [ ] Curated YouTube plays inline at the teacher's timestamp range; watching logged as engagement, never mastery
- [ ] Summary one-pager PDF downloads/prints cleanly
- [ ] Per-concept mastery view in profile: L1–L4 shown in friendly words only ("Let's fix this / Almost there / Mastered / Top form") — no band labels, no percentages, no classmate scores anywhere
- [ ] Absence recovery: Rohan's shame-free "Catch-up, 20 minutes" card works (recovery event logged as distinct)

### 3.2 — Phase 05: Teacher World (afternoon) (S→real)

- [ ] Morning dashboard: last night's completion, three reddest heatmap cells, doubt clusters, grading queue count, ONE suggested action — zero data entry anywhere
- [ ] Class × concept heatmap: rows = students, columns = concepts, three-colour scale (safe / unstable / critical); drill shows confidence pattern + error families; one tap pushes a reteach repair session to the struggling subset ONLY
- [ ] Students never know they were "the red ones" — the reteach arrives as a friendly bridge path
- [ ] Session builder: auto-suggested concepts from syllabus progress, attach notes / trimmed video / summary sheet, quiz auto-selected by concept + difficulty mix (editable), open/close defaults, homework flag
- [ ] **Student preview renders the REAL player** — what Sharma Ma'am sees is exactly what Aarav gets
- [ ] Publish takes under 3 minutes, timed, twice in a row
- [ ] Publish notification reaches the class at 18:00 open — not before
- [ ] Question bank: filters by concept/difficulty/board-format; provenance visible; AI-drafted questions arrive visually distinct and NEVER auto-publish (teacher approve/reject both work)
- [ ] Class space announcements, section-scoped (9-A's feed is 9-A's)
- [ ] Subject/section scoping proven: Sharma Ma'am cannot touch 9-C or the maths teacher's rows

### 3.3 — Day 2 Learnings

- **Diagnostic-first is product law.** Every new chapter, every student, no exceptions — including chapters the teacher is confident about.
- **Mastery is per concept, never one overall percentage.** "Aarav: Distance 82%, Acceleration 30%" is the honest shape; an overall "56%" hides the exact gap the app exists to find.
- **"Sure" + wrong is the most diagnostic signal in the app** — it means a real misconception, not carelessness. The confidence buttons are not decoration.
- **The teacher's evening is 5 minutes, not 50.** Publishing under 3 minutes is a feature, not a nice-to-have — it is what makes nightly publishing (and therefore the moat) actually happen.
- **A game that doesn't write concept evidence is a toy; a plain quiz that does is an asset.**

### 3.4 — Day 2 Verification Checklist

- [ ] Priya and Aarav open the same chapter and receive visibly different content (side-by-side screenshot)
- [ ] Diagnostic result changes the Next-Action card for that specific child
- [ ] Resume mid-quiz works after killing the app (same question, no double-submit, timer sane)
- [ ] Two tabs on the same quiz → one authoritative attempt, second tab told "already in progress"
- [ ] Network trace during a quiz: no answer key ever in the client payload
- [ ] Sharma Ma'am publishes at 14:00; the 18:05 Aarav run completes end-to-end: warm-up (if flagged) → concept page with checkpoints → quiz with confidence buttons → "why wrong" summary → streak ticks
- [ ] Her heatmap updates from his real answers within the night's aggregate
- [ ] Previous day's exit demo still passes (regression, 5 minutes)

### 3.5 — DAY 2 EXIT DEMO (must pass to sleep)

- [ ] **Exit demo passed:** Sharma Ma'am publishes tonight's session in under 3 minutes with a real student preview; Aarav completes it end-to-end at 18:05 (warm-up, concept page with checkpoints, quiz with confidence buttons, why-wrong summary); the heatmap updates from his real answers

---

## Part 4 — Day 3: The Intelligence

> **Paste:** `07_AI_TUTOR_CORE.md` (morning) → `08_AI_PERSONALIZATION_ENGINE.md` (afternoon) → `06_PARENT_ADMIN_WORLDS.md` (evening). This is the day the app stops being the same for everyone.

### 4.1 — Phase 07: AI Tutor Core (morning) (S→real)

- [ ] Cloud companion chat runs the full **11-step server-side sequence**: auth → rate-limit + budget → student context slice from the trail → concept map around the doubt → language + band depth detection → system prompt with safety rules + tone → stream (SSE) with thinking state → private log → anonymised cluster counters → promised follow-ups written → budget closed
- [ ] AI keys exist ONLY in server env vars (client bundle grep clean)
- [ ] Same doubt, different depth: Priya gets analogy-first, Aarav gets formula-forward (verified side-by-side)
- [ ] English, Hindi, and natural Hinglish all answered in-language
- [ ] Homework mode is Socratic: refuses direct answers, guides with questions and hints
- [ ] Honesty layer: unsure questions get a plain "I don't know" + escalation offer — never a confident invention
- [ ] 20-probe adversarial spot-check: zero fabricated citations, zero fear/shame/comparison tone
- [ ] Rate limit + token budget enforced — burst test rejected cleanly
- [ ] SnapDoubt: photo → server-side extraction → confirmation round-trip → doubt (or triaged per §5.7 with reason recorded)
- [ ] Doubt clustering job produces "17 doubts on acceleration, 9 on sign convention" from the seed truth — anonymised to the teacher
- [ ] Opt-in named escalation ("also tell my teacher") delivers correctly; default is always anonymous

### 4.2 — Phase 08: Personalisation Engine (afternoon) (B)

- [ ] Band routing live in EVERY serving surface: note variants (simple/standard/concise), quiz entry difficulty, ladder, pacing
- [ ] **The ladder rule observed live: starts at L2; three consecutive correct climb to L3; two consecutive wrong drop to L1 with an automatic bridge explanation** (drop = help, never punishment)
- [ ] Band placement arithmetic implemented as specified: diagnostic seeds → rolling window (last ~10 interactions per concept) → prerequisite-weighted chapter average; "Guess" discounts a correct answer; "Sure"+wrong weighs as misconception; NO black-box model
- [ ] Promotion/demotion events logged and visible to the teacher ("Aarav moved 25-50 → 50-75 on Motion, Tuesday"); demotion is quiet and shame-free
- [ ] Error DNA drives four visibly different repair paths: concept gap (bridge back + re-test) / careless slip (one-line nudge) / method error (worked example, broken step highlighted) / guess (honest acknowledgement, re-queued in a different skin)
- [ ] Revision radar: 2-minute warm-up appears exactly when decay is seeded ("Quick warm-up? Distance & displacement — fading"); skip is respected without guilt-tripping
- [ ] Frustration radar: rapid wrongs + retries + abandonment → softer tone, smaller next step, maybe a break — never a red screen
- [ ] Dushman queue targets the student's own 3 weakest concepts, re-skinned so recognition can't masquerade as mastery, retires at L3
- [ ] Study plans generate realistic night-by-night plans from the trail ("exam in 3 weeks, 6 concepts shaky, 25 min a night") and SHRINK after a missed night instead of breaking
- [ ] Interest mash-ups: same concept/difficulty/scoring dressed in the student's declared interest (or triaged per §5.7)
- [ ] Learning-prediction weights start neutral, move slowly, inspectable in the profile ("explains best with: examples and Hindi terms; consolidates by: self-testing")

### 4.3 — Phase 06: Parent + Admin Worlds (evening) (S→real)

- [ ] Parent weekly dashboard renders graphs from the child's REAL trail: effort bars (sessions + minutes per night), mastery trend per subject, streak health, three-state exam readiness lamp
- [ ] Plain-language summary under the graphs — sentences a non-teacher parent can act on
- [ ] "Ask This" card grounded in a real event of that child ("Aarav fixed his acceleration graphs this week — ask him to show you how he reads one")
- [ ] **Privacy wall proven: no chats, no doubts, no raw answers reachable by parent — rejected at the database, not just hidden in UI**
- [ ] Multi-child parent switches children; only linked ones visible
- [ ] Weekly email digest cron delivers (or triaged per §5.7 with reason recorded)
- [ ] Printable one-page report generates and matches the teacher's truth
- [ ] Admin: CSV import with validation preview + per-row named errors; activation-code export as printable slips; parent-link approval queue + revocation (cuts access immediately, audit-logged); permission matrix page matching Part 2.4 with privacy-wall rows HARD-LOCKED; audit log of imports/approvals/revocations/resets

### 4.4 — Day 3 Learnings

- **The privacy wall is commercial, not compliance theatre.** Students only confess real confusion at 11 pm if they are certain no parent reads it — the wall is what makes the doubt data (and the teacher's heatmap) honest.
- **Answer at band depth, in the student's language.** The same doubt about acceleration is a different answer for Priya and Aarav — that difference IS the product.
- **Prediction must be legible.** Pattern memory with a paper trail, never a black box — a teacher asking "why did it show her that?" must get a real answer.
- **The four error families are not interchangeable.** Mislabelling them is how generic apps waste student time.
- **Plans that assume a suddenly-perfect student are lies, and children know it.**

### 4.5 — Day 3 Verification Checklist

- [ ] Priya and Aarav ask the SAME doubt → visibly different-depth answers (screenshots side-by-side)
- [ ] Priya's repair path works end-to-end (prerequisite re-taught simply → re-test)
- [ ] Rohan's catch-up card works (20 min, shame-free copy, recovery event in the trail)
- [ ] A parent opens the dashboard and the graphs have MOVED because of last night's real session
- [ ] Parent query on chats rejected in logs (the wall, again — it is that important)
- [ ] Ladder transitions logged with bridge text visible on a drop
- [ ] Band promotion event visible to the teacher
- [ ] Admin approves one pending link; audit log shows it; revocation closes the parent world immediately
- [ ] Days 1–2 exit demos still pass (regression)

### 4.6 — DAY 3 EXIT DEMO (must pass to sleep)

- [ ] **Exit demo passed:** same doubt → different depth for Priya vs Aarav; Priya's repair path and Rohan's catch-up card both work; a parent's graphs moved from last night's real session; the privacy wall proven by a rejected parent query on chats

---

## Part 5 — Day 4: Delight & Launch

> **Paste:** `09_MOTIVATION_GAMES.md` (morning) → `10_INDIA_LAYER_PWA_LAUNCH.md` (afternoon). Evening = fix rounds, deploy, runbook, rehearsal. This is the day the app becomes demo-able — and fun.

### 5.1 — Phase 09: Games & Motivation (morning) (S→real)

- [ ] Five games playable end-to-end on a low-end phone, all on the SHARED question bank: **MCQ Rush** (60-second streaks) · **Match-the-Concept** (term ↔ definition vs clock) · **Rapid Revision** (flashcard deck as self-rated sprint) · **Streak Challenge** (bank XP or risk it — bounded downside, banked portion survives) · **Boss Level** (mixed exam-format boss, gated at ≥ 70% chapter mastery, defeat unlocks next-chapter preview)
- [ ] Boss Level LOCKED below 70% chapter mastery — negative test done
- [ ] Every game scores against concepts and writes evidence rows; confidence buttons present INSIDE games; the ladder applies inside games too
- [ ] Streaks accrue from any meaningful learning act (session, game, warm-up); touch is server-side and idempotent (one per calendar day, ever; midnight + timezone boundary tested; timezone set by the school)
- [ ] Freezes: 1 earned per 5 streak days, max 2 stored; a freeze burns automatically on a missed day; after a true break, restart is gentle ("welcome back — day 1 starts today")
- [ ] Daily 5-minute challenge serves warm-up / Dushman content — a compressed evening still moves the needle
- [ ] Improvement badges award on real trajectories: "Fixed It" (L1→L2), "Comeback King" (recovered after 3 absent days), "Dushman Slayer", "Boss Buster" — amber accent reserved for this shelf
- [ ] **NO leaderboard, NO classmate comparison anywhere — audited** (this is permanent product law, not a missing feature)
- [ ] Celebrations skippable; reduced-motion honoured in games too

### 5.2 — Phase 10: India Layer, PWA & QA (afternoon) (B)

- [ ] PWA installable; app shell caches; icon + splash correct
- [ ] "Save for offline" caches the current chapter; airplane-mode read works
- [ ] Offline attempts land in the IndexedDB outbox; sync on reconnect marks them "synced late" (teacher sees the tag, not silence)
- [ ] Data-saver mode swaps heavy renders for the PDF summaries
- [ ] Full Hindi audit: zero missing keys (automated parity check green); language switch instant, in-place, state preserved mid-session
- [ ] Hinglish flows naturally in companion chat (native-speaker review)
- [ ] Lighthouse mobile: performance ≥ 80, accessibility ≥ 90 on a low-end profile
- [ ] The whole student loop usable on a 2-year-old Android over a 3G-class network
- [ ] Edge-case sweep (§6.3) executed — every case handled gracefully
- [ ] **Full-day acceptance script (§6.2) executed for real, on the record**

### 5.3 — Evening: Fix Rounds & Launch

- [ ] Fix Round 1: everything that broke the script or checklist — severity order: data integrity → security → flows → polish
- [ ] Fix Round 2: Round-1 fallout + triage decisions made real (deferred items moved to backlog properly, half-built features finished OR hidden — never left dangling)
- [ ] Build FREEZES after Round 2 — remaining hours go to rehearsal and rest (a fresh demo of a slightly-less-working app beats a tired demo of a working one, every time)
- [ ] Deployed URL live, HTTPS, env vars set in hosting (not local-only)
- [ ] Runbook written: deploy, reset, seed, rotate keys, known limits
- [ ] Demo-reset script verified AFTER final fixes (the world is repeatable)
- [ ] Demo script rehearsed once against the deployed world, timed
- [ ] Demo accounts + passwords listed in one secure place for presenters
- [ ] Fallback demo plan if venue network dies (offline-cached device)
- [ ] AI spend cap + rate limits set for demo-day safety
- [ ] Someone celebrated — four days of this deserves it

### 5.4 — Day 4 Learnings

- **Games are the sugar, evidence is the medicine — both served together.** Every game writes concept evidence or it doesn't ship.
- **Motivation is personal here: streaks, improvement badges, beaten enemies.** The day a classmate's name appears on a student's screen is the day the trust dies.
- **Offline is an Indian feature, not a nice-to-have.** Flaky 3G at 11 pm is the actual production environment.
- **Hindi parity is parity.** One missing key is one broken promise, visible exactly when it matters.

### 5.5 — Day 4 Verification Checklist

- [ ] Three-archetype evening recorded side-by-side (Aarav / Priya / Rohan visibly different — the personalisation centrepiece)
- [ ] Both languages walked through the full student loop
- [ ] Permission-matrix negative tests all rejected (parent AND admin walls)
- [ ] Rapid double-submit + flaky-network submissions stay consistent
- [ ] AI adversarial probes clean (no fabricated citations, no fear/shame tone)
- [ ] Fresh-eyes walkthrough: someone who did not build it completes a session unaided
- [ ] Days 1–3 exit demos still green after Day 4 changes (regression)

### 5.6 — DAY 4 EXIT DEMO (this IS the demo)

- [ ] **Exit demo passed:** the complete acceptance script (§6.2) passes end-to-end on the deployed URL — admin 07:00 through next-morning heatmap — and the three archetypes have three visibly different evenings, demonstrated live on a real phone

### 5.7 — If Behind: The Triage Table (this order, no exceptions)

| Slipping item | Day-4 action | Why it is safe to defer |
|---|---|---|
| Interest mash-ups, readiness-lamp refinements | Defer to post-launch backlog | Nice differentiation, not load-bearing for the demo sentence |
| SnapDoubt photo pipeline | Ship typed doubts only | The chat already carries the doubt; the camera is sugar |
| Streak Challenge game | Ship four games, not five | The arcade story survives with four doors |
| Weekly email digest | In-app parent view only | The dashboard proves the graphs |
| PWA offline depth | Install + cache shell only | Online demo works regardless |
| **NEVER defer** | Server-side scoring · RLS · confidence buttons · band routing · teacher heatmap · parent aggregates · the evidence trail | **These ARE the product — deferring any means the demo shows a mock** |

---

## Part 6 — Feature-by-Feature Completion Checklist (all 35, groups A–K)

*Every feature of the prototype, in catalog order. Each line: static status → build day → the "done when" test. A feature is ticked only when its done-when is observed in the real app.*

### A — Identity & Onboarding (2)

- [ ] Sign-in / Sign-up, school-anchored (VS-01..08) — (S→real) · Day 1 · done when: all 4 roles enter through their real flow, codes single-use+expiring, wrong-DOB errors friendly
- [ ] Parent linking & approvals (VS-08) — (B) · Day 3 · done when: OTP → pending → admin approve → aggregates-only parent world; revocation cuts access instantly, audit-logged

### B — Diagnostic & Placement (1)

- [ ] Chapter diagnostic, test-before-teach (VS-19) — (S concept→real) · Day 2 · done when: first chapter open offers ~5 friendly questions; result seeds mastery + entry band; Priya ≠ Aarav routed differently from the SAME session

### C — Learning Content, the five study surfaces (5)

- [ ] School notes, teacher-authored (VS-11) — (S→real) · Day 2 · done when: notes publish through the session builder with concept tags and render at the student's band variant, Hindi included
- [ ] Interactive notes (VS-11+) — (S→real) · Day 2 · done when: a checkpoint fires after each idea, scores server-side, explains inline; "explain simpler" swaps variants of the SAME idea
- [ ] Summary notes as PDFs (VS-44) — (S→real) · Day 2 · done when: the Motion one-pager downloads/prints cleanly; AI-drafted version publishes only after teacher approval
- [ ] Flashcards, auto-built decks (VS-93+) — (S→real) · Day 4 · done when: 8–12 cards × 3 concepts flip; self-ratings (knew/almost/forgot) logged as revision evidence; deck feeds Rapid Revision
- [ ] Curated YouTube with timestamps (VS-13) — (S→real) · Day 2 · done when: teacher-pasted link plays inline at the trim range with the one-line reason; a view is logged as engagement, never mastery

### D — Practice & Assessment (5)

- [ ] Quiz engine, server-scored (VS-18) — (S→real) · Day 2 · done when: network trace shows zero answer keys client-side; ≥60% completes; below offers bridge; why-wrong summary per miss
- [ ] Confidence buttons / Pakka Meter (VS-39) — (B) · Day 2 · done when: Sure/Unsure/Guess under EVERY question in quizzes AND games, logged on every response row
- [ ] Adaptive difficulty ladder (VS-23) — (B) · Day 3 · done when: start-L2, 3-up/2-down observed live with bridge text on drops
- [ ] Exam-format practice, Board mode (VS-24) — (B) · Day 3 · done when: format-tagged sets (MCQ/AR/Case/Numerical/Short) served on owned concepts, timed
- [ ] Homework submission (VS-17) — (B) · Day 3 · done when: assign → submit (text/photo) → grading queue with AI-suggested marks the teacher accepts/edits in one tap; companion strictly Socratic during it

### E — AI Features, behind the cloud companion (4)

- [ ] Doubt chat (VS-28) — (S→real) · Day 3 · done when: 11-step server sequence runs, SSE streams with thinking state, band-depth answers in EN/HI/Hinglish, private log
- [ ] SnapDoubt, photo-to-doubt (VS-30) — (B) · Day 3 · done when: photo → extraction → CONFIRMATION → doubt (or triaged with reason)
- [ ] Study plans, the chaos-killer (VS-34) — (S→real) · Day 3 · done when: realistic night-by-night plan from the trail; shrinks — not breaks — after a missed night
- [ ] Doubt clusters → teacher (VS-38) — (B) · Day 3 · done when: anonymised "17 on acceleration / 9 on sign convention" from seed truth; opt-in named escalation works; default anonymous

### F — Personalisation beyond the bands (4)

- [ ] Dushman questions (VS-41) — (B) · Day 3 · done when: 3 weakest concepts return re-skinned until L3; queue updates silently from tonight's misses
- [ ] Interest mash-ups (VS-45) — (B) · Day 3 · done when: same concept/difficulty/scoring in the student's chosen context (or triaged)
- [ ] Absence recovery path (VS-20) — (B) · Day 3 · done when: Rohan's "Catch-up, 20 min" card works; recovery event distinct in the trail; heatmap shows "recovered", not a hole
- [ ] Test-prep readiness signal (VS-47) — (B) · Day 3 · done when: three-state lamp per exam computed from mastery across the exam's concepts

### G — Games & Motivation (3)

- [ ] Games arcade, five games one bank (VS-93..99) — (S→real) · Day 4 · done when: all five playable end-to-end on low-end phone, every game writes concept evidence, Boss gated at ≥70%
- [ ] Streaks with freezes + daily challenge (VS-95..96) — (B) · Day 4 · done when: any learning act counts; idempotent touch; freeze rules (1 per 5 days, max 2) boundary-tested; 5-min challenge serves warm-up/Dushman
- [ ] Improvement badges (VS-97) — (B) · Day 4 · done when: Fixed It / Comeback King / Dushman Slayer / Boss Buster award on real trajectories; amber reserved for the shelf

### H — Teacher World (5)

- [ ] Morning dashboard (VS-60) — (S→real) · Day 2 · done when: completion, red cells, clusters, queue, ONE suggested action — all aggregated from real evidence, zero data entry
- [ ] Class × concept heatmap (VS-61) — (S→real) · Day 2 · done when: grid matches seed truth; drill shows signals; one-tap reteach targets the struggling subset only
- [ ] Session builder with student preview (VS-62) — (S→real) · Day 2 · done when: publish < 3 min timed twice; preview renders the real player
- [ ] Question bank + AI-drafted questions (VS-63) — (B) · Day 2 · done when: filters work; AI drafts visually distinct, never auto-publish
- [ ] Class space & announcements (VS-10) — (B) · Day 2 · done when: section-scoped feed; no cross-class noise

### I — Parent World (3)

- [ ] Weekly progress dashboard (VS-73) — (S→real) · Day 3 · done when: graphs move from the child's real events; plain-language summary reads like a person; no chats/doubts/raw answers anywhere
- [ ] "Ask This" conversation prompts (VS-75) — (B) · Day 3 · done when: the prompt is grounded in a real event of that child
- [ ] Notifications & milestones (VS-74) — (B) · Day 3 · done when: ~2 notices a week, milestones/readiness shifts only; realtime unread counts for teachers

### J — Admin World (2)

- [ ] School setup wizard + CSV onboarding (VS-79..82) — (S→real) · Day 1–3 · done when: wizard completes without reference docs (usability test); CSV happy path + bad row → named error, others commit; printable code slips
- [ ] Approvals, permissions & audit (VS-83..87) — (B) · Day 3 · done when: approval queue + revoke works; matrix matches Part 2.4 with privacy rows hard-locked; audit log complete; demo-reset restores verbatim

### K — Platform, India layer (1)

- [ ] Bilingual + PWA offline (VS-88..92) — (B) · Day 1 i18n / Day 4 PWA · done when: zero missing Hindi keys; instant in-place switch; installable; offline read + outbox sync with late-marking; data-saver swaps to PDFs; Lighthouse ≥80/≥90

---

## Part 7 — Flow-by-Flow Checklist (the 7 flows, step by step)

*Each step is observed in the real app, in the role that lives it. Screenshots or it did not happen.*

### Flow 1 — School Onboarding (Admin → everyone) — 5 steps

- [ ] 1. Admin creates the school world (wizard: school → year → classes → sections → subjects → assignments; all audit-logged)
- [ ] 2. Teachers invited by staff ID + email (one-time link → password → shell with classes pre-listed)
- [ ] 3. Students imported via CSV; activation codes exported as printable slips
- [ ] 4. Student activates: code + roll no + DOB → password → student shell with cloud-companion greeting
- [ ] 5. Parent links via OTP → admin approves → parent world for that child only ("your parent can now see your progress — never your chats")

### Flow 2 — Student first login → diagnostic → personalised home — 3 steps

- [ ] 1. Sign-in → class workspace assembles itself (one `student_home` RPC)
- [ ] 2. Chapter open → diagnostic offer (5 friendly questions, confidence buttons, zero marks language)
- [ ] 3. Band placement written → home adapts (Priya: repair path; Aarav: acceleration concept; no band label anywhere)

### Flow 3 — The daily learning session (minute by minute) — 6 steps

- [ ] 1. 18:04 — session opens on server time; ONE quiet notification; Next-Action updates
- [ ] 2. 18:06 — warm-up offered ONLY if the radar flagged decay; skip respected without guilt
- [ ] 3. 18:10 — concept pages with interactive checkpoints, curated video at timestamp, "simpler" one tap away
- [ ] 4. 18:22 — quiz with confidence buttons + the ladder (harder when rolling, kinder when not)
- [ ] 5. 18:31 — why-wrong summary (concept + family + fix); ≥60% completes, below → bridge; Dushman queue updates silently
- [ ] 6. 18:34 — optional game (light evidence); streak ticks; home recalculates tomorrow

### Flow 4 — Doubt to answer (11 pm, the moat moment) — 3 steps

- [ ] 1. 23:02 — doubt typed (or SnapDoubt photo → confirm) → 11-step sequence begins
- [ ] 2. 23:04 — answer streams at band depth in the student's language; promised practice queued for tomorrow
- [ ] 3. Morning — teacher sees the anonymised cluster, not the child; one-tap reteach; opt-in named escalation works

### Flow 5 — Teacher's day (dashboard → reteach) — 4 steps

- [ ] 1. 07:40 — morning dashboard: completion, red cells, clusters, pending grading, ONE suggested action
- [ ] 2. 11:20 — heatmap drill ("Sure + wrong" dominance = misconception) → one-tap reteach to the struggling subset
- [ ] 3. 14:00 — publish tonight's session under 3 minutes with real student preview
- [ ] 4. 20:30 — grading queue with AI suggestions; accepts six, edits two, one comment line each — ten minutes, done

### Flow 6 — Parent's weekly view (Sunday, 10 minutes) — 3 steps

- [ ] 1. Weekly dashboard from the child's real trail (effort bars, mastery trend, streak, readiness lamp) — no raw answers in sight
- [ ] 2. The "Ask This" card — grounded in something real the child did
- [ ] 3. Printable one-page report when the school asks (PTM handout)

### Flow 7 — Game break (with the boss gate) — 3 steps

- [ ] 1. Arcade entry: five doors, one bank, tonight's recommended door first; solo play only
- [ ] 2. Streak Challenge: bank XP or risk it; a wrong risk ends the run with the banked portion intact
- [ ] 3. Boss Level: ≥70% gate enforced; defeat unlocks next-chapter preview + badge candidacy

---

## Part 8 — The Never-Break Rules (read before every build day)

*The learnings, distilled to law. If a decision ever feels ambiguous, these settle it.*

1. **Backend-first, always.** Screens consume real data or they don't ship.
2. **Diagnose first, teach second, adapt always.** Every new chapter, every student, no exceptions.
3. **Mastery is per concept.** Never one overall percentage; never a band label on a child — concepts are labelled, people are not.
4. **The student vocabulary is fixed:** "Mastered / Almost there / Let's fix this / Top form" — nothing that smells like a rank, ever.
5. **No public leaderboards, no classmate comparison — forever.** Motivation is personal: streaks, improvement badges, beaten enemies.
6. **Confidence buttons on every question, everywhere.** "Sure + wrong" is the most diagnostic signal in the app.
7. **The ladder is law:** start L2, three-up, two-down, always with a bridge explanation.
8. **Answer keys never reach the client.** Scoring is server-side, always.
9. **The privacy wall has no exceptions:** parents and admins never read chats, doubts or raw answers — enforced by RLS, proven by rejected queries.
10. **The AI never fabricates, never fears, never compares.** Honest "I don't know" > confident invention. Homework mode is Socratic.
11. **Every learning event appends to the evidence trail.** Nothing overwrites history.
12. **Server time is authoritative.** Client clocks are ignored for sessions and streaks.
13. **Absence is met with "Catch-up", never a wall of backlog.** Shame-free copy, always.
14. **Scholar Indigo is the only design system.** Hero gradient only on hero/auth; amber only for achievement; 4-pt grid; ≥44px touch targets.
15. **Every feature must serve a station of the loop** (Diagnose / Learn / Practice / Understand / Progress) — or it does not belong.
16. **Both languages, zero missing keys, at the moment it ships.**
17. **No regressions.** A feature that breaks yesterday's exit demo is a bug, not a feature.
18. **Never defer:** server-side scoring · RLS · confidence buttons · band routing · teacher heatmap · parent aggregates · the evidence trail. These ARE the product.

---

## Part 9 — Testing & Acceptance (the global gates)

### 9.1 — Global Definition of Done (applies to every phase, every day)

- [ ] Real data, real flows — every list, score, graph and notification computed from the database on a real role's session (no placeholder JSON, no mock logins, no "will wire later")
- [ ] Both languages — anything a user can read exists in EN + HI with zero missing keys when it ships
- [ ] All states designed — loading, empty, error + retry, permission-denied for every async surface (the skeleton is part of the feature)
- [ ] Security proven, not assumed — each new capability: one positive test (right role succeeds) + one negative test (wrong role rejected in the database)
- [ ] Evidence written — if it touches learning, it writes to the trail with the right event shape, or it is a screen, not a feature
- [ ] No regressions — previous exit demos still pass before the phase is called done

### 9.2 — The Full-Day Acceptance Script (run exactly, on the record)

| Time | Actor | What must happen (observed, not assumed) |
|---|---|---|
| 07:00 | Admin | Signs in; dashboard healthy; approves one pending parent link; exports a fresh activation-code batch; audit log shows both |
| 09:30 | Teacher | Morning dashboard shows last night's completion + the seeded doubt cluster; drills the acceleration cell; pushes one reteach to the struggling subset |
| 14:00 | Teacher | Publishes tonight's Motion session (TIMED: under 3 minutes) with notes, checkpoint-embedded concept page, summary PDF, curated video, 5-question quiz |
| 18:00 | System | Session opens on server time; notifications land quietly; Next-Action cards update |
| 18:05 | Aarav | Skips warm-up (radar clear), concise variant, L3 quiz, 4/5 "Sure", one method-error fix, Dushman queued, MCQ Rush for fun, streak ticks to 13 |
| 18:20 | Priya | Repair path first (bus analogy), simplest variant, Hindi labels, L1 quiz 3/5 with one discounted "Guess", warm companion tone, bridge scheduled |
| 20:30 | Rohan | Catch-up card, 20 minutes, shame-free copy, recovery event logged |
| 22:45 | Priya | Asks the companion one real doubt; streamed answer at her depth; doubt joins the anonymous cluster |
| 21:30 | Parent | Opens weekly dashboard; graphs moved from tonight's real events; "Ask This" reflects a true milestone; no chats anywhere in sight |
| Next 07:30 | Teacher | Heatmap cells greener where the reteach landed; completion counts correct; grading queue behaves |
| Anytime | Tester | Language switch mid-flow; offline save + outbox sync; low-end device walkthrough; permission-wall negative probes all rejected |

- [ ] Acceptance script executed once, end-to-end, on the record — **observed by a human who did not build it, in one continuous run, on the deployed URL; screenshots archived next to the ticks**

### 9.3 — Edge-Case Sweep (before calling anything "done")

- [ ] Student kills app mid-quiz → resume lands on the same question; no double-submit; timer sane
- [ ] Two tabs, same quiz → one authoritative attempt; second tab told "already in progress"
- [ ] Session window missed entirely → no shame copy; folds into tomorrow's plan; parent sees honest effort line
- [ ] Midnight streak boundary → idempotent touch survives; timezone set by school, not device
- [ ] Flaky network during submit → outbox holds the attempt; sync marks it late; teacher sees the tag, not silence
- [ ] AI provider down / timeout → honest error state + retry; queue suggestion; never a fake answer
- [ ] Teacher publishes empty session → validation blocks publish, naming exactly what is missing
- [ ] Student activates with wrong DOB thrice → friendly lock with "ask your class teacher"; no account-lockout spiral
- [ ] Parent link revoked mid-week → parent world closes immediately; audit entry; child experience unchanged
- [ ] Hindi toggle mid-session → in-place switch; no lost progress; question text language matches
- [ ] Rapid session re-opens → completion rule still enforced; no XP/badge double-award

### 9.4 — Fix Rounds & Freeze

- [ ] Round 1 closed: everything that broke the script/checklist (severity: data integrity → security → flows → polish)
- [ ] Round 2 closed: Round-1 fallout + triage made real (deferred → backlog properly; half-built → finished or hidden, never dangling)
- [ ] Build frozen after Round 2; remaining time → rehearsal and rest

---

## Part 10 — Launch & Demo Readiness (the final 10)

- [ ] Deployed URL live; HTTPS; env vars set in hosting (not local-only)
- [ ] Analytics/error-reporting basics on (or triaged with reason)
- [ ] Runbook written: deploy, reset, seed, rotate keys, known limits
- [ ] Demo script rehearsed once against the deployed world, timed
- [ ] Demo accounts + passwords in one secure place for presenters
- [ ] Fallback demo plan if venue network dies (offline-cached device)
- [ ] AI spend cap + rate limits set for demo-day safety
- [ ] Post-launch backlog (Part 11) written where the team will see it
- [ ] Team knows the triage table by heart (or has it printed)
- [ ] The Part 1.5 sentence (below) demonstrated live on a real phone — pass

---

## Part 11 — After the Prototype: The Dream Roadmap

*The 4-day app is armed, not finished. This is the order the dream compounds in — after real usage, not before.*

### 11.1 — Post-Launch Backlog (in priority order)

- [ ] **Signature AI suite completion** — the deeper doubt tooling and assistive surfaces consciously deferred so the core loop shipped honest and fast (VS-48..59 family)
- [ ] **Recordings pipeline** — class-recording segments with school permission controls, closing the last content gap for absent students
- [ ] **PIN profiles for shared phones** — many households share one device; the streak must survive it (VS-06)
- [ ] **WhatsApp fallback notifications** — meeting parents where they already live, same two-notices-a-week discipline (VS-76)
- [ ] **Advanced teacher tooling** — deeper analytics exports, co-teaching views, department rollups (VS-68..71)
- [ ] **The second school** — only when the first one runs itself for a month; multi-tenancy before repeatability is how pilots die

### 11.2 — What We Deliberately Never Build (product law — the answer to every month-three request)

- [ ] Never: public leaderboards or any classmate-vs-classmate comparison (motivation is personal here)
- [ ] Never: coaching-institute integrations or ERP/fees/transport modules (the school's learning world is the boundary)
- [ ] Never: camera or microphone emotion detection (creepy, unreliable, and it would poison the trust the privacy wall builds)
- [ ] Never: AR/VR on this horizon

### 11.3 — What the Flywheel Becomes (why the dream compounds)

Every night the app learns the school a little better: which concepts produce which confusions in this section, which explanations rescue which errors, which students are quietly afraid of which chapters. Six months of that is a dataset no competitor can buy and a rapport no generic app can fake. The features were never the moat — **the compounding knowledge of each child, inside one trusted school, is.** Every new idea must answer "which station of the loop does this serve?" before it earns an hour.

---

## The One Sentence (the final gate)

> *A school admin has set up the school and issued activation codes; a teacher has published tonight's session for Class 9-A with a diagnostic, notes and a quiz; three different students — strong, struggling and absent — have signed in, been routed differently by their bands, completed the session, asked the cloud companion a doubt, and played one game; and a parent has opened a dashboard with real graphs generated from those exact events.*

- [ ] **THE FINAL CHECK:** that sentence is true end-to-end, demonstrated live on a real phone — and the closing definition below reads as fact, not aspiration:

> *"VidhyaSaathy removes the chaos: it tests before it teaches, adapts to the four kinds of learner in every classroom, answers doubts at 11 pm without judgement, and turns every answer into evidence that helps the teacher tomorrow and the parent on Sunday. The app is the moat — and it starts compounding the first night it is used."*

**Small steps make big progress.** · Product truth: Master File (12 parts) · Build how: Prompts 01–10 · Daily proof: this checklist
