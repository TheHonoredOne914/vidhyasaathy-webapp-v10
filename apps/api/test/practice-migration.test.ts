import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import Sqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { expect, it } from 'vitest';
import * as schema from '../src/db/schema.ts';

it('upgrades populated P6 attempts, preserving FKs, events, uniqueness and dashboard triggers', () => {
  const sqlite = new Sqlite(':memory:');
  try {
    sqlite.pragma('foreign_keys = ON');
    const migrationsFolder = resolve(import.meta.dirname, '../drizzle');
    sqlite.exec('CREATE TABLE __drizzle_migrations (id INTEGER PRIMARY KEY, hash TEXT NOT NULL, created_at NUMERIC)');
    for (const migration of readMigrationFiles({ migrationsFolder }).slice(0, 9)) {
      for (const statement of migration.sql) sqlite.exec(statement);
      sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(migration.hash, migration.folderMillis);
    }
    const db = drizzle(sqlite, { schema });
    // seedDemo writes today's columns (recordings_allowed, note type, source_class). Those do not exist until 0010/0011.
    const schoolId = randomUUID();
    const studentUserId = randomUUID();
    const teacherUserId = randomUUID();
    const teacherId = randomUUID();
    const yearId = randomUUID();
    const classId = randomUUID();
    const sectionId = randomUUID();
    const subjectId = randomUUID();
    const chapterId = randomUUID();
    const conceptId = randomUUID();
    const itemId = randomUUID();
    const seededAssignmentId = randomUUID();
    sqlite.prepare('INSERT INTO school (id, name, created_at) VALUES (?, ?, ?)').run(schoolId, 'Practice migration school', 1);
    db.insert(schema.users).values([{ id: studentUserId, createdAt: 1 }, { id: teacherUserId, createdAt: 1 }]).run();
    db.insert(schema.academicYears).values({ id: yearId, schoolId, name: '2026', startsOn: '2026-04-01', endsOn: '2027-03-31' }).run();
    db.insert(schema.classes).values({ id: classId, schoolId, academicYearId: yearId, name: '6' }).run();
    db.insert(schema.sections).values({ id: sectionId, schoolId, classId, name: 'A' }).run();
    db.insert(schema.subjects).values({ id: subjectId, schoolId, classId, name: 'Maths' }).run();
    db.insert(schema.profiles).values([
      { id: teacherId, userId: teacherUserId, schoolId, name: 'Teacher', role: 'teacher', createdAt: 1 },
      { id: randomUUID(), userId: studentUserId, schoolId, name: 'Student', role: 'student', sectionId, rollNumber: '1', createdAt: 1 },
    ]).run();
    db.insert(schema.chapters).values({ id: chapterId, schoolId, subjectId, title: 'Fractions', position: 0 }).run();
    sqlite.prepare('INSERT INTO concept (id, school_id, chapter_id, title, description) VALUES (?, ?, ?, ?, ?)').run(conceptId, schoolId, chapterId, 'Halves', 'Equal parts');
    const content = { type: 'mcq' as const, conceptId, prompt: 'Choose half', options: ['half', 'third'], answer: 'half', difficulty: 1, sourceRef: null };
    db.insert(schema.items).values({ id: itemId, schoolId, chapterId, conceptId, position: 0, content }).run();
    db.insert(schema.assignments).values({
      id: seededAssignmentId, schoolId, chapterId, sectionId, teacherId, title: 'Fractions', kind: 'homework',
      dueAt: 10, status: 'published', publishedAt: 1, updatedAt: 1,
    }).run();
    db.insert(schema.assignmentItems).values({ assignmentId: seededAssignmentId, itemId, schoolId, chapterId, position: 0 }).run();
    const profileId = db.select().from(schema.profiles).all().find((row) => row.role === 'student')!.id;
    const assignmentId = db.select().from(schema.assignments).get()!.id;
    const fracChapter = db.select().from(schema.chapters).all().find((row) => row.title === 'Fractions')!;
    const item = db.select().from(schema.items).all().find((row) => row.position === 0 && row.chapterId === fracChapter.id)!;
    const row = db.insert(schema.attempts).values({ id: randomUUID(), clientEventId: randomUUID(), schoolId,
      profileId, assignmentId, itemId: item.id, conceptId: item.conceptId, answer: 'Yes', correct: true, needsReview: false,
      timeMs: 1, clientTs: 1, serverTs: 1, updatedAt: 1 }).returning().get()!;
    migrate(db, { migrationsFolder }); migrate(db, { migrationsFolder });
    expect(db.select().from(schema.attempts).get()).toEqual(row);
    expect(() => db.insert(schema.attempts).values({ ...row, id: randomUUID(), clientEventId: randomUUID() }).run()).toThrow();
    sqlite.exec('UPDATE dashboard_job SET dirty = 0');
    const optional = { ...row, id: randomUUID(), clientEventId: randomUUID(), assignmentId: null };
    db.insert(schema.attempts).values(optional).run();
    db.insert(schema.attempts).values({ ...optional, id: randomUUID(), clientEventId: randomUUID() }).run();
    expect(sqlite.prepare('SELECT dirty FROM dashboard_job').get()).toEqual({ dirty: 1 });
    expect(() => db.insert(schema.attempts).values({ ...optional, id: randomUUID() }).run()).toThrow();
    expect(() => db.insert(schema.attempts).values({ ...optional, id: randomUUID(), clientEventId: randomUUID(), profileId: randomUUID() }).run()).toThrow();
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
    expect(sqlite.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger' AND tbl_name = 'attempt'").all()).toHaveLength(3);
  } finally { sqlite.close(); }
});

