import { expect, it } from 'vitest';
import { buildNightlyPlan, buildStudyPlan, replanAfterMiss, type StudyPlanItem } from './study-plan.ts';

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

it('plans six shaky concepts across nights of 25 minutes and folds a miss forward', () => {
  const concepts = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((id) => ({ id, shaky: true }));
  const prereqGraph = concepts.slice(1).map((concept, index) => ({ conceptId: concept.id, prereqId: concepts[index]!.id }));
  const plan = buildNightlyPlan({
    examDate: '2026-11-14', minutesPerNight: 25, concepts, prereqGraph,
    levels: concepts.map((concept) => ({ conceptId: concept.id, level: 2 })),
  }, '2026-10-24');
  expect(plan.items.filter((item) => item.status === 'planned')).toHaveLength(24);
  expect(plan.nights.every((night) => night.minutes <= 25)).toBe(true);
  expect(plan.nights[0]).toMatchObject({ night: '2026-10-24', minutes: 25 });
  expect(plan.nights[0]?.items.map((item) => `${item.conceptId}:${item.kind}`)).toEqual(['c1:repair', 'c1:learn']);
  expect(plan.items.filter((item) => item.kind === 'repair').map((item) => item.conceptId)).toEqual(concepts.map((concept) => concept.id));
  expect(plan.nights.every((night) => night.night < '2026-11-14')).toBe(true);
  const moved = replanAfterMiss(plan.items, '2026-10-24', '2026-11-14');
  expect(moved.events.map((event) => `${event.key}:${event.kind}`)).toEqual([
    'c1:repair:missed', 'c1:repair:folded', 'c1:learn:missed', 'c1:learn:folded',
  ]);
  expect(moved.nights.find((night) => night.night === '2026-10-25')?.minutes).toBe(25);
  expect(moved.nights.every((night) => night.minutes <= 25)).toBe(true);
  const first = plan.nights[0]?.minutes ?? 0;
  const second = plan.nights[1]?.minutes ?? 0;
  expect(moved.nights.some((night) => night.minutes === first + second)).toBe(false);
});

it('drops practice and revision when a miss no longer fits before the exam', () => {
  const concepts = [{ id: 'a', shaky: true }, { id: 'b', shaky: false }];
  const plan = buildNightlyPlan({
    examDate: '2026-10-26', concepts, prereqGraph: [{ conceptId: 'b', prereqId: 'a' }],
    levels: [{ conceptId: 'a', level: 2 }, { conceptId: 'b', level: 1 }],
  }, '2026-10-24');
  expect(plan.items.filter((item) => item.status === 'dropped').every((item) => item.kind === 'practice' || item.kind === 'revise')).toBe(true);
  expect(plan.items.filter((item) => item.kind === 'repair' || item.kind === 'learn').every((item) => item.status === 'planned')).toBe(true);
  expect(plan.nights.every((night) => night.minutes <= 25)).toBe(true);
  const moved = replanAfterMiss(plan.items, '2026-10-24', '2026-10-26');
  expect(moved.nights.every((night) => night.minutes <= 25)).toBe(true);
  expect(moved.items.filter((item) => item.status === 'dropped').every((item) => item.kind === 'practice' || item.kind === 'revise')).toBe(true);
  expect(moved.items.some((item) => item.kind === 'repair' && item.status !== 'dropped')).toBe(true);
});
