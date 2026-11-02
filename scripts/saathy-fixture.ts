import { existsSync } from 'node:fs';
import { openDatabase } from '../apps/api/src/db/index.ts';
import { seedDemo, ensureDemoStudents, applyDemoAccess, DEMO_SCHOOL_ID } from '../apps/api/src/db/demo.ts';
import { ensureNotebookDemo } from '../apps/api/src/db/notebook-seed.ts';
import { ensureDailyLoop } from '../apps/api/src/db/daily-seed.ts';
import { seedPhase4 } from '../apps/api/src/db/seed-phase4.ts';

const target = process.env.DATABASE_PATH;
if (!target?.endsWith('saathy-browser.db') || existsSync(target)) throw new Error('QA fixture requires a new, dedicated saathy-browser.db file.');
const database = openDatabase(target);
try {
  await seedDemo(database.db, { password: 'Saathy@2026!', pin: '2468' }, Date.now(), { rich: true });
  await ensureDemoStudents(database.db, '2468', Date.now());
  ensureDailyLoop(database.db, DEMO_SCHOOL_ID, Date.now());
  ensureNotebookDemo(database.db, DEMO_SCHOOL_ID, Date.now());
  await seedPhase4(database, Date.now);
  await applyDemoAccess(database.db);
  console.info('Created an isolated Saathy browser fixture. Existing databases unchanged.');
} finally { database.close(); }
