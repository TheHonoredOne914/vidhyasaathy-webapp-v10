import { eq } from 'drizzle-orm';
import type { GameRegistryEntry } from '@vidhyasaathy/contracts';
import type { Db } from '../db/index.ts';
import { chapters, concepts } from '../db/schema.ts';
import { gameCheckpointMap } from '../db/schema-phase4.ts';
import { GAME_TITLES } from '../routes/games.ts';

// Audited against apps/web/src/games/engine/registry.ts and ported/*.tsx.
// No final.html exists in this checkout, so it is not advertised as playable.
const chapterNames: Record<string, RegExp> = {
  motion: /^motion$/i, 'chotu-motion': /^motion$/i, newton: /force and laws/i, 'force-series': /force and laws/i,
  matter: /matter in our surroundings/i, cell: /fundamental unit|cell/i, float: /gravitation/i, sound: /^sound$/i,
  energy: /work and energy/i, poly: /polynomial/i, graphs: /coordinate geometry|cartesian/i,
  atom: /structure of the atom/i, 'maths-war': /number systems/i, circleverse: /^circles$/i,
  tinker: /what is democracy|why democracy/i, 'quill-blade': /^wind$/i, 'optics-lab': /light/i,
  mixtures: /is matter around us pure/i, tissues: /^tissues$/i, linear: /linear equations in two variables/i,
};

export function gameRegistry(db: Db, schoolId: string): GameRegistryEntry[] {
  const catalog = db.select().from(chapters).where(eq(chapters.schoolId, schoolId)).all();
  const ideas = db.select().from(concepts).where(eq(concepts.schoolId, schoolId)).all();
  const mappings = db.select().from(gameCheckpointMap).where(eq(gameCheckpointMap.schoolId, schoolId)).all();
  return Object.entries(GAME_TITLES).flatMap(([id, title]) => {
    const mapped = mappings.filter((row) => row.gameId === id);
    const chapterIds = new Set(mapped.flatMap((row) => ideas.filter((idea) => idea.id === row.conceptId).map((idea) => idea.chapterId)));
    const matches = catalog.filter((chapter) => chapterIds.has(chapter.id) || chapterNames[id]?.test(chapter.title));
    return matches.map((chapter) => {
      const conceptIds = [...new Set(mapped.filter((row) => ideas.some((idea) => idea.id === row.conceptId && idea.chapterId === chapter.id)).map((row) => row.conceptId))];
      return { id, title, subjectId: chapter.subjectId, chapterId: chapter.id,
        conceptIds: conceptIds.length ? conceptIds : ideas.filter((idea) => idea.chapterId === chapter.id && (idea.sourceClass == null || idea.sourceClass >= 9)).map((idea) => idea.id),
        route: id === 'atom' ? '/student/games/atom' : `/student/chapters/${chapter.id}/practice/engine/${id}`,
        description: `Explore ${chapter.title} with ${title}.`, difficulty: 'introductory' as const,
        available: mapped.some((row) => ideas.some((idea) => idea.id === row.conceptId && idea.chapterId === chapter.id)) };
    });
  });
}
