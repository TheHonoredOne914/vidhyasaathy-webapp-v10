import { and, eq } from 'drizzle-orm';
import type { Database } from './index.ts';
import { applyDemoAccess, DEMO_SCHOOL_ID, ensureDemoStudents, seedDemo } from './demo.ts';
import { ensureDailyLoop } from './daily-seed.ts';
import { ensureNotebookDemo } from './notebook-seed.ts';
import { seedPhase4 } from './seed-phase4.ts';
import { chapters, concepts, profiles, studentConceptStates } from './schema.ts';
import { moduleBank } from '../learning/proto-content.ts';
import { gameRegistry } from '../learning/proto-games.ts';
import { buildLearningPlan } from '../learning/proto-plan.ts';
import { prepareLearningStore } from '../learning/proto-store.ts';

export async function ensureDemoStory(database: Database, now: number) {
  const { db, sqlite } = database;
  await prepareLearningStore(database);
  const students = db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.role, 'student'))).all();
  const catalog = db.select().from(chapters).where(eq(chapters.schoolId, DEMO_SCHOOL_ID)).all();
  const aarav = students.find((row) => row.name === 'Aarav');
  const motion = catalog.find((row) => row.title === 'Motion');
  if (aarav && motion && !sqlite.prepare('SELECT id FROM proto_study_session WHERE school_id=? AND profile_id=?').get(DEMO_SCHOOL_ID, aarav.id)) {
    const plan = await buildLearningPlan(moduleBank(db, DEMO_SCHOOL_ID, motion).modules, gameRegistry(db, DEMO_SCHOOL_ID), async () => { throw new Error('Demo offline plan'); });
    plan.currentStep = 2;
    sqlite.prepare('INSERT OR IGNORE INTO proto_study_session VALUES (?,?,?,?,?,?,?)').run(`demo:motion:${aarav.id}`, DEMO_SCHOOL_ID, aarav.id, motion.id, JSON.stringify(plan), now, now);
  }
  const priya = students.find((row) => row.name === 'Priya');
  const coordinate = catalog.find((row) => /coordinate geometry/i.test(row.title));
  if (priya && coordinate) {
    for (const concept of db.select().from(concepts).where(eq(concepts.chapterId, coordinate.id)).all().filter((row) => row.sourceClass == null || row.sourceClass >= 9).slice(0, 2)) {
      db.insert(studentConceptStates).values({ schoolId: DEMO_SCHOOL_ID, profileId: priya.id, conceptId: concept.id, mastery: 0.2, leitnerBox: 1, nextReview: now, attempts: 2, updatedAt: now }).onConflictDoNothing().run();
    }
  }
}

export async function bootstrapDemo(database: Database, now: number) {
  if (process.env.NODE_ENV === 'production' || (process.env.DEMO_SEED !== 'true' && process.env.DEMO_LOOSE_AUTH !== 'true')) return;
  // Never seed a real school, even if it has not enrolled students yet.
  if (database.sqlite.prepare("SELECT id FROM profile WHERE role='student' OR school_id<>? LIMIT 1").get(DEMO_SCHOOL_ID)
    || database.sqlite.prepare('SELECT id FROM school WHERE id<>? LIMIT 1').get(DEMO_SCHOOL_ID)) return;
  await seedDemo(database.db, { password: process.env.DEMO_PASSWORD ?? 'Saathy@2026!', pin: '2468' }, now, { rich: true });
  await ensureDemoStudents(database.db, '2468', now);
  ensureDailyLoop(database.db, DEMO_SCHOOL_ID, now);
  ensureNotebookDemo(database.db, DEMO_SCHOOL_ID, now);
  await seedPhase4(database, () => now);
  await applyDemoAccess(database.db);
  await ensureDemoStory(database, now);
}
