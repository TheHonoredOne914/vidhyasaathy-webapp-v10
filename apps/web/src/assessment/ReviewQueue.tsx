import { AttemptSchema, GradeAttemptSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { audienceFrom } from '../content/audience';
import { ApiClientError, postJson } from '../api/client';
import { usePageMeta } from '../meta';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { AccessDenied } from '../routes/AccessDenied';
import { LessonFrame } from '../routes/content/LessonFrame';
import { AssignmentListSchema, AttemptListSchema } from './schemas';
import { answerText } from './present';

export function ReviewQueuePage() {
  const { pathname } = useLocation();
  const audience = audienceFrom(pathname);
  const reviews = useRemote('/attempts?pendingOnly=true', AttemptListSchema);
  const assignments = useRemote('/assignments', AssignmentListSchema);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  usePageMeta('Review queue — VidhyaSaathy', 'Short answers that need a teacher to mark them correct or not.');

  if (reviews.denied || assignments.denied) return <AccessDenied />;
  if ((reviews.status === 'loading' && !reviews.data) || (assignments.status === 'loading' && !assignments.data)) {
    return <LessonFrame kicker="Review" title="Review queue"><Skeleton /></LessonFrame>;
  }
  if (!reviews.data || !assignments.data) {
    const failed = reviews.data ? assignments : reviews;
    return <ErrorState title="Could not load the review queue" message={failed.message ?? 'Try again.'} onRetry={() => { reviews.reload(); assignments.reload(); }} />;
  }

  const titles = new Map(assignments.data.map((item) => [item.id, item.title]));

  async function grade(id: string, correct: boolean) {
    setPendingId(id);
    setError(null);
    try {
      await postJson(`/attempts/${id}/grade`, AttemptSchema, GradeAttemptSchema.parse({ correct }));
      reviews.reload();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Could not save the mark.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <LessonFrame kicker="Review" title="Review queue" script="Short answers wait here." stale={reviews}>
      <p className="lesson-actions"><Link to={`/${audience}/homework`}>Back to homework</Link></p>
      {reviews.data.length === 0 ? <p>No answers are waiting for a mark.</p> : (
        <div className="grid gap-4" aria-label="Answers waiting for a mark">
          {reviews.data.map((row) => (
            <article key={row.id} className="lesson-card">
              <h2>{titles.get(row.assignmentId) ?? 'Assignment'}</h2>
              <p>{answerText(row.answer)}</p>
              <div className="lesson-actions">
                <Button disabled={pendingId === row.id} onClick={() => { void grade(row.id, true); }}>Mark correct</Button>
                <Button variant="secondary" disabled={pendingId === row.id} onClick={() => { void grade(row.id, false); }}>Mark not correct</Button>
              </div>
            </article>
          ))}
        </div>
      )}
      {error ? <p role="alert">{error}</p> : null}
    </LessonFrame>
  );
}
