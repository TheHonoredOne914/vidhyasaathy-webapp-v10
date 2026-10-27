import { PracticeAttemptSchema, SubmitPracticeAttemptSchema } from '@vidhyasaathy/contracts';
import { acknowledge, blockEntry, enqueue, isRetryableStatus, readyEntries, retryEntry } from '@vidhyasaathy/core/sync';
import { z } from 'zod';
import { ApiClientError, postJson } from '../../api/client';
import { readCachedMe, readStorage, writeStorage } from '../../storage';
import type { Checkpoint, CheckpointAnswer, CheckpointResult } from './types';

const ResultSchema = z.object({
  conceptId: z.string().min(1), correct: z.boolean(), attempts: z.number().int().positive(),
  hintUsed: z.boolean(), ms: z.number().int().nonnegative(), source: z.string().startsWith('game:'),
}).strict();
const EventSchema = z.object({ clientEventId: z.string().uuid(), result: ResultSchema, practiceAttempt: SubmitPracticeAttemptSchema.nullable() });
const QueueSchema = z.array(z.object({
  event: EventSchema, attempts: z.number().int().nonnegative(), nextAttemptAt: z.number().nonnegative(),
  status: z.enum(['pending', 'blocked']), error: z.string().nullable(),
}));
type Queue = z.infer<typeof QueueSchema>;
export type ProgressStatus = { pending: number; message: string };
const flushing = new Map<string, Promise<ProgressStatus>>();

function scope(): { key: string; student: boolean } {
  const me = readCachedMe()?.me;
  return { key: `vs.games.progress.${me ? `${me.school.id}.${me.profile.id}` : 'guest'}`, student: me?.profile.role === 'student' };
}

function readQueue(key: string): Queue {
  try {
    const parsed = QueueSchema.safeParse(JSON.parse(readStorage(key) ?? '[]'));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

function persist(key: string, queue: Queue): void {
  const raw = JSON.stringify(queue);
  writeStorage(key, raw);
  if (readStorage(key) !== raw) throw new Error('This result could not be saved. Device storage may be full or unavailable.');
}

function status(key: string): ProgressStatus {
  const queue = readQueue(key);
  const pending = queue.filter((entry) => entry.status === 'pending').length;
  const blocked = queue.find((entry) => entry.status === 'blocked');
  return { pending, message: pending > 0 ? `${pending} answers saved on this device, waiting to sync.` : blocked?.error ?? 'Practice answers synced.' };
}

export async function recordCheckpointResult(result: CheckpointResult, checkpoint: Checkpoint, answer: CheckpointAnswer): Promise<ProgressStatus> {
  try {
    const current = scope();
    const now = Date.now();
    const clientEventId = crypto.randomUUID();
    const practiceAttempt = checkpoint.practice && current.student ? SubmitPracticeAttemptSchema.parse({
      clientEventId, itemId: checkpoint.practice.itemId, answer: checkpoint.practice.toAnswer(answer),
      timeMs: Math.min(86_400_000, result.ms), clientTs: now,
    }) : null;
    const event = EventSchema.parse({ clientEventId, result, practiceAttempt });
    let queue = enqueue(readQueue(current.key), event, now);
    // The current API grades released item answers, not arbitrary game telemetry.
    // Retain telemetry locally rather than inventing an endpoint or item UUID.
    if (!practiceAttempt) queue = blockEntry(queue, clientEventId, 'Saved on this device only. School practice sync needs a published item mapping.');
    persist(current.key, queue);
    return await flushProgress();
  } catch (error) {
    return { pending: 0, message: error instanceof Error ? error.message : 'Could not save this answer.' };
  }
}

export function flushProgress(): Promise<ProgressStatus> {
  const current = scope();
  const running = flushing.get(current.key);
  if (running) return running;
  const task = flush(current.key, current.student).catch((error: unknown): ProgressStatus => ({
    pending: readQueue(current.key).length,
    message: error instanceof Error ? error.message : 'Could not sync practice answers.',
  })).finally(() => { flushing.delete(current.key); });
  flushing.set(current.key, task);
  return task;
}

async function flush(key: string, student: boolean): Promise<ProgressStatus> {
  if (!student || (typeof navigator !== 'undefined' && !navigator.onLine)) return status(key);
  for (const entry of readyEntries(readQueue(key), Date.now())) {
    if (scope().key !== key) break;
    const input = entry.event.practiceAttempt;
    if (!input) continue;
    try {
      const marked = await postJson('/practice/attempts', PracticeAttemptSchema, input, AbortSignal.timeout(20_000));
      if (marked.clientEventId !== input.clientEventId || marked.itemId !== input.itemId || marked.conceptId !== entry.event.result.conceptId) throw new ApiClientError(200, 'INVALID_RESPONSE', 'The server did not confirm this concept answer.');
      persist(key, acknowledge(readQueue(key), [entry.event.clientEventId]));
    } catch (error) {
      const code = error instanceof ApiClientError ? error.status : null;
      const message = error instanceof Error ? error.message : 'Could not sync this answer.';
      const queue = isRetryableStatus(code === 0 ? null : code)
        ? retryEntry(readQueue(key), entry.event.clientEventId, Date.now(), Math.random())
        : blockEntry(readQueue(key), entry.event.clientEventId, message);
      persist(key, queue);
    }
  }
  return status(key);
}
