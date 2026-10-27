import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { generateClaimCode } from '@vidhyasaathy/core/claim';
import Database from 'better-sqlite3';
import type { Role } from '@vidhyasaathy/contracts';

function open(databasePath: string): Database.Database {
  const db = new Database(databasePath);
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  return db;
}

export function seedClaim(databasePath: string, schoolId: string, name: string): { profileId: string; code: string } {
  const db = open(databasePath);
  const now = Date.now();
  const userId = randomUUID();
  const profileId = randomUUID();
  const code = generateClaimCode();
  const codeHash = createHash('sha256').update(code).digest('hex');
  db.transaction(() => {
    db.prepare('INSERT INTO "user" (id, created_at) VALUES (?, ?)').run(userId, now);
    db.prepare('INSERT INTO profile (id, user_id, school_id, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(profileId, userId, schoolId, name, 'student', now);
    db.prepare('INSERT INTO claim_code (id, code_hash, school_id, profile_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(randomUUID(), codeHash, schoolId, profileId, now + 86400000, now);
  })();
  db.close();
  return { profileId, code };
}

export function seedLinkedParent(databasePath: string, schoolId: string, name: string, studentProfileId: string): string {
  const db = open(databasePath);
  const now = Date.now();
  const userId = randomUUID();
  const profileId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  db.transaction(() => {
    db.prepare('INSERT INTO "user" (id, created_at) VALUES (?, ?)').run(userId, now);
    db.prepare('INSERT INTO profile (id, user_id, school_id, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(profileId, userId, schoolId, name, 'parent', now);
    db.prepare('INSERT INTO session (token_hash, profile_id, school_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(tokenHash, profileId, schoolId, now + 604800000, now);
    db.prepare('INSERT INTO parent_link (id, school_id, parent_profile_id, student_profile_id) VALUES (?, ?, ?, ?)').run(randomUUID(), schoolId, profileId, studentProfileId);
  })();
  db.close();
  return token;
}

export function seedRoleSession(databasePath: string, schoolId: string, role: Extract<Role, 'teacher' | 'parent'>, name: string): string {
  const db = open(databasePath);
  const now = Date.now();
  const userId = randomUUID();
  const profileId = randomUUID();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  db.transaction(() => {
    db.prepare('INSERT INTO "user" (id, created_at) VALUES (?, ?)').run(userId, now);
    db.prepare('INSERT INTO profile (id, user_id, school_id, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(profileId, userId, schoolId, name, role, now);
    db.prepare('INSERT INTO session (token_hash, profile_id, school_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(tokenHash, profileId, schoolId, now + 604800000, now);
  })();
  db.close();
  return token;
}
