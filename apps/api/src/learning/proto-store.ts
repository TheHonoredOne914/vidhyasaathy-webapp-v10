import { dirname, resolve } from 'node:path';
import type { Database } from '../db/index.ts';
import { backupDatabase } from '../db/backup.ts';
import type { LearningPlan } from '@vidhyasaathy/contracts';

export type StudySession = { id: string; school_id: string; profile_id: string; chapter_id: string; plan: string; created_at: number; updated_at: number };

export async function prepareLearningStore(database: Database) {
  const { sqlite } = database;
  if (sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='proto_study_session'").get()) return;
  // Online backup includes WAL pages and is completed before additive DDL.
  if (sqlite.name !== ':memory:' && sqlite.name) await backupDatabase(sqlite.name, resolve(dirname(sqlite.name), 'backups'));
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS proto_learning_plan (
      id TEXT PRIMARY KEY, school_id TEXT NOT NULL, profile_id TEXT NOT NULL, chapter_id TEXT NOT NULL, plan TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS proto_study_session (
      id TEXT PRIMARY KEY, school_id TEXT NOT NULL, profile_id TEXT NOT NULL, chapter_id TEXT NOT NULL,
      plan TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS proto_study_owner ON proto_study_session(school_id,profile_id,chapter_id,updated_at);
    CREATE TABLE IF NOT EXISTS proto_learning_event (
      id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES proto_study_session(id), type TEXT NOT NULL,
      concept_id TEXT NOT NULL, ts TEXT NOT NULL, result TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS proto_event_session ON proto_learning_event(session_id,ts);
  `);
}

export function sessionPlan(session: StudySession): LearningPlan { return JSON.parse(session.plan) as LearningPlan; }
