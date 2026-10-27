import { StudentEnrollmentSchema, SyncResponseSchema, type SyncResponse } from '@vidhyasaathy/contracts';
import { z } from 'zod';
import { getJson } from '../api/client';
import { CACHE_PREFIX } from '../storage';
import { openAssessmentDb } from './outbox';

const SnapshotSchema = z.object({ enrollment: z.string(), data: SyncResponseSchema });
type Snapshot = z.infer<typeof SnapshotSchema>;

async function readSnapshot(owner: string): Promise<Snapshot | null> {
  const db = await openAssessmentDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('snapshots', 'readonly');
    const request = tx.objectStore('snapshots').get(owner);
    tx.oncomplete = () => {
      db.close();
      const parsed = SnapshotSchema.safeParse(request.result);
      resolve(parsed.success ? parsed.data : null);
    };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Could not read saved homework.')); };
  });
}

async function saveSnapshot(owner: string, snapshot: Snapshot): Promise<void> {
  const db = await openAssessmentDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('snapshots', 'readwrite');
    // Entities, independent cursors and the successful timestamp commit together.
    tx.objectStore('snapshots').put(snapshot, owner);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onabort = () => { db.close(); reject(tx.error ?? new Error('Could not save homework on this device.')); };
  });
}

function upsert<T>(previous: T[], incoming: T[], key: (row: T) => string): T[] {
  return [...new Map([...previous, ...incoming].map((row) => [key(row), row])).values()];
}

export function mergePull(previous: SyncResponse | null, page: SyncResponse): SyncResponse {
  return {
    ...page,
    assignments: upsert(previous?.assignments ?? [], page.assignments, (row) => row.id),
    items: upsert(previous?.items ?? [], page.items, (row) => row.id),
    attempts: upsert(previous?.attempts ?? [], page.attempts, (row) => row.id),
    conceptStates: upsert(previous?.conceptStates ?? [], page.conceptStates, (row) => row.conceptId),
  };
}

function mirrorCache(owner: string, data: SyncResponse): void {
  const prefix = `${CACHE_PREFIX}${owner.replace('/', '.')}.`;
  const updatedAt = new Date(data.updatedAt).toISOString();
  const write = (path: string, value: unknown) => {
    localStorage.setItem(`${prefix}${path}`, JSON.stringify({ data: value, updatedAt }));
  };
  write('/assignments', data.assignments);
  write('/concept-states', data.conceptStates);
  for (const assignment of data.assignments) {
    const items = assignment.itemIds.flatMap((id) => data.items.filter((item) => item.id === id));
    if (items.length === assignment.itemIds.length) write(`/assignments/${assignment.id}`, { ...assignment, items });
    write(`/assignments/${assignment.id}/attempts`, data.attempts.filter((attempt) => attempt.assignmentId === assignment.id));
    write(`/assignments?chapterId=${assignment.chapterId}`, data.assignments.filter((row) => row.chapterId === assignment.chapterId));
  }
}

export async function pullAssessments(owner: string): Promise<string> {
  const enrollment = JSON.stringify(await getJson('/student/enrollment', StudentEnrollmentSchema, AbortSignal.timeout(15000)));
  const stored = await readSnapshot(owner);
  let data = stored?.enrollment === enrollment ? stored.data : null;
  if (stored && stored.enrollment !== enrollment) {
    const prefix = `${CACHE_PREFIX}${owner.replace('/', '.')}.`;
    for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key);
    await saveSnapshot(owner, { enrollment, data: {
      updatedAt: 0, cursors: { assignments: 0, items: 0, attempts: 0, conceptStates: 0 },
      hasMore: { assignments: false, items: false, attempts: false, conceptStates: false },
      assignments: [], items: [], attempts: [], conceptStates: [],
    } });
  }
  do {
    const cursors = data?.cursors ?? { assignments: 0, items: 0, attempts: 0, conceptStates: 0 };
    const query = new URLSearchParams(Object.entries(cursors).map(([key, value]) => [key, String(value)]));
    query.set('limit', '100');
    const page = await getJson(`/sync?${query}`, SyncResponseSchema, AbortSignal.timeout(15000));
    if (Object.entries(page.hasMore).some(([key, more]) => more && page.cursors[key as keyof typeof cursors] <= cursors[key as keyof typeof cursors])) {
      throw new Error('The homework sync cursor did not advance. Try again later.');
    }
    data = mergePull(data, page);
    await saveSnapshot(owner, { enrollment, data });
  } while (Object.values(data.hasMore).some(Boolean));
  mirrorCache(owner, data);
  return new Date(data.updatedAt).toISOString();
}
