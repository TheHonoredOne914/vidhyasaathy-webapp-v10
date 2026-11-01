import { and, eq } from 'drizzle-orm';
import { expect, it } from 'vitest';
import { seedDemo, DEMO_SCHOOL_ID } from '../src/db/demo.ts';
import { ensureNotebookDemo } from '../src/db/notebook-seed.ts';
import { openDatabase } from '../src/db/index.ts';
import {
  announcements, answerEvidence, assignments, attempts, conceptLadders, concepts, items, learningSessions,
  notes, notifications, profiles, slides, subjects, teacherAssignments,
} from '../src/db/schema.ts';
import { notebookWorld, subjectsBoard } from '../src/notebook/views.ts';
import { PASSWORD, PIN } from './helpers.ts';

it('adds scored Class 9 notebook history without replacing existing content or learner work', async () => {
  const database = openDatabase(':memory:');
  const db = database.db, now = Date.UTC(2026, 9, 31, 12);
  try {
    await seedDemo(db, { password: PASSWORD, pin: PIN }, now, { rich: true });
    ensureNotebookDemo(db, DEMO_SCHOOL_ID, now);
    const pupil = (name: string) => db.select().from(profiles)
      .where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, name))).get()!;
    const aarav = pupil('Aarav'), priya = pupil('Priya');
    const board = subjectsBoard(notebookWorld(db, DEMO_SCHOOL_ID, aarav, now));
    expect(board.subjects.map((row) => row.name)).toEqual(expect.arrayContaining(['Physics', 'Chemistry', 'Biology', 'Mathematics']));
    const known = db.select().from(conceptLadders).all();
    const score = (id: string) => known.filter((row) => row.profileId === id).reduce((sum, row) => sum + (row.masteryLevel ?? 0), 0);
    expect(score(aarav.id)).toBeGreaterThan(score(priya.id));
    expect(new Set(known.filter((row) => row.profileId === aarav.id).map((row) => row.masteryLevel)).size).toBeGreaterThan(1);
    const homework = db.select().from(assignments).all().filter((row) => row.title.startsWith('Returned practice:'));
    expect(homework).toHaveLength(3);
    const graded = db.select().from(attempts).all().filter((row) => row.profileId === aarav.id && homework.some((task) => task.id === row.assignmentId));
    expect(graded).toHaveLength(3);
    expect(graded.every((row) => row.correct && row.gradedAt !== null && row.gradedBy !== null)).toBe(true);
    expect(graded.every((row) => db.select().from(answerEvidence).where(eq(answerEvidence.id, row.id)).get()?.source === 'homework')).toBe(true);
    const inbox = db.select().from(notifications).where(eq(notifications.profileId, aarav.id)).all();
    expect(inbox.some((row) => row.createdAt === now)).toBe(true);
    expect(inbox.some((row) => row.createdAt < now - 86_400_000)).toBe(true);
    expect(db.select().from(announcements).all().some((row) => row.audience === 'all')).toBe(true);
    expect(db.select().from(slides).all().length).toBeGreaterThan(3);
    // Keep read state and teacher edits, and prove no duplicate content, evidence or work on a later rerun.
    db.update(notifications).set({ readAt: now }).where(eq(notifications.id, inbox[0]!.id)).run();
    const note = db.select().from(notes).all().find((row) => row.title === 'Osmosis')!;
    db.update(notes).set({ body: `${note.body} Teacher annotation.` }).where(eq(notes.id, note.id)).run();
    const snapshot = () => [subjects, concepts, notes, items, learningSessions, slides, assignments, attempts,
      answerEvidence, conceptLadders, notifications, announcements, teacherAssignments].map((table) => db.select().from(table).all());
    const before = snapshot();
    ensureNotebookDemo(db, DEMO_SCHOOL_ID, now + 86_400_000);
    expect(snapshot()).toEqual(before);
    expect(database.sqlite.pragma('foreign_key_check')).toEqual([]);
  } finally { database.close(); }
});
