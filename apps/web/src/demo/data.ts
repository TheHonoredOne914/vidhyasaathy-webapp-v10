import { z } from 'zod';

export const DEMO_DATE = '2026-11-02';
export const DEMO_STORAGE_KEY = 'vidhyasaathy.dashboard-demo.v1';
const NamedSchema = z.object({ id: z.string().min(1), name: z.string().trim().min(1).max(80) });
export const StudentSchema = NamedSchema.extend({ classId: z.string(), note: z.string().max(240) });
export const TeacherSchema = NamedSchema.extend({ subjectId: z.string(), classId: z.string() });
export const ClassSchema = NamedSchema.extend({});
export const SubjectSchema = NamedSchema.extend({});
export const AssignmentSchema = z.object({ id: z.string(), title: z.string().trim().min(1).max(120), classId: z.string(), subjectId: z.string(), due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), completedBy: z.array(z.string()) });
export const DemoStateSchema = z.object({ version: z.literal(1), students: z.array(StudentSchema).min(1), teachers: z.array(TeacherSchema), classes: z.array(ClassSchema).min(1), subjects: z.array(SubjectSchema).min(1), assignments: z.array(AssignmentSchema) });
export type DemoState = z.infer<typeof DemoStateSchema>;
export type Student = z.infer<typeof StudentSchema>;
export type Mastery = 'New' | "Let's fix this" | 'Almost there' | 'Mastered' | 'Top form';

export const demoSeed: DemoState = {
  version: 1,
  classes: [{ id: 'class-9a', name: 'Class 9 · A' }, { id: 'class-9b', name: 'Class 9 · B' }],
  subjects: [{ id: 'physics', name: 'Physics' }, { id: 'maths', name: 'Mathematics' }],
  teachers: [{ id: 'teacher-ananya', name: 'Ananya Rao', subjectId: 'physics', classId: 'class-9a' }, { id: 'teacher-dev', name: 'Dev Shah', subjectId: 'maths', classId: 'class-9b' }],
  students: [
    { id: 'aarav', name: 'Aarav', classId: 'class-9a', note: 'Finding his feet with distance-time graphs. A worked example helps.' },
    { id: 'meera', name: 'Meera', classId: 'class-9a', note: 'Explains ideas clearly. Ready to connect graphs with everyday journeys.' },
    { id: 'kabir', name: 'Kabir', classId: 'class-9b', note: 'Enjoys visual explorations. Encourage him to explain each step.' },
    { id: 'priya', name: 'Priya', classId: 'class-9b', note: 'Hindi terms alongside English help. Start with a familiar everyday example.' },
    { id: 'rohan', name: 'Rohan', classId: 'class-9a', note: 'Missed two lessons. Offer a short catch-up before new practice.' },
  ],
  assignments: [
    { id: 'assignment-motion', title: 'Read a journey graph', classId: 'class-9a', subjectId: 'physics', due: '2026-11-04', completedBy: ['meera'] },
    { id: 'assignment-plane', title: 'Find points on the Cartesian plane', classId: 'class-9b', subjectId: 'maths', due: '2026-11-05', completedBy: ['kabir'] },
  ],
};

export const parentChildIds = ['aarav', 'priya'];
export const concepts: { id: string; name: string; subjectId: string; chapter: string }[] = [
  { id: 'distance', name: 'Distance and displacement', subjectId: 'physics', chapter: 'Motion' },
  { id: 'speed', name: 'Speed and velocity', subjectId: 'physics', chapter: 'Motion' },
  { id: 'graph', name: 'Distance-time graphs', subjectId: 'physics', chapter: 'Motion' },
  { id: 'axes', name: 'Axes and origin', subjectId: 'maths', chapter: 'Coordinate Geometry' },
  { id: 'points', name: 'Plotting ordered pairs', subjectId: 'maths', chapter: 'Coordinate Geometry' },
];
const words: Mastery[][] = [
  ['Mastered', 'Almost there', "Let's fix this", 'Mastered', 'Almost there'],
  ['Top form', 'Mastered', 'Mastered', 'Top form', 'Mastered'],
  ['Mastered', 'Almost there', 'Almost there', 'Mastered', 'Top form'],
  ['Almost there', "Let's fix this", 'New', 'Almost there', "Let's fix this"],
  ['Almost there', 'New', 'New', 'Almost there', 'New'],
];
// Explicitly fictional observations, never student scoring or diagnostic evidence.
export const observations = demoSeed.students.flatMap((student, i) => concepts.map((concept, j) => ({ studentId: student.id, conceptId: concept.id, word: words[i]![j]! })));
export type Activity = { id: string; studentId: string; subjectId: string; day: string; minutes: number; kind: 'Learn' | 'Practise' | 'Games' | 'Sessions'; title: string; detail: string };
export const activities: Activity[] = demoSeed.students.flatMap((student, index) => Array.from({ length: 14 }, (_, offset) => {
  if ((student.id === 'rohan' && offset < 4) || (offset + index) % 5 === 0) return [];
  const subjectId = (offset + index) % 2 ? 'maths' : 'physics';
  const kind = (['Learn', 'Practise', 'Games', 'Sessions'] as const)[(offset + index) % 4]!;
  const day = new Date(Date.parse(`${DEMO_DATE}T12:00:00Z`) - offset * 86400000).toISOString().slice(0, 10);
  return [{ id: `activity-${student.id}-${offset}`, studentId: student.id, subjectId, day, minutes: 12 + (offset * 7 + index * 3) % 24, kind,
    title: kind === 'Games' ? (subjectId === 'maths' ? 'Cartesian explorer' : 'Motion graph explorer') : `${subjectId === 'maths' ? 'Coordinate Geometry' : 'Motion'} · ${kind.toLowerCase()}`,
    detail: kind === 'Sessions' ? 'Learned with an example, explored a visual, and reviewed the main idea.' : kind === 'Games' ? 'Connected a visual activity to the chapter. This is a sample activity record.' : 'Worked through the chapter with a short explanation and guided practice.' }];
}).flat());

export function inPeriod(day: string, days: number) {
  const age = (Date.parse(`${DEMO_DATE}T12:00:00Z`) - Date.parse(`${day}T12:00:00Z`)) / 86400000;
  return age >= 0 && age < days;
}
export function studentActivities(studentId: string, days: number) {
  return activities.filter((row) => row.studentId === studentId && inPeriod(row.day, days));
}
export function subjectProgress(studentId: string, subjectId: string) {
  const rows = observations.filter((row) => row.studentId === studentId && concepts.some((concept) => concept.id === row.conceptId && concept.subjectId === subjectId));
  return { secure: rows.filter((row) => row.word === 'Mastered' || row.word === 'Top form').length, total: rows.length };
}
export function validDemoState(state: DemoState) {
  const unique = (rows: { id: string }[]) => new Set(rows.map((row) => row.id)).size === rows.length;
  return [state.students, state.teachers, state.classes, state.subjects, state.assignments].every(unique)
    && state.students.every((row) => state.classes.some((item) => item.id === row.classId))
    && state.teachers.every((row) => state.classes.some((item) => item.id === row.classId) && state.subjects.some((item) => item.id === row.subjectId))
    && state.assignments.every((row) => state.classes.some((item) => item.id === row.classId) && state.subjects.some((item) => item.id === row.subjectId) && row.completedBy.every((id) => state.students.some((student) => student.id === id)));
}

export function loadDemoState(raw: string | null): DemoState {
  try {
    const result = DemoStateSchema.safeParse(JSON.parse(raw ?? 'null'));
    if (result.success && validDemoState(result.data)) return result.data;
  } catch { /* Invalid saved demo data falls back to the sample. */ }
  return structuredClone(demoSeed);
}
