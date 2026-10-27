import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { verifyCredential } from '../src/auth/security.ts';
import { backupDatabase } from '../src/db/backup.ts';
import { seedDemo, DEMO_SCHOOL_ID } from '../src/db/demo.ts';
import { openDatabase } from '../src/db/index.ts';
import { attempts, parentLinks, profiles, schools, teacherAssignments, users } from '../src/db/schema.ts';
import { PASSWORD, PIN } from './helpers.ts';

it('seeds only a labelled demo, hashes credentials, links all four roles and never resets progress', async () => {
  const database = openDatabase(':memory:');
  try {
    await expect(seedDemo(database.db, { password: 'short', pin: PIN })).rejects.toThrow();
    expect(database.db.select().from(schools).all()).toEqual([]);
    expect(await seedDemo(database.db, { password: PASSWORD, pin: PIN })).toEqual({ schoolId: DEMO_SCHOOL_ID, created: true });
    const before = database.db.select().from(users).all();
    for (const row of before) {
      if (row.passwordHash) expect(await verifyCredential(row.passwordHash, PASSWORD)).toBe(true);
      if (row.pinHash) expect(await verifyCredential(row.pinHash, PIN)).toBe(true);
    }
    expect(database.db.select().from(profiles).all().map((row) => row.role).sort()).toEqual(['admin', 'parent', 'student', 'teacher']);
    expect(database.db.select().from(parentLinks).all()).toHaveLength(1);
    expect(database.db.select().from(teacherAssignments).all()).toHaveLength(2);
    expect(database.db.select().from(attempts).all()).toEqual([]);
    expect(await seedDemo(database.db, { password: `${PASSWORD}!`, pin: '9876' })).toEqual({ schoolId: DEMO_SCHOOL_ID, created: false });
    expect(database.db.select().from(users).all()).toEqual(before);
  } finally { database.close(); }
});

it('backs up committed WAL data and restores with integrity intact without altering the source', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'vs-p7-backup-'));
  const database = openDatabase(join(directory, 'source.sqlite'));
  try {
    database.sqlite.pragma('wal_autocheckpoint = 0');
    await seedDemo(database.db, { password: PASSWORD, pin: PIN });
    const filename = await backupDatabase(join(directory, 'source.sqlite'), join(directory, 'backups'));
    const restored = openDatabase(filename);
    try {
      expect(restored.db.select().from(schools).all()).toEqual(database.db.select().from(schools).all());
      expect(restored.db.select().from(users).all()).toEqual(database.db.select().from(users).all());
      expect(restored.sqlite.pragma('integrity_check', { simple: true })).toBe('ok');
      expect(restored.sqlite.pragma('foreign_key_check')).toEqual([]);
    } finally { restored.close(); }
    await expect(backupDatabase(join(directory, 'missing.sqlite'), directory)).rejects.toThrow();
    await expect(backupDatabase(':memory:', directory)).rejects.toThrow();
  } finally { database.close(); await rm(directory, { recursive: true, force: true }); }
});
