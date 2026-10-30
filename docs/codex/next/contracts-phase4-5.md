# API contracts for the parallel Phase 4-5 runs
Copy of record: docs/codex/contracts-phase4-5.md. Backend runs implement these shapes; frontend runs consume them. Fields may be ADDED, never renamed or removed. All times are ISO strings in UTC; the client formats them in IST. All student/parent payloads carry mastery WORDS only (`'Let\'s fix this'|'Almost there'|'Mastered'|'Top form'|'New'`), never bands, levels or ranks.

Relative-day format used by the UI (frontend helper, IST): under 60 min → "now"; same IST day → "today"; within 6 days → short weekday ("Mon"); otherwise "22 Oct".

---
## A. Ask Saathy (phase-4b implements, phase-4f consumes; mockup ask.html)

### `GET /ask/status` (student)
`{ configured: boolean, provider: 'stub'|'openai'|'http', snapConfigured: boolean, budget: { usedTokens, limitTokens } }`
`configured:false` means the LocalStubProvider is answering from retrieved NCERT notes only; the UI still works.

### `POST /ask/stream` (student) → `text/event-stream`
Request:
```ts
{ clientEventId: string, threadId?: string, text: string /*1-800*/,
  style: 'hints'|'explain',            // the "Hints mode" / "Explain fully" tabs
  mode: 'learn'|'homework',            // homework = locked hints, homework guard on
  conceptId?: string, chapterId?: string, assignmentItemId?: string,
  from?: { kind: 'practice'|'lesson'|'homework'|'session'|'home', ref?: string, label?: string }, // "from Practice Q4"
  followupKind?: 'another'|'why'|'reverse'|'example'|'simpler'|'quiz', snapId?: string }
```
Events, in order (each `event: <name>\ndata: <json>`):
| event | data |
|---|---|
| `thread` | `{ threadId, title, concept: { id, name, subjectName, chapterLabel } \| null, studentMessageId, fromLabel?: string }` |
| `thinking` | `{}` |
| `token` | `{ text }` (many) |
| `citation` | `{ chunkId, noteTitle, page?: number }` |
| `quickTry` | `{ itemId, stem, options: [{ id, text }] }` (optional; never the key) |
| `followups` | `{ chips: [{ kind: 'another'\|'why'\|'reverse'\|'example'\|'simpler'\|'quiz'\|'ask_teacher', label }] }` (max 3, plus `ask_teacher` on unsure answers) |
| `done` | `{ messageId, text /* final, after guards */, flags: { homeworkGuard: boolean, honestUnsure: boolean, clarifying: boolean } }` |
| `error` | `{ code: 'provider_down'\|'timeout'\|'budget'\|'rate_limit'\|'invalid', message /* friendly copy */ }` |
If a guard rewrites the answer, `done.text` replaces whatever was streamed; the UI must render `done.text` as the final bubble.
`POST /ask` (existing) stays as the non-stream fallback and returns the same final fields as JSON.

### `GET /ask/threads?limit=20&subjectId=` (student only; 403 parent/admin/teacher)
`{ threads: [{ id, title, subjectName, conceptName, updatedAt }] }` — title is a short topic label ("km/h to m/s"), PII-scrubbed, kept after the 24 h purge.

### `GET /ask/threads/:id` (owner only)
`{ id, title, style, mode, concept: {id,name,subjectName,chapterLabel}|null, purged: boolean,
   messages: [{ id, role: 'student'|'saathy', text, createdAt, fromLabel?, citations: [{chunkId,noteTitle,page?}],
                flags, quickTry?: {itemId, stem, options:[{id,text}], answered?: {optionId, correct}}, followups?: [{kind,label}] }] }`
Messages older than 24 h are purged: `purged:true`, `messages:[]`.

### `POST /ask/quick-try/:itemId/answer` (student)
Request `{ clientEventId, threadId, optionId, confidence?: 'sure'|'unsure'|'guess' }` → `{ correct, correctOptionId, explanation, xp }`. Server-scored, evidence `source='ask'`, idempotent on clientEventId.

### Saved explanations
- `POST /ask/messages/:id/save` → `{ savedId }` (Saathy messages only; the saved copy is kept after the purge)
- `DELETE /ask/saved/:savedId` → `{ ok: true }`
- `GET /ask/saved?limit=10` → `{ items: [{ id, title, subjectName, savedAt, messageId }] }`

### SnapDoubt
- `POST /ask/snap` multipart `file` (image/jpeg|png|webp, ≤ 4 MB) → `{ snapId, status: 'extracted'|'failed'|'not_configured', extractedText?: string, message?: string }`
- `POST /ask/snap/:id/confirm { text }` → `{ snapId, text }`
Files live under apps/api/data/private/snap/, never served by URL, deleted at 24 h.

### Escalation
- `POST /ask/escalate { messageId, alsoTellTeacher: true }` → `{ escalationId, teacherName, copy: "Sent to <teacher>. You'll see her reply here." }`
- `GET /teacher/escalations?sectionId=` (teacher of that section) → `{ items: [{ id, studentName, conceptName, questionText, status, createdAt, teacherReply? }] }`
- `POST /teacher/escalations/:id/reply { text }` → `{ ok: true }`
(phase-4b builds these three; phase-5b only reads `doubt_escalation` / `doubt_cluster_counter`.)

---
## B. Games (phase-4b implements, phase-4f consumes; mockup games.html)

### `GET /student/games` (extend the 3C endpoint if it exists; keep its fields)
```ts
{ subjects: [{ id, name, count }], total: number,
  todaysGame: { gameId, title, blurb, conceptName, lessonNote /* "Goes with the Acceleration lesson you're on." */, estMinutes, href } | null,
  games: [{ gameId, title, subjectId, subjectName, topic /* "Motion · acceleration" */, chapterId, href,
            state: 'today'|'new'|'played'|'opens_later'|'paused',
            opensAfter?: string /* concept or chapter name for "Opens after Gravitation" */,
            chapterLabel?: string /* "Ch 10" */,
            best?: { kind: 'time'|'stars'|'score', value: number, label: string /* "Best 42 s" | "3 stars" | "Best 7/10" */ } }] }
```
`todaysGame` is never atom. Atom is in `games` with `state:'paused'`. Never a level ("Lvl"), rank or classmate data.

### `POST /games/:gameId/sessions { clientEventId }` → `{ sessionId, checkpoints: { [checkpointKey]: { itemId, stem, options: [{ id, text }], format, level } } }`
404 for atom and unknown games. Checkpoint content comes from the bank via `publicItem()` (no keys). The recap pool level is picked by the ladder.

### `POST /games/:gameId/sessions/:id/answer`
Request `{ clientEventId, checkpointKey, answer: { optionId } | { numeric, unit? } | { text }, confidence: 'sure'|'unsure'|'guess', timeMs, syncedLate?: boolean }`
→ `{ correct, correctOptionId?, explanation, misconceptionNote?, errorType?, xp }`. Evidence `source='game'` (light weight), streak touch `game_round`, idempotent on clientEventId.

### `POST /games/:gameId/sessions/:id/finish` → `{ answered, correct, personalBest: boolean, best: { kind, value, label }, xp }`
### `GET /games/:gameId/best` → `{ best: { kind, value, label } | null, conceptName }` (for the in-game header "Your best: 7/10")

---
## C. Teacher (phase-5b implements, phase-5f consumes; mockup teacher-home.html)
Extend the 3C teacher-home endpoint (see docs/codex/ui-todo-3c.md for its real path; below it is called `GET /teacher/home`). Required fields after phase-5b:
```ts
{ teacher: { name, subjectName, sections: [{ id, label }] }, section: { id, label }, dateIST,
  kpis: { diagnostic: { done, total, notStarted }, handedIn: { done, total, assignmentTitle, dueLabel },
          studiedThisWeek: { students, avgMinutes }, commonMistake: { count, label } | null },
  mastery: { chapterName, view: 'group'|'student',
             columns: [{ id, label }],              // groups (student_group) or students
             rows: [{ conceptId, name, isNew: boolean, cells: [{ columnId, pct: number | null, tint: 1|2|3|4|5|'new' }] }] },
  suggestion: { text, conceptId?, kind: 'reteach'|'grade'|'publish' } | null,
  reviewQueue: [{ id, kind: 'notes'|'questions'|'video', title, meta, action: 'review'|'watch', href, flagged?: number }],
  nudges: [{ studentId, name, initial, reason, nudgedAt?: string }] }
```
`GET /teacher/home?sectionId=&view=group|student`. Tint buckets (teacher only): 1 <40%, 2 40-54, 3 55-69, 4 70-84, 5 ≥85; concepts not yet taught to the section are `'new'`.
- `POST /teacher/nudges { studentId, reasonCode }` → `{ ok, nudgedAt }` (private notification to the student in friendly words; never says why they were picked; audit entry).
- Plan endpoints (cursor-phase-5.md API table) are built by phase-5b with the shapes given there: `/teacher/morning`, heatmap, cell drill, student evidence, `POST/GET /teacher/reteach`, doubt clusters, grading, content drafts. They have no v10 mockup yet, so phase-5f builds no UI for them.

## D. Parent (phase-5b implements, phase-5f consumes; mockup parent-home.html)
Extend the 3C parent-home endpoint (real path in ui-todo-3c.md; below `GET /parent/home?childId=`). Approved link only (403 otherwise, logged). Aggregates only; a contract test enforces the allowed key set.
```ts
{ parent: { name, childRelation /* "Aarav's parent" */ }, children: [{ id, firstName }], child: { id, firstName, classLabel, schoolName },
  weekLabel /* "Week of 26 to 30 Oct" */, weekLine /* "a calm, steady week" from plainSummary */,
  kpis: { minutes, deltaMinutes, homework: { done, total, note? }, daysInRow, usualTimeLabel? },
  subjects: [{ id, name, pct, word }],
  gotIt: string[], workingOn: { text } | null,
  askThis: { eventId, text } | null,
  fromSchool: [{ id, from /* "Sharma Ma'am · Physics" */, text, dayLabel, isNew }],
  comingUp: [{ id, text, dateLabel }] }
```
- `POST /parents/ask-this/:eventId/had` → `{ ok }` (backend only; no UI until mockup).
- `GET /parents/children/:id/week` and `/report` per cursor-phase-5.md (backend only; no UI until mockup).
