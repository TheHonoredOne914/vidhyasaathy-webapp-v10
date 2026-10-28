# P5 AI API

All routes require a session; mutations require the existing same-origin CSRF header.
Contracts are exported from `@vidhyasaathy/contracts`. Chats are private: no parent,
teacher or admin chat/history endpoint exists.

- `POST /ask` (student): `AskSchema` -> `AskResponseSchema`. Default hint level 1;
  levels 2/3 and `socratic` are explicit. Only released class notes are retrieved.
  `not_in_notes`, `not_configured` ("AI not configured") and `unavailable` are real states.
  Citations link to `GET /notes/:id`; `locator` identifies the text chunk.
  Cache is scoped to school/profile, notes, their contents, question, level, mode
  and provider. Each higher hint requires the previous hint in that mode.
- `POST /ai/draft-jobs` (assigned teacher/admin): `CreateDraftJobSchema` ->
  `DraftJobSchema` (202). SQLite-backed jobs are polled by the API.
- `GET /ai/draft-jobs/:id` (assigned teacher/admin): `DraftJobSchema`.
- `POST /ai/draft-jobs/:id/review`: `ReviewDraftJobSchema` -> `DraftJobSchema`.
  Approval creates an editable **draft** session and quiz. Use the existing publish
  routes after review; generated content is never automatically published.
- `GET /concepts/:id/gap` (student): `ConceptGapSchema`; earliest evidenced weak
  prerequisite, default minimum evidence 3, mastery below 0.7. A failed target
  itself needs only one marked failure to offer remediation.
- `GET /concepts/:id/remediation` (student): `RemediationSchema`. A released,
  teacher-authored note and exactly two auto-markable published questions are
  required. Missing material is labelled, never generated as a substitute.
- `POST /concepts/:id/remediation/check`: `SubmitRemediationSchema` ->
  `RemediationResultSchema`. Both answers must be correct; retries with the same
  event are idempotent. `passedOnSecondAttempt` counts checks, not time spent.
  Further answers/slides for the failed concept return `REMEDIATION_REQUIRED`
  until this check passes; missing material requires teacher help.
- `GET /study-plan` (student): `StudyPlanSchema`. Teacher work is required,
  recommendations optional; deadlines are never changed. `continue.resumeAt`
  is the next slide/question index. Due teacher work is ordered first.

The default provider never invents answers or drafts. Without a provider, `POST /ask`
quotes the released note sentences that cover most of the question's subject words
(status `answered`, verbatim citations) and otherwise returns `not_in_notes`. Set `OPENAI_API_KEY` on the
API only to enable the hosted adapter (`OPENAI_MODEL` is configurable). Notes are
indexed as text; image/PDF bytes are not OCR'd. Supply the note body for retrieval.
Private debugging records expire after 24 hours; answer caches after one hour.
