import { Link } from 'react-router-dom';
import { usePageMeta } from '../meta';
import { useRemote } from '../setup/useRemote';
import { AssignmentListSchema, AttemptListSchema } from '../assessment/schemas';
import { scoreText, formatDue } from '../assessment/present';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { Badge } from '../ui/Badge';

export function ExaminerHome() {
  usePageMeta('Examiner desk — VidhyaSaathy', 'Assigned papers and assessment marking.');
  const assignments = useRemote('/assignments', AssignmentListSchema);
  const attempts = useRemote('/attempts?pendingOnly=true', AttemptListSchema);

  if (assignments.denied || attempts.denied) return <EmptyState title="The examiner desk is not connected yet.">Examiner access is not enabled for this account. Ask an administrator to assign the Board Examiner role.</EmptyState>;
  if (assignments.status === 'error' || attempts.status === 'error') return <ErrorState title="Could not load the examiner desk" message={assignments.message ?? attempts.message ?? 'Try again.'} onRetry={() => { assignments.reload(); attempts.reload(); }} />;
  if (!assignments.data || !attempts.data) return <section className="lesson-shell"><Skeleton /></section>;

  return (
    <section className="lesson-shell" aria-labelledby="examiner-title">
      <header className="lesson-banner">
        <p className="lesson-kicker">Board examiner</p>
        <h1 id="examiner-title">The marking desk</h1>
        <p className="lesson-hand">Assigned papers, careful marks, clear moderation.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3" aria-label="Examiner summary">
        <Card variant="sticky"><p className="text-sm text-mid">Assigned papers</p><p className="mt-1 text-3xl font-semibold text-navy">{assignments.data.length}</p></Card>
        <Card variant="note"><p className="text-sm text-mid">Waiting to mark</p><p className="mt-1 text-3xl font-semibold text-navy">{attempts.data.length}</p></Card>
        <Card><p className="text-sm text-mid">Moderation view</p><Link className="mt-2 inline-block text-link" to="/examiner/moderation">Open summary</Link></Card>
      </div>
      <div className="mt-8 flex items-end justify-between gap-4"><div><p className="lesson-kicker">Your queue</p><h2 className="text-2xl font-semibold text-navy">Assigned papers</h2></div><Badge tone="peach">{attempts.data.length} to mark</Badge></div>
      {assignments.data.length === 0 ? <div className="mt-4"><EmptyState title="No papers are assigned yet.">When a paper reaches your desk, it will appear here with its due date and marking progress.</EmptyState></div> : (
        <div className="mt-4 grid gap-4" aria-label="Assigned papers">
          {assignments.data.map((assignment) => <Card key={assignment.id} className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-sm text-mid">{assignment.kind === 'quiz' ? 'Assessment' : 'Paper'} · due {formatDue(assignment.dueAt)}</p><h3 className="mt-1 text-xl font-semibold text-navy">{assignment.title}</h3><p className="mt-1 text-mid">{scoreText(assignment.score)}</p></div>
            <Link className="inline-flex min-h-12 items-center rounded-[14px] bg-navy px-[22px] font-semibold text-ivory shadow-[0_4px_0_#041d3d]" to={`/examiner/papers/${assignment.id}`}>Review paper</Link>
          </Card>)}
        </div>
      )}
    </section>
  );
}
