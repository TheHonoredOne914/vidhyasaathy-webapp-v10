import { describe, expect, it } from 'vitest';
import { activities, concepts, DEMO_DATE, DemoStateSchema, demoSeed, inPeriod, loadDemoState, observations, parentChildIds, studentActivities, subjectProgress, validDemoState } from './data';

describe('shared dashboard demo', () => {
  it('keeps all sample entities and observations linked by consistent IDs', () => {
    expect(DemoStateSchema.parse(demoSeed)).toEqual(demoSeed);
    expect(validDemoState(demoSeed)).toBe(true);
    for (const id of parentChildIds) expect(demoSeed.students.some((row) => row.id === id)).toBe(true);
    for (const row of activities) {
      expect(demoSeed.students.some((student) => student.id === row.studentId)).toBe(true);
      expect(demoSeed.subjects.some((subject) => subject.id === row.subjectId)).toBe(true);
      expect(row.minutes).toBeGreaterThan(0);
    }
    for (const row of observations) expect(concepts.some((concept) => concept.id === row.conceptId)).toBe(true);
  });
  it('uses an inclusive snapshot and exclusive lower date boundary', () => {
    expect(inPeriod(DEMO_DATE, 7)).toBe(true);
    expect(inPeriod('2026-10-27', 7)).toBe(true);
    expect(inPeriod('2026-10-26', 7)).toBe(false);
    expect(inPeriod('2026-11-03', 7)).toBe(false);
    expect(inPeriod('broken', 7)).toBe(false);
    expect(studentActivities('aarav', 14).length).toBeGreaterThan(studentActivities('aarav', 7).length);
    expect(studentActivities('rohan', 7).every((row) => row.day < '2026-10-30')).toBe(true);
  });
  it('round-trips edits and assignments without changing the original seed', () => {
    const edited = loadDemoState(null);
    edited.students[0]!.name = 'Aarav edited';
    edited.assignments.push({ id: 'shared-task', title: 'A sample task', classId: 'class-9a', subjectId: 'physics', due: '2026-11-06', completedBy: [] });
    const restored = loadDemoState(JSON.stringify(edited));
    expect(restored.students[0]!.name).toBe('Aarav edited');
    expect(restored.assignments.find((row) => row.id === 'shared-task')?.classId).toBe(restored.students[0]!.classId);
    expect(loadDemoState(null)).toEqual(demoSeed);
    expect(demoSeed.students[0]!.name).toBe('Aarav');
  });
  it('rejects malformed, incompatible and dangling persisted records', () => {
    for (const raw of ['broken', '{}', '{"version":2}', 'null']) expect(loadDemoState(raw)).toEqual(demoSeed);
    const dangling = loadDemoState(null);
    dangling.students[0]!.classId = 'missing-class';
    expect(loadDemoState(JSON.stringify(dangling))).toEqual(demoSeed);
    const duplicate = loadDemoState(null);
    duplicate.subjects.push(duplicate.subjects[0]!);
    expect(validDemoState(duplicate)).toBe(false);
    const completion = loadDemoState(null);
    completion.assignments[0]!.completedBy.push('missing-child');
    expect(validDemoState(completion)).toBe(false);
  });
  it('keeps new concepts and new sample students out of help counts', () => {
    expect(subjectProgress('priya', 'physics')).toEqual({ secure: 0, total: 3 });
    expect(subjectProgress('new-student', 'physics')).toEqual({ secure: 0, total: 0 });
    expect(observations.filter((row) => row.studentId === 'rohan' && row.word === "Let's fix this")).toEqual([]);
  });
});
