import { describe, expect, it } from 'vitest';
import { RECAP_DAY_MS, scheduleRecap, type RecapItem } from '../recap';

const item: RecapItem = { id: 'demo:one', owner: 'student', conceptId: 'atom.shells', gameId: 'demo', question: { prompt: 'How many?', choices: [{ id: 'two', label: 'Two' }, { id: 'eight', label: 'Eight' }], answerId: 'two', explanation: 'Two.' }, missedAt: 1_000, reviewedAt: null };

describe('spaced recap scheduling', () => {
  it('waits until an item is more than one day old', () => {
    expect(scheduleRecap([item], item.missedAt + RECAP_DAY_MS, 'student')).toBeNull();
    expect(scheduleRecap([item], item.missedAt + RECAP_DAY_MS + 1, 'student')).toEqual(item);
  });

  it('scopes recap to the current learner and schedules the oldest due item', () => {
    const other = { ...item, id: 'demo:two', owner: 'other', missedAt: 0 };
    expect(scheduleRecap([other, item], item.missedAt + RECAP_DAY_MS + 1, 'student')).toEqual(item);
  });
});
