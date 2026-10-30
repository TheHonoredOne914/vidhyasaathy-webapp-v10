import { expect, it } from 'vitest';
import { pickNextAction, type NextActionCandidate } from './next-action.ts';
import { endOfTomorrowIst } from './streak.ts';

const now = Date.UTC(2026, 9, 24, 12);

function candidate(partial: Partial<NextActionCandidate> & Pick<NextActionCandidate, 'id' | 'kind'>): NextActionCandidate {
  return {
    title: partial.id, conceptId: null, conceptName: null, estMinutes: 10, href: `/go/${partial.id}`,
    resumeState: null, dueAt: null, resumeAt: 0, lateUntil: null, windowOpen: true, ...partial,
  };
}

it('ranks catch-up, then unfinished, due, revision, new work, and a game', () => {
  const horizon = endOfTomorrowIst(now);
  const candidates = [
    candidate({ id: 'game', kind: 'game', estMinutes: 4 }),
    candidate({ id: 'fresh', kind: 'new', conceptId: 'acceleration', title: 'Acceleration' }),
    candidate({ id: 'review', kind: 'revision', conceptId: 'distance', title: 'Distance' }),
    candidate({ id: 'homework', kind: 'due', dueAt: now + 3_600_000, title: 'Homework' }),
    candidate({ id: 'later', kind: 'due', dueAt: horizon + 86_400_000, title: 'Next week' }),
    candidate({ id: 'open', kind: 'unfinished', resumeAt: 5, resumeState: 'step=3', href: '/student/sessions/1?step=3' }),
  ];
  expect(pickNextAction({ absentDays: 3, candidates, catchUp: null }, now)).toMatchObject({
    kind: 'catchup', title: "Good to see you. Let's take this in small steps.", estMinutes: 20,
  });
  expect(pickNextAction({ absentDays: 0, candidates, catchUp: null }, now)).toMatchObject({ kind: 'unfinished', href: '/student/sessions/1?step=3' });
  const withoutOpen = candidates.filter((item) => item.kind !== 'unfinished');
  expect(pickNextAction({ absentDays: 0, candidates: withoutOpen, catchUp: null }, now)?.kind).toBe('due');
  const revisionOnly = withoutOpen.filter((item) => item.kind !== 'due');
  expect(pickNextAction({ absentDays: 0, candidates: revisionOnly, catchUp: null }, now)?.kind).toBe('revision');
  expect(pickNextAction({ absentDays: 0, candidates: revisionOnly.filter((item) => item.kind !== 'revision'), catchUp: null }, now)?.kind).toBe('new');
  expect(pickNextAction({ absentDays: 0, candidates: [candidate({ id: 'game', kind: 'game' })], catchUp: null }, now)?.kind).toBe('game');
});

it('keeps overdue work only inside late_until and breaks ties by due time, resume, then id', () => {
  const due = (id: string, dueAt: number, lateUntil: number | null = null, resumeAt = 0) =>
    candidate({ id, kind: 'due', dueAt, lateUntil, resumeAt, title: id });
  const ranked = pickNextAction({
    absentDays: 0,
    catchUp: null,
    candidates: [due('b', now + 1000), due('a', now + 1000), due('early', now - 5000, now + 1000), due('closed', now - 5000, now - 1)],
  }, now);
  expect(ranked?.title).toBe('early');
  const tied = pickNextAction({
    absentDays: 0, catchUp: null, candidates: [due('b', now + 1000), due('a', now + 1000)],
  }, now);
  expect(tied?.title).toBe('a');
  const resumed = pickNextAction({
    absentDays: 0, catchUp: null,
    candidates: [
      candidate({ id: 'older', kind: 'unfinished', resumeAt: 2 }),
      candidate({ id: 'newer', kind: 'unfinished', resumeAt: 9 }),
    ],
  }, now);
  expect(resumed?.title).toBe('newer');
});
