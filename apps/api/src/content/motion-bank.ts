import { and, eq } from 'drizzle-orm';
import { SaveItemSchema, type SaveItem } from '@vidhyasaathy/contracts';
import { NOT_TAUGHT, classifyError, type Confidence } from '@vidhyasaathy/core/learning';
import type { Db } from '../db/index.ts';
import { answerEvidence, assignmentItems, assignments, conceptPrereqs, concepts, items, learningSessions, profiles, teacherAssignments } from '../db/schema.ts';
import { rebuildLearner } from '../learning/record.ts';
import { MOTION_EXTRA, type ExtraQuestion } from './motion-bank-extra.ts';
import { ensureMotionLessons } from './motion-lessons.ts';
import { MOTION_SLIPS } from './motion-slips.ts';

const id = (n: number) => `d7000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const SKIP = NOT_TAUGHT;
type Family = 'concept_gap' | 'careless' | 'method' | 'guess';
export type MotionMistake = { option: string; errorType: Family; explanation: string; fix: string };
type Question = {
  id: string; concept: string; level: 1 | 2 | 3 | 4; prompt: string; options: string[]; answer: string;
  explanation: string; mistakes?: { option: string; errorType: Family; explanation: string }[]; role: 'practice' | 'diagnostic';
};

const PRACTICE: Question[] = [
  { id: id(1001), concept: 'Distance & Displacement', level: 1, role: 'practice', prompt: 'A runner completes one round of a 400 m track. What are the distance and the displacement?', options: ['400 m and 0', '0 and 400 m', '400 m and 400 m', '0 and 0'], answer: '400 m and 0', explanation: 'Displacement (विस्थापन) compares only the start and the finish, so one full round has displacement zero.', mistakes: [{ option: '0 and 400 m', errorType: 'concept_gap', explanation: 'Distance is the whole path. Displacement is zero when the runner is back at the start.' }] },
  { id: id(1002), concept: 'Distance & Displacement', level: 1, role: 'practice', prompt: 'Distance is a scalar quantity because it', options: ['has magnitude only', 'includes a direction', 'can be negative', 'is the same as velocity'], answer: 'has magnitude only', explanation: 'Distance has size only. It does not point in a direction and it is never negative.', mistakes: [{ option: 'includes a direction', errorType: 'concept_gap', explanation: 'Direction belongs to displacement, not to distance.' }] },
  { id: id(1003), concept: 'Distance & Displacement', level: 2, role: 'practice', prompt: 'A student walks 4 m east and then 3 m north. What is the magnitude of the displacement?', options: ['5 m', '7 m', '1 m', '12 m'], answer: '5 m', explanation: 'The straight-line displacement is the hypotenuse, 5 m, while the distance walked is 7 m.', mistakes: [{ option: '7 m', errorType: 'method', explanation: '7 m is the distance along the path. Displacement is the straight line, 5 m.' }] },
  { id: id(1004), concept: 'Distance & Displacement', level: 2, role: 'practice', prompt: 'Displacement of a moving object can be', options: ['positive, negative or zero', 'only positive', 'only zero', 'always greater than distance'], answer: 'positive, negative or zero', explanation: 'Displacement has direction, so its sign can be positive, negative, or zero.', mistakes: [{ option: 'always greater than distance', errorType: 'concept_gap', explanation: 'Displacement is never longer than the path. Distance is the longer one, or they are equal.' }] },
  { id: id(1005), concept: 'Distance & Displacement', level: 3, role: 'practice', prompt: 'A farmer walks the boundary of a square field of side 10 m. Each round takes 40 s. What is the magnitude of the displacement after 2 min 20 s?', options: ['14.1 m', '0', '140 m', '10 m'], answer: '14.1 m', explanation: '2 min 20 s is 3.5 rounds, which ends at the opposite corner. The straight-line displacement is 10√2 m, about 14.1 m.', mistakes: [{ option: '140 m', errorType: 'method', explanation: '140 m is the distance of 3.5 rounds. Displacement is the diagonal, about 14.1 m.' }, { option: '0', errorType: 'concept_gap', explanation: 'Displacement is zero after a whole number of rounds. 3.5 rounds ends across the field.' }] },
  { id: id(1006), concept: 'Distance & Displacement', level: 4, role: 'practice', prompt: 'Can an object move through a distance and still have zero displacement?', options: ['Yes, if it returns to its starting point', 'No, they are always equal', 'Only if its speed is zero', 'Only on a perfectly straight road'], answer: 'Yes, if it returns to its starting point', explanation: 'Any closed path has some distance and zero displacement, because the start and finish are the same point.', mistakes: [{ option: 'No, they are always equal', errorType: 'concept_gap', explanation: 'Distance and displacement are equal only for motion in one straight direction without turning back.' }] },
  { id: id(1007), concept: 'Distance & Displacement', level: 4, role: 'practice', prompt: 'A bus goes from home to school and back by the same road. Which statement is true?', options: ['Distance is not zero and displacement is zero', 'Both are zero', 'Displacement is larger than distance', 'Distance is zero and displacement is not'], answer: 'Distance is not zero and displacement is zero', explanation: 'The bus travelled a path, so distance is not zero, but it finished where it started.', mistakes: [{ option: 'Displacement is larger than distance', errorType: 'concept_gap', explanation: 'The straight-line displacement cannot be longer than the path travelled.' }] },
  { id: id(1101), concept: 'Speed & Velocity', level: 1, role: 'practice', prompt: 'Speed is', options: ['distance divided by time', 'displacement divided by time', 'mass multiplied by velocity', 'time divided by distance'], answer: 'distance divided by time', explanation: 'Speed = distance / time. It does not use direction.', mistakes: [{ option: 'displacement divided by time', errorType: 'concept_gap', explanation: 'Displacement divided by time is velocity. Speed uses distance.' }] },
  { id: id(1102), concept: 'Speed & Velocity', level: 1, role: 'practice', prompt: 'The SI unit of speed is', options: ['m/s', 'km/h', 'm/s²', 's/m'], answer: 'm/s', explanation: 'The SI unit of speed is metre per second.', mistakes: [{ option: 'km/h', errorType: 'method', explanation: 'km/h is a common unit, but the SI unit is m/s.' }] },
  { id: id(1103), concept: 'Speed & Velocity', level: 2, role: 'practice', prompt: 'A car travels 100 km in 2 h. What is its average speed?', options: ['50 km/h', '200 km/h', '102 km/h', '2 km/h'], answer: '50 km/h', explanation: 'Average speed = total distance / total time = 100 km / 2 h = 50 km/h.', mistakes: [{ option: '200 km/h', errorType: 'method', explanation: 'Multiplying 100 by 2 gives 200. Speed divides distance by time.' }] },
  { id: id(1104), concept: 'Speed & Velocity', level: 2, role: 'practice', prompt: 'Velocity differs from speed because velocity', options: ['includes direction', 'is always a larger number', 'has no unit', 'is a scalar'], answer: 'includes direction', explanation: 'Velocity is speed in a definite direction. Speed has no direction.', mistakes: [{ option: 'is a scalar', errorType: 'concept_gap', explanation: 'Speed is the scalar. Velocity is the vector, because it has direction.' }] },
  { id: id(1105), concept: 'Speed & Velocity', level: 3, role: 'practice', prompt: 'A body moves in a circle at a steady speed. Its velocity is', options: ['changing, because the direction changes', 'constant, because the speed is constant', 'zero', 'equal to its acceleration'], answer: 'changing, because the direction changes', explanation: 'Velocity changes whenever the direction changes, even if the speed stays the same.', mistakes: [{ option: 'constant, because the speed is constant', errorType: 'concept_gap', explanation: 'A steady speed on a curve is not a steady velocity. The direction keeps changing.' }] },
  { id: id(1106), concept: 'Speed & Velocity', level: 3, role: 'practice', prompt: 'An object returns to its starting point. Its average velocity for the trip is', options: ['zero', 'equal to its average speed', 'always 10 m/s', 'equal to the distance'], answer: 'zero', explanation: 'Average velocity uses displacement. A return to the start means displacement zero, so average velocity is zero.', mistakes: [{ option: 'equal to its average speed', errorType: 'concept_gap', explanation: 'Average speed uses distance and is not zero. Average velocity uses displacement and is zero.' }] },
  { id: id(1107), concept: 'Speed & Velocity', level: 4, role: 'practice', prompt: 'A car odometer reads 2000 km at the start of a trip and 2400 km after 8 h. What is the average speed?', options: ['50 km/h', '400 km/h', '2400 km/h', '8 km/h'], answer: '50 km/h', explanation: 'The car covered 400 km in 8 h, so average speed is 50 km/h.', mistakes: [{ option: '400 km/h', errorType: 'method', explanation: '400 km is the distance. Divide by 8 h to get 50 km/h.' }] },
  { id: id(1108), concept: 'Speed & Velocity', level: 4, role: 'practice', prompt: 'A scooter covers 10 km in 15 minutes. What is its average speed?', options: ['40 km/h', '10 km/h', '150 km/h', '0.67 km/h'], answer: '40 km/h', explanation: '15 minutes is 0.25 h. Average speed = 10 km / 0.25 h = 40 km/h.', mistakes: [{ option: '10 km/h', errorType: 'method', explanation: '10 km is the distance. Divide by 0.25 h, not by 1 h.' }] },
  { id: id(1201), concept: 'Acceleration', level: 1, role: 'practice', prompt: 'Acceleration is the rate of change of', options: ['velocity', 'distance only', 'mass', 'time'], answer: 'velocity', explanation: 'Acceleration tells how quickly velocity changes with time.', mistakes: [{ option: 'distance only', errorType: 'concept_gap', explanation: 'Distance has no direction. Acceleration is about the change in velocity.' }] },
  { id: id(1202), concept: 'Acceleration', level: 1, role: 'practice', prompt: 'The SI unit of acceleration is', options: ['m/s²', 'm/s', 'km/h', 's²/m'], answer: 'm/s²', explanation: 'Acceleration is velocity change per second, so its SI unit is m/s².', mistakes: [{ option: 'm/s', errorType: 'method', explanation: 'm/s is the unit of speed and velocity, not of acceleration.' }] },
  { id: id(1203), concept: 'Acceleration', level: 2, role: 'practice', prompt: 'Negative acceleration means the', options: ['velocity is decreasing', 'object must be at rest', 'distance is zero', 'speed has no direction'], answer: 'velocity is decreasing', explanation: 'Negative acceleration, also called retardation, means the velocity is decreasing.', mistakes: [{ option: 'object must be at rest', errorType: 'concept_gap', explanation: 'An object can be moving and still be slowing down. Rest means velocity is zero, not that acceleration is negative.' }] },
  { id: id(1204), concept: 'Acceleration', level: 2, role: 'practice', prompt: 'Which is the first equation of uniformly accelerated motion?', options: ['v = u + at', 's = ut + ½at²', 'v² = u² + 2as', 'F = ma'], answer: 'v = u + at', explanation: 'The first equation of motion is v = u + at.', mistakes: [{ option: 'F = ma', errorType: 'concept_gap', explanation: 'F = ma relates force and acceleration. The equation of motion here is v = u + at.' }] },
  { id: id(1205), concept: 'Acceleration', level: 3, role: 'practice', prompt: 'A bus slows from 80 km/h to 60 km/h in 5 s. Its acceleration is about', options: ['-1.11 m/s²', '4 m/s²', '-4 m/s²', '1.11 m/s²'], answer: '-1.11 m/s²', explanation: 'Convert to m/s first: 80 km/h is about 22.2 m/s and 60 km/h is about 16.7 m/s. a = (v − u) / t is about −1.11 m/s².', mistakes: [{ option: '-4 m/s²', errorType: 'method', explanation: '(60 − 80) / 5 = −4 only if the speeds stay in km/h. Convert to m/s before dividing by seconds.' }] },
  { id: id(1206), concept: 'Acceleration', level: 3, role: 'practice', prompt: 'A train starts from rest and reaches 40 km/h in 10 minutes. Its acceleration is about', options: ['0.0185 m/s²', '4 m/s²', '0.67 m/s²', '0'], answer: '0.0185 m/s²', explanation: '40 km/h is about 11.1 m/s and 10 minutes is 600 s. a = 11.1 / 600, about 0.0185 m/s².', mistakes: [{ option: '4 m/s²', errorType: 'method', explanation: '40 / 10 forgets that 10 minutes is 600 s and that 40 km/h must be changed to m/s.' }] },
  { id: id(1207), concept: 'Acceleration', level: 4, role: 'practice', prompt: 'A car speeds up uniformly from 18 km/h to 36 km/h in 5 s. How far does it travel in that time?', options: ['37.5 m', '25 m', '135 m', '7.5 m'], answer: '37.5 m', explanation: '18 km/h is 5 m/s and 36 km/h is 10 m/s, so a = 1 m/s². s = ut + ½at² = 25 + 12.5 = 37.5 m.', mistakes: [{ option: '25 m', errorType: 'method', explanation: '25 m is only the ut part. Add ½at² as well.' }] },
  { id: id(1208), concept: 'Acceleration', level: 4, role: 'practice', prompt: 'A stone thrown straight up is at the top of its path. Its acceleration is', options: ['about 9.8 m/s² downward', 'zero', 'upward', 'equal to its speed'], answer: 'about 9.8 m/s² downward', explanation: 'Speed is zero for an instant at the top, but gravity still accelerates the stone downward at about 9.8 m/s².', mistakes: [{ option: 'zero', errorType: 'concept_gap', explanation: 'Zero at the top is the velocity, not the acceleration. Gravity has not switched off.' }] },
  { id: id(1401), concept: 'Distance & Displacement', level: 2, role: 'practice', prompt: 'A distance-time graph is a straight line through the origin. It reads 0 m at 0 s and 60 m at 10 s. The speed is', options: ['6 m/s', '60 m/s', '10 m/s', '600 m/s'], answer: '6 m/s', explanation: 'The slope of a distance-time graph is the speed: 60 m / 10 s = 6 m/s.', mistakes: [] },
  { id: id(1402), concept: 'Speed & Velocity', level: 3, role: 'practice', prompt: 'A velocity-time graph is a horizontal line at 8 m/s from 0 to 5 s. The distance covered is', options: ['40 m', '8 m', '13 m', '1.6 m'], answer: '40 m', explanation: 'The area under a velocity-time graph is the distance: 8 m/s × 5 s = 40 m.', mistakes: [] },
  { id: id(1403), concept: 'Acceleration', level: 2, role: 'practice', prompt: 'The slope of a velocity-time graph gives the', options: ['acceleration', 'speed', 'distance', 'the time only'], answer: 'acceleration', explanation: 'Slope = change in velocity / time, which is the acceleration. The area under the same graph is the distance.', mistakes: [] },
  { id: id(1404), concept: 'Acceleration', level: 3, role: 'practice', prompt: 'Using v² = u² + 2as, a body starts from rest and accelerates at 2 m/s² through 9 m. Its speed is', options: ['6 m/s', '36 m/s', '18 m/s', '4.5 m/s'], answer: '6 m/s', explanation: 'v² = 0 + 2×2×9 = 36, so v = 6 m/s.', mistakes: [] },
  { id: id(1405), concept: 'Acceleration', level: 3, role: 'practice', prompt: 'Using s = ut + ½at² with u = 0, a = 4 m/s² and t = 3 s, the distance is', options: ['18 m', '12 m', '36 m', '6 m'], answer: '18 m', explanation: 's = 0 + ½×4×3² = 18 m.', mistakes: [] },
  { id: id(1406), concept: 'Speed & Velocity', level: 4, role: 'practice', prompt: 'In uniform circular motion', options: ['the speed is constant and the direction keeps changing', 'speed and velocity are both constant', 'the acceleration is zero', 'the displacement equals the circumference'], answer: 'the speed is constant and the direction keeps changing', explanation: 'The speed stays the same, but the direction changes continuously, so the velocity changes and there is a centripetal acceleration.', mistakes: [] },
];

const DIAGNOSTIC: Question[] = [
  { id: id(1301), concept: 'Motion and Time', level: 1, role: 'diagnostic', prompt: 'A toy car covers 20 m in 5 s. What is its speed?', options: ['4 m/s', '100 m/s', '15 m/s', SKIP], answer: '4 m/s', explanation: 'Speed = distance / time = 20 / 5 = 4 m/s.', mistakes: [{ option: '100 m/s', errorType: 'method', explanation: 'Multiplying 20 by 5 gives 100. Speed divides distance by time.' }] },
  { id: id(1302), concept: 'Motion and Time', level: 1, role: 'diagnostic', prompt: 'The SI unit of time is the', options: ['second', 'minute', 'hour', SKIP], answer: 'second', explanation: 'The SI unit of time is the second.', mistakes: [{ option: 'minute', errorType: 'concept_gap', explanation: 'Minutes are useful, but the SI unit is the second.' }] },
  { id: id(1303), concept: 'Units and ratios', level: 1, role: 'diagnostic', prompt: 'Which of these is a ratio of two lengths?', options: ['3 m : 2 m', '3 m : 2 s', '3 kg : 2 m', SKIP], answer: '3 m : 2 m', explanation: 'A ratio compares two quantities of the same kind. Both parts here are lengths.', mistakes: [{ option: '3 m : 2 s', errorType: 'concept_gap', explanation: 'Metres and seconds are different kinds of quantity, so this is not a length ratio.' }] },
  { id: id(1304), concept: 'Units and ratios', level: 2, role: 'diagnostic', prompt: 'To convert a speed in km/h into m/s, multiply by', options: ['5/18', '18/5', '1000', SKIP], answer: '5/18', explanation: '1 km/h = 1000 m / 3600 s = 5/18 m/s.', mistakes: [{ option: '18/5', errorType: 'method', explanation: '18/5 converts m/s into km/h. km/h into m/s uses 5/18.' }] },
  { id: id(1305), concept: 'Reading graphs', level: 1, role: 'diagnostic', prompt: 'A straight distance-time graph through the origin means the object', options: ['moves at uniform speed', 'is at rest', 'is speeding up', SKIP], answer: 'moves at uniform speed', explanation: 'A straight distance-time graph means equal distances in equal times: uniform speed.', mistakes: [{ option: 'is at rest', errorType: 'concept_gap', explanation: 'Rest is a horizontal distance-time graph. A sloping straight line is uniform speed.' }] },
  { id: id(1306), concept: 'Reading graphs', level: 2, role: 'diagnostic', prompt: 'The slope of a distance-time graph gives', options: ['speed', 'acceleration', 'the time only', SKIP], answer: 'speed', explanation: 'On a distance-time graph, slope = distance / time = speed.', mistakes: [{ option: 'acceleration', errorType: 'concept_gap', explanation: 'Acceleration is the slope of a velocity-time graph, not a distance-time graph.' }] },
];

const PREREQS = [
  { id: id(201), title: 'Motion and Time', sourceClass: 7, description: 'Class 7: speed is distance divided by time, and uniform motion covers equal distances in equal times.' },
  { id: id(202), title: 'Units and ratios', sourceClass: 7, description: 'Class 7: a ratio compares two quantities of the same kind, and km/h converts to m/s by multiplying by 5/18.' },
  { id: id(203), title: 'Reading graphs', sourceClass: 7, description: 'Class 7: the slope of a distance-time graph is the speed.' },
] as const;

const CHAPTER_LINKS: Record<string, string[]> = {
  'Distance & Displacement': ['Motion and Time', 'Reading graphs'],
  'Speed & Velocity': ['Units and ratios', 'Motion and Time'],
  Acceleration: ['Units and ratios'],
};

function practiceMistakes(question: Question) {
  const number = Number(question.id.slice(-12));
  const slips = MOTION_SLIPS[number];
  const wrong = question.options.filter((option) => option !== question.answer);
  if (!slips || wrong.some((option) => !slips[option]?.explanation || !slips[option]?.fix)) {
    throw new Error(`Motion practice is missing a misconception for ${question.id}.`);
  }
  return wrong.map((option) => ({ option, ...slips[option]! }));
}

function contentFor(question: Question, conceptId: string): SaveItem {
  const mistakes = question.role === 'practice' ? practiceMistakes(question) : question.mistakes;
  return SaveItemSchema.parse({
    type: 'mcq', conceptId, prompt: question.prompt, options: question.options, answer: question.answer,
    difficulty: question.level, sourceRef: null, explanation: question.explanation, mistakes, role: question.role,
  });
}

const SAMPLE_CONCEPT = 'd7000000-0000-4000-8000-000000000099';
export const motionPractice = PRACTICE;
export const motionDiagnostic = DIAGNOSTIC;
export function motionContents() {
  return PRACTICE.map((question) => contentFor(question, SAMPLE_CONCEPT));
}

function extraContent(question: ExtraQuestion, conceptId: string): SaveItem {
  return SaveItemSchema.parse({
    type: 'mcq', conceptId, prompt: question.prompt, options: question.options, answer: question.answer,
    difficulty: question.level, sourceRef: null, explanation: question.explanation, mistakes: question.mistakes, role: 'practice',
  });
}
export const motionExtra = MOTION_EXTRA;
export function motionExtraContents() {
  return MOTION_EXTRA.map((question) => extraContent(question, SAMPLE_CONCEPT));
}

// Runs after ensureMotionLessons, which creates the uniform-motion and graph concepts these questions use.
// Extra questions join the practice pool only; the 'Motion practice' homework keeps its original 30.
function ensureMotionExtra(db: Db, schoolId: string, chapterId: string) {
  const byTitle = new Map(db.select().from(concepts).where(and(eq(concepts.schoolId, schoolId), eq(concepts.chapterId, chapterId))).all()
    .map((row) => [row.title, row.id]));
  MOTION_EXTRA.forEach((question, index) => {
    const conceptId = byTitle.get(question.concept);
    if (!conceptId) return;
    const itemId = id(question.n);
    const content = extraContent(question, conceptId);
    const existing = db.select().from(items).where(eq(items.id, itemId)).get();
    if (!existing) {
      db.insert(items).values({ id: itemId, schoolId, chapterId, sessionId: null, conceptId, position: 400 + index, content }).run();
      return;
    }
    if (JSON.stringify(existing.content) !== JSON.stringify(content) || existing.conceptId !== conceptId) {
      db.update(items).set({ content, conceptId }).where(eq(items.id, itemId)).run();
    }
  });
}

export function ensureMotionBank(db: Db, schoolId: string, now: number) {
  const chapter = db.select().from(concepts).where(eq(concepts.schoolId, schoolId)).all();
  const motion = db.select().from(learningSessions).where(eq(learningSessions.schoolId, schoolId)).all().find((row) => row.title.startsWith('Session 3'));
  if (!motion) return;
  const chapterId = motion.chapterId;
  const byTitle = new Map(chapter.filter((row) => row.chapterId === chapterId).map((row) => [row.title, row]));
  for (const prereq of PREREQS) {
    if (byTitle.has(prereq.title)) continue;
    db.insert(concepts).values({ id: prereq.id, schoolId, chapterId, title: prereq.title, description: prereq.description, sourceClass: prereq.sourceClass }).run();
    byTitle.set(prereq.title, { id: prereq.id, schoolId, chapterId, title: prereq.title, description: prereq.description, sourceClass: prereq.sourceClass });
  }
  for (const [title, prereqTitles] of Object.entries(CHAPTER_LINKS)) {
    const concept = byTitle.get(title);
    if (!concept) continue;
    for (const prereqTitle of prereqTitles) {
      const prereq = byTitle.get(prereqTitle);
      if (!prereq) continue;
      const exists = db.select().from(conceptPrereqs).where(and(eq(conceptPrereqs.conceptId, concept.id), eq(conceptPrereqs.prereqId, prereq.id))).get();
      if (!exists) db.insert(conceptPrereqs).values({ schoolId, conceptId: concept.id, prereqId: prereq.id }).run();
    }
  }
  const bank = [...PRACTICE, ...DIAGNOSTIC];
  bank.forEach((question, position) => {
    const concept = byTitle.get(question.concept);
    if (!concept) return;
    const content = contentFor(question, concept.id);
    const existing = db.select().from(items).where(eq(items.id, question.id)).get();
    if (!existing) {
      db.insert(items).values({
        id: question.id, schoolId, chapterId, sessionId: null, conceptId: concept.id, position: 100 + position, content,
      }).run();
      return;
    }
    if (JSON.stringify(existing.content) !== JSON.stringify(content) || existing.conceptId !== concept.id) {
      db.update(items).set({ content, conceptId: concept.id }).where(eq(items.id, question.id)).run();
    }
  });
  ensureMotionLessons(db, schoolId, chapterId, now);
  ensureMotionExtra(db, schoolId, chapterId);
  const teacher = db.select().from(teacherAssignments).where(eq(teacherAssignments.schoolId, schoolId)).all()
    .find((row) => row.sectionId === motion.sectionId);
  if (!teacher) return;
  if (!db.select().from(assignments).where(eq(assignments.id, id(301))).get()) {
    db.insert(assignments).values({
      id: id(301), schoolId, chapterId, sectionId: motion.sectionId, teacherId: teacher.teacherProfileId,
      title: 'Motion practice', kind: 'homework', dueAt: now + 14 * 86400000, status: 'published', publishedAt: now, updatedAt: now,
    }).run();
  }
  PRACTICE.forEach((question, position) => {
    const concept = byTitle.get(question.concept);
    if (!concept) return;
    const linked = db.select().from(assignmentItems).where(and(eq(assignmentItems.assignmentId, id(301)), eq(assignmentItems.itemId, question.id))).get();
    if (!linked) db.insert(assignmentItems).values({ assignmentId: id(301), itemId: question.id, schoolId, chapterId, position }).run();
  });
}

export function ensureMotionHistories(db: Db, schoolId: string, now: number) {
  const people = db.select().from(profiles).where(and(eq(profiles.schoolId, schoolId), eq(profiles.role, 'student'))).all();
  const byName = new Map(people.map((row) => [row.name, row.id]));
  const bank = new Map(PRACTICE.map((question) => [question.id, question]));
  const itemOf = new Map(db.select().from(items).where(eq(items.schoolId, schoolId)).all().map((row) => [row.id, row]));
  const add = (name: string, questionId: string, correct: boolean, confidence: Confidence, daysAgo: number, n: number) => {
    const profileId = byName.get(name);
    const question = bank.get(questionId);
    const item = itemOf.get(questionId);
    if (!profileId || !question || !item) return;
    const timeMs = 20_000;
    db.insert(answerEvidence).values({
      id: `demo:motion:${name}:${questionId}:${n}`, schoolId, profileId, conceptId: item.conceptId, itemId: questionId, level: question.level,
      correct, confidence, source: 'practice', timeMs, answer: correct ? question.answer : (question.mistakes?.[0]?.option ?? question.options.find((option) => option !== question.answer) ?? question.answer),
      errorType: classifyError({ correct, confidence, level: question.level, timeMs, notTaught: false }), notTaught: false, createdAt: Math.max(0, now - daysAgo * 86400000 - n),
    }).onConflictDoNothing().run();
  };
  const titles = ['Distance & Displacement', 'Speed & Velocity', 'Acceleration'];
  for (const title of titles) {
    const owned = PRACTICE.filter((question) => question.concept === title);
    const basic = owned.filter((question) => question.level === 1);
    owned.forEach((question, index) => add('Aarav', question.id, true, 'sure', 3, index));
    if (basic[0] && basic[1]) {
      for (let n = 0; n < 3; n += 1) add('Meera', basic[0].id, true, 'sure', 6, n);
      for (let n = 0; n < 2; n += 1) add('Meera', basic[1].id, false, 'unsure', 2, n);
      for (let n = 0; n < 2; n += 1) add('Kabir', basic[0].id, true, 'sure', 8, n);
      for (let n = 0; n < 3; n += 1) add('Kabir', basic[1].id, false, 'unsure', 4, n);
    }
    const twist = owned.find((question) => question.level >= 2);
    if (twist) for (let n = 0; n < 4; n += 1) add('Priya', twist.id, false, 'sure', 5, n);
  }
  const firstDistance = PRACTICE.find((question) => question.concept === 'Distance & Displacement' && question.level === 1);
  if (firstDistance) add('Rohan', firstDistance.id, false, 'unsure', 20, 0);
  for (const name of ['Aarav', 'Meera', 'Kabir', 'Priya', 'Rohan']) {
    const profileId = byName.get(name);
    if (profileId) rebuildLearner(db, schoolId, profileId, now);
  }
}
