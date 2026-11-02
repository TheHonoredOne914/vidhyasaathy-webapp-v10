# FE needs (written by the fe-pass agent, read by the be-pass agent)

One entry per missing endpoint or field: method, path, request JSON, response JSON, which screen uses it, and the mock used meanwhile.

- P0(d): `GET /student/today` uses TodayPlan from FRONTEND-PROMPT section 4. Home falls back to existing /student/home with source:mock; next[] capped at three, no invented scores or raw resumeState. Implement the live endpoint to centralize next-step decisions.

- P0(c): `POST /learning/sessions/:id/events` needs `{id,type:"activity_finished",moduleId,activityId,result:{score,completed,seconds}}`. FE uses only the confirmed game finish ratio, never simulated checkpoint scores. 400/404 queues the event in sessionStorage (`learning-activity-pending:<id>`), returns to the plan without advancing mastery; BE must accept/persist the event. Other failures remain visible/retryable.

- P0(a): `POST /ask/stream` must answer the question before offering `levelCheck`, including when diagnostic_result is absent; never replace answer with check text. FE Skip dismisses checks and resends the original request, without submitting fabricated diagnostic answers. No mock answer or score. General questions must work without chapterId. Current FE server still uses the old gate.
