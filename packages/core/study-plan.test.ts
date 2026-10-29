import { expect, it } from 'vitest';
import { buildStudyPlan, type StudyPlanItem } from './study-plan.ts';

it('puts unfinished work before due work, then revision, new work, and games', () => {
  const now = Date.UTC(2026, 9, 24, 12);
  const base = { chapterId: 'chapter', title: 'Practice', resumeAt: 0, dueAt: null };
  const input: StudyPlanItem[] = [
    { ...base, id: 'session', kind: 'session', required: true, resumeAt: 2 },
    { ...base, id: 'review', kind: 'review', required: false, dueAt: now - 100 },
    { ...base, id: 'remediation', kind: 'remediation', required: false },
    { ...base, id: 'homework', kind: 'assignment', required: true, dueAt: now + 3600000 },
    { ...base, id: 'fresh', kind: 'session', required: true },
    { ...base, id: 'game', kind: 'game', required: false },
  ];
  const plan = buildStudyPlan(input, now);
  expect(plan.items.map((item) => item.id)).toEqual(['session', 'review', 'homework', 'remediation', 'fresh', 'game']);
  expect(plan.nextAction).toBe(input[0]);
  expect(plan.continue).toBe(input[0]);
  expect(input[3]?.dueAt).toBe(now + 3600000);
  expect(input[0]?.resumeAt).toBe(2);
  expect(input[0]?.id).toBe('session');
});

it('returns explicit empty states and deterministic equal-priority order', () => {
  expect(buildStudyPlan([], 0)).toEqual({ items: [], nextAction: null, continue: null });
  const item = { chapterId: 'chapter', title: '', kind: 'assignment' as const, required: true, dueAt: 5, resumeAt: 0 };
  expect(buildStudyPlan([{ ...item, id: 'b' }, { ...item, id: 'a' }], 0).items.map((entry) => entry.id)).toEqual(['a', 'b']);
});
