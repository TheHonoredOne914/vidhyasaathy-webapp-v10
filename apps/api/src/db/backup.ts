import { randomUUID } from 'node:crypto';
import { chmod, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

// SQLite's online backup includes committed WAL pages; copying the .db file does not.
export async function backupDatabase(source: string, directory: string) {
  if (!source || source === ':memory:' || !directory) throw new Error('A database file and backup directory are required.');
  const db = new Database(resolve(source), { readonly: true, fileMustExist: true });
  const filename = resolve(directory, `vidhyasaathy-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.sqlite`);
  try {
    await mkdir(resolve(directory), { recursive: true, mode: 0o700 });
    await db.backup(filename);
    await chmod(filename, 0o600);
    const copy = new Database(filename, { readonly: true, fileMustExist: true });
    try {
      if (copy.pragma('integrity_check', { simple: true }) !== 'ok' || (copy.pragma('foreign_key_check') as unknown[]).length !== 0) {
        throw new Error('Backup integrity check failed.');
      }
    } finally {
      copy.close();
    }
    return filename;
  } catch (error) {
    await rm(filename, { force: true });
    throw error;
  } finally {
    db.close();
  }
}
