import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { SaveItemSchema } from '@vidhyasaathy/contracts';
import { markItem } from '../assessment/service.ts';
import { recordAnswer } from '../learning/record.ts';
import type { Db } from './index.ts';
import {
  announcements, answerEvidence, assignmentItems, assignments, attempts, chapters, classes, concepts, items,
  learningSessions, noteConcepts, notes, notifications, profiles, sections, slides, subjects, teacherAssignments,
} from './schema.ts';

const DAY = 86_400_000;
const CONTENT = [
  { subject: 'Chemistry', chapter: 'Atoms and Molecules', ideas: [
    { title: 'Conservation of mass', body: 'In a chemical reaction, mass is neither created nor destroyed. The total mass of the reactants equals the total mass of the products in a closed system.',
      prompt: 'In a closed vessel, 12 g of carbon reacts completely with 32 g of oxygen. What mass of carbon dioxide forms?',
      options: ['44 g', '20 g', '384 g', '32 g'], answer: '44 g',
      explanation: 'Mass is conserved: 12 g + 32 g = 44 g.', misconception: '20 g', fix: 'Add the masses of both reactants; do not subtract them.' },
    { title: 'Chemical formulae', body: 'A chemical formula shows the kinds and numbers of atoms in a molecule. In water, H2O, each molecule contains two hydrogen atoms and one oxygen atom.',
      prompt: 'How many atoms in total are present in one molecule of water, H2O?',
      options: ['3', '2', '1', '4'], answer: '3', explanation: 'Two hydrogen atoms and one oxygen atom make three atoms.',
      misconception: '2', fix: 'The subscript belongs only to hydrogen. Count the oxygen atom too.' },
  ] },
  { subject: 'Biology', chapter: 'The Fundamental Unit of Life', ideas: [
    { title: 'Plasma membrane', body: 'The plasma membrane separates the contents of a cell from its environment. It is selectively permeable: it permits some substances to enter or leave while preventing others.',
      prompt: 'Which cell structure selectively controls the movement of substances into and out of a cell?',
      options: ['Plasma membrane', 'Cell wall', 'Nucleus', 'Ribosome'], answer: 'Plasma membrane',
      explanation: 'The plasma membrane is selectively permeable.', misconception: 'Cell wall', fix: 'The cell wall gives support; the plasma membrane selectively controls passage.' },
    { title: 'Osmosis', body: 'Osmosis is the movement of water through a selectively permeable membrane from a region of higher water concentration to a region of lower water concentration.',
      prompt: 'A cell is placed in a dilute solution with a higher water concentration than its contents. What happens initially?',
      options: ['Water enters the cell', 'Water leaves the cell', 'No water moves', 'The cell wall pumps salt'], answer: 'Water enters the cell',
      explanation: 'Water enters by osmosis, moving from higher to lower water concentration.', misconception: 'Water leaves the cell', fix: 'Compare water concentrations, not just the amounts of dissolved solute.' },
  ] },
  { subject: 'Mathematics', chapter: 'Polynomials', ideas: [
    { title: 'Degree of a polynomial', body: 'The degree of a non-zero polynomial in one variable is the highest power of the variable with a non-zero coefficient. A non-zero constant polynomial has degree zero.',
      prompt: 'What is the degree of 5x^3 + 2x^2 - 7?', options: ['3', '5', '2', '0'], answer: '3',
      explanation: 'The highest power of x with a non-zero coefficient is 3.', misconception: '5', fix: 'The degree is a power of the variable, not its coefficient.' },
    { title: 'Zero of a polynomial', body: 'A number a is a zero of a polynomial p(x) when p(a) = 0. Substitute the number for the variable to check whether it is a zero.',
      prompt: 'Which number is a zero of p(x) = x - 4?', options: ['4', '-4', '0', '1'], answer: '4',
      explanation: 'Substituting x = 4 gives p(4) = 4 - 4 = 0.', misconception: '-4', fix: 'Substitute the proposed number: p(-4) = -8, not zero.' },
  ] },
] as const;

/** Add notebook fixtures only to the opted-in demo class. Never replace existing work. */
export function ensureNotebookDemo(db: Db, schoolId: string, now: number) {
  const grade = db.select().from(classes).where(and(eq(classes.schoolId, schoolId), eq(classes.name, '9'))).get();
  if (!grade) return;
  const section = db.select().from(sections).where(and(eq(sections.classId, grade.id), eq(sections.name, 'A'))).get();
  if (!section) return;
  const pupils = db.select().from(profiles).where(and(eq(profiles.schoolId, schoolId), eq(profiles.sectionId, section.id))).all()
    .filter((row) => row.role === 'student' && ['Aarav', 'Meera', 'Kabir', 'Priya', 'Rohan'].includes(row.name));
  if (!pupils.some((row) => row.name === 'Aarav')) return;
  const teacher = db.select().from(profiles).where(and(eq(profiles.schoolId, schoolId), eq(profiles.role, 'teacher'))).get();
  if (!teacher) return;

  for (const [subjectIndex, content] of CONTENT.entries()) {
    let subject = db.select().from(subjects).where(and(eq(subjects.classId, grade.id), eq(subjects.name, content.subject))).get();
    if (!subject) {
      subject = { id: randomUUID(), schoolId, classId: grade.id, name: content.subject };
      db.insert(subjects).values(subject).run();
    }
    db.insert(teacherAssignments).values({ id: randomUUID(), schoolId, teacherProfileId: teacher.id,
      sectionId: section.id, subjectId: subject.id, classId: grade.id }).onConflictDoNothing().run();
    let chapter = db.select().from(chapters).where(and(eq(chapters.subjectId, subject.id), eq(chapters.title, content.chapter))).get();
    if (!chapter) {
      chapter = { id: randomUUID(), schoolId, subjectId: subject.id, title: content.chapter, position: 0 };
      db.insert(chapters).values(chapter).run();
    }
    const chapterId = chapter.id;
    const sessionTitle = `Explore: ${content.chapter}`;
    let session = db.select().from(learningSessions).where(and(eq(learningSessions.chapterId, chapterId), eq(learningSessions.title, sessionTitle))).get();
    if (!session) {
      session = { id: randomUUID(), schoolId, chapterId, sectionId: section.id, title: sessionTitle,
        status: 'published', releaseAt: now - 4 * DAY, updatedAt: now };
      db.insert(learningSessions).values(session).run();
    }
    for (const [position, idea] of content.ideas.entries()) {
      let concept = db.select().from(concepts).where(and(eq(concepts.chapterId, chapterId), eq(concepts.title, idea.title))).get();
      if (!concept) {
        concept = { id: randomUUID(), schoolId, chapterId, title: idea.title, description: idea.body, sourceClass: 9 };
        db.insert(concepts).values(concept).run();
      }
      const conceptId = concept.id;
      const note = db.select().from(notes).where(and(eq(notes.chapterId, chapterId), eq(notes.title, idea.title))).get();
      const noteId = note?.id ?? randomUUID();
      if (!note) {
        db.insert(notes).values({ id: noteId, schoolId, chapterId, title: idea.title, body: idea.body,
          status: 'published', releaseAt: now - 4 * DAY, updatedAt: now }).run();
      }
      db.insert(noteConcepts).values({ schoolId, chapterId, noteId, conceptId }).onConflictDoNothing().run();
      db.insert(slides).values({ id: randomUUID(), schoolId, chapterId, sessionId: session.id, conceptId,
        noteId, position, title: idea.title, body: idea.body }).onConflictDoNothing().run();
      let item = db.select().from(items).where(and(eq(items.sessionId, session.id), eq(items.position, position))).get();
      if (!item) {
        item = { id: randomUUID(), schoolId, chapterId, sessionId: session.id, position, conceptId,
          content: SaveItemSchema.parse({ type: 'mcq', conceptId, difficulty: position === 0 ? 3 : 2,
            prompt: idea.prompt, options: [...idea.options], answer: idea.answer, explanation: idea.explanation,
            sourceRef: { noteId, locator: `NCERT Class 9: ${content.chapter}, ${idea.title}` },
            mistakes: [{ option: idea.misconception, errorType: 'concept_gap', explanation: idea.fix, fix: idea.fix }] }) };
        db.insert(items).values(item).run();
      }
      for (const pupil of pupils) {
        const count = pupil.name === 'Aarav' ? (position === 0 ? 6 : 2) : pupil.name === 'Meera' ? 4 : 3;
        for (let n = 0; n < count; n++) {
          const id = `demo:notebook:${pupil.id}:${conceptId}:${n}`;
          if (db.select({ id: answerEvidence.id }).from(answerEvidence).where(eq(answerEvidence.id, id)).get()) continue;
          const answer = pupil.name === 'Aarav' || pupil.name === 'Meera' || (pupil.name === 'Kabir' && n === 0)
            ? idea.answer : idea.misconception;
          const correct = markItem(item.content, answer);
          if (correct === null) continue;
          recordAnswer(db, { id, schoolId, profileId: pupil.id, conceptId, chapterId, itemId: item.id,
            level: position === 0 ? 3 : 2, correct, confidence: pupil.name === 'Priya' ? 'sure' : 'unsure',
            source: 'practice', timeMs: 35_000, answer, markedFamily: correct ? null : 'concept_gap' },
          now - (pupil.name === 'Rohan' ? 20 : 3) * DAY + (subjectIndex * 20 + position * 7 + n) * 60_000);
        }
      }
      // A returned assignment and a separate outstanding one, without changing Motion's next action.
      const title = `${position === 0 ? 'Returned practice' : 'Try next'}: ${content.chapter}`;
      let homework = db.select().from(assignments).where(and(eq(assignments.chapterId, chapterId), eq(assignments.title, title))).get();
      if (!homework) {
        homework = { id: randomUUID(), schoolId, chapterId, sectionId: section.id, teacherId: teacher.id,
          title, kind: 'homework', dueAt: now + (position === 0 ? -2 : 5) * DAY, lateUntil: null,
          status: 'published', publishedAt: now - 4 * DAY, updatedAt: now };
        db.insert(assignments).values(homework).run();
      }
      db.insert(assignmentItems).values({ schoolId, chapterId, assignmentId: homework.id, itemId: item.id, position: 0 })
        .onConflictDoNothing().run();
      if (position !== 0) continue;
      for (const pupil of pupils.filter((row) => row.name !== 'Rohan')) {
        if (db.select({ id: attempts.id }).from(attempts).where(and(eq(attempts.assignmentId, homework.id), eq(attempts.profileId, pupil.id), eq(attempts.itemId, item.id))).get()) continue;
        const answer = pupil.name === 'Priya' ? idea.misconception : idea.answer;
        const correct = markItem(item.content, answer);
        if (correct === null) continue;
        const id = randomUUID(), answeredAt = now - 3 * DAY;
        db.insert(attempts).values({ id, clientEventId: randomUUID(), schoolId, assignmentId: homework.id,
          profileId: pupil.id, itemId: item.id, conceptId, answer, correct, needsReview: false, timeMs: 40_000,
          clientTs: answeredAt, serverTs: answeredAt, updatedAt: answeredAt, gradedBy: teacher.id, gradedAt: answeredAt }).run();
        recordAnswer(db, { id, schoolId, profileId: pupil.id, conceptId, chapterId, itemId: item.id, level: 3,
          correct, confidence: 'unsure', source: 'homework', timeMs: 40_000, answer,
          markedFamily: correct ? null : 'concept_gap' }, answeredAt);
      }
    }
  }
  const remarkTitle = 'From school: steady practice';
  let remark = db.select().from(announcements).where(and(eq(announcements.schoolId, schoolId), eq(announcements.sectionId, section.id), eq(announcements.title, remarkTitle))).get();
  if (!remark) {
    remark = { id: randomUUID(), schoolId, sectionId: section.id, authorId: teacher.id, title: remarkTitle,
      body: 'We are practising explanations as well as answers. Please encourage a short, regular review of the ideas discussed in class.',
      audience: 'all', channels: ['in_app'], createdAt: now - DAY };
    db.insert(announcements).values(remark).run();
  }
  for (const pupil of pupils) for (const earlier of [false, true]) {
    const createdAt = now - (earlier ? 2 * DAY : 0);
    db.insert(notifications).values({ id: randomUUID(), schoolId, profileId: pupil.id,
      announcementId: earlier ? remark.id : null, dedupeKey: `demo:notebook:${pupil.id}:${earlier ? 'earlier' : 'today'}`,
      kind: earlier ? 'announcement' : 'content_publish', topic: null,
      title: earlier ? remarkTitle : 'Your Class 9 notes are ready',
      body: earlier ? remark.body : 'Explore your notes in Chemistry, Biology and Mathematics.',
      href: earlier ? '/student/notifications' : '/student/subjects', channel: 'in_app', status: 'delivered',
      failure: null, createdAt, deliverAfter: createdAt, deliveredAt: createdAt, readAt: null }).onConflictDoNothing().run();
  }
}
