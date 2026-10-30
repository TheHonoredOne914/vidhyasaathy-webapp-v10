import { resolve } from 'node:path';
import { openDatabase } from '../api/src/db/index.ts';
import { backfillStreaks } from '../api/src/daily/backfill.ts';

const databasePath = process.env.DATABASE_PATH ?? resolve(import.meta.dirname, '../api/data/vidhyasaathy.db');
const database = openDatabase(databasePath);
try {
  const result = backfillStreaks(database.db, Date.now());
  console.info(`Backfilled ${result.touches} streak days across ${result.profiles} students.`);
} finally {
  database.close();
}
