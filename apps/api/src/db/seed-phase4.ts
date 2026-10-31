import type { Database } from './index.ts';
import { gameCheckpointMap } from './schema-phase4.ts';
import { items, concepts, chapters, subjects, sections, profiles } from './schema.ts';

export async function seedPhase4(database: Database, now: () => number) {
  const { db } = database;
  const schoolId = db.select({ id: subjects.schoolId }).from(subjects).limit(1).get()?.schoolId;
  if (!schoolId) return;
  
  const conceptRows = db.select().from(concepts).where(concepts.schoolId.eq(schoolId)).all();
  const itemRows = db.select().from(items).where(items.schoolId.eq(schoolId)).all();
  
  if (conceptRows.length === 0 || itemRows.length === 0) return;
  
  const conceptByTitle = new Map(conceptRows.map((c) => [c.title, c]));
  const itemsByConcept = new Map<string, typeof itemRows>();
  for (const item of itemRows) {
    const arr = itemsByConcept.get(item.conceptId) ?? [];
    arr.push(item);
    itemsByConcept.set(item.conceptId, arr);
  }
  
  const gameCheckpoints: Record<string, { conceptTitle: string; keys: string[] }> = {
    motion: { conceptTitle: 'Speed & Velocity', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    graphs: { conceptTitle: 'Distance-time graphs', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    newton: { conceptTitle: 'Uniform and non-uniform motion', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    energy: { conceptTitle: 'Speed & Velocity', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    matter: { conceptTitle: 'Distance & Displacement', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    float: { conceptTitle: 'Speed & Velocity', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    cell: { conceptTitle: 'One half', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    poly: { conceptTitle: 'Equal parts', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    engine: { conceptTitle: 'Distance & Displacement', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    arena: { conceptTitle: 'Speed & Velocity', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
    sound: { conceptTitle: 'Distance-time graphs', keys: ['q1', 'q2', 'q3', 'q4', 'q5'] },
  };
  
  for (const [gameId, { conceptTitle, keys }] of Object.entries(gameCheckpoints)) {
    const concept = conceptByTitle.get(conceptTitle);
    if (!concept) {
      console.log(`Concept not found: ${conceptTitle}`);
      continue;
    }
    
    const conceptItems = itemsByConcept.get(concept.id);
    if (!conceptItems || conceptItems.length === 0) {
      console.log(`No items for concept: ${conceptTitle} (${concept.id})`);
      continue;
    }
    
    console.log(`Seeding ${gameId} with ${keys.length} checkpoints for concept ${conceptTitle}`);
    for (let i = 0; i < keys.length; i++) {
      const item = conceptItems[i % conceptItems.length];
      const result = db.insert(gameCheckpointMap).values({
        schoolId,
        gameId,
        checkpointKey: keys[i],
        conceptId: concept.id,
        itemId: item.id,
      }).onConflictDoNothing().run();
      console.log(`  ${keys[i]}: changes=${result.changes}`);
    }
  }
}