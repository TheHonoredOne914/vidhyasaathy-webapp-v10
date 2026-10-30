import { describe, expect, it } from 'vitest';
import type { Assignment, SubmitAttempt, SyncResponse } from '@vidhyasaathy/contracts';
import { enqueue } from '@vidhyasaathy/core/sync';
import { applyFlush } from './outbox';
import { dueNow, scoreText, studentScore } from './present';
import { mergePull } from './pull';

const event = {
  clientEventId: '11111111-1111-4111-8111-111111111111',
  assignmentId: '22222222-2222-4222-8222-222222222222',
  itemId: '33333333-3333-4333-8333-333333333333',
  answer: 'top',
  timeMs: 10,
  clientTs: 10,
} satisfies SubmitAttempt;

function assignment(id: string, dueAt: number, status: NonNullable<Assignment['score']>['status']): Assignment {
  return {
    id, schoolId: '44444444-4444-4444-8444-444444444444', chapterId: '55555555-5555-4555-8555-555555555555',
    teacherId: '66666666-6666-4666-8666-666666666666', teacherName: 'Kiran Das', sectionId: '77777777-7777-4777-8777-777777777777',
    title: id, kind: 'homework', dueAt, itemIds: ['33333333-3333-4333-8333-333333333333'], required: true,
    status: 'published', publishedAt: 1, updatedAt: 1,
    score: { answered: status === 'not_started' ? 0 : 1, marked: status === 'completed' ? 1 : 0, correct: status === 'completed' ? 1 : 0, total: 1, status },
  };
}

describe('attempt outbox result', () => {
  it('keeps answers queued during a request, even if an unrelated ID is acknowledged', () => {
    const other = { ...event, clientEventId: '88888888-8888-4888-8888-888888888888' };
    const queued = enqueue(enqueue([], event, 0), other, 1);
    const remaining = applyFlush(queued, [event.clientEventId], { ok: true, received: [event.clientEventId, other.clientEventId] }, 2, 0);
    expect(remaining.map((row) => row.event.clientEventId)).toEqual([other.clientEventId]);
  });
  it('drops a sent answer and keeps a failed one for later', () => {
    const queued = enqueue([], event, 0);
    expect(applyFlush(queued, [event.clientEventId], { ok: true, received: [event.clientEventId] }, 0, 0.2)).toEqual([]);
    const retried = applyFlush(queued, [event.clientEventId], { ok: false, retry: true, error: 'offline' }, 20, 0.2);
    expect(retried[0]?.attempts).toBe(1);
    expect(retried[0]?.status).toBe('pending');
    const blocked = applyFlush(retried, [event.clientEventId], { ok: false, retry: false, error: 'Used already.' }, 20, 0.2);
    expect(blocked[0]?.status).toBe('blocked');
  });
});

describe('incremental homework pull', () => {
  it('merges pages without dropping unchanged work and saves all independent cursors', () => {
    const first: SyncResponse = {
      updatedAt: 10, cursors: { assignments: 1, items: 2, attempts: 3, conceptStates: 4 },
      hasMore: { assignments: true, items: false, attempts: false, conceptStates: false },
      assignments: [assignment('first', 100, 'not_started'), assignment('second', 200, 'not_started')],
      items: [], attempts: [], conceptStates: [],
    };
    const page: SyncResponse = {
      ...first, updatedAt: 20, cursors: { assignments: 5, items: 2, attempts: 6, conceptStates: 4 },
      hasMore: { assignments: false, items: false, attempts: false, conceptStates: false },
      assignments: [assignment('first', 100, 'completed')],
    };
    const result = mergePull(first, page);
    expect(result.assignments.map((row) => [row.id, row.score?.status])).toEqual([['first', 'completed'], ['second', 'not_started']]);
    expect(result.cursors).toEqual(page.cursors);
    expect(result.updatedAt).toBe(20);
    expect(mergePull(null, first)).toEqual(first);
  });
});

describe('due work', () => {
  it('keeps unfinished work that is due today or earlier', () => {
    const now = Date.parse('2026-10-25T12:00:00');
    const later = Date.parse('2026-10-25T18:00:00');
    const rows = dueNow([
      assignment('later', later, 'not_started'),
      assignment('done', now - 1000, 'completed'),
      assignment('overdue', now - 86_400_000, 'in_progress'),
      assignment('future', now + 3 * 86_400_000, 'not_started'),
    ], now);
    expect(rows.map((row) => row.id)).toEqual(['overdue', 'later']);
    expect(scoreText(rows[1]?.score ?? null)).toBe('Not started');
    expect(scoreText({ answered: 2, marked: 2, correct: 2, total: 2, status: 'completed' })).toBe('2 of 2 correct');
    expect(studentScore({ answered: 2, marked: 2, correct: 1, total: 2, status: 'completed' })).toBe('Almost there.');
    expect(studentScore({ answered: 2, marked: 2, correct: 2, total: 2, status: 'completed' })).toBe('Top form on this work.');
  });
});
