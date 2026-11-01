import { expect, it } from 'vitest';
import { seedDemo } from '../src/db/demo.ts';
import { ensureNotebookDemo } from '../src/db/notebook-seed.ts';
import { seedPhase4 } from '../src/db/seed-phase4.ts';
import { openDatabase } from '../src/db/index.ts';
import { gameCheckpointMap } from '../src/db/schema-phase4.ts';
import { concepts, items } from '../src/db/schema.ts';
import { PASSWORD, PIN } from './helpers.ts';

it('maps only matching game concepts, preserving all existing content on reruns', async () => {
  const database = openDatabase(':memory:');
  try {
    const now = Date.UTC(2026, 10, 1);
    await seedDemo(database.db, { password: PASSWORD, pin: PIN }, now, { rich: true });
    const school = database.sqlite.prepare('SELECT id FROM school LIMIT 1').get() as { id: string };
    ensureNotebookDemo(database.db, school.id, now);
    const before = database.db.select().from(items).all();
    await seedPhase4(database, () => now);
    const mappings = database.db.select().from(gameCheckpointMap).all();
    expect(mappings).toHaveLength(36);
    const seeded = database.db.select().from(items).all();
    expect(seeded).toEqual(expect.arrayContaining(before));
    const conceptRows = database.db.select().from(concepts).all();
    for (const mapping of mappings) {
      expect(['motion', 'cell', 'poly', 'newton', 'matter', 'float', 'sound', 'energy', 'graphs']).toContain(mapping.gameId);
      expect(mapping.checkpointKey).not.toMatch(/^q\d+$/);
      const item = database.db.select().from(items).all().find((row) => row.id === mapping.itemId)!;
      expect(item.conceptId).toBe(mapping.conceptId);
      expect(item.schoolId).toBe(mapping.schoolId);
      expect(conceptRows.find((row) => row.id === mapping.conceptId)?.chapterId).toBe(item.chapterId);
      if (mapping.gameId === 'cell') expect(['Plasma membrane', 'Osmosis', 'Diffusion', 'Mitochondria'])
        .toContain(conceptRows.find((row) => row.id === mapping.conceptId)?.title);
      if (mapping.gameId === 'poly') expect(['Degree of a polynomial', 'Zero of a polynomial', 'Value of a polynomial', 'Factor theorem'])
        .toContain(conceptRows.find((row) => row.id === mapping.conceptId)?.title);
    }
    await seedPhase4(database, () => now + 86_400_000);
    expect(database.db.select().from(gameCheckpointMap).all()).toEqual(mappings);
    expect(database.db.select().from(items).all()).toEqual(seeded);
  } finally { database.sqlite.close(); }
});
