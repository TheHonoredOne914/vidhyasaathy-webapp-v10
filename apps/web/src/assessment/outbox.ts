import type { SubmitAttempt } from '@vidhyasaathy/contracts';
import { PushAttemptsResponseSchema } from '@vidhyasaathy/contracts';
import { acknowledge, blockEntry, enqueue, isRetryableStatus, readyEntries, resumeEntry, retryEntry, type OutboxEntry } from '@vidhyasaathy/core/sync';
import { ApiClientError, postJson } from '../api/client';
import { readStorage, writeStorage } from '../storage';

type StoredAttempt = OutboxEntry<SubmitAttempt> & { profileId: string };

const DB_NAME = 'vidhyasaathy-outbox';
const STORE = 'attempts';

function syncKey(profileId: string): string {
  return `vidhyasaathy.attemptSyncAt.${profileId}`;
}

export function readSyncAt(profileId: string): string | null {
  return readStorage(syncKey(profileId));
}

export function openAssessmentDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'event.clientEventId' });
      if (!db.objectStoreNames.contains('snapshots')) db.createObjectStore('snapshots');
    };
    request.onerror = () => { reject(request.error ?? new Error('Could not open the answer queue.')); };
    request.onsuccess = () => { resolve(request.result); };
  });
}

export function readOutbox(profileId: string): Promise<OutboxEntry<SubmitAttempt>[]> {
  return openAssessmentDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const request = tx.objectStore(STORE).getAll();
    request.onerror = () => { reject(request.error ?? new Error('Could not read the answer queue.')); };
    request.onsuccess = () => {
      const rows = (request.result as StoredAttempt[]).filter((row) => row.profileId === profileId);
      resolve(rows.map((row) => ({
        event: row.event, attempts: row.attempts, nextAttemptAt: row.nextAttemptAt, status: row.status, error: row.error,
      })));
    };
    tx.oncomplete = () => { db.close(); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Could not read the answer queue.')); };
  }));
}

function updateOutbox(profileId: string, update: (entries: OutboxEntry<SubmitAttempt>[]) => OutboxEntry<SubmitAttempt>[]): Promise<OutboxEntry<SubmitAttempt>[]> {
  return openAssessmentDb().then((db) => new Promise((resolve, reject) => {
    let entries: OutboxEntry<SubmitAttempt>[] = [];
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const request = store.getAll();
    request.onerror = () => { reject(request.error ?? new Error('Could not read the answer queue.')); };
    request.onsuccess = () => {
      const rows = (request.result as StoredAttempt[]).filter((row) => row.profileId === profileId);
      entries = update(rows.map((row) => ({ event: row.event, attempts: row.attempts, nextAttemptAt: row.nextAttemptAt, status: row.status, error: row.error })));
      for (const row of rows) store.delete(row.event.clientEventId);
      for (const entry of entries) store.put({ ...entry, profileId });
    };
    tx.oncomplete = () => { db.close(); resolve(entries); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error('Could not save the answer queue.')); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Could not save the answer queue.')); };
  }));
}

export async function queueAttempt(profileId: string, event: SubmitAttempt): Promise<void> {
  await updateOutbox(profileId, (current) => {
    if (current.some((row) => row.event.assignmentId === event.assignmentId && row.event.itemId === event.itemId)) return current;
    return enqueue(current, event, Date.now());
  });
}

export async function resumeOutbox(profileId: string): Promise<void> {
  await updateOutbox(profileId, (current) => current.reduce((next, row) => resumeEntry(next, row.event.clientEventId, Date.now()), current));
}

export type FlushOutcome = { ok: true; received: readonly string[] } | { ok: false; retry: boolean; error: string };

export function applyFlush(
  queue: readonly OutboxEntry<SubmitAttempt>[],
  ids: readonly string[],
  outcome: FlushOutcome,
  now: number,
  random: number,
): OutboxEntry<SubmitAttempt>[] {
  if (outcome.ok) return acknowledge(queue, outcome.received.filter((id) => ids.includes(id)));
  return ids.reduce<OutboxEntry<SubmitAttempt>[]>((next, id) => (
    outcome.retry ? retryEntry(next, id, now, random) : blockEntry(next, id, outcome.error)
  ), [...queue]);
}

export async function flushOutbox(profileId: string): Promise<{ pending: number; sent: number; error: string | null }> {
  let queue = await readOutbox(profileId);
  const pending = () => queue.filter((entry) => entry.status === 'pending').length;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { pending: pending(), sent: 0, error: null };
  const ready = readyEntries(queue, Date.now());
  if (ready.length === 0) return { pending: pending(), sent: 0, error: null };
  const ids = ready.map((entry) => entry.event.clientEventId);
  try {
    const result = await postJson('/sync/attempts', PushAttemptsResponseSchema, { attempts: ready.map((entry) => entry.event) });
    const received = result.attempts.filter((attempt) => ready.some(({ event }) => (
      event.clientEventId === attempt.clientEventId && event.assignmentId === attempt.assignmentId && event.itemId === attempt.itemId
      && JSON.stringify(event.answer) === JSON.stringify(attempt.answer)
    ))).map((attempt) => attempt.clientEventId);
    if (received.length !== ids.length || new Set(received).size !== ids.length) {
      throw new ApiClientError(200, 'INVALID_RESPONSE', 'The server did not confirm these answers. They are still saved on this device.');
    }
    queue = await updateOutbox(profileId, (current) => applyFlush(current, ids, { ok: true, received }, Date.now(), 0));
    writeStorage(syncKey(profileId), new Date().toISOString());
    return { pending: pending(), sent: result.attempts.length, error: null };
  } catch (error) {
    const status = error instanceof ApiClientError ? error.status : null;
    const message = error instanceof Error ? error.message : 'Could not send answers.';
    queue = await updateOutbox(profileId, (current) => applyFlush(current, ids, {
      ok: false, retry: isRetryableStatus(status === 0 ? null : status), error: message,
    }, Date.now(), Math.random()));
    return { pending: pending(), sent: 0, error: message };
  }
}
