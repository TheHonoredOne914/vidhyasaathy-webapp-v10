export interface FollowupItemRow {
  id: string;
  conceptId: string;
  itemId: string | null;
  reason: string;
  dueAt: number;
  createdAt: number;
  completedAt: number | null;
}

export interface FollowupCandidate {
  id: string;
  kind: 'followup';
  title: string;
  conceptId: string;
  conceptName: string | null;
  estMinutes: number;
  href: string;
  resumeState: string | null;
  dueAt: number;
  resumeAt: number;
  lateUntil: number | null;
  windowOpen: boolean;
}

export function getFollowupCandidates(rows: FollowupItemRow[], now: number): FollowupCandidate[] {
  return rows
    .filter((row) => row.completedAt == null)
    .map((row) => ({
      id: row.id,
      kind: 'followup' as const,
      title: row.reason === 'unsure_answer' ? 'Review unsure answer' : 'Review quick-try',
      conceptId: row.conceptId,
      conceptName: null,
      estMinutes: 5,
      href: `/student/ask?concept=${row.conceptId}&followup=${row.id}`,
      resumeState: null,
      dueAt: row.dueAt,
      resumeAt: row.createdAt,
      lateUntil: row.dueAt + 7 * 24 * 60 * 60 * 1000,
      windowOpen: row.dueAt <= now + 7 * 24 * 60 * 60 * 1000,
    }));
}