import { ChildListSchema, ResourceParamsSchema, RosterListSchema, SaveSchoolDetailsSchema, SchoolDetailsSchema, SchoolSummarySchema, StudentEnrollmentSchema, SubjectSchema } from '@vidhyasaathy/contracts';
import { and, count, eq, isNotNull, isNull } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import type { Db } from '../db/index.ts';
import { classes, parentLinks, profiles, schools, sections, subjects, users } from '../db/schema.ts';
import { parseInput } from '../errors.ts';
import { found, readSection, scope } from '../school/access.ts';

export function registerFlowRoutes(app: FastifyInstance, db: Db, auth: AuthService): void {
  const admin = { preHandler: requireRole('admin') };
  app.get('/admin/school-details', admin, async (request) => {
    const row = found(db.select().from(schools).where(eq(schools.id, requireAuth(request).school.id)).get());
    return SchoolDetailsSchema.strip().parse(row);
  });
  app.put('/admin/school-details', admin, async (request) => {
    const input = parseInput(SaveSchoolDetailsSchema, request.body);
    const schoolId = requireAuth(request).school.id;
    return db.transaction(() => {
      db.update(schools).set(input).where(eq(schools.id, schoolId)).run();
      auth.audit(request, 'school.update');
      return SchoolDetailsSchema.parse({ id: schoolId, ...input });
    });
  });
  app.get('/admin/summary', admin, async (request) => {
    const schoolId = requireAuth(request).school.id;
    const roleCount = (role: 'teacher' | 'student') => db.select({ total: count() }).from(profiles).where(and(eq(profiles.schoolId, schoolId), eq(profiles.role, role))).get()?.total ?? 0;
    return SchoolSummarySchema.parse({
      classes: db.select({ total: count() }).from(classes).where(eq(classes.schoolId, schoolId)).get()?.total ?? 0,
      teachers: roleCount('teacher'), students: roleCount('student'),
      activated: db.select({ total: count() }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(and(eq(profiles.schoolId, schoolId), eq(profiles.role, 'student'), isNotNull(users.pinHash))).get()?.total ?? 0,
      pending: db.select({ total: count() }).from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(and(eq(profiles.schoolId, schoolId), eq(profiles.role, 'student'), isNull(users.pinHash))).get()?.total ?? 0,
      parentLinks: db.select({ total: count() }).from(parentLinks).where(eq(parentLinks.schoolId, schoolId)).get()?.total ?? 0,
      studentsWithParent: db.select({ total: count() }).from(profiles).innerJoin(parentLinks, and(eq(parentLinks.studentProfileId, profiles.id), eq(parentLinks.schoolId, schoolId))).where(and(eq(profiles.schoolId, schoolId), eq(profiles.role, 'student'))).get()?.total ?? 0,
    });
  });
  app.get('/sections/:id/students', { preHandler: requireRole('admin', 'teacher') }, async (request) => {
    const { id } = parseInput(ResourceParamsSchema, request.params);
    const section = readSection(db, request, id);
    const roster = db.select({ id: profiles.id, name: profiles.name, rollNumber: profiles.rollNumber, pinHash: users.pinHash }).from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(and(eq(profiles.schoolId, section.schoolId), eq(profiles.sectionId, id), eq(profiles.role, 'student'))).orderBy(profiles.rollNumber).all();
    return RosterListSchema.parse(roster.map(({ pinHash, ...student }) => ({ ...student, activated: pinHash !== null })));
  });
  app.get('/parent/children', { preHandler: requireRole('parent') }, async (request) => {
    const me = requireAuth(request);
    return ChildListSchema.parse(db.select({ id: profiles.id, name: profiles.name, className: classes.name, sectionName: sections.name }).from(parentLinks)
      .innerJoin(profiles, and(eq(profiles.id, parentLinks.studentProfileId), eq(profiles.schoolId, me.school.id)))
      .leftJoin(sections, and(eq(sections.id, profiles.sectionId), eq(sections.schoolId, me.school.id)))
      .leftJoin(classes, and(eq(classes.id, sections.classId), eq(classes.schoolId, me.school.id)))
      .where(and(eq(parentLinks.schoolId, me.school.id), eq(parentLinks.parentProfileId, me.profile.id))).all());
  });
  app.get('/student/subjects', { preHandler: requireRole('student') }, async (request) => {
    const me = requireAuth(request);
    const student = found(db.select().from(profiles).where(scope(profiles, me.school.id, me.profile.id)).get());
    if (!student.sectionId) return [];
    const section = found(db.select().from(sections).where(scope(sections, me.school.id, student.sectionId)).get());
    return db.select().from(subjects).where(and(eq(subjects.schoolId, me.school.id), eq(subjects.classId, section.classId))).all().map((subject) => SubjectSchema.parse(subject));
  });
  app.get('/student/enrollment', { preHandler: requireRole('student') }, async (request) => {
    const me = requireAuth(request);
    const row = db.select({ className: classes.name, sectionName: sections.name, rollNumber: profiles.rollNumber }).from(profiles)
      .leftJoin(sections, and(eq(sections.id, profiles.sectionId), eq(sections.schoolId, me.school.id)))
      .leftJoin(classes, and(eq(classes.id, sections.classId), eq(classes.schoolId, me.school.id)))
      .where(scope(profiles, me.school.id, me.profile.id)).get();
    return StudentEnrollmentSchema.parse(found(row));
  });
}
