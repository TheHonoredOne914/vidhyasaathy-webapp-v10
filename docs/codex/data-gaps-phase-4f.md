# Phase 4f: backend data gaps

- `GET /student/home`: current-concept suggestion chips are absent from `StudentHomeSchema`. Do not fabricate suggestions; render returned Ask followups after a question. The Talking about card uses the thread's concept.
- Real-data verification requires phase-4b HTTP endpoints on port 3010, without reading or modifying its worktree. No database changes belong to this frontend branch.
