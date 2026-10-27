import { Link } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';
import { AssignmentListSchema, AttemptListSchema } from '../assessment/schemas';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

export function ModerationSummary() {
  const assignments = useRemote('/assignments', AssignmentListSchema);
  const attempts = useRemote('/attempts?pendingOnly=false', AttemptListSchema);
  if (assignments.denied || attempts.denied) return <EmptyState title="Moderation is not available yet.">The API does not expose moderation data for this account.</EmptyState>;
  if (assignments.status === 'error' || attempts.status === 'error') return <ErrorState title="Could not load moderation" message={assignments.message ?? attempts.message ?? 'Try again.'} onRetry={() => { assignments.reload(); attempts.reload(); }} />;
  if (!assignments.data || !attempts.data) return <section className="lesson-shell"><Skeleton /></section>;
  const assignmentData = assignments.data;
  const attemptData = attempts.data;
  const rows = assignmentData.map((assignment) => { const paperAttempts = attemptData.filter((attempt) => attempt.assignmentId === assignment.id); const marked = paperAttempts.filter((attempt) => !attempt.needsReview).length; return { assignment, total: paperAttempts.length, marked, pending: paperAttempts.length - marked }; });
  return <section className="lesson-shell" aria-labelledby="moderation-title"><header className="lesson-banner"><p className="lesson-kicker">Board examiner</p><h1 id="moderation-title">Moderation summary</h1><p className="lesson-hand">A quiet check on what is marked and what still needs a second look.</p></header><p className="lesson-actions"><Link to="/examiner">Back to examiner desk</Link></p>{rows.length === 0 ? <EmptyState title="No assessment activity yet.">Once answers arrive, this summary will show the marking pulse across your papers.</EmptyState> : <div className="grid gap-4 sm:grid-cols-2">{rows.map(({ assignment, total, marked, pending }) => <Card key={assignment.id}><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-mid">{assignment.kind === 'quiz' ? 'Assessment' : 'Paper'}</p><h2 className="mt-1 text-xl font-semibold text-navy">{assignment.title}</h2></div><span className="rounded-full bg-ice px-3 py-1 text-sm font-semibold text-navy">{marked}/{total} marked</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-ice"><div className="h-full rounded-full bg-success" style={{ width: total ? `${(marked / total) * 100}%` : '0%' }} /></div><p className="mt-3 text-mid">{pending ? `${pending} answer${pending === 1 ? '' : 's'} still need marking.` : 'All submitted answers are marked.'}</p><Link className="mt-4 inline-block text-link" to={`/examiner/papers/${assignment.id}`}>Open paper</Link></Card>)}</div>}</section>;
}
