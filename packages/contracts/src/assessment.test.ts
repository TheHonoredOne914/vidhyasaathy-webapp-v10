import { describe, expect, it } from 'vitest';
import { SaveAssignmentSchema, SubmitAttemptSchema, SyncQuerySchema } from './assessment.ts';

const id = '00000000-0000-4000-8000-000000000001';
describe('assessment contracts', () => {
  it('requires unique questions and a due date', () => {
    const input = { sectionId: id, title: 'Fractions', kind: 'quiz', dueAt: 1, itemIds: [id] };
    expect(SaveAssignmentSchema.safeParse(input).success).toBe(true);
    expect(SaveAssignmentSchema.safeParse({ ...input, itemIds: [id, id] }).success).toBe(false);
    expect(SaveAssignmentSchema.safeParse({ ...input, dueAt: -1 }).success).toBe(false);
  });
  it('never accepts client marks or identity', () => {
    const event = { clientEventId: id, assignmentId: id, itemId: id, answer: 'half', timeMs: 2, clientTs: 1 };
    expect(SubmitAttemptSchema.safeParse(event).success).toBe(true);
    for (const extra of [{ correct: true }, { profileId: id }, { conceptId: id }]) {
      expect(SubmitAttemptSchema.safeParse({ ...event, ...extra }).success).toBe(false);
    }
    expect(SubmitAttemptSchema.safeParse({ ...event, answer: '' }).success).toBe(false);
  });
  it('bounds differential pulls and supplies independent cursors', () => {
    expect(SyncQuerySchema.parse({})).toEqual({ assignments: 0, items: 0, attempts: 0, conceptStates: 0, limit: 100 });
    for (const input of [{ items: '-1' }, { attempts: '1.5' }, { limit: '201' }]) {
      expect(SyncQuerySchema.safeParse(input).success).toBe(false);
    }
  });
});
