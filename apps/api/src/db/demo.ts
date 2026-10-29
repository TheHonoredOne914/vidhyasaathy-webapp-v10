import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { SaveItemSchema } from '@vidhyasaathy/contracts';
import { hashCredential, hashToken } from '../auth/security.ts';
import type { Db } from './index.ts';
import { ensureMotionBank, ensureMotionHistories } from '../content/motion-bank.ts';
import { academicYears, assignmentItems, assignments, chapters, classes, conceptPrereqs, concepts, items,
  claimCodes, learningEvidence, learningSessions, noteConcepts, notes, parentLinks, profiles, schools, sections, sessionProgress,
  slides, studentConceptStates, subjects, syncChanges, teacherAssignments, users, attempts } from './schema.ts';

export const DEMO_SCHOOL_ID = 'd7000000-0000-4000-8000-000000000001';
const Credentials = z.object({ password: z.string().min(12).max(128), pin: z.string().regex(/^\d{4}$/) }).strict();
export type SeedDemoOptions = { rich?: boolean };

// Explicit opt-in seed only. The records below cover every demo role and core loop.
export async function seedDemo(db: Db, credentials: z.input<typeof Credentials>, now = Date.now(), options: SeedDemoOptions = {}) {
  const input = Credentials.parse(credentials);
  const existing = db.select().from(schools).where(eq(schools.id, DEMO_SCHOOL_ID)).get();
  if (existing) {
    if (existing.name !== 'Demo school') throw new Error('Demo school ID is already in use.');
    // Content-only upgrade for older demo databases; accounts and progress stay untouched.
    db.transaction(() => {
      ensureMotionContent(db, now);
      ensureMotionBank(db, DEMO_SCHOOL_ID, now);
      ensureMotionHistories(db, DEMO_SCHOOL_ID, now);
    });
    return { schoolId: existing.id, created: false };
  }
  const passwordHash = await hashCredential(input.password);
  const pinHash = await hashCredential(input.pin);
  return db.transaction(() => {
    const schoolId = DEMO_SCHOOL_ID;
    db.insert(schools).values({ id: schoolId, name: 'Demo school', createdAt: now }).run();
    const yearId = randomUUID(), classId = randomUUID(), sectionId = randomUUID(), subjectId = randomUUID();
    db.insert(academicYears).values({ id: yearId, schoolId, name: '2026-2027', startsOn: '2026-06-01', endsOn: '2027-05-31' }).run();
    db.insert(classes).values({ id: classId, schoolId, academicYearId: yearId, name: '6' }).run();
    db.insert(sections).values({ id: sectionId, schoolId, classId, name: 'A' }).run();
    db.insert(subjects).values({ id: subjectId, schoolId, classId, name: 'Mathematics' }).run();
    const class9Id = randomUUID(), section9aId = randomUUID(), section9bId = randomUUID(), physicsId = randomUUID();
    db.insert(classes).values({ id: class9Id, schoolId, academicYearId: yearId, name: '9' }).run();
    db.insert(sections).values([{ id: section9aId, schoolId, classId: class9Id, name: 'A' }, { id: section9bId, schoolId, classId: class9Id, name: 'B' }]).run();
    db.insert(subjects).values({ id: physicsId, schoolId, classId: class9Id, name: 'Physics' }).run();
    
    const profileIds: Record<string, string> = {};
    const roles = options.rich ? ['admin', 'teacher', 'parent', 'examiner'] as const : ['admin', 'teacher', 'parent'] as const;
    for (const role of roles) {
      const userId = randomUUID(), profileId = randomUUID();
      db.insert(users).values({ id: userId, email: `${role}@demo.invalid`, passwordHash, pinHash: null, createdAt: now }).run();
      db.insert(profiles).values({ id: profileId, userId, schoolId, role: role === 'examiner' ? 'admin' : role, name: role === 'teacher' ? "Sharma Ma'am" : `Demo ${role}`,
        sectionId: null, rollNumber: null, phone: role === 'parent' ? '9876543210' : '', createdAt: now }).run();
      profileIds[role] = profileId;
    }
    const students = options.rich
      ? [['student', '1', 'Aarav'], ['student2', '2', 'Meera'], ['student3', '3', 'Kabir'], ['student4', '4', 'Priya'], ['student5', '5', 'Rohan']] as const
      : [['student', '1', 'Aarav']] as const;
    for (const [key, rollNumber, name] of students) {
      const userId = randomUUID(), profileId = randomUUID();
      db.insert(users).values({ id: userId, email: null, passwordHash: null, pinHash, createdAt: now }).run();
      db.insert(profiles).values({ id: profileId, userId, schoolId, role: 'student', name,
        sectionId: options.rich ? section9aId : sectionId, rollNumber, phone: '9876543210', createdAt: now }).run();
      profileIds[key] = profileId;
    }
    db.insert(claimCodes).values({ id: randomUUID(), codeHash: hashToken('DEMSTUDENT22'), encryptedCode: null, schoolId, profileId: profileIds.student!, expiresAt: now + 365 * 86400000, redeemedAt: null, createdAt: now }).run();
    db.insert(teacherAssignments).values({ id: randomUUID(), schoolId, teacherProfileId: profileIds.teacher!, sectionId: section9aId, subjectId: physicsId, classId: class9Id }).run();
    db.insert(teacherAssignments).values({ id: randomUUID(), schoolId, teacherProfileId: profileIds.teacher!, sectionId, subjectId, classId }).run();
    db.insert(parentLinks).values(students.map(([key]) => ({ id: randomUUID(), schoolId,
      parentProfileId: profileIds.parent!, studentProfileId: profileIds[key]! }))).run();
    const chapterId = randomUUID(), equalId = randomUUID(), halfId = randomUUID(), noteId = randomUUID(), sessionId = randomUUID();
    db.insert(chapters).values({ id: chapterId, schoolId, subjectId, title: 'Fractions', position: 0 }).run();
    db.insert(concepts).values([
      { id: equalId, schoolId, chapterId, title: 'Equal parts', description: 'A fraction describes equal parts of a whole.' },
      { id: halfId, schoolId, chapterId, title: 'One half', description: 'One of two equal parts is one half, written 1/2.' },
    ]).run();
    db.insert(conceptPrereqs).values({ schoolId, conceptId: halfId, prereqId: equalId }).run();
    db.insert(notes).values({ id: noteId, schoolId, chapterId, title: 'Demo teacher-approved fractions notes',
      body: 'A fraction describes equal parts of one whole. Parts must be equal. One of two equal parts is one half, written 1/2. Two halves make one whole.',
      status: 'published', releaseAt: now, updatedAt: now }).run();
    db.insert(noteConcepts).values([equalId, halfId].map((conceptId) => ({ noteId, schoolId, chapterId, conceptId }))).run();
    db.insert(learningSessions).values({ id: sessionId, schoolId, chapterId, sectionId, title: 'Demo: exploring fractions',
      status: 'published', releaseAt: now, updatedAt: now }).run();
    db.insert(slides).values([
      { id: randomUUID(), schoolId, chapterId, sessionId, conceptId: equalId, noteId, position: 0,
        title: 'Equal parts', body: 'Split one whole into equal parts. Unequal pieces do not show halves.' },
      { id: randomUUID(), schoolId, chapterId, sessionId, conceptId: halfId, noteId, position: 1,
        title: 'One half', body: 'One of two equal parts is 1/2. Two halves make a whole.' },
    ]).run();
    const questions = [
      { conceptId: equalId, prompt: 'Must fractional parts be equal?', options: ['Yes', 'No'], answer: 'Yes' },
      { conceptId: halfId, prompt: 'One of two equal parts is…', options: ['1/2', '1/3'], answer: '1/2' },
      { conceptId: equalId, prompt: 'Can two unequal pieces show halves?', options: ['Yes', 'No'], answer: 'No' },
      { conceptId: halfId, prompt: 'How many halves make one whole?', options: ['Two', 'Three'], answer: 'Two' },
      { conceptId: equalId, prompt: 'A fraction describes parts of…', options: ['One whole', 'Only a circle'], answer: 'One whole' },
      { conceptId: halfId, prompt: 'Which notation means one half?', options: ['1/2', '2/1'], answer: '1/2' },
    ];
    const itemRows = questions.map((question, position) => ({ id: randomUUID(), schoolId, chapterId, sessionId, position,
      conceptId: question.conceptId, content: SaveItemSchema.parse({ ...question, type: 'mcq', difficulty: 1,
        sourceRef: { noteId, locator: 'Fractions notes' } }) }));
    db.insert(items).values(itemRows).run();
    const assignmentId = randomUUID();
    db.insert(assignments).values({ id: assignmentId, schoolId, chapterId, sectionId, teacherId: profileIds.teacher!,
      title: 'Demo: fractions practice', kind: 'homework', dueAt: now + 7 * 86400000, status: 'published', publishedAt: now, updatedAt: now }).run();
    db.insert(assignmentItems).values(itemRows.slice(0, 2).map((item, position) => ({ assignmentId, itemId: item.id, schoolId, chapterId, position }))).run();
    db.insert(syncChanges).values([
      { schoolId, stream: 'assignments' as const, entityId: assignmentId, assignmentId },
      ...itemRows.slice(0, 2).map((item) => ({ schoolId, stream: 'items' as const, entityId: item.id, assignmentId })),
    ]).run();
    const motionChapterId = randomUUID();
    db.insert(chapters).values({ id: motionChapterId, schoolId, subjectId: physicsId, title: 'Motion', position: 0 }).run();
    const motionConcepts = ['Distance & Displacement', 'Speed & Velocity', 'Acceleration'].map((title) => ({ id: randomUUID(), title }));
    db.insert(concepts).values(motionConcepts.map((item) => ({ id: item.id, schoolId, chapterId: motionChapterId, title: item.title, description: `Class 9 Physics: ${item.title}.` }))).run();
    db.insert(conceptPrereqs).values([{ schoolId, conceptId: motionConcepts[1]!.id, prereqId: motionConcepts[0]!.id }, { schoolId, conceptId: motionConcepts[2]!.id, prereqId: motionConcepts[1]!.id }]).run();
    const session3Id = randomUUID();
    const opensAt = new Date(now); opensAt.setHours(18, 0, 0, 0);
    db.insert(learningSessions).values({ id: session3Id, schoolId, chapterId: motionChapterId, sectionId: section9aId, title: 'Session 3: Motion diagnostic', status: 'published', releaseAt: opensAt.getTime(), updatedAt: now }).run();
    const diagnosticQuestions = [
      ['Distance & Displacement', 'Which quantity has direction?', ['Distance', 'Displacement'], 'Displacement'],
      ['Distance & Displacement', 'Distance is always…', ['Non-negative', 'Negative'], 'Non-negative'],
      ['Speed & Velocity', 'Speed is distance divided by…', ['Time', 'Mass'], 'Time'],
      ['Speed & Velocity', 'Velocity includes speed and…', ['Direction', 'Temperature'], 'Direction'],
      ['Acceleration', 'Acceleration measures change in…', ['Velocity', 'Distance only'], 'Velocity'],
    ] as const;
    db.insert(items).values(diagnosticQuestions.map(([conceptTitle, prompt, options, answer], position) => ({
      id: randomUUID(), schoolId, chapterId: motionChapterId, sessionId: session3Id, position,
      conceptId: motionConcepts.find((concept) => concept.title === conceptTitle)!.id,
      content: SaveItemSchema.parse({ type: 'mcq', prompt, options, answer, difficulty: 1, sourceRef: null, conceptId: motionConcepts.find((concept) => concept.title === conceptTitle)!.id }),
    }))).run();
    ensureMotionContent(db, now);
    ensureMotionBank(db, schoolId, now);
    ensureMotionHistories(db, schoolId, now);
    if (options.rich) for (const [index, key] of (['student', 'student2', 'student3', 'student4'] as const).entries()) {
      const profileId = profileIds[key]!;
      db.insert(sessionProgress).values({ sessionId, profileId, schoolId, viewedSlides: index === 0 ? 2 : 1,
        checkSubmittedAt: index === 0 ? now - 60000 : null, completedAt: index === 0 ? now - 30000 : null }).run();
      db.insert(learningEvidence).values([
        { id: `demo:evidence:${key}:equal`, schoolId, profileId, conceptId: equalId, correct: true, source: 'session', createdAt: Math.max(0, now - 90000) },
        { id: `demo:evidence:${key}:half`, schoolId, profileId, conceptId: halfId, correct: index === 0, source: 'session', createdAt: Math.max(0, now - 60000) },
      ]).run();
      db.insert(studentConceptStates).values([
        { schoolId, profileId, conceptId: equalId, mastery: 0.8, leitnerBox: 4, nextReview: now + 86400000, attempts: 3, updatedAt: now },
        { schoolId, profileId, conceptId: halfId, mastery: index === 0 ? 0.75 : 0.35, leitnerBox: index === 0 ? 3 : 2,
          nextReview: now + (index === 0 ? 86400000 : 3600000), attempts: 2, updatedAt: now },
      ]).run();
      for (const [itemIndex, item] of itemRows.slice(0, 2).entries()) {
        db.insert(attempts).values({ id: randomUUID(), clientEventId: randomUUID(), schoolId, assignmentId, profileId,
          itemId: item.id, conceptId: item.conceptId, answer: itemIndex === 0 ? 'Yes' : (index === 0 ? '1/2' : '1/3'),
          correct: itemIndex === 0 || index === 0, needsReview: false, timeMs: 18000 + index * 1000,
          clientTs: Math.max(0, now - 45000), serverTs: Math.max(0, now - 40000), updatedAt: now, gradedBy: null, gradedAt: null }).run();
      }
    }
    return { schoolId, created: true };
  });
}

const MOTION_NOTES = [
  { concept: 'Distance & Displacement', title: 'Motion notes: distance and displacement', body: 'Distance is the total length of the path travelled by an object, whatever direction it moves in. '
    + 'Distance is a scalar quantity: it has magnitude only and is never negative. '
    + 'Displacement is the shortest straight-line distance from the initial position to the final position of an object, together with its direction. '
    + 'Displacement is a vector quantity: it has both magnitude and direction. '
    + 'The difference between distance and displacement is that distance measures the whole path travelled, while displacement only compares the starting and final positions. '
    + 'If an object comes back to its starting point, its displacement is zero even though the distance travelled is not zero. '
    + 'For example, a runner who completes one round of a 400 m track covers a distance of 400 m but has zero displacement.' },
  { concept: 'Speed & Velocity', title: 'Motion notes: speed and velocity', body: 'Speed is the distance travelled by an object per unit time, so speed = distance / time. '
    + 'The SI unit of speed is metre per second (m/s). '
    + 'Average speed is the total distance travelled divided by the total time taken. '
    + 'Velocity is the speed of an object in a definite direction, so velocity = displacement / time. '
    + 'Velocity is a vector quantity, while speed is a scalar quantity. '
    + 'An object moving at constant speed along a circular path has a changing velocity because its direction keeps changing. '
    + 'Uniform motion means an object covers equal distances in equal intervals of time; non-uniform motion means it covers unequal distances in equal intervals of time.' },
  { concept: 'Acceleration', title: 'Motion notes: acceleration', body: 'Acceleration is the rate of change of velocity with time. '
    + 'Acceleration = (final velocity - initial velocity) / time, written a = (v - u) / t. '
    + 'The SI unit of acceleration is metre per second squared (m/s2). '
    + 'Acceleration is positive when velocity increases and negative when velocity decreases; negative acceleration is also called retardation or deceleration. '
    + 'Motion in which velocity changes by equal amounts in equal intervals of time is called uniformly accelerated motion, for example a ball rolling down a smooth slope. '
    + 'The equations of uniformly accelerated motion are v = u + at, s = ut + 1/2 at2 and v2 = u2 + 2as.' },
] as const;

const MOTION_SLIDES = [
  { concept: 'Distance & Displacement', title: 'Distance vs displacement', body: 'Distance is the whole path travelled and has no direction. Displacement is the straight line from start to finish, with direction. One round of a 400 m track: distance 400 m, displacement 0.' },
  { concept: 'Speed & Velocity', title: 'Speed vs velocity', body: 'Speed = distance / time (m/s). Velocity = displacement / time, so it has a direction. Going round a circle at a steady speed still changes your velocity.' },
  { concept: 'Acceleration', title: 'Acceleration', body: 'Acceleration is the rate of change of velocity: a = (v - u) / t, measured in m/s2. Slowing down is negative acceleration, also called retardation.' },
  { concept: 'Acceleration', title: 'Before the check', body: 'Ask yourself: Does it have a direction? Is it the whole path or just start to finish? Is the velocity changing? Then try the five check questions.' },
] as const;

/** Idempotently adds the Class 9 Motion notes and Session 3 slides that older demo seeds lacked. */
export function ensureMotionContent(db: Db, now: number) {
  const chapter = db.select().from(chapters).where(and(eq(chapters.schoolId, DEMO_SCHOOL_ID), eq(chapters.title, 'Motion'))).get();
  if (!chapter) return;
  const conceptRows = db.select().from(concepts).where(eq(concepts.chapterId, chapter.id)).all();
  const conceptId = (title: string) => conceptRows.find((row) => row.title === title)?.id;
  if (MOTION_NOTES.some((note) => !conceptId(note.concept))) return;
  const session = db.select().from(learningSessions).where(eq(learningSessions.chapterId, chapter.id)).all()
    .find((row) => row.title.startsWith('Session 3'));
  // Notes must be released no later than the session that cites them.
  const releaseAt = Math.min(now, session?.releaseAt ?? now);
  const existingNotes = db.select().from(notes).where(eq(notes.chapterId, chapter.id)).all();
  const noteIds: Record<string, string> = {};
  for (const note of MOTION_NOTES) {
    const found = existingNotes.find((row) => row.title === note.title);
    if (found) { noteIds[note.concept] = found.id; continue; }
    const id = randomUUID();
    db.insert(notes).values({ id, schoolId: DEMO_SCHOOL_ID, chapterId: chapter.id, title: note.title, body: note.body,
      status: 'published', releaseAt, updatedAt: now }).run();
    db.insert(noteConcepts).values({ noteId: id, schoolId: DEMO_SCHOOL_ID, chapterId: chapter.id, conceptId: conceptId(note.concept)! }).run();
    noteIds[note.concept] = id;
  }
  if (!session || db.select().from(slides).where(eq(slides.sessionId, session.id)).all().length > 0) return;
  db.insert(slides).values(MOTION_SLIDES.map((slide, position) => ({ id: randomUUID(), schoolId: DEMO_SCHOOL_ID, chapterId: chapter.id,
    sessionId: session.id, conceptId: conceptId(slide.concept)!, noteId: noteIds[slide.concept] ?? null, position, title: slide.title, body: slide.body }))).run();
}

/**
 * Dev-only: sets every demo staff password back to the documented demo password so the
 * walkthrough credentials work on an older database. Student PINs and progress are untouched.
 */
export async function resetDemoLogins(db: Db, password: string) {
  const parsed = Credentials.shape.password.parse(password);
  const passwordHash = await hashCredential(parsed);
  const staff = db.select({ userId: profiles.userId }).from(profiles).innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), isNotNull(users.email))).all().map((row) => row.userId);
  if (!staff.length) return 0;
  db.update(users).set({ passwordHash }).where(inArray(users.id, staff)).run();
  return staff.length;
}

const DEMO_STUDENTS = [
  { name: 'Aarav', roll: '1' }, { name: 'Meera', roll: '2' }, { name: 'Kabir', roll: '3' },
  { name: 'Priya', roll: '4' }, { name: 'Rohan', roll: '5' },
] as const;

/** Adds any missing demo students. Existing pins and progress stay as they are. */
export async function ensureDemoStudents(db: Db, pin: string, now: number) {
  const pinHash = await hashCredential(Credentials.shape.pin.parse(pin));
  const session = db.select().from(learningSessions).where(eq(learningSessions.schoolId, DEMO_SCHOOL_ID)).all()
    .find((row) => row.title.startsWith('Session 3'));
  const parent = db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.role, 'parent'))).get();
  if (!session || !parent) return;
  const existing = db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.role, 'student'))).all();
  for (const student of DEMO_STUDENTS) {
    if (existing.some((row) => row.name === student.name)) continue;
    const userId = randomUUID();
    const profileId = randomUUID();
    db.insert(users).values({ id: userId, email: null, passwordHash: null, pinHash, createdAt: now }).run();
    db.insert(profiles).values({
      id: profileId, userId, schoolId: DEMO_SCHOOL_ID, role: 'student', name: student.name,
      sectionId: session.sectionId, rollNumber: student.roll, phone: '9876543210', createdAt: now,
    }).run();
    db.insert(parentLinks).values({ id: randomUUID(), schoolId: DEMO_SCHOOL_ID, parentProfileId: parent.id, studentProfileId: profileId }).run();
  }
}

const CANONICAL_PASSWORD = 'Saathy@2026!';
const CANONICAL_PINS: Record<string, string> = { Aarav: '2468', Meera: '3579', Kabir: '4680', Priya: '5791', Rohan: '6802' };

/** CLI only. Tests keep the pin they pass into seedDemo. */
export async function applyDemoAccess(db: Db) {
  const passwordHash = await hashCredential(CANONICAL_PASSWORD);
  const teacherPin = await hashCredential('1357');
  const staff = db.select({ userId: profiles.userId, role: profiles.role }).from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), isNotNull(users.email))).all();
  for (const row of staff) {
    db.update(users).set(row.role === 'teacher' ? { passwordHash, pinHash: teacherPin } : { passwordHash }).where(eq(users.id, row.userId)).run();
  }
  for (const [name, pin] of Object.entries(CANONICAL_PINS)) {
    const profile = db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.name, name), eq(profiles.role, 'student'))).get();
    if (!profile) continue;
    db.update(users).set({ pinHash: await hashCredential(pin) }).where(eq(users.id, profile.userId)).run();
  }
}

export function canonicalDemoLogins() {
  return [
    `School: Demo school (${DEMO_SCHOOL_ID})`,
    `Staff password: ${CANONICAL_PASSWORD}`,
    'admin: admin@demo.invalid',
    "teacher: teacher@demo.invalid (Sharma Ma'am), PIN 1357",
    'parent: parent@demo.invalid',
    'examiner: examiner@demo.invalid',
    'Student PINs',
    'Aarav: 2468',
    'Meera: 3579',
    'Kabir: 4680',
    'Priya: 5791',
    'Rohan: 6802',
  ].join('\n');
}

export function demoLogins(db: Db, password: string, pin: string) {
  const rows = db.select({ email: users.email, name: profiles.name, role: profiles.role, profileId: profiles.id })
    .from(profiles).innerJoin(users, eq(users.id, profiles.userId)).where(eq(profiles.schoolId, DEMO_SCHOOL_ID)).all();
  return [
    `School: Demo school (${DEMO_SCHOOL_ID})`,
    `Password accounts (password: ${password})`,
    ...rows.filter((row) => row.email).map((row) => `${row.role}: ${row.email} (${row.name})`),
    `Student PIN accounts (PIN: ${pin})`,
    ...rows.filter((row) => !row.email).map((row) => `student: profileId=${row.profileId} (${row.name})`),
  ].join('\n');
}

