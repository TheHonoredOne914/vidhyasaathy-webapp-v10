# P7 practice

All endpoints require a student session. Other roles are denied.

- `GET /chapters/:id/practice?gameId=quick_revision_quiz&limit=6`: `PracticeSet`. Optional teacher-published items only; answers are stripped. Two new items then one due review from at least seven days ago, with fallback when either pool is short. Never creates assignments or changes deadlines.
- `POST /practice/attempts`: `SubmitPracticeAttempt` -> `PracticeAttempt`. Server grades and records the normal attempt event with `assignmentId: null`; UUID retries are idempotent and conflicting payloads return 409. Only released items in the student's own class/section are accepted. Unrecognised short answers are rejected rather than silently graded.
- `GET /practice/streak`: `Streak`. Correct marked answers and correct lesson/remediation checks only, grouped by Asia/Kolkata calendar day. Today or yesterday keeps a current streak; no login, time, speed, leaderboard, invented holiday or grace-day rewards.

Practice attempts use their own retry endpoint, not the assignment-only sync transport. Mastery changes still appear in the existing concept-state sync stream. Shared-device sign-in remains per-profile PIN/token; no endpoint lists another student's profile or learning data.
