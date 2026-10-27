# P4 assessment and offline-sync contract

Import schemas/types from `@vidhyasaathy/contracts`, outbox helpers from
`@vidhyasaathy/core/sync`, mastery from `@vidhyasaathy/core/mastery`.
Requests use the existing cookie session and Origin/CSRF rules. Timestamps are
integer epoch milliseconds. IDs are UUIDs. All request objects reject extra keys.

## Routes

| Route | Access | Input / response |
| --- | --- | --- |
| `GET /chapters/:id/items` | Admin or assigned teacher | `BankItemSchema[]`, including answer keys |
| `POST /chapters/:id/items` | Admin or assigned teacher | `SaveItemSchema` -> `BankItemSchema` (201) |
| `PUT /items/:id` | Admin or assigned teacher | `SaveItemSchema` -> bank item; assigned items are immutable |
| `GET /assignments` | Admin, assigned teacher, enrolled student | `AssignmentQuerySchema` -> `AssignmentSchema[]` |
| `GET /assignments/:id` | Same, scoped to assignment | `AssignmentDetailSchema`; student items omit keys |
| `POST /chapters/:id/assignments` | Admin or section+subject assigned teacher | `SaveAssignmentSchema` -> draft detail (201) |
| `PUT /assignments/:id` | Same | `SaveAssignmentSchema` -> detail; drafts only |
| `POST /assignments/:id/publish` | Same | `{}` -> published detail; drafts only |
| `POST /attempts` | Enrolled student | `SubmitAttemptSchema` -> `AttemptSchema` |
| `POST /sync/attempts` | Enrolled student | `PushAttemptsSchema` -> `PushAttemptsResponseSchema` |
| `GET /assignments/:id/attempts` | Assignment-scoped staff or student | `AttemptSchema[]`; students see only their own |
| `GET /attempts` | Admin or assigned teacher | `ReviewQuerySchema` -> attempts; pending reviews by default |
| `POST /attempts/:id/grade` | Same | `GradeAttemptSchema` -> attempt, with grader and timestamps |
| `GET /concept-states` | Student | Own `StudentConceptStateSchema[]`, next-review order |
| `GET /sync` | Student | `SyncQuerySchema` -> `SyncResponseSchema` |

Parents have no P4 assessment endpoints; parent summaries belong to P6. Teachers
must be assigned both the subject and section. Students see only published work
in their current section. Admins stay school-scoped.

## Answering and scoring

- Assignment `itemIds` define question order, including when rendering sync items.
  Both homework and quizzes are teacher-required work; due dates never change on submission.
  Derive overdue state from `dueAt`; `score.status` describes answering/review progress.
- Publication is immediate. Assigned bank questions are immutable; create another
  question to revise one. Published assignments are immutable. Referenced source
  notes must already be released before an assignment can be published.
- One answer per student/assignment/item. Generate `clientEventId` once before
  persistence; retry the identical payload. An identical retry returns the current
  attempt (including any teacher regrade), without another attempt or mastery update.
  A reused ID with different data/owner, or a second ID for an answered item, is 409.
- `answer`: MCQ option string; match-pairs array of right values in left-list order;
  short-answer or flashcard recall string. Never send correctness, identity or concept.
- MCQs and pairs are exact-marked. Text recall uses Unicode/case/whitespace
  normalization. Accepted short answers pass automatically; other short answers
  have `correct: null`, `needsReview: true` until teacher grading. Pending answers
  do not count as mastery evidence. Grades and regrades recompute the same evidence.
- Late offline submissions are accepted; both client and server timestamps remain
  recorded. Mastery orders evidence by `min(clientTs, serverTs)`, then event ID,
  not arrival time. Time spent is stored but never contributes to mastery.
- Reversible initial mastery policy: 14-day evidence half-life; Leitner boxes 1..5
  with 1/3/7/14/30-day intervals, correct advances and incorrect resets to box 1.

## Offline handoff

1. Scope persisted caches, cursors and outboxes by school/profile. Reset content
   caches/cursors if enrollment changes. Never show another account's cached work.
2. Persist `enqueue` output before networking. `readyEntries` returns up to 100.
   Push batches transactionally; a failed batch acknowledges nothing. Remove only
   event IDs returned by a successful, validated response using `acknowledge`.
3. Network/408/425/429/5xx failures use `retryEntry` with a fresh random value in
   `[0,1)` (capped exponential full jitter). Keep other failures with `blockEntry`;
   require authentication recovery or user action before `resumeEntry`. Never drop
   an answer on failure or silently generate a new event ID.
4. Pull `/sync?assignments=0&items=0&attempts=0&conceptStates=0&limit=100` initially.
   Cursors are independent opaque receipt integers, not timestamps. Atomically
   persist each response's entity upserts, cursors and `updatedAt`; repeat while
   any `hasMore` is true. Equal timestamps and delayed events are not skipped.
5. Upsert items/assignments/attempts by ID and concept states by profile+concept.
   A page may repeat an entity with its latest state. Assignment changes also carry
   updated own scores; question items never carry answer keys. Preserve the last
   successful `updatedAt` for the cached/offline UI. P4 has no delete/unpublish route.
