# P6 dashboards and communications

All routes require a session. Mutations require the configured Origin. Responses include `updatedAt` for client caching. Percentages use marked evidence only; fewer than `MIN_ANALYTICS_ATTEMPTS` (reversible default: 3) return a null pass rate and `insufficient` confidence. No rankings, time-spent metrics or private AI messages are returned.

| Route | Access / response schema |
| --- | --- |
| GET /dashboard/teacher | Teacher; TeacherDashboardSchema, optional sectionId |
| GET /sections/:id/insights | Admin or assigned teacher; ClassInsightsSchema, teacher's assigned subjects only |
| POST /sections/:id/reteach | Assigned teacher; ReteachDecisionInputSchema -> ReteachDecisionSchema |
| GET /progress | Student's own ProgressSchema |
| GET /parents/children/:id/summary | Parent's linked child only (otherwise 403); ParentSummarySchema |
| GET /announcements | Role/relationship-filtered AnnouncementListSchema, optional sectionId |
| POST /announcements | Admin or assigned teacher; SaveAnnouncementSchema -> AnnouncementSchema (201) |
| GET /notifications | Own NotificationListSchema (latest 100) |
| POST /notifications/:id/read | Own NotificationSchema |
| POST /notifications/:id/retry | Own failed NotificationSchema; external channels remain explicitly unconfigured |
| GET /notification-settings | Own NotificationSettingsSchema |
| PUT /notification-settings | SaveNotificationSettingsSchema -> NotificationSettingsSchema |
| GET /audit-log | Admin, own school; AuditLogListSchema, optional before/limit |

SQLite job refreshes daily concept/misconception aggregates; reads also run a pending refresh so newly accepted or graded evidence is immediately visible. Parent summaries show observed result, explicitly unconfigured AI interpretation, teacher confirmation only when recorded, and a suggested support action. Parent alerts name the concept and link to the child's summary (one alert per linked child/concept). In-app delivery is real; email/WhatsApp fail with an explicit unconfigured reason, never a fabricated success. Reversible quiet-hours defaults: 22:00–07:00, UTC+05:30; equal start/end disables quiet hours. Preferences are per profile. Alerts are deferred during quiet hours or while disabled; no external service is used.
