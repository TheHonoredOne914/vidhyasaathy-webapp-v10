import { describe, expect, it } from 'vitest';
import { acknowledge, blockEntry, enqueue, isRetryableStatus, readyEntries, resumeEntry, retryDelay, retryEntry } from './sync.ts';

describe('persistent outbox helpers', () => {
  const event = { clientEventId: 'event-1', answer: 'half' };
  it('keeps original event IDs and payloads until a positive acknowledgment', () => {
    const queue = enqueue([], event, 10);
    expect(enqueue(queue, { ...event, answer: 'changed' }, 20)).toEqual(queue);
    expect(readyEntries(queue, 9)).toEqual([]);
    expect(readyEntries(queue, 10)[0]?.event).toBe(event);
    expect(acknowledge(queue, ['unknown'])).toEqual(queue);
    expect(acknowledge(queue, [event.clientEventId])).toEqual([]);
    expect(queue).toHaveLength(1);
  });
  it('retries with bounded exponential jitter without changing the queued answer', () => {
    const queue = enqueue([], event, 0);
    const retry = retryEntry(queue, event.clientEventId, 10, 0.5);
    expect(retry[0]).toMatchObject({ attempts: 1, nextAttemptAt: 510, event });
    expect(retryEntry(retry, event.clientEventId, 510, 0.5)[0]?.nextAttemptAt).toBe(1510);
    expect(retryDelay(1000, 0.5)).toBe(150000);
    expect(retryDelay(1, 0)).toBe(1);
    expect(() => retryDelay(1, 1)).toThrow(RangeError);
  });
  it('retains permanent failures for user action and can resume after sign-in', () => {
    const queue = enqueue([], event, 0);
    const blocked = blockEntry(queue, event.clientEventId, 'Sign in again.');
    expect(readyEntries(blocked, 100)).toEqual([]);
    expect(retryEntry(blocked, event.clientEventId, 100, 0.5)).toEqual(blocked);
    expect(readyEntries(resumeEntry(blocked, event.clientEventId, 100), 100)).toHaveLength(1);
    for (const status of [null, 408, 425, 429, 500, 503]) expect(isRetryableStatus(status)).toBe(true);
    for (const status of [200, 400, 401, 403, 409, 600]) expect(isRetryableStatus(status)).toBe(false);
  });
});
