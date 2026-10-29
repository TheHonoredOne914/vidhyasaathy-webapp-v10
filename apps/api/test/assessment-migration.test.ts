import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import Sqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { expect, it } from 'vitest';
import * as schema from '../src/db/schema.ts';

it('upgrades populated P3 items without losing session content or progress, and is repeatable', () => {
  const sqlite = new Sqlite(':memory:');
  try {
    sqlite.pragma('foreign_keys = ON');
    const migrationsFolder = resolve(import.meta.dirname, '../drizzle');
    sqlite.exec('CREATE TABLE __drizzle_migrations (id INTEGER PRIMARY KEY, hash TEXT NOT NULL, created_at NUMERIC)');
    for (const migration of readMigrationFiles({ migrationsFolder }).slice(0, 4)) {
      for (const statement of migration.sql) sqlite.exec(statement);
      sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(migration.hash, migration.folderMillis);
    }
    const db = drizzle(sqlite, { schema });
    const schoolId = randomUUID(); const userId = randomUUID(); const profileId = randomUUID();
    const yearId = randomUUID(); const classId = randomUUID(); const sectionId = randomUUID();
    const subjectId = randomUUID(); const chapterId = randomUUID(); const conceptId = randomUUID();
    const sessionId = randomUUID(); const itemId = randomUUID();
    // Later migrations add recordings_allowed, source_class and last_review. Seed only columns that exist after 0003.
    sqlite.prepare('INSERT INTO school (id, name, created_at) VALUES (?, ?, ?)').run(schoolId, 'Migration test school', 1);
    db.insert(schema.users).values({ id: userId, createdAt: 1 }).run();
    sqlite.prepare('INSERT INTO profile (id, user_id, school_id, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(profileId, userId, schoolId, 'Migration student', 'student', 1);
    db.insert(schema.academicYears).values({ id: yearId, schoolId, name: '2026', startsOn: '2026-04-01', endsOn: '2027-03-31' }).run();
    db.insert(schema.classes).values({ id: classId, schoolId, academicYearId: yearId, name: '6' }).run();
    db.insert(schema.sections).values({ id: sectionId, schoolId, classId, name: 'A' }).run();
    db.insert(schema.subjects).values({ id: subjectId, schoolId, classId, name: 'Maths' }).run();
    db.insert(schema.chapters).values({ id: chapterId, schoolId, subjectId, title: 'Fractions', position: 0 }).run();
    sqlite.prepare('INSERT INTO concept (id, school_id, chapter_id, title, description) VALUES (?, ?, ?, ?, ?)').run(conceptId, schoolId, chapterId, 'Halves', 'Equal parts');
    db.insert(schema.learningSessions).values({ id: sessionId, schoolId, chapterId, sectionId, title: 'Halves',
      status: 'published', releaseAt: 1, updatedAt: 1 }).run();
    const content = { type: 'mcq' as const, conceptId, prompt: 'Choose half', options: ['half', 'third'],
      answer: 'half', difficulty: 1, sourceRef: null };
    db.insert(schema.items).values({ id: itemId, schoolId, chapterId, sessionId, conceptId, position: 0, content }).run();
    sqlite.prepare('INSERT INTO session_progress (session_id, profile_id, school_id, viewed_slides, check_submitted_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)').run(sessionId, profileId, schoolId, 1, 2, 2);
    migrate(db, { migrationsFolder });
    migrate(db, { migrationsFolder });
    expect(db.select().from(schema.items).all()).toEqual([{ id: itemId, schoolId, chapterId, sessionId, conceptId, position: 0, content }]);
    expect(db.select().from(schema.sessionProgress).all()).toEqual([{ sessionId, schoolId, profileId,
      viewedSlides: 1, checkSubmittedAt: 2, completedAt: 2, lastReview: null }]);
    db.insert(schema.items).values({ id: randomUUID(), schoolId, chapterId, conceptId, position: 0, content }).run();
    expect(db.select().from(schema.items).all()).toHaveLength(2);
    for (const table of [schema.assignments, schema.assignmentItems, schema.attempts, schema.studentConceptStates, schema.syncChanges]) {
      expect(db.select().from(table).all()).toEqual([]);
    }
    expect(sqlite.pragma('foreign_key_check')).toEqual([]);
  } finally {
    sqlite.close();
  }
});

