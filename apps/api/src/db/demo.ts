import { randomUUID } from 'node:crypto';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { SaveItemSchema } from '@vidhyasaathy/contracts';
import { hashCredential, hashToken } from '../auth/security.ts';
import type { Db } from './index.ts';
import { ensureMotionBank, ensureMotionHistories } from '../content/motion-bank.ts';
import { ensureDailyLoop } from './daily-seed.ts';
import { academicYears, aiDraftJobs, assignmentItems, assignments, chapters, classes, conceptPrereqs, concepts, items,
  claimCodes, learningEvidence, learningSessions, noteConcepts, notes, parentLinks, profiles, schools, sections, sessionProgress,
  slides, studentConceptStates, subjects, syncChanges, teacherAssignments, users, attempts } from './schema.ts';
import { digest } from '../ai/retrieval.ts';

export const DEMO_SCHOOL_ID = 'd7000000-0000-4000-8000-000000000001';
const Credentials = z.object({ password: z.string().min(12).max(128), pin: z.string().regex(/^\d{4}$/) }).strict();
export type SeedDemoOptions = { rich?: boolean };

type MotionCheck = {
  concept: 'Distance & Displacement' | 'Speed & Velocity' | 'Acceleration';
  prompt: string;
  options: [string, string, string, string];
  answer: string;
  explanation: string;
  mistakes: { option: string; errorType: 'concept_gap' | 'method' | 'careless'; explanation: string; fix: string }[];
};

const SESSION_CHECKS: MotionCheck[] = [
  {
    concept: 'Distance & Displacement',
    prompt: 'A girl walks 6 m east and then 8 m north. The magnitude of her displacement is',
    options: ['10 m', '14 m', '2 m', '48 m'],
    answer: '10 m',
    explanation: 'Displacement is the straight line from start to finish. √(6² + 8²) = 10 m. The path length, 14 m, is the distance.',
    mistakes: [
      { option: '14 m', errorType: 'concept_gap', explanation: '14 m adds the two legs, so it is the distance, not the displacement.', fix: 'Displacement is the straight line: √(6² + 8²).' },
      { option: '2 m', errorType: 'method', explanation: 'Subtracting the legs is not how a right angle combines.', fix: 'Use Pythagoras for two perpendicular parts of a journey.' },
      { option: '48 m', errorType: 'careless', explanation: '6 × 8 is an area, not a length.', fix: 'Combine the two lengths with √(6² + 8²).' },
    ],
  },
  {
    concept: 'Distance & Displacement',
    prompt: 'Which statement about distance is correct?',
    options: ['It is never negative', 'It can be negative', 'It is always equal to displacement', 'Its SI unit is m/s'],
    answer: 'It is never negative',
    explanation: 'Distance is the length of the path. It has no direction, so it cannot be negative.',
    mistakes: [
      { option: 'It can be negative', errorType: 'concept_gap', explanation: 'A negative sign belongs to displacement when a direction is chosen, not to distance.', fix: 'Distance is a scalar path length and stays zero or positive.' },
      { option: 'It is always equal to displacement', errorType: 'concept_gap', explanation: 'They match only for a straight path that never turns back.', fix: 'Distance is the whole path. Displacement is start to finish.' },
      { option: 'Its SI unit is m/s', errorType: 'careless', explanation: 'm/s is a unit of speed. Distance is a length.', fix: 'Measure distance in metres.' },
    ],
  },
  {
    concept: 'Speed & Velocity',
    prompt: 'A car travels 90 km in 1.5 h. Its average speed is',
    options: ['60 km/h', '135 km/h', '90 km/h', '1.5 km/h'],
    answer: '60 km/h',
    explanation: 'Average speed = total distance / total time = 90 km / 1.5 h = 60 km/h.',
    mistakes: [
      { option: '135 km/h', errorType: 'method', explanation: '90 × 1.5 multiplies distance by time. Speed divides.', fix: 'Divide 90 km by 1.5 h.' },
      { option: '90 km/h', errorType: 'careless', explanation: '90 km is the distance, not the speed.', fix: 'Divide the distance by the time taken.' },
      { option: '1.5 km/h', errorType: 'method', explanation: '1.5 h is the time. Dividing time by distance is not speed.', fix: 'Speed is distance divided by time.' },
    ],
  },
  {
    concept: 'Speed & Velocity',
    prompt: 'Velocity is different from speed because velocity',
    options: ['has a direction', 'is always larger than speed', 'has no unit', 'measures mass'],
    answer: 'has a direction',
    explanation: 'Velocity is speed in a definite direction. Speed is the size of that velocity.',
    mistakes: [
      { option: 'is always larger than speed', errorType: 'concept_gap', explanation: 'The size of the velocity is the speed, so velocity is not a bigger number.', fix: 'Velocity adds a direction. Its magnitude is the speed.' },
      { option: 'has no unit', errorType: 'careless', explanation: 'Velocity uses the same unit as speed.', fix: 'State the unit, such as m/s, and the direction.' },
      { option: 'measures mass', errorType: 'concept_gap', explanation: 'Mass is not part of velocity.', fix: 'Velocity is displacement divided by time.' },
    ],
  },
  {
    concept: 'Acceleration',
    prompt: 'A cyclist speeds up from 4 m/s to 10 m/s in 3 s. The acceleration is',
    options: ['2 m/s²', '14 m/s²', '3.33 m/s²', '6 m/s'],
    answer: '2 m/s²',
    explanation: 'a = (v − u) / t = (10 − 4) / 3 = 2 m/s².',
    mistakes: [
      { option: '14 m/s²', errorType: 'method', explanation: 'Adding 10 and 4 ignores that acceleration uses the change in velocity.', fix: 'Subtract the first speed, then divide by the time.' },
      { option: '3.33 m/s²', errorType: 'careless', explanation: '10 / 3 uses only the final speed.', fix: 'Use (10 − 4) / 3.' },
      { option: '6 m/s', errorType: 'method', explanation: '6 m/s is the change in speed, and it is not yet divided by time.', fix: 'Divide that change by 3 s, and keep the unit m/s².' },
    ],
  },
];

const WEAK_SESSION_PROMPTS: Record<string, MotionCheck> = {
  'Which quantity has direction?': SESSION_CHECKS[0]!,
  'Distance is always…': SESSION_CHECKS[1]!,
  'Speed is distance divided by…': SESSION_CHECKS[2]!,
  'Velocity includes speed and…': SESSION_CHECKS[3]!,
  'Acceleration measures change in…': SESSION_CHECKS[4]!,
};

function motionCheckContent(conceptId: string, check: MotionCheck) {
  return SaveItemSchema.parse({
    type: 'mcq', prompt: check.prompt, options: [...check.options], answer: check.answer,
    difficulty: 2, explanation: check.explanation, mistakes: check.mistakes,
    sourceRef: null, conceptId, role: 'check',
  });
}

function refreshMotionChecks(db: Db, chapterId: string, conceptId: (title: string) => string | undefined) {
  const session = db.select().from(learningSessions).where(eq(learningSessions.chapterId, chapterId)).all()
    .find((row) => row.title.startsWith('Session 3'));
  if (!session) return;
  for (const row of db.select().from(items).where(eq(items.sessionId, session.id)).all()) {
    if (row.content.type !== 'mcq') continue;
    const check = WEAK_SESSION_PROMPTS[row.content.prompt];
    if (!check) continue;
    const linked = conceptId(check.concept);
    if (!linked || linked !== row.conceptId) continue;
    db.update(items).set({ content: motionCheckContent(row.conceptId, check) }).where(eq(items.id, row.id)).run();
  }
}

// Explicit opt-in seed only. The records below cover every demo role and core loop.
export async function seedDemo(db: Db, credentials: z.input<typeof Credentials>, now = Date.now(), options: SeedDemoOptions = {}) {
  const input = Credentials.parse(credentials);
  const existing = db.select().from(schools).where(eq(schools.id, DEMO_SCHOOL_ID)).get();
  if (existing) {
    if (existing.name !== 'Demo school') throw new Error('Demo school ID is already in use.');
    // Content-only upgrade for older demo databases; accounts and progress stay untouched.
    db.transaction(() => {
      // Older demo seeds left Session 3 releasing in the future; the demo session is meant to be explorable all day.
      const future = db.select().from(learningSessions).all()
        .find((row) => row.schoolId === DEMO_SCHOOL_ID && row.title.startsWith('Session 3') && row.releaseAt != null && row.releaseAt > now);
      if (future) db.update(learningSessions).set({ releaseAt: now - 3600000 }).where(eq(learningSessions.id, future.id)).run();
      ensureMotionContent(db, now);
      ensureMotionBank(db, DEMO_SCHOOL_ID, now);
      ensureMotionPairs(db, DEMO_SCHOOL_ID);
      ensureMotionHistories(db, DEMO_SCHOOL_ID, now);
      ensureDailyLoop(db, DEMO_SCHOOL_ID, now);
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
    const opensAt = now - 3600000; // demo: already released so the session surface is explorable all day;
    db.insert(learningSessions).values({ id: session3Id, schoolId, chapterId: motionChapterId, sectionId: section9aId, title: 'Session 3: Motion diagnostic', status: 'published', releaseAt: opensAt, updatedAt: now }).run();
    db.insert(items).values(SESSION_CHECKS.map((check, position) => {
      const conceptId = motionConcepts.find((concept) => concept.title === check.concept)!.id;
      return {
        id: randomUUID(), schoolId, chapterId: motionChapterId, sessionId: session3Id, position, conceptId,
        content: motionCheckContent(conceptId, check),
      };
    })).run();
    ensureMotionContent(db, now);
    ensureMotionBank(db, schoolId, now);
    ensureMotionPairs(db, schoolId);
    ensureMotionHistories(db, schoolId, now);
    ensureDailyLoop(db, schoolId, now);
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
  refreshMotionChecks(db, chapter.id, conceptId);
  ensureTeacherReviewJobs(db, chapter, noteIds, now);
  if (!session || db.select().from(slides).where(eq(slides.sessionId, session.id)).all().length > 0) return;
  db.insert(slides).values(MOTION_SLIDES.map((slide, position) => ({ id: randomUUID(), schoolId: DEMO_SCHOOL_ID, chapterId: chapter.id,
    sessionId: session.id, conceptId: conceptId(slide.concept)!, noteId: noteIds[slide.concept] ?? null, position, title: slide.title, body: slide.body }))).run();
}

/** Idempotently gives the demo teacher lesson review metadata; with no AI provider configured the honest status is not_configured. */
function ensureTeacherReviewJobs(db: Db, chapter: typeof chapters.$inferSelect, noteIds: Record<string, string>, now: number) {
  const teacher = db.select().from(profiles).where(and(eq(profiles.schoolId, DEMO_SCHOOL_ID), eq(profiles.role, 'teacher'))).get();
  const assignment = teacher ? db.select().from(teacherAssignments).where(and(
    eq(teacherAssignments.schoolId, DEMO_SCHOOL_ID), eq(teacherAssignments.teacherProfileId, teacher.id),
    eq(teacherAssignments.subjectId, chapter.subjectId))).get() : null;
  if (!assignment) return;
  for (const concept of ['Distance & Displacement', 'Acceleration'] as const) {
    const noteId = noteIds[concept];
    const existing = noteId && db.select().from(aiDraftJobs).where(and(eq(aiDraftJobs.schoolId, DEMO_SCHOOL_ID),
      eq(aiDraftJobs.noteId, noteId), eq(aiDraftJobs.sectionId, assignment.sectionId))).get();
    if (!noteId || existing) continue;
    const note = db.select().from(notes).where(eq(notes.id, noteId)).get();
    if (!note) continue;
    const source = { noteId, title: note.title, body: note.body,
      concepts: db.select({ id: concepts.id, title: concepts.title }).from(noteConcepts)
        .innerJoin(concepts, eq(concepts.id, noteConcepts.conceptId))
        .where(and(eq(noteConcepts.schoolId, DEMO_SCHOOL_ID), eq(noteConcepts.noteId, noteId))).all() };
    db.insert(aiDraftJobs).values({ id: randomUUID(), schoolId: DEMO_SCHOOL_ID, chapterId: chapter.id, noteId,
      sectionId: assignment.sectionId, requestedBy: teacher!.id, sourceHash: digest(source),
      status: 'not_configured', message: 'AI not configured', draft: null, sessionId: null, assignmentId: null,
      createdAt: now, updatedAt: now }).run();
  }
}

type MotionPair = { concept: string; level: 1 | 2 | 3; prompt: string; explanation: string; pairs: { left: string; right: string }[] };

// Match-the-Concept pairs so the game has a playable bank; the ids stay clear of every other Motion seed.
const MOTION_PAIRS: MotionPair[] = [
  { concept: 'Distance & Displacement', level: 1, prompt: 'Match each motion word to what it means.', explanation: 'Distance counts the whole path; displacement only compares the start and the finish.',
    pairs: [{ left: 'Distance', right: 'The whole path travelled' }, { left: 'Displacement', right: 'Straight line from start to end, with direction' }, { left: 'Zero displacement', right: 'Finished where you started' }] },
  { concept: 'Distance & Displacement', level: 2, prompt: 'Match each quantity to an example of it.', explanation: 'Distance and speed are scalars; displacement and velocity carry a direction, so they are vectors.',
    pairs: [{ left: 'Distance', right: '400 m around the whole track' }, { left: 'Displacement', right: '0 m after one full round' }, { left: 'Speed', right: '50 km/h on a highway' }, { left: 'Velocity', right: '50 km/h towards the north' }] },
  { concept: 'Distance & Displacement', level: 2, prompt: 'Match each walk to its displacement.', explanation: 'Displacement is the straight line from start to finish, so opposite legs can cancel.',
    pairs: [{ left: 'One full round of a 400 m track', right: '0 m' }, { left: '6 m east then 8 m north', right: '10 m' }, { left: '3 m east then 2 m east', right: '5 m east' }] },
  { concept: 'Speed & Velocity', level: 1, prompt: 'Match each speed idea to its formula.', explanation: 'Speed divides distance by time; average speed uses the totals for the whole trip.',
    pairs: [{ left: 'Speed', right: 'distance / time' }, { left: 'Average speed', right: 'total distance / total time' }, { left: 'Velocity', right: 'displacement / time' }] },
  { concept: 'Speed & Velocity', level: 2, prompt: 'Match each reading to what it tells you.', explanation: 'A speed with a direction is a velocity; the same number without direction is only a speed.',
    pairs: [{ left: '60 km/h', right: 'Speed only' }, { left: '60 km/h towards the north', right: 'Velocity' }, { left: 'Steady 60 km/h on a circular track', right: 'Velocity is changing' }] },
  { concept: 'Acceleration', level: 2, prompt: 'Match each motion to the acceleration it shows.', explanation: 'Acceleration is the change in velocity: positive while speeding up, negative while slowing down, zero when steady.',
    pairs: [{ left: 'Speeding up', right: 'Positive acceleration' }, { left: 'Slowing down', right: 'Negative acceleration' }, { left: 'Steady velocity', right: 'Zero acceleration' }] },
  { concept: 'Acceleration', level: 3, prompt: 'Match each equation of motion to what it gives you.', explanation: 'Each equation links a different pair of quantities for uniformly accelerated motion.',
    pairs: [{ left: 'v = u + at', right: 'Velocity after time t' }, { left: 's = ut + ½at²', right: 'Distance covered in time t' }, { left: 'v² = u² + 2as', right: 'Velocity from the distance' }] },
  { concept: 'Units and ratios', level: 1, prompt: 'Match each unit to the quantity it measures.', explanation: 'Metres per second belong to speed, metres per second squared to acceleration.',
    pairs: [{ left: 'Metre per second (m/s)', right: 'Speed' }, { left: 'Metre per second squared (m/s²)', right: 'Acceleration' }, { left: 'Metre (m)', right: 'Distance' }, { left: 'Second (s)', right: 'Time' }] },
  { concept: 'Reading graphs', level: 2, prompt: 'Match each distance-time graph shape to the motion.', explanation: 'On a distance-time graph the slope is the speed: rising, flat, or steep tells the whole story.',
    pairs: [{ left: 'Straight line rising steadily', right: 'Constant speed' }, { left: 'Flat horizontal line', right: 'Standing still' }, { left: 'Steep straight line', right: 'Fast constant speed' }] },
  { concept: 'Reading graphs', level: 3, prompt: 'Match each velocity-time graph shape to the motion.', explanation: 'On a velocity-time graph the slope is the acceleration and the area under it is the distance.',
    pairs: [{ left: 'Horizontal line above zero', right: 'Constant velocity' }, { left: 'Line rising from the origin', right: 'Speeding up from rest' }, { left: 'Line falling to zero', right: 'Slowing to a stop' }] },
];

const motionPairId = (n: number) => `d7000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const MOTION_PRACTICE_ASSIGNMENT_ID = 'd7000000-0000-4000-8000-000000000301';

/** Idempotently adds the Match-the-Concept pair bank and links it to the Motion practice assignment. */
function ensureMotionPairs(db: Db, schoolId: string) {
  const chapter = db.select().from(chapters).where(and(eq(chapters.schoolId, schoolId), eq(chapters.title, 'Motion'))).get();
  if (!chapter) return;
  const conceptRows = db.select().from(concepts).where(eq(concepts.chapterId, chapter.id)).all();
  const conceptId = (title: string) => conceptRows.find((row) => row.title === title)?.id;
  const assignment = db.select().from(assignments).where(eq(assignments.id, MOTION_PRACTICE_ASSIGNMENT_ID)).get();
  MOTION_PAIRS.forEach((question, index) => {
    const owner = conceptId(question.concept);
    if (!owner) return;
    const itemId = motionPairId(1701 + index);
    const content = SaveItemSchema.parse({
      type: 'match_pairs', conceptId: owner, prompt: question.prompt, difficulty: question.level, sourceRef: null,
      explanation: question.explanation, pairs: question.pairs, role: 'practice',
    });
    const existing = db.select().from(items).where(eq(items.id, itemId)).get();
    if (!existing) {
      db.insert(items).values({ id: itemId, schoolId, chapterId: chapter.id, sessionId: null, conceptId: owner, position: 500 + index, content }).run();
    } else if (JSON.stringify(existing.content) !== JSON.stringify(content) || existing.conceptId !== owner) {
      db.update(items).set({ content, conceptId: owner }).where(eq(items.id, itemId)).run();
    }
    if (assignment && !db.select().from(assignmentItems).where(and(eq(assignmentItems.assignmentId, assignment.id), eq(assignmentItems.itemId, itemId))).get()) {
      db.insert(assignmentItems).values({ assignmentId: assignment.id, itemId, schoolId, chapterId: chapter.id, position: 500 + index }).run();
    }
  });
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
const CANONICAL_PINS: Record<string, string> = { Aarav: '2468', Meera: '2468', Kabir: '2468', Priya: '2468', Rohan: '2468' };

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
      'Meera: 2468',
      'Kabir: 2468',
      'Priya: 2468',
      'Rohan: 2468',
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

