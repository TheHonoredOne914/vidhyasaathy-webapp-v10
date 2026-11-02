import { openDatabase } from './index.ts';
import { ensureDemoStory } from './demo-bootstrap.ts';
import { ensureDailyLoop } from './daily-seed.ts';
import { seedPhase4 } from './seed-phase4.ts';
import { ensureNotebookDemo } from './notebook-seed.ts';
import { applyDemoAccess, canonicalDemoLogins, DEMO_SCHOOL_ID, ensureDemoStudents, resetDemoLogins, seedDemo } from './demo.ts';

if (process.env.NODE_ENV === 'production' || process.env.DEMO_SEED !== 'true') {
  throw new Error('Demo seeding requires DEMO_SEED=true and a non-production environment.');
}
if (!process.env.DEMO_PASSWORD || !process.env.DEMO_PIN) throw new Error('Set DEMO_PASSWORD and DEMO_PIN explicitly.');
const database = openDatabase(process.env.DATABASE_PATH ?? './data/vidhyasaathy.db');
try {
  const result = await seedDemo(database.db, { password: process.env.DEMO_PASSWORD, pin: process.env.DEMO_PIN }, Date.now(), { rich: true });
  if (!result.created && process.env.DEMO_RESET_LOGINS === 'true') {
    const count = await resetDemoLogins(database.db, process.env.DEMO_PASSWORD);
    console.info(`Demo school already exists; reset ${count} staff passwords to DEMO_PASSWORD (PINs and progress unchanged).`);
  } else {
    console.info(result.created ? 'Created Demo school.' : 'Demo school already exists; credentials unchanged (set DEMO_RESET_LOGINS=true to reset staff passwords).');
  }
  await ensureDemoStudents(database.db, process.env.DEMO_PIN, Date.now());
  ensureDailyLoop(database.db, DEMO_SCHOOL_ID, Date.now());
  ensureNotebookDemo(database.db, DEMO_SCHOOL_ID, Date.now());
  await seedPhase4(database, Date.now);
  await applyDemoAccess(database.db);
  await ensureDemoStory(database, Date.now());
  const logins = canonicalDemoLogins();
  console.info(logins);
} finally {
  database.close();
}
