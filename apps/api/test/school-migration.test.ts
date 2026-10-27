import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import Sqlite from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { describe, expect, it } from 'vitest';
import { hashToken } from '../src/auth/security.ts';
import * as schema from '../src/db/schema.ts';

describe('school setup migration', () => {
  it('upgrades populated P1 databases without losing profiles, codes or sessions and is repeatable', () => {
    const sqlite = new Sqlite(':memory:');
    try {
      sqlite.pragma('foreign_keys = ON');
      const migrationsFolder = resolve(import.meta.dirname, '../drizzle');
      const baseline = readMigrationFiles({ migrationsFolder })[0];
      if (!baseline) throw new Error('Missing P1 migration.');
      for (const statement of baseline.sql) sqlite.exec(statement);
      sqlite.exec('CREATE TABLE __drizzle_migrations (id INTEGER PRIMARY KEY, hash TEXT NOT NULL, created_at NUMERIC)');
      sqlite.prepare('INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)').run(baseline.hash, baseline.folderMillis);
      const schoolId = randomUUID();
      const userId = randomUUID();
      const profileId = randomUUID();
      const codeHash = hashToken('P1 test claim code');
      const tokenHash = hashToken('P1 test session');
      sqlite.prepare('INSERT INTO school (id, name, created_at) VALUES (?, ?, ?)').run(schoolId, 'Test school', 1);
      sqlite.prepare('INSERT INTO user (id, created_at) VALUES (?, ?)').run(userId, 1);
      sqlite.prepare('INSERT INTO profile (id, user_id, school_id, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(profileId, userId, schoolId, 'Test student', 'student', 1);
      sqlite.prepare('INSERT INTO claim_code (id, code_hash, school_id, profile_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(randomUUID(), codeHash, schoolId, profileId, 9999999999999, 1);
      sqlite.prepare('INSERT INTO session (token_hash, profile_id, school_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(tokenHash, profileId, schoolId, 9999999999999, 1);
      const db = drizzle(sqlite, { schema });
      migrate(db, { migrationsFolder });
      migrate(db, { migrationsFolder });
      expect(db.select().from(schema.profiles).all()).toEqual([
        expect.objectContaining({ id: profileId, schoolId, sectionId: null, rollNumber: null }),
      ]);
      expect(db.select().from(schema.claimCodes).all()).toEqual([
        expect.objectContaining({ profileId, codeHash, encryptedCode: null }),
      ]);
      expect(db.select().from(schema.sessions).all()).toEqual([expect.objectContaining({ profileId, tokenHash })]);
      expect(db.select().from(schema.invitations).all()).toEqual([]);
      for (const table of [schema.chapters, schema.concepts, schema.conceptPrereqs, schema.notes,
        schema.noteConcepts, schema.learningSessions, schema.slides, schema.items, schema.sessionProgress]) {
        expect(db.select().from(table).all()).toEqual([]);
      }
      expect(sqlite.pragma('foreign_key_check')).toEqual([]);
    } finally {
      sqlite.close();
    }
  });
});
