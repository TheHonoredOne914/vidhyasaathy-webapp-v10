import { and, eq } from 'drizzle-orm';
import { SaveItemSchema } from '@vidhyasaathy/contracts';
import type { Database } from './index.ts';
import { gameCheckpointMap } from './schema-phase4.ts';
import { items, concepts, chapters } from './schema.ts';

export async function seedPhase4(database: Database, _now: () => number) {
  const { db } = database;
  // Missing bank coverage stays unavailable; never borrow unrelated questions.
  const checkpoints = [
    ['motion', 'motion.speed', 'Motion', 'Speed & Velocity'],
    ['motion', 'motion.acceleration', 'Motion', 'Acceleration'],
    ['cell', 'cell-membrane-selective-permeability', 'The Fundamental Unit of Life', 'Plasma membrane'],
    ['cell', 'osmosis-hypotonic', 'The Fundamental Unit of Life', 'Osmosis'],
    ['poly', 'poly.degree', 'Polynomials', 'Degree of a polynomial'],
    ['poly', 'poly.zeroes', 'Polynomials', 'Zero of a polynomial'],
  ] as const;
  for (const [gameId, checkpointKey, chapterTitle, conceptTitle] of checkpoints) {
    const matches = db.select({ concept: concepts }).from(concepts).innerJoin(chapters,
      and(eq(chapters.id, concepts.chapterId), eq(chapters.schoolId, concepts.schoolId)))
      .where(and(eq(chapters.title, chapterTitle), eq(concepts.title, conceptTitle))).all();
    for (const { concept } of matches) {
      const candidates = db.select().from(items).where(and(eq(items.schoolId, concept.schoolId),
        eq(items.chapterId, concept.chapterId), eq(items.conceptId, concept.id))).all();
      const item = candidates.find((row) => {
        const parsed = SaveItemSchema.safeParse(row.content);
        return parsed.success && parsed.data.type === 'mcq' && parsed.data.options.length <= 4;
      });
      if (!item) continue;
      db.insert(gameCheckpointMap).values({ schoolId: concept.schoolId, gameId, checkpointKey,
        conceptId: concept.id, itemId: item.id }).onConflictDoNothing().run();
    }
  }
}
