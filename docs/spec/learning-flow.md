# VidhyaSaathy learning flow: what the guide asks for

Source: Product Master File (Parts 3-8, checklist 10.3, 10.7, 10.9) checked against our gap audit `master-file-gap.md` (repo HEAD f6aea03, 29 Oct 2026 IST).

**64 learning elements: Built 7 · Needs improving 23 · To build 34.**

## Carren's rules (override the spec)

- No sound anywhere. Feedback is on-screen text and visuals only.
- Notebook design stays: cream/navy/gold, ruled lines, handwritten headings, the approved mockups. Landing page untouched.
- Students never see bands, ranks, percentiles or classmates' scores. Only: Let's fix this, Almost there, Mastered, Top form.
- Keep all existing data. Add columns and new event types; never wipe or reseed over real rows.
- No new games. Only Carren's games, one at a time. Existing games just need to save evidence.

## 1. The learning loop

Diagnose → Learn → Practice → Understand → Progress → (back to Diagnose). Every station writes evidence the next one reads. The loop never resets, so the app knows the child a little better every night.

- **Diagnose:** 5 friendly questions find what the child knows and which prerequisites are shaky.
- **Learn:** concept pages at the child's depth: notes, checkpoints, video clip, worked examples.
- **Practice:** quizzes and games on one question bank; difficulty climbs only as fast as the child proves it should.
- **Understand:** "why I got it wrong": concept + mistake type + one fix. Doubts go to Saathy.
- **Progress:** per-concept mastery, streaks and badges for the child; heatmap for the teacher; weekly graphs for the parent.

## 2. Every element, stage by stage

### 1. Diagnose: find what the child already knows

| Element | What it does for the student | What the smart backend does / needs | Status |
|---|---|---|---|
| Sign-in lands in your class world | You see your class, subjects and chapters in order, with a friendly hello. | One home call returns classes, chapters, pending items and streak (now 5+ calls). | Needs improving |
| Diagnostic offer on first chapter open | "Let's see what you already know, this is not a test." 5 questions, 3 minutes. | Draw from the prerequisite chain plus 2 new-concept probes. Offer it automatically. Never graded, never shown as marks. | Needs improving |
| Confidence buttons in the diagnostic | You tap Sure, Unsure or Guess on each question. | Save confidence with every diagnostic answer. | To build |
| Placement card and routing | "You're strong on distance, let's build the rest." Priya gets a repair path, Aarav goes straight to acceleration. | Seed a mastery score per concept, write a band event, start neutral format weights, route the Next-Action card. | To build |
| Skipping is allowed | No pressure to take the diagnostic. | Serve standard (Band-2) content until real evidence arrives. | To build |
| Next-Action card | One card says exactly what to do now, how long it takes, and opens it mid-way. | Server picks: unfinished > due tomorrow > revision of a fading concept > new content > games. | Needs improving |
| Calm home | Streak chip, one encouragement line, nothing shouting. | Home v3 with notebook lines is in the app. | Built |

### 2. Learn: concept pages at the child's depth

| Element | What it does for the student | What the smart backend does / needs | Status |
|---|---|---|---|
| School notes on the concept page | You read what Sharma Ma'am taught, in her words. | Notes tagged to concepts; the band picks which version is shown. | Needs improving |
| 3 note versions (simple, standard, concise) | Same truth at your depth: analogies for Priya, compact for Aarav. | 3 variants per concept; band plus prediction weights choose. | To build |
| "Explain this simpler" button | One tap swaps a section to the simple version. | Swap variant per section; log the tap as a learning signal. | To build |
| Inline checkpoints | A quick question after each idea, checked instantly, with a short explanation if wrong. | 2-3 per concept, scored on the server on tap, each one an evidence event. | Needs improving |
| Prerequisite repair path | A shaky base gets fixed first in the simplest words. | Walk back along the prerequisite graph, re-teach, re-test. | Needs improving |
| Curated YouTube clip | Watch only the part that matters (e.g. 8:20-15:40), with the teacher's reason. | Store link, start/end, concept and reason. Log watching as engagement, never as mastery. | To build |
| Summary one-pager | Morning-of-exam scan: definitions, 3-5 formulas, 2 exam patterns, mini concept map. | Drafted from notes, teacher approves, printable PDF. | To build |
| Flashcards | Flip a card, rate it knew it, almost or forgot. | 8-12 cards per concept; flips are revision evidence and a light mastery signal. | Needs improving |
| Session player with resume | You carry on exactly where you stopped. | Progress held on the server. | Built |
| Hindi content and labels | Priya can switch Hindi labels on. | Every student string and content piece in English and Hindi. | To build |

### 3. Practice: questions that adapt

| Element | What it does for the student | What the smart backend does / needs | Status |
|---|---|---|---|
| Server-scored quiz | Fair marking; answers never leak to the phone. | Answer keys stay on the server; one evidence row per answer. | Built |
| Confidence buttons (Pakka Meter) | Sure, Unsure or Guess before the reveal. You learn to notice when you're guessing. | Confidence stored on every answer, in quizzes and games. | To build |
| Time-to-answer | Invisible to the child. | Seconds from shown to locked. Saved now, but the engine doesn't use it yet. | Needs improving |
| Difficulty ladder | Questions get harder when you're rolling and kinder when you're not, with a short explanation on a drop. | Start at L2. 3 correct in a row: up to L3. 2 wrong in a row: down to L1 plus a bridge explanation. Log every move. | To build |
| Practice sized to the child | Priya gets 3-5 easy questions with worked examples first; Aarav gets L3 and board twists. | Band routing table decides set size, start level and extras. | To build |
| Motion question bank (about 80) | Good questions whose wrong options mean something. | 4 tags each: concept, L1-L3, board format, source. Each wrong option maps to a confusion. We have 5. | Needs improving |
| Board-format practice | Exam-style practice (MCQ, Assertion-Reason, case-based, numerical, short) before tests. | Format tag on every question, timed sets, accuracy per format. | To build |
| Homework with Socratic help | Saathy gives hints, never the answer. | Homework flag forces hint mode; submissions go to the teacher's queue. | Needs improving |
| Games count as practice | Playing still moves your progress. No new games. | Every game answer saves concept, confidence and level as evidence. Atom Forge saves nothing today. | Needs improving |
| Interest mash-ups | Average speed through cricket run-rates. | Interest tags on the child; question skin picked at serve time; scoring unchanged. | To build |
| Answers sync when the network drops | Works on a flaky connection. | Offline outbox with duplicate-safe sync. | Built |

### 4. Understand: why it went wrong

| Element | What it does for the student | What the smart backend does / needs | Status |
|---|---|---|---|
| "Why I got it wrong" summary | Each miss shows the concept, the mistake type and a one-line fix. Reads like a coach. | Built from the error classifier. | Needs improving |
| Error DNA (4 mistake types) | The right fix for the right mistake. | Concept gap, careless slip, method error, guess. Each has its own repair (rules below). | To build |
| 60% rule and bridge path | Under 60% you get a bridge path, never a fail. | Session completes only when all parts are done and the quiz is at least 60%. We use 70% today. | To build |
| Ask Saathy answers from the notes | Answers come from school notes; sources are never invented. | Quote must match a retrieved note exactly or the answer is rejected. | Built |
| Same doubt, different depth | Priya gets analogy-first, Aarav formula-first. | Put the child's recent evidence and level into the prompt. | To build |
| Honest "I don't know" | Saathy admits it and offers to ask the teacher. | Not-in-notes reply exists; add the escalation action. | Needs improving |
| Answer appears as Saathy thinks | Text streams in word by word. | Streaming answer (SSE). | To build |
| Hindi and Hinglish chat | Ask in your own words and get answered the same way. | Detect language; reply in it. | To build |
| SnapDoubt | Photo of the confusing line, confirm the text, then ask. | Extract text on the server, confirm step, private storage. | To build |
| Tomorrow's hook | Saathy remembers to give you a related mini-practice tomorrow. | Chat can write Dushman or practice items into a queue. | To build |

### 5. Progress: mastery, revision and motivation

| Element | What it does for the student | What the smart backend does / needs | Status |
|---|---|---|---|
| Mastery map with friendly words | Per concept: Let's fix this, Almost there, Mastered, Top form. Never one overall %. | L1-L4 per concept (rules below). Today it shows a %. | Needs improving |
| Bands (hidden) | The child never sees them. | 0-25 / 25-50 / 50-75 / 75-100 per concept; chapter band from the prerequisite-weighted average; moves logged. | To build |
| Quick warm-up (revision radar) | "Quick warm-up? Distance, fading." 2 minutes, skip without guilt. | Forgetting-curve decay. Due dates exist; the warm-up screen doesn't. | Needs improving |
| Frustration radar | Saathy softens, makes the next step smaller, may suggest a break. Never a red screen. | Watch fast wrong answers, quick retries and quitting mid-session. | To build |
| Ratta (rote) detector | Catches answers learnt by heart but not understood. | Flag Sure + correct that fails when the same concept is asked differently. | To build |
| Avoidance radar (Darr ka map) | Concepts you dodge come back gently inside low-stakes games. | Track concepts opened then skipped, doubts typed then deleted. | To build |
| Dushman questions | Your 3 weakest concepts come back in disguise until you beat them. | Weakest-3 query, re-skinned questions, retire at L3 with a badge. | To build |
| Daily 5-minute challenge | Even a short evening moves the needle. | Serves warm-ups and Dushman questions. | To build |
| Study plan | "Exam in 3 weeks, 6 shaky concepts, 25 min a night." Realistic nights. | Ordered by prerequisites, shrinks after a missed night, each step feeds Next-Action. Today it's a plain list. | Needs improving |
| Catch-up for absent children | "Good to see you. Let's take this in small steps." 20 minutes. | 2 most faded concepts plus missed sessions in short form; logged as a recovery event. | To build |
| Streak with freezes | Any real learning act counts; restart is gentle. | One touch per day; 1 freeze per 5 days, max 2 stored. No freezes today. | Needs improving |
| Improvement badges | Fixed It, Comeback King, Dushman Slayer, Boss Buster. | Rules run on evidence events; no other student is ever mentioned. | To build |
| How you learn best | Profile line: "explains best with examples and Hindi terms; learns by self-testing". | Format weights start neutral and shift slowly with what precedes correct answers. | To build |
| Exam readiness lamp | Not ready / Getting there / Ready for each exam. | Mastery across the exam's concepts, weighted by prerequisite depth. | To build |
| Evidence trail | Every bit of effort is counted honestly. | Append-only log with confidence, time, mistake type and source. Today grading overwrites and confidence is missing. | Needs improving |
| Chapter history kept | "Forgot acceleration?" still opens in March. | Nothing is purged. | Built |
| No ranks or band labels anywhere | No comparison with classmates, ever. | Remove the fake "WARRIOR LV 5" header in the arena games. | To build |

### 6. What teachers and parents see from learning data

| Element | What it does for the student | What the smart backend does / needs | Status |
|---|---|---|---|
| Student x concept heatmap | Teacher sees safe / unstable / critical per child per concept. | Rollups from the evidence trail. Today it's a concept list. | Needs improving |
| Cell drill | "12 were Sure and wrong: a misconception, not carelessness." | Needs confidence and mistake type saved. | To build |
| One-tap reteach | Struggling kids get a friendly bridge tonight and never know they were "red". | Create a repair session for that subset. Today it only records a note. | Needs improving |
| Band moves shown to teacher | "Aarav moved 25-50 to 50-75 on Motion, Tuesday." | Band-change events in the log. | To build |
| Doubt clusters | "17 doubts on acceleration, 9 on sign convention", anonymous. | Nightly clustering; keep doubts (now deleted after 24 h); opt-in named escalation. | Needs improving |
| Morning dashboard | Completion, 3 reddest cells, clusters, one suggested action. | Aggregates from the trail. | Needs improving |
| Parent weekly graphs | Effort bars, mastery trend, streak, readiness lamp. | Aggregates only. Today it's text, no graphs. | Needs improving |
| "Ask This" card | One real dinner-table question each week. | Pick from that child's notable events. | To build |
| Parent privacy wall | Parents never see chats, doubts or raw answers. | Aggregates-only routes. | Built |

## 3. The smart backend

### Signals collected (all passive, all logged)

| Signal | What it is | What it tells the engine |
|---|---|---|
| Correctness | Right/wrong per question, per concept, at which difficulty | The mastery backbone (L1-L4) |
| Confidence | Sure / Unsure / Guess, tapped before the reveal | Sure + wrong = real misconception; Guess + right = discounted |
| Time-to-answer | Seconds from shown to locked | Too fast + wrong = careless; too slow + right = fragile, needs reinforcing |
| Error type | Classified after each wrong answer | Picks the repair path |
| Session rhythm | When they study, how long, resumptions | Realistic nightly goals; spots 11 pm cramming and frustration |
| Avoidance | Concepts opened then skipped; doubt typed then deleted | The "Darr ka map" |
| Revision behaviour | Flashcard flips, summary opens before quizzes | Does this child learn by re-reading or by self-testing? |

No learning-style questionnaire. The confidence tap is the only active gesture.

### Mastery maths (per concept, never one overall %)

- Diagnostic seeds a starting score per concept.
- Every answer updates it. Correct at higher difficulty counts more.
- Guess + correct is discounted heavily. Sure + wrong is flagged as a misconception (the strongest signal in the app).
- Rolling window: the last ~10 interactions per concept, to smooth noise.
- Chapter band = prerequisite-weighted average of its concepts.
- Simple, inspectable arithmetic. No black-box model.

Spec fixes the shape, not the weights. **Our proposal (tunable):** difficulty weight L1 = 1, L2 = 1.5, L3 = 2, board-format L4 = 2.5; credit for a correct answer Sure = 1, Unsure = 0.75, Guess = 0.25; wrong = 0.

`mastery = Σ(weight × credit) ÷ Σ(weight)` over the last 10 answers on that concept.

### L1-L4 mastery levels

| Level | Meaning | Earned by | Student sees |
|---|---|---|---|
| L1 Fragile | Seen it, can't use it yet | Diagnostic partial or early attempts mostly wrong | Let's fix this + repair path |
| L2 Steady | Handles basics reliably | ≥60% on the concept at L1-L2 difficulty | Almost there + guided practice |
| L3 Strong | Solves application problems | Consistently right at L3 with Sure confidence | Mastered + Boss Level and Dushman unlock |
| L4 Advanced | Handles exam twists | Board-format questions right under time pressure | Top form + challenge set, next-chapter preview |

Levels decay gently over time (revision radar), so September's mastery is re-proved lightly before exams.

### Difficulty ladder (fixed rule)

- Start at L2.
- 3 correct in a row → up to L3.
- 2 wrong in a row → down to L1, always with a bridge explanation.
- Every move is logged. Same ladder in quizzes and games.

### Bands (internal only)

| Band | Content | Practice | Saathy tone | Extras |
|---|---|---|---|---|
| 0-25% | Simplest version, everyday analogies, prerequisites first, Hindi prominent | L1 only, sets of 3-5, worked examples first | Extra warm, zero jargon, celebrates single wins | Dushman early on repaired concepts; Boss locked until L2 |
| 25-50% | Standard notes + step-by-step examples, checkpoint after each idea, flashcards pushed | Start L2, drop to L1 after 2 wrong with a bridge | Checks understanding with one gentle question per concept | Daily challenge at L1-L2 mix; no Boss |
| 50-75% | Full pages, application focus, "where students slip" callouts | L2-L3 mix, ladder climbs after 3 right | Shifts from explaining to quizzing ("try this twist") | Dushman on own 3 weakest; Boss unlocks at L3 |
| 75-100% | Concise advanced notes, board twists, next-concept preview | L3 default + board format, timed sets | Coach-like and brief | Boss and challenge sets; interest mash-ups |

- Promotion: L2-L3 correctness ≥70% across the chapter's concepts plus Sure on most. Logged ("Aarav moved 25-50 → 50-75 on Motion, Tuesday").
- Demotion (after absence or decay) is silent: just serve bridge content, never announce a fall.
- Bands are per concept. The same child can be Band 4 on Distance and Band 1 on Acceleration.

### Error DNA: four mistake types, four repairs

| Type | Signature | Repair |
|---|---|---|
| Concept gap | Sure + wrong + slow; prerequisite mastery low | Bridge back: prerequisite re-taught simply, then re-test |
| Careless slip | Very fast + wrong on a concept otherwise at L3+ | One-line nudge, no re-teach; "slow down on signs" habit card |
| Method error | Right approach, wrong execution (unit, sign, arithmetic) | Worked example of the same pattern, broken step highlighted |
| Guess | Guess tapped, whatever the outcome | Honest acknowledgement, short explanation, re-queued in a new skin tomorrow |

### Next-Action priority (server-side)

1. Unfinished session
2. Session due tomorrow
3. Revision of a fading concept
4. New content
5. Games

Plus: absence → Catch-up card (20 min); plan items feed into it.

### The radars

| Radar | Watches | Does |
|---|---|---|
| Revision / warm-up | Mastery decay on the forgetting curve | 2-minute "Quick warm-up?" before decay hurts |
| Frustration | Fast wrong answers, quick retries, quitting | Softer tone, smaller next step, maybe a break. Never red |
| Ratta (rote) | Sure + correct that collapses in a changed context | Flags memorised-not-understood |
| Avoidance (Darr ka map) | Concepts opened then skipped; deleted doubts | Re-introduces them inside low-stakes games |

### Other fixed numbers

- Diagnostic: ~5 questions, ~3 minutes, from the prerequisite chain + 2 new-concept probes.
- Session completes at quiz ≥60% (we use 70% today; change it).
- Boss Level gate: ≥70% chapter mastery.
- Dushman: 3 weakest concepts, retire at L3.
- Streak: one touch per day; 1 freeze per 5 streak days, max 2 stored.
- Warm-up 2 min · Daily challenge 5 min · Catch-up 20 min.
- Content per Motion concept: 2-3 checkpoints, 8-12 flashcards, 3 note versions; bank ~25 / ~25 / ~30 questions (about 80), mix MCQ 40% · Numerical 30% · Assertion-Reason 15% · Case-based 10% · Short 5%.
- Ask Saathy: 11-step server sequence (auth → rate limit/budget → context slice → concept map → language + level → prompt with safety rules → stream → private log → doubt-cluster counter → follow-ups → budget close).

## 4. The student's evening, minute by minute (Part 7, Flow 3)

| Time | What happens | Features | Status |
|---|---|---|---|
| 18:04 | Session opens; one quiet notification. Home card: "Tonight's Physics: Acceleration, about 25 min" | Session open/close windows, Next-Action card | Needs improving |
| 18:06 | Only if needed: "Quick warm-up? Distance & displacement, fading." 2 min, skippable | Revision radar, flashcard warm-up | To build |
| 18:10 | Notes at the child's depth, checkpoint after each idea, video clip at the teacher's timestamp, "simpler" one tap away | Note variants, checkpoints, curated video, Explain simpler | To build (notes exist) |
| 18:22 | Quiz: Sure/Unsure/Guess before each reveal; harder when rolling, kinder when not | Confidence buttons, ladder, bridge text, server scoring | To build (scoring built) |
| 18:31 | "Why I got it wrong" summary; Dushman queue updates; ≥60% completes, below offers a bridge; streak ticks | Error DNA, 60% rule, mastery update, Dushman, streak | To build |
| 18:34 | Optional game for 4 minutes (light evidence), then done; tomorrow already recalculated | Game evidence, streak, badges, overnight teacher/parent aggregates | Needs improving |
| 23:02 | Doubt: "why is acceleration negative here??" Answered at the child's depth; teacher sees the cluster next morning, not the child | Ask Saathy depth by level, streaming, SnapDoubt, doubt clusters | Needs improving |

Three children, one evening (must all differ):
- **Aarav (strong):** diagnostic confirms basics → concise acceleration page → L3 numericals in 6 min → one method error with a one-line fix → Dushman queued → 14 min total.
- **Priya (struggling):** fragile average-speed → 10-min repair path with a bus-journey analogy and 2 guided examples → simplest acceleration page with Hindi labels → 5 L1 questions, a Guess discounted → warm praise, bridge practice tomorrow. No red anywhere.
- **Rohan (absent 3 days):** "Catch-up, 20 minutes": 2 most faded concepts + tonight's session in short form. "Good to see you. Let's take this in small steps." Teacher heatmap shows "recovered", not a hole.

## 5. Build order for Codex (dependency order)

1. **Evidence trail v2.** Add confidence, time, mistake type, source (session/quiz/homework/game/flashcard/diagnostic), level and format to every answer. Grading becomes a new event, not an overwrite. One shared Sure/Unsure/Guess component. Everything else reads this.
2. **Motion content and demo children.** About 80 tagged questions whose wrong options map to confusions; 3 note versions; 2-3 checkpoints, 8-12 flashcards per concept; summary sheet; 2 video clips. Seed Priya, Aarav and Rohan with a Motion history. Add alongside existing data, don't wipe it.
3. **Mastery engine.** Rolling-window score per concept, L1-L4, hidden bands, friendly words on the progress page, band-change events.
4. **Diagnostic-first.** Auto-offer on first chapter open, placement card, routes the first step (skip → standard content).
5. **Ladder, 60% rule, Error DNA.** 3-up/2-down with bridge text, session completes at 60%, 4 repair paths, real "why I got it wrong" summary.
6. **Learn surfaces.** Note versions + Explain simpler, inline checkpoints, trimmed YouTube player, summary one-pager, flashcard flip with knew/almost/forgot.
7. **Next-Action and recovery.** New priority order, Quick warm-up, Rohan's Catch-up, daily 5-minute challenge, Dushman queue.
8. **Ask Saathy upgrade.** Answers by the child's level, streaming, homework always hints-only, "ask my teacher" escalation, tomorrow's follow-up hooks. Then Hindi/Hinglish and SnapDoubt.
9. **Quiet intelligence.** Frustration, rote and avoidance radars; realistic study plan that shrinks after a missed night; streak freezes; improvement badges; "how you learn best" weights; exam readiness lamp.
10. **Teacher and parent views on the same data.** Student × concept heatmap with drill, reteach that reaches students, band moves, doubt clusters kept and grouped, parent graphs and "Ask This". Wire existing games (incl. Atom Forge) to save evidence; no new games.
