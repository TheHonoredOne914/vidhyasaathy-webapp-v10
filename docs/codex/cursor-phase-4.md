# Phase 4: Ask Saathy, existing games wired to evidence, pluggable content generator

Read AGENTS.md first, especially "Carren's hard rules". Then read docs/spec/learning-flow.md, docs/spec/master-file-gap.md (Build plan steps 8-9, checklist 10.7 #1-10 and 10.8 #2-4) and docs/codex/progress.md (what Phases 1-3 shipped). In docs/spec/master-file.txt, read 2.4, 5.4, 5.5, 5.7, Part 6 E (VS-28, VS-30, VS-38), G (VS-93..99), Flow 4, Flow 7, 8.2, 8.3 and 11.3 ("AI provider down").
Mockups: docs/mockups/ask-v1-1440/360.png and games-v1-1440/360.png, with their sources in docs/mockups/src/.

> **Pre-flight (every run).** Grep for the real names before coding:
> - `rg -n "LlmProvider|LocalStubProvider|HINT_FIRST|socratic|doubtBatches|purge" apps/api/src`
> - `rg -n "Block|validateBlock|recompute" packages/contracts/src`, which finds Phase 2's interactive-block schema and validator. **Build on it; do not fork it.**
> - `rg -n "recordCheckpointResult|checkpoint.practice" apps/web/src/games`
>
> If a name differs from this spec, use the real one and note it in progress.md.

## Goal
1. **Ask Saathy.** A doubt asked at 11 pm gets an honest, streamed answer at the child's depth and in the child's language. It knows where they slipped, never does their homework for them, says "I don't know" when it should, can escalate to the teacher, and accepts a photo of the problem. All of it follows the 11-step server sequence (5.7).
2. **Games.** Every EXISTING game stops being "saved on this device only" and writes real, server-scored, concept-tagged evidence.
3. **Content generator.** A pluggable, validated, teacher-gated pipeline, so Dhruv's future Class 9 syllabus model can fill Phase 2's interactive lesson blocks without ever publishing anything unchecked.

## Hard rules (Carren)
- **Keep data.** Additive migrations only. Back up `apps/api/data/*.db` (`npm run db:backup`) before migrating.
- **No new games.** Atom Forge is paused: do not touch `apps/web/src/games/atom*` or its route, do not wire it, and do not list it as playable.
- **Look and feel.**
  - Landing, themes and colours unchanged. No dark mode.
  - **No sound, audio or voice anywhere.** That means no TTS, no mic input for doubts, and every video muted with no audio track played.
  - No bands, ranks, leaderboards or numeric levels for students; friendly words only.
  - Notebook vibe; full-width with side rails; colourful confidence chips.
  - Line-art cloud only; no emoji; nothing AI-generic.
- **Content.** Real NCERT only. Verified YouTube IDs or none. No mojibake.
- **Scoring.** Server-side. Every answer writes evidence. No answer key on the client.
- **Process.** Demo logins as in AGENTS.md. Node >= 24; `npm run typecheck` and `npm run test:unit` green; small commits; append to progress.md.
- **AI drafts never auto-publish** (2.4, 5.5).
- **API keys stay server-side** (5.5, 10.7 #1).

## Archetype user stories
- **Priya, 22:45.** She types "acceleration negative kyun hota hai??" in Hinglish.
  - The cloud shows its *thinking* state while the answer streams in Hinglish.
  - Analogy first: the bus braking near her stop. Hindi terms are shown: त्वरण, मंदन. Short sentences, one idea at a time.
  - It ends with "Want to try one?", which gives 1 L1 check.
  - Her doubt joins the anonymous "acceleration · sign convention" counter.
  - Because the pattern matches her Dushman, tomorrow's plan gets a 5-min mini-practice.
- **Aarav.** He asks the same doubt in English.
  - He gets a formula-forward answer: a = (v − u)/t with signs, and a v-t graph slope note.
  - It is personalised: "you slipped on the sign convention yesterday" (VS-28), drawn from his evidence.
  - In homework mode, asking "what's the answer to Q3" gets a Socratic hint ladder, never the final value.
- **Rohan.** He photographs a textbook line with SnapDoubt.
  - He sees the extracted text, fixes one word, and sends it.
  - The model is unsure, so the answer says plainly "I'm not sure about this one" and offers "Ask Sharma Ma'am". Rohan ticks "also tell my teacher", which creates a named escalation.
- **All three.** Playing Cricket Lab (newton) or Graph Detective, each checkpoint shows Sure/Unsure/Guess chips. Answers are server-scored, appear in their mastery, and count as a streak touch. The fake "WARRIOR · LV 5 · 1,180 XP" header is gone.

---

## Part A: Ask Saathy

### Data model (additive migration `00NN_ask_saathy.sql`)
- **`ask_thread`**: id, profile_id, school_id, chapter_id NULL, concept_id NULL, mode enum(learn, homework), language enum(en, hi, hinglish), created_at, updated_at.
  - This is a private conversation container. Raw text keeps the existing 24-hour purge on `doubt`; extend the purge to `ask_message`.
- **`ask_message`**: id, thread_id, school_id, role enum(student, saathy), text, citations JSON, flags JSON (`{homeworkGuard, honestUnsure, clarifying}`), tokens_in, tokens_out, created_at.
  - Purged after 24 h, the same as `doubt`.
  - Before the purge, the nightly job has already written the anonymised counters.
- **`doubt_cluster_counter`**: school_id, section_id, concept_id, subtag (e.g. `sign_convention`, `graph_reading`, `avg_speed_mean`, which reuse the Phase 1 Error DNA / misconception tags), day, count, sample_snippets JSON (max 3, PII-scrubbed: no names, roll numbers or phone numbers; max 140 chars).
  - UNIQUE(section_id, concept_id, subtag, day).
  - This is what teachers see (VS-38, 2.4).
- **`doubt_escalation`**: id, profile_id, school_id, section_id, teacher_id, concept_id, question_text (kept; this is opt-in), status enum(open, answered, closed), teacher_reply NULL, created_at, answered_at.
  - Named only because the student opted in.
- **`ai_budget_day`**: profile_id, school_id, day, requests, tokens.
  - UNIQUE(profile_id, day).
  - The token budget (5.7 step 2). Default 30 000 tokens/day per student, a named constant.
- **`snap_upload`**: id, profile_id, school_id, path (under `apps/api/data/private/snap/`, never served statically), mime, bytes, extracted_text, status enum(extracted, confirmed, failed, not_configured), created_at.
  - Deleted with its file after 24 h.
- **`followup_item`**: id, profile_id, school_id, concept_id, kind enum(mini_practice, dushman_bump), source_message_id, due_day, consumed_at NULL.
  - Phase 3's `pickNextAction` and the study plan read it as a "due" item (Flow 4 step 2).

### The 11-step sequence (5.7), in `apps/api/src/ai/ask-pipeline.ts`
Pure helpers go in `packages/core/ask.ts` for unit testing.
1. **Auth.** `requireRole('student')`. Scope the chapter to the student's enrolment.
2. **Rate limit and budget.** Keep the existing 10 req/min; add the `ai_budget_day` check. Over budget → 429 with friendly copy: "Saathy needs a rest. Try again tomorrow, or ask your teacher."
3. **Student context slice.** Collect, server-side only:
   - per-concept L-level and friendly word for the chapter;
   - the last 10 evidence rows with errorType;
   - active Dushman; language preference;
   - internal band (used for depth only; never in output).
4. **Concept map.** Map the question to concept(s) through FTS retrieval (existing `ai/retrieval.ts`) plus concept names and Hindi terms.
5. **Language and depth** (`core/ask.ts`).
   - **`detectLanguage(text)`**: Devanagari ≥30% of letters → `hi`. Latin text with ≥2 hits from a Hinglish lexicon (kyun, kya, hai, nahi, matlab, samjha, kaise, …) → `hinglish`. Otherwise `en`.
   - **`depthProfile(band, levels)`**:
     - band 0-25, or the concept at L1 → `analogy_first` (short sentences, a familiar Indian analogy such as bus, cricket or auto-rickshaw, Hindi terms in brackets);
     - 25-75 → `standard`;
     - 75-100 → `formula_forward` (formula, sign conventions, board-format tip). (5.4)
   - **`needsClarification(text, conceptMatches)`**: fewer than 4 content words and no concept match, or the top 2 concept scores within 10% → ask exactly ONE clarifying question with 2-3 tappable options (5.4).
6. **System prompt** (`ai/prompts/ask.ts`). It has these blocks: role, depth profile, language, the student's recent slip (one sentence, e.g. "yesterday: sign convention error on a deceleration item"), retrieved NCERT chunks with ids, and the rules:
   - only answer from the chunks;
   - cite chunk ids;
   - say "I'm not sure" if the chunks don't cover it;
   - never reveal homework answers in homework mode;
   - warm tone;
   - no shame words, no fear words;
   - no emoji.
7. **SSE stream.**
   - `POST /ask/stream` with `Content-Type: text/event-stream`. Events:
     - `thinking`;
     - `token` {text} (many);
     - `citation` {chunkId, noteTitle, page};
     - `followups` {chips:[…]};
     - `done` {messageId, flags};
     - `error` {code, message}.
   - Extend `LlmProvider` with `stream(prompt): AsyncIterable<string>`.
   - `LocalStubProvider` streams a deterministic grounded answer built from retrieved chunks. It is used in tests and when no key is set.
   - `OpenAiProvider` streams if `OPENAI_API_KEY` is set. Keep it OpenAI-compatible so a different base URL works (`AI_BASE_URL`).
   - **Provider down or timeout (20 s):** an `error` event, an honest UI error state with Retry, and "Ask your teacher instead" (11.3). Never a fake answer.
8. **Guards, run on the full text before `done`. A failing guard swaps the answer for a safe fallback.**
   - **Verbatim-citation check** (existing): any claimed citation must exist in the retrieved chunks, otherwise strip it and mark `honestUnsure`.
   - **Homework guard:** when `mode=homework`, or when the question fuzzy-matches (token Jaccard ≥0.6) an item in an open assignment for this student, compare the output against that item's key server-side: option letter/text, numeric answer ±1%, final formula result. On a leak, replace it with the next rung of the hint ladder:
     1. "What is given? What is asked?"
     2. "Which formula links them?"
     3. "Try substituting. What do you get for v − u?"
     4. "Check your units and sign."

     The guard never sends the key to the client (5.5, VS-17).
   - **Honesty:** retrieval top score below threshold, or the model's own "not sure" → prefix "I'm not sure about this one." and show the [Ask my teacher] chip (5.5, 10.7 "honesty path").
   - **Tone:** a deny-list of shame words ("stupid", "obviously", "easy", "you should know", "wrong again") → rewrite.
9. **Private log.** Write `ask_message` rows. The existing `doubt` row stays for compatibility.
10. **Anonymised cluster counters.**
    - Classify the subtag with `core/ask.ts::subtagFor(conceptId, text, recentErrorTypes)` (a keyword map per concept; Motion: sign/negative/deceleration/retardation → `sign_convention`; graph/slope/area → `graph_reading`; average/mean → `avg_speed_mean`), then increment `doubt_cluster_counter`.
    - Add the nightly job `apps/api/src/dashboard/jobs/doubt-clusters.ts`, using the existing `dashboard_job` pattern. It rolls up the day, PII-scrubs and keeps up to 3 snippets. Seed it so 9-A shows "17 doubts on acceleration, 9 on sign convention" (8.4).
11. **Follow-ups and budget close.**
    - If the subtag matches the student's last 10 errorTypes or an active Dushman → write `followup_item` (mini_practice, due tomorrow).
    - Emit `followups` chips: "Give me an example", "Quiz me on this", "Explain simpler" ("Explain like I'm 10" in the mockup).
    - "Quiz me" serves 1 bank item through `publicItem()`. It is server-scored, writes evidence `source='ask'` and shows "+10 XP" from Phase 3 xp.
    - Update `ai_budget_day`.

### Other endpoints

| Method / path | Contract |
|---|---|
| `POST /ask/stream` | Request `{threadId?, chapterId?, conceptId?, mode:'learn'\|'homework', assignmentItemId?, text (1-800 chars), clientEventId}`. Response is SSE as above. The existing `POST /ask` stays and returns the same final JSON (non-stream fallback). |
| `GET /ask/threads?limit=20` · `GET /ask/threads/:id` | The student's own threads only, with "Recent doubts" titles. 403 for every other role, including parent and admin (2.4). |
| `POST /ask/escalate {messageId, alsoTellTeacher:true}` | → `doubt_escalation` to the section's subject teacher, plus a notification to the teacher, plus an audit_log entry. Student copy: "Sent to Sharma Ma'am. You'll see her reply here." |
| `POST /ask/snap` (multipart, image/jpeg\|png\|webp, ≤4 MB) | → `{snapId, status, extractedText}`. Extraction goes through `VisionProvider.extract(image)` (OpenAI-compatible vision if a key is set). **No key → `status:'not_configured'` with "Type your doubt instead" (9.4 triage).** Never call any third-party OCR from the client. |
| `POST /ask/snap/:id/confirm {text}` | Marks it confirmed and returns text for the stream call. The image file is deleted at the 24 h purge. It is never visible to anyone but the student, never served by a URL, and access goes through the API only. |
| `GET /teacher/escalations` · `POST /teacher/escalations/:id/reply` | The teacher sees opt-in named escalations for their sections only. The reply shows up in the student's thread and notifications. |

### UI: Ask Saathy screen (`/student/ask`)
New route; reuse `ai/AskPanel.tsx` internals where possible. Match `docs/mockups/ask-v1-1440.png` and `-360`.

- **Header:** "Ask Saathy" plus a subject/chapter pill ("Physics · Ch 8").
- **Main column:** a dated thread ("Today · Wed 28 Oct").
  - The student's bubble sits on the right on lined paper.
  - Saathy's answer is a notebook card with bold key terms and an optional mini-diagram. Render a Phase 2 block when the answer references one, e.g. the A→B distance/displacement sketch.
  - A citation chip reads "From your notes · Motion, p.2".
  - Follow-up chips: "Give me an example", "Quiz me on this", "Explain like I'm 10".
  - The inline "Quiz me" card has sticky-note options a/b/c, confidence chips, and correct feedback in green: "Spot on! …".
- **Composer:** "Ask Saathy anything from your syllabus…", a chapter selector, a **Hint mode** toggle with a "?" tooltip ("Saathy gives hints instead of answers"), a camera button (SnapDoubt), and Send. **No mic button.**
- **Right rail:** "+ New doubt", "Recent doubts" (title, subject, day), and the trust card "Only from your NCERT books. Saathy answers from your Class 9 textbooks and your teachers' notes."
- **Line-art cloud states:** thinking (restrained pulse; reduced-motion → static dots), confusion-support (on a clarifying question), error (provider down), resting. **Never animate while a Quiz-me question is being solved** (5.4, 10.10).
- **SnapDoubt flow:** pick or take a photo → upload with progress → "Here's what I read. Fix anything that looks off." with an editable textarea → Send. Show `not_configured` and `failed` states with copy.
- **Escalation chip** on unsure answers → a confirm sheet with an "also tell my teacher" checkbox, unchecked by default.
- **Deep links:**
  - Homework "Ask Saathy for a hint →" opens `/student/ask?mode=homework&item=:id` with Hint mode locked on.
  - The home "Need help understanding?" card goes to `/student/ask`.
  - Replace AskDock entry points to point here.

---

## Part B: Wire the EXISTING games to learning evidence (no new games)

**Inventory.**
- **Practice modes:** `packages/core/games.ts` (mcq_rush, match_the_concept, quick_revision_quiz, timed_concept_challenge, chapter_progress_challenge), played through `apps/web/src/practice/PracticePlay.tsx` → `POST /practice/attempts`.
- **Arena/video games:** `apps/web/src/games/*` via `games/engine/registry.ts`: cell, matter, motion, newton (Cricket Lab), graphs, float, sound (Echo Corridor), energy, poly, and `demo`.
- **Excluded:** `atom` (paused). Do not open or edit `apps/web/src/games/atom*`.

### Data (additive migration `00NN_game_evidence.sql`)
- **`game_session`**: id, profile_id, school_id, game_id, chapter_id, concept_ids JSON, started_at, ended_at NULL, answered, correct, best_flag.
- **`game_checkpoint_map`**: game_id, checkpoint_key, item_id, concept_id, school_id.
  - Maps every arena checkpoint/recap question to a real bank `item` (concept-tagged, server key).
  - Seed it for the 9 non-atom games.
  - Where a game asks something not yet in the bank, ADD a real NCERT item (four-tag rule 8.2, provenance `game:<id>`, misconception distractors) rather than inventing telemetry.
- **Evidence:** add `source` values `game` and `ask` (and `warmup`/`daily_challenge` if Phase 3 didn't) to evidence. If the column has a CHECK, add the values via a new nullable `source_detail` column instead of rebuilding.

### Engine
- **`core/learning` source weight.** Game evidence counts as *light evidence* (Flow 3 step 6): weight 0.5 in the rolling window (our default, a named constant). It never promotes a level alone, so ≥1 non-game evidence row is needed for promotion. Test it.
- **Ladder inside games** (10.8 #4). Practice modes already pull items. Make item selection call the Phase 1 ladder (`nextLevel(state)`), so difficulty moves with performance. Arena games keep their scripted checkpoints, but their recap pool picks the level by ladder.
- **Gating.**
  - A game card is "Opens with Ch N" until that chapter is unlocked for the section (games-v1).
  - **Boss gate (only if Carren approves):** `chapter_progress_challenge` unlocks at ≥70% chapter mastery (Flow 7). Until then, keep its current behaviour.

### API
- **`POST /games/:gameId/sessions`** → `{sessionId}`. 404 for `atom`.
- **`POST /games/:gameId/sessions/:id/answer`**:
  - Request `{clientEventId, checkpointKey, answer, confidence:'sure'|'unsure'|'guess', timeMs}`.
  - The server resolves `item_id` through `game_checkpoint_map`, scores with `markItem`, writes evidence (`source='game'`, with confidence and errorType), and touches the streak (Phase 3 `touchStreak`, act `game_round`).
  - Returns `{correct, explanation, misconceptionNote}`, never the key before answering.
  - Idempotent on clientEventId (EVENT_CONFLICT pattern).
- **`POST /games/:gameId/sessions/:id/finish`** → `{answered, correct, personalBest:boolean, xp}`. Personal best is the student's own history only.
- **`GET /student/games`** → the games-v1 list:
  - `[{gameId, title, subject, chapterLabel, estMinutes:8, state:'new'|'played'|'opens_later'|'paused', personalBest?, stars?(0-3 from own best accuracy)}]`;
  - plus `todaysPick` (the warm-up/Dushman concept's game first, Flow 7 step 1).
  - Atom is either omitted or returned as `paused` and not clickable. Ask Carren; default to **omitted**.

### Client changes
- **`games/engine/progress.ts`:** `recordCheckpointResult` posts to the new answer endpoint through the existing outbox (`core/sync.ts`).
  - Remove the "Saved on this device only" blocked path for mapped checkpoints.
  - Offline attempts queue and sync with "synced late" marking (10.11).
- **`games/engine/CheckpointPanel.tsx` and `RecapQuestions.tsx`:**
  - add the Sure/Unsure/Guess chips (shared component from Phase 1) before submit;
  - remove any client-side correctness check that uses a bundled key; feedback comes from the server response;
  - remove keys from the game bundles (`validators.ts` files may keep *simulation* math, but never answer keys for scored checkpoints).
- **`games/arena/ArenaShell.tsx` line ~68:** delete the fake "WARRIOR · LV 5 · {name} Apprentice" rank and "1,180 XP · next LV 1500". Replace them with the concept name and "Your best: 7/10" from the server.
- **`games/engine/InteractiveVideo.tsx`:** force `muted`, no audio playback, no volume UI (hard rule). The same goes for any `Audio`/`AudioContext` usage in non-atom games: remove it, or gate it off permanently.
- **Games screen `/student/games`:** match `docs/mockups/games-v1-1440.png` and `-360`.
  - Title "Games" and the line "Play a chapter instead of reading it. About 8 minutes each."
  - Subject filter pills with counts.
  - "Today's pick" hero card.
  - Grid cards with line-art icons, subject · chapter, and New / stars / "best 41 s" / "Opens with Ch 10".
  - No leaderboards, no classmates.
  - Celebrations are skippable and honour reduced motion.

---

## Part C: Pluggable content generator (for Dhruv's Class 9 syllabus model)

### Contract (`packages/contracts/src/generator.ts`, reusing Phase 2's block schema)
```ts
GenerationRequest = { requestId: uuid, schoolId, chapterId, conceptId, sourceClass: number,   // 6-9
  variant: 'simple'|'standard'|'stretch', language: 'en'|'hi'|'en+hi_terms',
  blockKinds: Array<'slider_graph'|'moving_object'|'drag_label'|'predict_reveal'|'step_by_step'|'note'|'checkpoint'>,
  ncertRefs: Array<{book:string, chapter:string, page?:number}>, maxBlocks: number (≤12) }
LessonDraft = { requestId, generator:{id, version, model?}, conceptId,
  blocks: Array<Phase2Block>,                        // the SAME zod union Phase 2 uses
  items: Array<ItemDraft>,                           // checkpoint/practice items
  provenance: { sourceRefs: NcertRef[], createdAt, notes? } }
ItemDraft = { stem_en, stem_hi?, level:'L1'|'L2'|'L3'|'L4', format:'mcq'|'numerical'|'assertion_reason'|'case'|'short',
  options?: Array<{id, text_en, text_hi?, misconceptionTag?}>, answer: {optionId}|{numeric:number, unit:string, tolerancePct:number}|{text},
  numericCheck?: { formula: string /* e.g. "(v-u)/t" */, given: Record<string,number> }, explanation_en, explanation_hi? }
```
- Export JSON Schema from the zod definitions (`zod-to-json-schema`, or a hand-written `docs/spec/lesson-draft.schema.json` checked in a test). Dhruv's model then has a concrete target.

### Interface (`apps/api/src/content/generator/`)
- `ContentGenerator { id: string; version: string; generate(req: GenerationRequest, signal): Promise<unknown> }`. It returns `unknown` on purpose, because everything is validated after.
- **Adapters:**
  - `LocalTemplateGenerator`: deterministic, builds from seeded Motion content. Used in tests and demos.
  - `HttpGenerator`: POSTs `GenerationRequest` to `CONTENT_GENERATOR_URL` with a bearer `CONTENT_GENERATOR_TOKEN` from env, 60 s timeout. This is where Dhruv's model plugs in.
- **Registry:** `CONTENT_GENERATOR=local|http`.

### Validation pipeline (`content/generator/validate.ts`), all server-side, which rejects with named reasons
1. zod parse against `LessonDraft`.
2. Phase 2 block validator: it **recomputes every numeric value** (e.g. a = (v−u)/t, s = ut + ½at², slopes of the graph data, positions over time) and rejects mismatches beyond 1%.
3. **Item rules** (8.2):
   - four tags present;
   - exactly one correct option;
   - every distractor has a `misconceptionTag` from the Error DNA / misconception list;
   - `numericCheck` evaluated with a **safe expression evaluator** (a small parser over + − × ÷ ^ and parentheses and named variables; **no `eval`/`Function`**) that must equal `answer.numeric` within tolerance;
   - units present for numericals;
   - stems unambiguous: reject "all of the above"/"none of the above" and double negatives.
4. **Text hygiene:** reject mojibake (regex for `Ã|â€|Â|\uFFFD`), emoji, lorem/placeholder text and empty Hindi when Hindi is requested.
5. **Media:** any YouTube reference must be an 11-char ID that passes an oEmbed check (`https://www.youtube.com/oembed?url=…`) at validation time, otherwise it is stripped. Never a search link.
6. **Scope:** NCERT 6-9 only; `sourceClass` matches the concept's `sourceClass`.

### Data (additive migration `00NN_content_generator.sql`)
- **`content_draft`**: id, school_id, chapter_id, concept_id, generator_id, generator_version, request JSON, draft JSON, validation JSON (`{ok, errors[], recomputed[]}`), status enum(generating, invalid, pending_review, approved, rejected), requested_by, reviewed_by NULL, review_note NULL, created_at, reviewed_at NULL.
- On approval it is materialised into the Phase 2 note/block tables and `item` rows, with `provenance = 'ai_draft:<draftId> approved by <teacherId>'`, plus an `audit_log` entry.

### API
| Method / path | Contract |
|---|---|
| `POST /teacher/content/generate {chapterId, conceptId, variant, blockKinds, language}` | Teacher of that section/subject only → `{draftId, status}`. Runs async on the existing `ai_draft_job`-style worker loop. |
| `GET /teacher/content/drafts?status=` · `GET /teacher/content/drafts/:id` | List and detail, with validation errors and recomputed values. |
| `POST /teacher/content/drafts/:id/review {decision:'approve'\|'reject', edits?, note}` | Edits are re-validated. Approve is only possible when validation passes. **Nothing is ever published without this call** (5.5, 2.4). Students never see drafts. |

### UI
- `/teacher/content/drafts`, reusing the `ai/DraftReview.tsx` and `DraftReviewPage` patterns.
- AI drafts are **visually distinct**: a dashed navy border plus the label "Draft · needs your check".
- Left: block-by-block preview **rendered with the real Phase 2 block components and student player**. Right: the validation panel (✓/✗ per rule, with recomputed numbers shown next to the claimed ones) and Approve / Edit / Reject buttons.
- No teacher mockup exists, so reuse the notebook workspace tokens.

---

## Acceptance criteria
- [ ] Chat runs all 11 steps. Keys never reach the client (network-trace test: no `sk-`/key env in bundles or responses) (10.7 #1).
- [ ] It streams over SSE with the thinking state, and the provider-down path shows an honest error with retry (10.7 #2, 11.3).
- [ ] The same doubt gives different depth for Priya and Aarav. A unit test on the prompt builder plus an API test with LocalStubProvider asserts `analogy_first` vs `formula_forward` (10.7 #3).
- [ ] EN, HI and Hinglish are detected and answered in-language (10.7 #4).
- [ ] Homework mode never leaks the key. Write a test that seeds an assignment item with numeric answer 2.5 m/s² and asserts no stream contains "2.5" plus a unit, or the option text (10.7 #5).
- [ ] The honesty path shows "I'm not sure" plus escalation. Opt-in escalation reaches only that section's teacher (10.7 #6, 10.4).
- [ ] No fabricated citations. Add a 20-probe adversarial test file `apps/api/test/ask-adversarial.test.ts` (10.7 #7).
- [ ] A burst test rejects cleanly on rate limit plus token budget (10.7 #8).
- [ ] SnapDoubt: photo → extraction → confirmation → doubt, or `not_configured` triage. Files are private (10.7 #9).
- [ ] The cluster job reproduces "17 on acceleration, 9 on sign convention" from seed (10.7 #10).
- [ ] Every non-atom game writes evidence rows, with confidence chips present and the ladder moving difficulty. A negative test shows atom is not exposed (10.8 #2-4).
- [ ] No "LV", "WARRIOR", leaderboard or audio in the games code (grep test).
- [ ] Generator: Local adapter end-to-end. An invalid numeric (a claimed 3 m/s² where (v−u)/t = 2.5) is rejected with a named reason. A mojibake string is rejected. An approved draft appears in the student player. A rejected or unreviewed draft never does.
- [ ] Parent and admin tokens get 403 on `/ask/*` thread reads, and teacher tokens get 403 on raw threads (2.4).
- [ ] Playwright `e2e/phase4-ask-games.spec.ts`:
  - Priya asks in Hinglish → streamed answer;
  - homework hint mode;
  - Cricket Lab checkpoint → progress page reflects it;
  - teacher approves a generated draft.
  - Screenshots go to `docs/screens/phase4/` at 1440 and 360.

## Cursor runs (sequential; each ends green, committed, with progress.md appended)
**Run 4A: Ask Saathy backend and screen.**
- Migration, with backup first.
- `core/ask.ts` (language, depth, clarification, subtag, homework-leak check, tone filter), with unit tests.
- `ai/ask-pipeline.ts` with SSE, provider `stream()` for stub and OpenAI-compatible providers, guards, follow-ups, budget.
- Escalation routes and the nightly cluster job plus seed.
- SnapDoubt endpoints with `not_configured` fallback.
- `/student/ask` screen per ask-v1, with deep links from homework and home.
- API tests and the adversarial probe file.

**Run 4B: Games to evidence.**
- Migration.
- `game_checkpoint_map` seed for the 9 non-atom games, adding real NCERT items where needed.
- Game session/answer/finish routes.
- Light-evidence weight and ladder in practice modes.
- Client progress.ts rewire, chips in CheckpointPanel/RecapQuestions, keys out of bundles.
- ArenaShell fake rank removed; video muted.
- `/student/games` per games-v1.
- Tests, including the atom-excluded negative.

**Run 4C: Content generator.**
- Contracts plus JSON Schema export.
- Generator interface, Local and Http adapters.
- Validate pipeline with the safe evaluator, oEmbed check and hygiene rules.
- `content_draft` migration, teacher routes, review UI using the real player.
- Approve → materialise with provenance plus audit.
- Tests.
- Playwright phase4 spec and screenshots last.

## Out of scope
- New games. That includes Streak Challenge and a separate Boss Level game; see open questions in progress.md.
- Teacher heatmap and dashboards, which are Phase 5.
- Voice or audio of any kind.
