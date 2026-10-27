# PHASE 3 — Teacher content: publish notes & resources + student class workspace
Read HARD_RULES + DECISIONS. Do not break 1–2. No landing/theme hex changes.

## Goal
Teachers publish tagged materials; students browse class→subject→chapter→concept; notifications real.

## Backend
1. Resource/note publish: type pdf|ppt|image|youtube|recording; tag class/subject/chapter/concept; title/desc; available_at schedule (check-on-read OK).
2. Trimmed YouTube: store startSec/endSec; student API returns them.
3. Recording + segments table if missing (recording_id, title, start, end, concept_id); school setting recordings_allowed.
4. On publish: insert notifications for class students.
5. Student hierarchy APIs scoped by section; scheduled hidden until available_at.
6. Notifications list + mark-read + unread count.

## Frontend
- Teacher publish wizard (tagging IS the feature).
- Student My Class navigation ≤4 taps to a resource; statuses New/Scheduled/Available.
- In-app PDF/image view; YouTube embed with start/end; segment play.
- Bell + notification centre.
- Keep chapter history (nothing hard-deleted).

## DoD
- Publish PDF Physics→Motion→Acceleration visible to class student at that path
- Scheduled invisible then appears
- Trimmed YT segment only
- Recording segments + permission enforced
- Hierarchy ≤4 taps
- Notifications class-scoped; badge; mark-read persists
- Phases 1–2 unbroken

Reply changed files only.
