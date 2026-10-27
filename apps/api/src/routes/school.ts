import { randomUUID } from 'node:crypto';
import {
  AcademicYearSchema, ClassSchema, ResourceParamsSchema, SaveAcademicYearSchema, SaveClassSchema,
  SaveSectionSchema, SaveSubjectSchema, SectionSchema, SubjectSchema,
} from '@vidhyasaathy/contracts';
import { and, eq, inArray } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import type { z, ZodTypeAny } from 'zod';
import { requireAuth, requireRole } from '../auth/middleware.ts';
import type { AuthService } from '../auth/service.ts';
import type { Db } from '../db/index.ts';
import { academicYears, classes, sections, subjects, teacherAssignments } from '../db/schema.ts';
import { parseInput } from '../errors.ts';
import { found, mutate, readSection, scope } from '../school/access.ts';

interface Resource<Input, Row> {
  list: (schoolId: string) => Row[];
  read: (schoolId: string, id: string) => Row | undefined;
  create: (schoolId: string, id: string, input: Input) => Row;
  update: (schoolId: string, id: string, input: Input) => Row;
  remove: (schoolId: string, id: string) => void;
}

function registerResource<S extends ZodTypeAny, R>(
  app: FastifyInstance, db: Db, auth: AuthService, path: string, schema: S, resource: Resource<z.infer<S>, R>,
) {
  const options = { preHandler: requireRole('admin') };
  app.get(`/admin/${path}`, options, async (request) => resource.list(requireAuth(request).school.id));
  app.get(`/admin/${path}/:id`, options, async (request) => {
    const { id } = parseInput(ResourceParamsSchema, request.params);
    return found(resource.read(requireAuth(request).school.id, id));
  });
  app.post(`/admin/${path}`, options, async (request, reply) => {
    const input = parseInput(schema, request.body);
    const row = mutate(() => db.transaction(() => {
      const result = resource.create(requireAuth(request).school.id, randomUUID(), input);
      auth.audit(request, `school.${path}.create`);
      return result;
    }));
    return reply.code(201).send(row);
  });
  app.put(`/admin/${path}/:id`, options, async (request) => {
    const { id } = parseInput(ResourceParamsSchema, request.params);
    const input = parseInput(schema, request.body);
    return mutate(() => db.transaction(() => {
      const schoolId = requireAuth(request).school.id;
      found(resource.read(schoolId, id));
      const result = resource.update(schoolId, id, input);
      auth.audit(request, `school.${path}.update`);
      return result;
    }));
  });
  app.delete(`/admin/${path}/:id`, options, async (request, reply) => {
    const { id } = parseInput(ResourceParamsSchema, request.params);
    mutate(() => db.transaction(() => {
      const schoolId = requireAuth(request).school.id;
      found(resource.read(schoolId, id));
      resource.remove(schoolId, id);
      auth.audit(request, `school.${path}.delete`);
    }));
    return reply.code(204).send();
  });
}

export function registerSchoolRoutes(app: FastifyInstance, db: Db, auth: AuthService): void {
  registerResource(app, db, auth, 'academic-years', SaveAcademicYearSchema, {
    list: (schoolId) => db.select().from(academicYears).where(scope(academicYears, schoolId)).all(),
    read: (schoolId, id) => db.select().from(academicYears).where(scope(academicYears, schoolId, id)).get(),
    create: (schoolId, id, input) => db.insert(academicYears).values({ ...input, schoolId, id }).returning().get(),
    update: (schoolId, id, input) => found(db.update(academicYears).set(input).where(scope(academicYears, schoolId, id)).returning().get()),
    remove: (schoolId, id) => { db.delete(academicYears).where(scope(academicYears, schoolId, id)).run(); },
  });
  registerResource(app, db, auth, 'classes', SaveClassSchema, {
    list: (schoolId) => db.select().from(classes).where(scope(classes, schoolId)).all(),
    read: (schoolId, id) => db.select().from(classes).where(scope(classes, schoolId, id)).get(),
    create: (schoolId, id, input) => {
      found(db.select().from(academicYears).where(scope(academicYears, schoolId, input.academicYearId)).get());
      return db.insert(classes).values({ ...input, schoolId, id }).returning().get();
    },
    update: (schoolId, id, input) => {
      found(db.select().from(academicYears).where(scope(academicYears, schoolId, input.academicYearId)).get());
      return found(db.update(classes).set(input).where(scope(classes, schoolId, id)).returning().get());
    },
    remove: (schoolId, id) => { db.delete(classes).where(scope(classes, schoolId, id)).run(); },
  });
  registerResource(app, db, auth, 'sections', SaveSectionSchema, {
    list: (schoolId) => db.select().from(sections).where(scope(sections, schoolId)).all(),
    read: (schoolId, id) => db.select().from(sections).where(scope(sections, schoolId, id)).get(),
    create: (schoolId, id, input) => {
      found(db.select().from(classes).where(scope(classes, schoolId, input.classId)).get());
      return db.insert(sections).values({ ...input, schoolId, id }).returning().get();
    },
    update: (schoolId, id, input) => {
      found(db.select().from(classes).where(scope(classes, schoolId, input.classId)).get());
      return found(db.update(sections).set(input).where(scope(sections, schoolId, id)).returning().get());
    },
    remove: (schoolId, id) => { db.delete(sections).where(scope(sections, schoolId, id)).run(); },
  });
  registerResource(app, db, auth, 'subjects', SaveSubjectSchema, {
    list: (schoolId) => db.select().from(subjects).where(scope(subjects, schoolId)).all(),
    read: (schoolId, id) => db.select().from(subjects).where(scope(subjects, schoolId, id)).get(),
    create: (schoolId, id, input) => {
      found(db.select().from(classes).where(scope(classes, schoolId, input.classId)).get());
      return db.insert(subjects).values({ ...input, schoolId, id }).returning().get();
    },
    update: (schoolId, id, input) => {
      found(db.select().from(classes).where(scope(classes, schoolId, input.classId)).get());
      return found(db.update(subjects).set(input).where(scope(subjects, schoolId, id)).returning().get());
    },
    remove: (schoolId, id) => { db.delete(subjects).where(scope(subjects, schoolId, id)).run(); },
  });

  const readOptions = { preHandler: requireRole('admin', 'teacher') };
  app.get('/sections', readOptions, async (request) => {
    const { school, profile } = requireAuth(request);
    const assigned = db.select({ id: teacherAssignments.sectionId }).from(teacherAssignments).where(and(
      eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id),
    ));
    return db.select().from(sections).where(and(scope(sections, school.id),
      profile.role === 'teacher' ? inArray(sections.id, assigned) : undefined,
    )).all().map((row) => SectionSchema.parse(row));
  });
  app.get('/sections/:id', readOptions, async (request) => {
    const { id } = parseInput(ResourceParamsSchema, request.params);
    return SectionSchema.parse(readSection(db, request, id));
  });
  app.get('/classes', readOptions, async (request) => {
    const { school, profile } = requireAuth(request);
    const assigned = db.select({ id: teacherAssignments.classId }).from(teacherAssignments).where(and(
      eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id),
    ));
    return db.select().from(classes).where(and(scope(classes, school.id),
      profile.role === 'teacher' ? inArray(classes.id, assigned) : undefined,
    )).all().map((row) => ClassSchema.parse(row));
  });
  app.get('/classes/:id', readOptions, async (request) => {
    const { id } = parseInput(ResourceParamsSchema, request.params);
    const { school, profile } = requireAuth(request);
    if (profile.role === 'teacher') found(db.select().from(teacherAssignments).where(and(
      eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id),
      eq(teacherAssignments.classId, id),
    )).get());
    return ClassSchema.parse(found(db.select().from(classes).where(scope(classes, school.id, id)).get()));
  });
  app.get('/subjects', readOptions, async (request) => {
    const { school, profile } = requireAuth(request);
    const assigned = db.select({ id: teacherAssignments.subjectId }).from(teacherAssignments).where(and(
      eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id),
    ));
    return db.select().from(subjects).where(and(scope(subjects, school.id),
      profile.role === 'teacher' ? inArray(subjects.id, assigned) : undefined,
    )).all().map((row) => SubjectSchema.parse(row));
  });
  app.get('/academic-years', readOptions, async (request) => {
    const { school, profile } = requireAuth(request);
    const assigned = db.select({ id: classes.academicYearId }).from(classes)
      .innerJoin(teacherAssignments, and(eq(teacherAssignments.classId, classes.id), eq(teacherAssignments.schoolId, classes.schoolId)))
      .where(and(eq(teacherAssignments.schoolId, school.id), eq(teacherAssignments.teacherProfileId, profile.id)));
    return db.select().from(academicYears).where(and(scope(academicYears, school.id),
      profile.role === 'teacher' ? inArray(academicYears.id, assigned) : undefined,
    )).all().map((row) => AcademicYearSchema.parse(row));
  });
}
