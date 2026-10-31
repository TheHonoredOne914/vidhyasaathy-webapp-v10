# polish3a data gaps

- Subjects / Time this week: `/student/home`, `/student/streak` and `/progress` do not expose measured weekly minutes by subject. Keep the card's empty line; need a student-scoped weekly-time endpoint, not estimates or streak-day counts.
- Subject path / Today's goal: `/student/home.todaysGoal` provides completed steps, not measured minutes or a minute target. Render those real steps (as home already does), never a fictitious minute ring.
- Path header counts completed ideas; the station labels the next idea's ordinal. Both are derived from the same concept list and mastery words; the header now explicitly says `ideas completed` to distinguish the two.
- Lesson: the lesson response has no verified video ID or video timing metadata. Keep the mockup's video empty state; no YouTube search link or invented clip. Diagram/interactive content is rendered only when the lesson supplies it.
- Session player: slides expose title/body/concept/note links, not diagram datasets, teacher identity/remarks or durations. Render honest empty states and existing note links instead of fabricated graphs, quotes or timings. Future slides are server-redacted until opened.
- Session notes: no server note-save endpoint exists. Notes are student/session/slide-scoped local storage, explicitly labelled as saved on this device; blocked storage shows an error and preserves typed text.
