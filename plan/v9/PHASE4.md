# PHASE 4 — Guided self-study sessions: builder & player
Read HARD_RULES + DECISIONS. Do not break 1–3.

## Goal
Core product: teacher builds structured session; student plays with sequential unlock; quiz mandatory for completion.

## Backend
1. Session CRUD: 10-step template structure stored as slides/sections; draft/publish; opens_at/due_at; assign sections/classes; duplicate/reuse; per-class question swap; version on edit-after-publish.
2. Player APIs: open_session enforces opens_at; save progress pointer; embedded question answers recorded; complete_session ONLY if quiz attempted (pass threshold default 60% overridable); store wrong answers + concept tags.
3. Teacher completion list: not-started / in-progress / completed / late.

## Frontend
- Session builder two-pane, sticky save, unsaved guard; preview uses real player.
- Player: sequential slides, questions block advance, progress bar, resume exact slide, quiz mandatory, score+review+next-step.
- States: Upcoming countdown, Available, In Progress, Completed, Overdue.
- Teacher completion table real data.

## DoD
- Build+publish 10-step session for class with 6PM availability
- Before 6PM locked countdown; after opens
- Cannot skip; questions block
- Quit slide 6 → resume slide 6
- Slides-only = in_progress not completed
- Quiz attempt completes + stores score
- Wrong answers stored with concept
- Duplicate/reuse + per-class swap
- Teacher list real statuses
- 1–3 unbroken

Reply changed files only.
