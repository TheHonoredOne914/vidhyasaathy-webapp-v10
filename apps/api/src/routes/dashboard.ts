import { randomUUID } from 'node:crypto';
import { AnnouncementListSchema, AnnouncementSchema, AuditLogListSchema, AuditLogQuerySchema, ClassInsightsSchema,
  NotificationListSchema, NotificationSchema, NotificationSettingsSchema, ParentSummarySchema, ProgressSchema,
  ReteachDecisionInputSchema, ReteachDecisionSchema, SaveAnnouncementSchema, SaveNotificationSettingsSchema,
  SectionInsightsQuerySchema, TeacherDashboardSchema } from '@vidhyasaathy/contracts';
import { and, desc, eq, isNull, lt } from 'drizzle-orm';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import { resourceId } from '../content/access.ts';
import { runDashboardJobs } from '../dashboard/jobs.ts';
import { dispatchStudent, groupInbox, notifyParentViewed } from '../daily/notify.ts';
import { deliverNotifications, notificationView, queueNotification, settingsFor } from '../dashboard/notifications.ts';
import { classInsights, parentSummary, sectionAccess, studentProgress, teacherDashboard, visibleAnnouncements } from '../dashboard/views.ts';
import type { Database, Db } from '../db/index.ts';
import { announcements, auditLogs, chapters, concepts, notifications, notificationSettings, parentLinks, profiles, reteachDecisions, subjects } from '../db/schema.ts';
import { ApiException, parseInput } from '../errors.ts';
import { found, mutate, scope } from '../school/access.ts';

function recipients(db: Db, schoolId: string, sectionId: string, audience: 'students' | 'parents' | 'all') {
  const students = db.select({ id: profiles.id, role: profiles.role }).from(profiles).where(and(eq(profiles.schoolId, schoolId),
    eq(profiles.sectionId, sectionId), eq(profiles.role, 'student'))).all();
  const studentIds = new Set(students.map((row) => row.id));
  const parentIds = [...new Set(db.select({ id: parentLinks.parentProfileId, studentId: parentLinks.studentProfileId })
    .from(parentLinks).where(eq(parentLinks.schoolId, schoolId)).all()
    .filter((row) => studentIds.has(row.studentId)).map((row) => row.id))];
  const parents = parentIds.map((id) => ({ id, role: 'parent' as const }));
  if (audience === 'students') return students;
  if (audience === 'parents') return parents;
  const seen = new Set<string>();
  return [...students, ...parents].filter((row) => (seen.has(row.id) ? false : seen.add(row.id)));
}

function ownNotification(db: Db, request: FastifyRequest) {
  const { school, profile } = requireAuth(request);
  const row = db.select().from(notifications).where(and(eq(notifications.schoolId, school.id), eq(notifications.id, resourceId(request)))).get();
  if (!row || row.profileId !== profile.id) throw new ApiException(404, 'NOT_FOUND', 'Resource not found.');
  return row;
}

export function registerDashboardRoutes(app: FastifyInstance, database: Database, auth: AuthService, now: () => number) {
  const { db } = database;
  const refresh = (request: FastifyRequest) => {
    const timestamp = now();
    runDashboardJobs(database, timestamp, requireAuth(request).school.id);
    return timestamp;
  };
  app.get('/dashboard/teacher', { preHandler: requireRole('teacher') }, async (request) => {
    const timestamp = refresh(request);
    const { sectionId } = parseInput(SectionInsightsQuerySchema, request.query);
    return TeacherDashboardSchema.parse(teacherDashboard(db, request, sectionId, timestamp));
  });
  app.get('/sections/:id/insights', { preHandler: requireRole('admin', 'teacher') }, async (request) => {
    const timestamp = refresh(request);
    return ClassInsightsSchema.parse(classInsights(db, request, resourceId(request), timestamp));
  });
  app.post('/sections/:id/reteach', { preHandler: requireRole('teacher') }, async (request, reply) => {
    const timestamp = now();
    const { school, profile } = requireAuth(request);
    const sectionId = resourceId(request);
    const access = sectionAccess(db, request, sectionId);
    const input = parseInput(ReteachDecisionInputSchema, request.body);
    const concept = found(db.select().from(concepts).where(scope(concepts, school.id, input.conceptId)).get());
    const chapter = found(db.select().from(chapters).where(scope(chapters, school.id, concept.chapterId)).get());
    const subject = found(db.select().from(subjects).where(scope(subjects, school.id, chapter.subjectId)).get());
    if (subject.classId !== access.section.classId || (access.subjectIds && !access.subjectIds.has(subject.id))) {
      throw new ApiException(400, 'CONCEPT_MISMATCH', 'Choose a concept from this section.');
    }
    const saved = mutate(() => db.transaction(() => {
      const row = db.insert(reteachDecisions).values({
        id: randomUUID(), schoolId: school.id, sectionId, conceptId: input.conceptId, teacherId: profile.id,
        decision: input.decision, note: input.note, createdAt: timestamp,
      }).returning().get();
      auth.audit(request, 'dashboard.reteach');
      return row;
    }));
    if (!saved) throw new ApiException(500, 'INTERNAL_ERROR', 'The request could not be completed.');
    return reply.code(201).send(ReteachDecisionSchema.parse({
      id: saved.id, sectionId: saved.sectionId, conceptId: saved.conceptId, teacherId: saved.teacherId,
      decision: saved.decision, note: saved.note, createdAt: saved.createdAt,
    }));
  });
  app.get('/progress', { preHandler: requireRole('student') }, async (request) => {
    const timestamp = refresh(request);
    const { school, profile } = requireAuth(request);
    const student = found(db.select().from(profiles).where(scope(profiles, school.id, profile.id)).get());
    return ProgressSchema.parse(studentProgress(db, request, student, timestamp));
  });
  app.get('/parents/children/:id/summary', { preHandler: requireRole('parent') }, async (request) => {
    const timestamp = refresh(request);
    const childId = resourceId(request);
    const summary = parentSummary(db, request, childId, timestamp);
    notifyParentViewed(db, requireAuth(request).school.id, childId, timestamp);
    return ParentSummarySchema.parse(summary);
  });
  app.get('/announcements', async (request) => {
    const { sectionId } = parseInput(SectionInsightsQuerySchema, request.query);
    return AnnouncementListSchema.parse({ updatedAt: now(), announcements: visibleAnnouncements(db, request, sectionId) });
  });
  app.post('/announcements', { preHandler: requireRole('admin', 'teacher') }, async (request, reply) => {
    const timestamp = now();
    const { school, profile } = requireAuth(request);
    const input = parseInput(SaveAnnouncementSchema, request.body);
    sectionAccess(db, request, input.sectionId);
    const saved = mutate(() => db.transaction(() => {
      const id = randomUUID();
      const row = db.insert(announcements).values({ ...input, id, schoolId: school.id, authorId: profile.id, createdAt: timestamp }).returning().get();
      for (const person of recipients(db, school.id, input.sectionId, input.audience)) {
        const href = person.role === 'parent' ? '/parent/notifications' : '/student/notifications';
        for (const channel of input.channels) {
          queueNotification(db, { schoolId: school.id, profileId: person.id, announcementId: id, kind: 'announcement', channel,
            dedupeKey: `announcement:${id}:${person.id}:${channel}`, title: input.title, body: input.body, href, createdAt: timestamp });
        }
      }
      deliverNotifications(db, timestamp, school.id);
      auth.audit(request, 'dashboard.announcement');
      return row;
    }));
    if (!saved) throw new ApiException(500, 'INTERNAL_ERROR', 'The request could not be completed.');
    const { schoolId: _schoolId, ...announcement } = saved;
    return reply.code(201).send(AnnouncementSchema.parse(announcement));
  });
  app.get('/notifications', async (request) => {
    const { school, profile } = requireAuth(request);
    const timestamp = now();
    if (profile.role === 'student') dispatchStudent(db, school.id, profile.id, timestamp);
    deliverNotifications(db, timestamp, school.id);
    const rows = db.select().from(notifications).where(and(eq(notifications.schoolId, school.id), eq(notifications.profileId, profile.id)))
      .orderBy(desc(notifications.createdAt)).limit(100).all().map(notificationView);
    return NotificationListSchema.parse({ updatedAt: timestamp, notifications: rows, groups: groupInbox(rows, timestamp) });
  });
  app.post('/notifications/read-all', async (request) => {
    const { school, profile } = requireAuth(request);
    const timestamp = now();
    db.update(notifications).set({ readAt: timestamp }).where(and(
      eq(notifications.schoolId, school.id), eq(notifications.profileId, profile.id), isNull(notifications.readAt),
    )).run();
    auth.audit(request, 'dashboard.notification-read-all');
    return { updatedAt: timestamp };
  });
  app.post('/notifications/:id/read', async (request) => {
    const row = ownNotification(db, request);
    const timestamp = now();
    if (row.readAt === null) db.update(notifications).set({ readAt: timestamp }).where(eq(notifications.id, row.id)).run();
    const saved = db.select().from(notifications).where(eq(notifications.id, row.id)).get();
    auth.audit(request, 'dashboard.notification-read');
    return NotificationSchema.parse(notificationView(found(saved)));
  });
  app.post('/notifications/:id/retry', async (request) => {
    const row = ownNotification(db, request);
    if (row.status !== 'failed') throw new ApiException(409, 'NOT_FAILED', 'Only a failed notification can be retried.');
    const timestamp = now();
    db.update(notifications).set({ status: 'queued', failure: null, deliverAfter: timestamp }).where(eq(notifications.id, row.id)).run();
    deliverNotifications(db, timestamp, row.schoolId);
    auth.audit(request, 'dashboard.notification-retry');
    return NotificationSchema.parse(notificationView(found(db.select().from(notifications).where(eq(notifications.id, row.id)).get())));
  });
  app.get('/notification-settings', async (request) => {
    const { school, profile } = requireAuth(request);
    return NotificationSettingsSchema.parse(settingsFor(db, school.id, profile.id));
  });
  app.put('/notification-settings', async (request) => {
    const input = parseInput(SaveNotificationSettingsSchema, request.body);
    const { notifySessions, notifyHomework, notifyStreak, notifyParentView, notifyGame, quietAfter21, ...base } = input;
    const flags = {
      ...(notifySessions === undefined ? {} : { notifySessions: notifySessions ? 1 : 0 }),
      ...(notifyHomework === undefined ? {} : { notifyHomework: notifyHomework ? 1 : 0 }),
      ...(notifyStreak === undefined ? {} : { notifyStreak: notifyStreak ? 1 : 0 }),
      ...(notifyParentView === undefined ? {} : { notifyParentView: notifyParentView ? 1 : 0 }),
      ...(notifyGame === undefined ? {} : { notifyGame: notifyGame ? 1 : 0 }),
      ...(quietAfter21 === undefined ? {} : { quietAfter21: quietAfter21 ? 1 : 0 }),
    };
    const { school, profile } = requireAuth(request);
    const timestamp = now();
    const saved = mutate(() => db.transaction(() => {
      db.insert(notificationSettings).values({ profileId: profile.id, schoolId: school.id, ...base, ...flags, updatedAt: timestamp })
        .onConflictDoUpdate({ target: notificationSettings.profileId, set: { ...base, ...flags, schoolId: school.id, updatedAt: timestamp } }).run();
      auth.audit(request, 'dashboard.settings');
      return settingsFor(db, school.id, profile.id);
    }));
    return NotificationSettingsSchema.parse(saved);
  });
  app.get('/audit-log', { preHandler: requireRole('admin') }, async (request) => {
    const query = parseInput(AuditLogQuerySchema, request.query);
    const { school } = requireAuth(request);
    const entries = db.select({ id: auditLogs.id, profileId: auditLogs.profileId, action: auditLogs.action,
      requestId: auditLogs.requestId, createdAt: auditLogs.createdAt }).from(auditLogs)
      .where(and(eq(auditLogs.schoolId, school.id), query.before === undefined ? undefined : lt(auditLogs.createdAt, query.before)))
      .orderBy(desc(auditLogs.createdAt)).limit(query.limit).all();
    return AuditLogListSchema.parse({ updatedAt: now(), entries });
  });
}
