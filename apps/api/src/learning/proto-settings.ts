import { dirname, resolve } from 'node:path';
import type { Database } from '../db/index.ts';
import { backupDatabase } from '../db/backup.ts';

export async function prepareLearningSettings({ sqlite }: Database) {
  if (sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='proto_founder_settings'").get()) return;
  if (sqlite.name && sqlite.name !== ':memory:') await backupDatabase(sqlite.name, resolve(dirname(sqlite.name), 'backups'));
  sqlite.exec(`CREATE TABLE IF NOT EXISTS proto_founder_settings (
    school_id TEXT PRIMARY KEY, gemini_key TEXT NOT NULL, gemini_model TEXT NOT NULL, updated_at INTEGER NOT NULL
  )`);
}

/** Server-only credentials, scoped to the administrator's school. */
export function learningSettings({ sqlite }: Database, schoolId: string) {
  return sqlite.prepare('SELECT gemini_key,gemini_model FROM proto_founder_settings WHERE school_id=?').get(schoolId) as
    { gemini_key: string; gemini_model: string } | undefined;
}
