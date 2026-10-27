import { AssignmentDetailSchema, type Answer } from '@vidhyasaathy/contracts';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../meta';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { fieldClass } from '../ui/Field';
import { Skeleton } from '../ui/Skeleton';
import { AccessDenied } from '../routes/AccessDenied';
import { LessonFrame } from '../routes/content/LessonFrame';
import { useAttemptSync } from './AttemptSync';
import { AttemptListSchema } from './schemas';
import { formatDue, questionView, scoreText, type QuestionView } from './present';

function markLabel(correct: boolean | null, needsReview: boolean): string {
  if (needsReview || correct === null) return 'Waiting for your teacher';
  return correct ? 'Correct' : 'Not correct';
}

export function AssignmentAnswerPage() {
  const { assignmentId = '' } = useParams();
  const assignment = useRemote(assignmentId ? `/assignments/${assignmentId}` : null, AssignmentDetailSchema);
  const attempts = useRemote(assignmentId ? `/assignments/${assignmentId}/attempts` : null, AttemptListSchema);
  const sync = useAttemptSync();
  const started = useRef(Date.now());
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [gate, setGate] = useState<string | null>(null);
  usePageMeta(assignment.data ? `${assignment.data.title} — VidhyaSaathy` : 'Assignment — VidhyaSaathy', 'Answer the questions. A saved answer is sent when you are back online.');

  useEffect(() => {
    if (!sync.revision) return;
    assignment.reload();
    attempts.reload();
  }, [assignment.reload, attempts.reload, sync.revision]);

  if (assignment.denied || attempts.denied) return <AccessDenied />;
  if (!assignment.data || !attempts.data) {
    if (assignment.status === 'error' || attempts.status === 'error') {
      return <ErrorState title="Could not load this assignment" message={assignment.message ?? attempts.message ?? 'Try again.'} onRetry={() => { assignment.reload(); attempts.reload(); }} />;
    }
    return <LessonFrame kicker="Assignment" title="Assignment"><Skeleton /></LessonFrame>;
  }

  const detail = assignment.data;
  const byItem = new Map(attempts.data.map((attempt) => [attempt.itemId, attempt]));

  async function save(view: QuestionView) {
    let answer: Answer | null = null;
    if (view.kind === 'mcq') answer = drafts[view.id] || null;
    else if (view.kind === 'match_pairs') {
      const row = matches[view.id] ?? [];
      answer = row.length === view.left.length && row.every(Boolean) ? row : null;
    } else answer = (drafts[view.id] ?? '').trim() || null;
    if (!answer) {
      setGate(view.kind === 'mcq' ? 'Choose an answer.' : view.kind === 'match_pairs' ? 'Match each one to a different value.' : 'Enter an answer.');
      return;
    }
    if (view.kind === 'match_pairs' && Array.isArray(answer) && new Set(answer).size !== answer.length) {
      setGate('Match each one to a different value.');
      return;
    }
    setGate(null);
    setSaving(view.id);
    try {
      await sync.queue({
        clientEventId: crypto.randomUUID(),
        assignmentId: detail.id,
        itemId: view.id,
        answer,
        timeMs: Math.min(86_400_000, Math.max(0, Date.now() - started.current)),
        clientTs: Date.now(),
      });
    } catch (error) {
      setGate(error instanceof Error ? error.message : 'Could not save this answer on this device.');
    } finally {
      setSaving(null);
    }
  }

  return (
    <LessonFrame kicker={detail.kind === 'quiz' ? 'Quiz' : 'Homework'} title={detail.title} script="Save it on this device." stale={assignment}>
      <p className="lesson-actions"><Link to="/student?panel=homework">Back to homework</Link></p>
      <p>Due {formatDue(detail.dueAt)}. {detail.teacherName}.</p>
      <p data-testid="assignment-score">{scoreText(detail.score)}</p>
      {sync.notice ? <p role="alert">{sync.notice}</p> : null}
      {detail.items.map((item) => {
        const view = questionView(item);
        const attempt = byItem.get(view.id);
          const queued = sync.queuedAnswerKeys.includes(`${detail.id}/${view.id}`);
        return (
          <fieldset key={view.id} className="lesson-card grid gap-3">
            <legend className="font-semibold">{view.prompt}</legend>
            {attempt ? <p>{markLabel(attempt.correct, attempt.needsReview)}</p> : queued ? <p role="status">Saved on this device.</p> : (
              <>
                {view.kind === 'mcq' ? view.options.map((option) => (
                  <label key={option} className="lesson-check">
                    <input type="radio" name={`answer-${view.id}`} checked={drafts[view.id] === option} onChange={() => { setDrafts((current) => ({ ...current, [view.id]: option })); }} />
                    {option}
                  </label>
                )) : null}
                {view.kind === 'match_pairs' ? view.left.map((left, index) => (
                  <label key={left} className="grid gap-1">
                    {left}
                    <select className={fieldClass} value={matches[view.id]?.[index] ?? ''} onChange={(event) => {
                      const next = [...(matches[view.id] ?? view.left.map(() => ''))];
                      next[index] = event.target.value;
                      setMatches((current) => ({ ...current, [view.id]: next }));
                    }}>
                      <option value="">Choose a match</option>
                      {view.right.map((right) => <option key={right} value={right}>{right}</option>)}
                    </select>
                  </label>
                )) : null}
                {view.kind === 'short_answer' || view.kind === 'flashcard' ? (
                  <label className="grid gap-1" htmlFor={`answer-${view.id}`}>
                    Your answer
                    <input id={`answer-${view.id}`} className={fieldClass} value={drafts[view.id] ?? ''} onChange={(event) => { setDrafts((current) => ({ ...current, [view.id]: event.target.value })); }} />
                  </label>
                ) : null}
                <Button disabled={saving === view.id} onClick={() => { void save(view); }}>{saving === view.id ? 'Saving answer' : 'Save answer'}</Button>
              </>
            )}
          </fieldset>
        );
      })}
      {gate ? <p role="alert">{gate}</p> : null}
    </LessonFrame>
  );
}
