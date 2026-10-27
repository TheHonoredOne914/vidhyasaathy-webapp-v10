import { AssignmentDetailSchema, AttemptSchema, GradeAttemptSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { postJson, ApiClientError } from '../api/client';
import { useRemote } from '../setup/useRemote';
import { AttemptListSchema } from '../assessment/schemas';
import { answerText, questionView } from '../assessment/present';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';

export function PaperReview() {
  const { assignmentId = '' } = useParams();
  const paper = useRemote(assignmentId ? `/assignments/${assignmentId}` : null, AssignmentDetailSchema);
  const attempts = useRemote(assignmentId ? `/assignments/${assignmentId}/attempts` : null, AttemptListSchema);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (paper.denied || attempts.denied) return <EmptyState title="This paper is not available.">The API did not grant access to this paper. Check the examiner assignment with an administrator.</EmptyState>;
  if (paper.status === 'error' || attempts.status === 'error') return <ErrorState title="Could not load this paper" message={paper.message ?? attempts.message ?? 'Try again.'} onRetry={() => { paper.reload(); attempts.reload(); }} />;
  if (!paper.data || !attempts.data) return <section className="lesson-shell"><Skeleton /></section>;
  const paperData = paper.data;
  const attemptData = attempts.data;
  const questions = new Map(paperData.items.map((item) => [item.id, questionView(item)]));
  async function mark(row: (typeof attemptData)[number], correct: boolean) {
    setSaving(row.id); setError(null);
    try { await postJson(`/attempts/${row.id}/grade`, AttemptSchema, GradeAttemptSchema.parse({ correct })); attempts.reload(); }
    catch (err) { setError(err instanceof ApiClientError ? err.message : 'Could not save this mark.'); }
    finally { setSaving(null); }
  }
  return <section className="lesson-shell" aria-labelledby="paper-title">
    <header className="lesson-banner"><p className="lesson-kicker">Paper review</p><h1 id="paper-title">{paperData.title}</h1><p className="lesson-hand">Mark one answer at a time. Keep the reason visible.</p></header>
    <p className="lesson-actions"><Link to="/examiner">Back to examiner desk</Link></p>
    {attemptData.length === 0 ? <EmptyState title="No submitted answers yet.">This paper has no answer sheets ready for marking.</EmptyState> : <div className="grid gap-5" aria-label="Submitted answers">
      {attemptData.map((row, index) => { const question = questions.get(row.itemId); return <article key={row.id} className="vs-paper rounded-[18px] border-l-4 border-l-peach p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><p className="text-sm font-semibold text-mid">Answer {index + 1} · {question?.kind.replace('_', ' ') ?? 'question'}</p>{row.needsReview ? <span className="rounded-full bg-peach px-3 py-1 text-sm font-semibold text-midnight">Needs mark</span> : <span className="text-sm font-semibold text-success">Marked</span>}</div>
        <h2 className="mt-3 text-xl font-semibold text-navy">{question?.prompt ?? 'Question text unavailable'}</h2><p className="mt-4 rounded-[12px] bg-ice/60 p-4 text-lg text-navy">{answerText(row.answer)}</p>
        {question?.answer ? <p className="mt-3 text-sm text-mid">Marking reference: <span className="font-semibold text-navy">{question.answer}</span></p> : null}
        {row.needsReview ? <div className="mt-5 flex flex-wrap gap-3"><Button disabled={saving === row.id} onClick={() => { void mark(row, true); }}>Mark correct</Button><Button variant="secondary" disabled={saving === row.id} onClick={() => { void mark(row, false); }}>Mark not correct</Button></div> : null}
      </article>; })}
    </div>}
    {error ? <p className="mt-4 text-danger" role="alert">{error}</p> : null}
  </section>;
}
