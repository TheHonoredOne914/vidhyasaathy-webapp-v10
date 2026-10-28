import { openDatabase } from './index.ts';
import { demoLogins, resetDemoLogins, seedDemo } from './demo.ts';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  const logins = demoLogins(database.db, process.env.DEMO_PASSWORD, process.env.DEMO_PIN);
  console.info(logins);
  const { mkdir, writeFile } = await import('node:fs/promises');
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const scriptsDir = resolve(repoRoot, 'scripts');
  await mkdir(scriptsDir, { recursive: true });
  await writeFile(resolve(scriptsDir, 'DEMO_LOGINS.md'), `# Demo logins\n\n\`\`\`text\n${logins}\n\`\`\`\n`, 'utf8');
} finally {
  database.close();
}
