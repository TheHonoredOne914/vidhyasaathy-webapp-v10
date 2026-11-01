import { and, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { SaveItemSchema } from '@vidhyasaathy/contracts';
import type { Database } from './index.ts';
import { gameCheckpointMap } from './schema-phase4.ts';
import { items, concepts, chapters, classes, profiles, sections, subjects, learningSessions, slides, notes, noteConcepts, teacherAssignments } from './schema.ts';
import { GAME_BANK } from './game-bank.ts';
import { DEMO_SCHOOL_ID } from './demo.ts';

export async function seedPhase4(database: Database, _now: () => number) {
  const { db } = database;
  const timestamp = _now();
  // Only the explicitly opted-in demo class receives authored NCERT content.
  for (const pupil of db.select().from(profiles).where(and(eq(profiles.name, 'Aarav'), eq(profiles.role, 'student'))).all()) {
    if (pupil.schoolId !== DEMO_SCHOOL_ID) continue;
    const section = pupil.sectionId ? db.select().from(sections).where(eq(sections.id, pupil.sectionId)).get() : undefined;
    const grade = section ? db.select().from(classes).where(eq(classes.id, section.classId)).get() : undefined;
    if (!section || grade?.name !== '9') continue;
    const teacher = db.select().from(profiles).where(and(eq(profiles.schoolId, pupil.schoolId), eq(profiles.role, 'teacher'))).get();
    if (!teacher) continue;
    for (const bank of GAME_BANK) {
      const schoolId = pupil.schoolId;
      let subject = db.select().from(subjects).where(and(eq(subjects.schoolId, schoolId), eq(subjects.classId, grade.id), eq(subjects.name, bank.subject))).get();
      if (!subject) {
        subject = { id: randomUUID(), schoolId, classId: grade.id, name: bank.subject };
        db.insert(subjects).values(subject).run();
      }
      db.insert(teacherAssignments).values({ id: randomUUID(), schoolId, teacherProfileId: teacher.id, sectionId: section.id, subjectId: subject.id, classId: grade.id }).onConflictDoNothing().run();
      let chapter = db.select().from(chapters).where(and(eq(chapters.subjectId, subject.id), eq(chapters.title, bank.chapter))).get();
      if (!chapter) {
        chapter = { id: randomUUID(), schoolId, subjectId: subject.id, title: bank.chapter, position: bank.id === 'motion' ? 0 : GAME_BANK.indexOf(bank) + 1 };
        db.insert(chapters).values(chapter).run();
      }
      const chapterId = chapter.id;
      const title = `Explore: ${bank.chapter}`;
      let session = db.select().from(learningSessions).where(and(eq(learningSessions.chapterId, chapterId), eq(learningSessions.sectionId, section.id), eq(learningSessions.title, title))).get();
      if (!session) {
        session = { id: randomUUID(), schoolId, chapterId, sectionId: section.id, title, status: 'published', releaseAt: timestamp - 86400000, updatedAt: timestamp };
        db.insert(learningSessions).values(session).run();
      }
      for (const [position, [key, conceptTitle, prompt, options, explanation]] of bank.questions.entries()) {
        let concept = db.select().from(concepts).where(and(eq(concepts.chapterId, chapterId), eq(concepts.title, conceptTitle))).get();
        if (!concept) {
          concept = { id: randomUUID(), schoolId, chapterId, title: conceptTitle, description: explanation, sourceClass: 9 };
          db.insert(concepts).values(concept).run();
        }
        const conceptId = concept.id;
        const noteId = db.select().from(notes).where(and(eq(notes.chapterId, chapterId), eq(notes.title, conceptTitle))).get()?.id ?? randomUUID();
        db.insert(notes).values({ id: noteId, schoolId, chapterId, title: conceptTitle, body: explanation, status: 'published', releaseAt: timestamp - 86400000, updatedAt: timestamp }).onConflictDoNothing().run();
        db.insert(noteConcepts).values({ schoolId, chapterId, noteId, conceptId }).onConflictDoNothing().run();
        // A separate session avoids overwriting the existing notebook lesson's slides.
        if (!db.select().from(slides).where(and(eq(slides.sessionId, session.id), eq(slides.position, position))).get()) db.insert(slides).values({ id: randomUUID(), schoolId, chapterId, sessionId: session.id, conceptId, noteId, position, title: conceptTitle, body: explanation }).run();
        const itemId = `game-bank:${schoolId}:${key}`;
        db.insert(items).values({ id: itemId, schoolId, chapterId, conceptId, sessionId: null, position,
          content: SaveItemSchema.parse({ type: 'mcq', conceptId, difficulty: 2, prompt, options: [...options], answer: options[0], explanation,
            sourceRef: { noteId, locator: `NCERT Class 9: ${bank.chapter}, ${conceptTitle}` } }) }).onConflictDoNothing().run();
        db.insert(gameCheckpointMap).values({ schoolId, gameId: bank.id, checkpointKey: key, conceptId, itemId }).onConflictDoNothing().run();
      }
    }
  }
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
