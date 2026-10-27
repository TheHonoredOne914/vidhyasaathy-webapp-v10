# P3 content API

All routes use the existing session cookie. Mutations require the configured Origin.
IDs are UUIDs, positions are zero-based, times are UTC epoch milliseconds. Shared
request/response schemas are exported from `src/content.ts`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/subjects/:id/chapters` | Chapter list with this student's progress status |
| POST | `/chapters` | Create chapter |
| GET, PUT | `/chapters/:id` | Read/update chapter |
| GET, POST | `/chapters/:id/concepts` | List/create concepts |
| PUT | `/concepts/:id` | Update concept and prerequisite IDs |
| GET, POST | `/chapters/:id/notes` | List/create tagged notes |
| GET, PUT | `/notes/:id` | Read/update note |
| POST | `/notes/:id/file` | Attach a local file to a draft |
| GET | `/notes/:id/file` | Authorized download |
| POST | `/notes/:id/publish` | Publish immediately or schedule |
| GET, POST | `/chapters/:id/sessions` | List/create section-specific sessions |
| GET, PUT | `/sessions/:id` | Read/update learning session |
| POST | `/sessions/:id/publish` | Publish immediately or schedule |
| POST | `/sessions/:id/advance` | Student submits `{ slideId }` for the current slide |
| POST | `/sessions/:id/check` | Student submits `{ answers: [{ itemId, answer }] }` |

Admins manage their school. Teachers author only assigned subjects; session access
also requires their assigned section. Students read only their enrolled class and
their section's released sessions. Parents have no access to these routes (parent
progress is P6). Foreign-school IDs return 404. Students cannot author or publish.

Publishing accepts `{ releaseAt: number | null }` (`{}` means now). Both lists and
direct reads enforce release time. Drafts and future content are not student data.
Published notes/sessions are immutable: create a new draft to revise. Notes need
at least one concept tag; referenced notes must release no later than their session.
Concept prerequisites may cross chapters in the same subject but cannot cycle.

Student session responses include only viewed slides and the next unlocked slide;
the check is omitted until all slides are viewed. Staff receive the full draft and
answer keys (`ItemSchema`); students receive redacted `PublicItemSchema` items.
Completion requires a full, format-valid check submission, not correctness. Grading
and attempts are P4. Match answers are right-hand strings in left-hand display order;
flashcards use a nonempty recalled-answer string. Retried progression/check requests
are idempotent. No client-supplied progress or profile ID is accepted.

## Local upload decision

Set `UPLOAD_DIRECTORY` in `apps/api/.env` (default `./uploads`, relative to API cwd).
Keep it outside any static/public directory; back it up alongside SQLite. Files are
stored under generated opaque IDs and downloaded through authenticated routes only.
Upload JSON is `{ filename, contentType, dataBase64 }` with canonical base64 data.
The reversible default is 10 MiB decoded per file. Only PDF, PNG, JPEG and UTF-8 text
are allowed, with extension/type/signature validation. Downloads are attachments,
`nosniff`, sandboxed and `no-store`; this is not malware scanning. One attachment per
draft note; replacing a file requires a new note. No cloud storage or new dependency.

The existing SQLite `session` table remains authentication-only. Learning content
uses `learning_session`, avoiding an incompatible P1 rename.
