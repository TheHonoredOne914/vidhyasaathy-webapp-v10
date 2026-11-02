import { apiFetch } from '../api/client';

type ActivityEvent = { id: string; type: 'activity_finished'; moduleId: string; activityId: string; result: { score: number; completed: boolean; seconds: number } };

export async function saveActivityEvidence(sessionId: string, event: ActivityEvent): Promise<'live' | 'mock'> {
  const response = await apiFetch(`/learning/sessions/${encodeURIComponent(sessionId)}/events`, { method: 'POST', body: JSON.stringify(event) });
  if (response.ok) return 'live';
  if (response.status !== 400 && response.status !== 404) throw new Error('Activity evidence could not be saved.');
  // An explicit compatibility queue, not mastery or a client-generated score.
  const key = `learning-activity-pending:${sessionId}`;
  const rows: ActivityEvent[] = JSON.parse(sessionStorage.getItem(key) ?? '[]');
  sessionStorage.setItem(key, JSON.stringify([...rows.filter((row) => row.id !== event.id), event]));
  return 'mock';
}
