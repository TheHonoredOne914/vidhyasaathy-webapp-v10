# PHASE 5 — Assessment engine: bank, homework, feedback loop
Read HARD_RULES + DECISIONS. Do not break 1–4. STOP after this phase.

## Goal
Question bank, homework/quiz assign, submit, auto-grade, Pakka Meter, why-wrong loop, attempt telemetry, short-answer review queue.

## Backend
1. Question bank CRUD school-scoped: type mcq|short|numerical; options; correct; explanation; concept; difficulty L1/L2/L3; format tag; NEVER expose correct to student queries pre-submit.
2. Quiz/homework creator: pick bank or inline (inline → bank); deadline; class; time limit; availability; notify on assign.
3. Auto-pick quiz: 40/40/20 L1/L2/L3.
4. submit: server grades MCQ/numerical; short → review queue; store confidence (pakka|sochta|andaza), time_ms, first_answer, answer_changes.
5. Why-wrong payload post-submit: correct, reason, concept, deep-link resource/session, similar question id.
6. review_short_answer: correct|partial|wrong + feedback; updates score; student can read.
7. Late flag by deadline.
8. Version-safe question edits after attempts.

## Frontend
- Bank browser + editor (teacher only sees correct).
- Quiz/HW creator + auto-pick.
- Student one-question flow + confirm; Pakka Meter light UI.
- Results with why-wrong + "Explanation dobara kholo" + "Try similar".
- Teacher review queue batch-friendly.
- Four UI states everywhere.

## DoD
- Quiz from bank + inline saved to bank
- MCQ auto-grade; short in review queue
- Confidence in DB every attempt
- Why-wrong + deep-link + similar
- Attempt rows: time, first, changes, confidence
- Teacher review reaches student
- Late flagged
- 1–4 unbroken

Reply changed files only. Do NOT start phase 6.
