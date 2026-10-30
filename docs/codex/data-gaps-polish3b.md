# polish3b data gaps

## Progress
- GET /progress has no weekly study duration or Sure/Unsure/Guess accuracy breakdown. Need server evidence aggregates; those cards retain notebook empty lines.
- GET /student/home supplies subject completion but not aggregate mastery words. Show a word only when all available concept words agree; otherwise link to the real concept words below.

## Quiz
- `/practice/attempts` does not return an XP delta. Refresh `/student/home` after a saved answer and show only its positive XP difference; omit when unavailable.
- Practice public items have no diagram or teacher attribution. Keep real question text; show lesson formulas only when `/concepts/:id/lesson` supplies them. No fabricated teacher formula note.
