export interface ClientEvent { clientEventId: string }
export interface OutboxEntry<T extends ClientEvent> {
  event: T;
  attempts: number;
  nextAttemptAt: number;
  status: 'pending' | 'blocked';
  error: string | null;
}

function timestamp(value: number) {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError('Use a nonnegative integer timestamp.');
}

// Persist the returned outbox (scoped to school/profile) before sending any network request.
export function enqueue<T extends ClientEvent>(outbox: readonly OutboxEntry<T>[], event: T, now: number): OutboxEntry<T>[] {
  timestamp(now);
  if (!event.clientEventId) throw new RangeError('Every queued event needs a stable client event ID.');
  if (outbox.some((entry) => entry.event.clientEventId === event.clientEventId)) return [...outbox];
  return [...outbox, { event, attempts: 0, nextAttemptAt: now, status: 'pending', error: null }];
}

export function readyEntries<T extends ClientEvent>(outbox: readonly OutboxEntry<T>[], now: number, limit = 100): OutboxEntry<T>[] {
  timestamp(now);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new RangeError('Use a batch size from 1 to 100.');
  return outbox.filter((entry) => entry.status === 'pending' && entry.nextAttemptAt <= now)
    .sort((a, b) => a.nextAttemptAt - b.nextAttemptAt).slice(0, limit);
}

export function acknowledge<T extends ClientEvent>(outbox: readonly OutboxEntry<T>[], clientEventIds: readonly string[]): OutboxEntry<T>[] {
  const received = new Set(clientEventIds);
  return outbox.filter((entry) => !received.has(entry.event.clientEventId));
}

export function retryDelay(failures: number, random: number, baseMs = 1000, maxMs = 300000): number {
  if (!Number.isSafeInteger(failures) || failures < 1 || !Number.isFinite(random) || random < 0 || random >= 1
    || !Number.isSafeInteger(baseMs) || baseMs < 1 || !Number.isSafeInteger(maxMs) || maxMs < baseMs) {
    throw new RangeError('Use positive retry bounds and jitter in [0, 1).');
  }
  const cap = Math.min(maxMs, baseMs * 2 ** Math.min(failures - 1, 30));
  return Math.max(1, Math.floor(random * cap));
}

export function retryEntry<T extends ClientEvent>(outbox: readonly OutboxEntry<T>[], id: string, now: number, random: number): OutboxEntry<T>[] {
  timestamp(now);
  return outbox.map((entry) => entry.event.clientEventId !== id || entry.status === 'blocked' ? entry : {
    ...entry, attempts: entry.attempts + 1,
    nextAttemptAt: Math.min(Number.MAX_SAFE_INTEGER, now + retryDelay(entry.attempts + 1, random)),
  });
}

export function blockEntry<T extends ClientEvent>(outbox: readonly OutboxEntry<T>[], id: string, error: string): OutboxEntry<T>[] {
  return outbox.map((entry) => entry.event.clientEventId === id ? { ...entry, status: 'blocked', error } : entry);
}

export function resumeEntry<T extends ClientEvent>(outbox: readonly OutboxEntry<T>[], id: string, now: number): OutboxEntry<T>[] {
  timestamp(now);
  return outbox.map((entry) => entry.event.clientEventId === id ? { ...entry, status: 'pending', error: null, nextAttemptAt: now } : entry);
}

export function isRetryableStatus(status: number | null): boolean {
  return status === null || status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}
