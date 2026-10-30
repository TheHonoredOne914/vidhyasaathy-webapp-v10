import { RemediationResultSchema, RemediationSchema, SubmitRemediationSchema, type Answer, type PublicItem } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { questionView } from '../assessment/present';
import { usePageMeta } from '../meta';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { fieldClass } from '../ui/Field';
import { Skeleton } from '../ui/Skeleton';
import { AccessDenied } from '../routes/AccessDenied';
import { Citation } from './Citation';

function answerFor(item: PublicItem, value: string | string[] | undefined): Answer | null {
  if (item.type === 'match_pairs') {
    if (!Array.isArray(value) || value.length !== item.left.length || value.some((entry) => !entry)) return null;
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) return null;
  return item.type === 'mcq' ? value : value.trim();
}

export function RemediationPage() {
  const { conceptId = '' } = useParams();
  const remediation = useRemote(conceptId ? `/concepts/${conceptId}/remediation` : null, RemediationSchema);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  usePageMeta(remediation.data ? `${remediation.data.title} — VidhyaSaathy` : 'Short lesson — VidhyaSaathy', 'A missed concept opens a short lesson and a two-question check.');

  if (remediation.denied) return <AccessDenied />;
  if (remediation.status === 'error' && !remediation.data) return <ErrorState title="Could not load this lesson" message={remediation.message ?? 'Try again.'} onRetry={remediation.reload} />;
  if (!remediation.data) return <section className="lesson-shell is-paper"><Skeleton /></section>;

  const view = remediation.data;
  const earlier = view.targetConceptId !== view.conceptId;

  async function submit() {
    const built = view.check.map((item) => ({ itemId: item.id, answer: answerFor(item, answers[item.id]) }));
    if (built.some((entry) => entry.answer === null)) {
      setError('Answer both questions.');
      return;
    }
    const payload = { clientEventId: crypto.randomUUID(), answers: built.map((entry) => ({ itemId: entry.itemId, answer: entry.answer as Answer })) };
    const parsed = SubmitRemediationSchema.safeParse(payload);
    if (!parsed.success) {
      setError('Answer both questions.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const outcome = await postJson(`/concepts/${conceptId}/remediation/check`, RemediationResultSchema, parsed.data);
      setResult(outcome.passed
        ? outcome.passedOnSecondAttempt ? 'Passed on the second check.' : 'You passed the check.'
        : `${outcome.correct > 0 ? 'Almost there.' : "Let's fix this."} Both answers need to be correct.`);
      setAnswers({});
      remediation.reload();
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="lesson-shell is-paper">
      <p className="lesson-kicker">Short lesson</p>
      <h1>{view.title}</h1>
      <p className="lesson-hand">{earlier ? 'This is the earliest weak prerequisite.' : 'Two questions follow the lesson.'}</p>
      <p data-testid="remediation-status">
        {view.status === 'not_needed' ? 'Nothing to practise on this concept right now.' : null}
        {view.status === 'needs_teacher_material' ? 'Ask your teacher. The short lesson or the two questions are not published yet.' : null}
        {view.status === 'passed' ? view.passedOnSecondAttempt ? 'Passed on the second check.' : 'You passed the check.' : null}
        {view.status === 'ready' ? 'Both answers need to be correct.' : null}
      </p>
      {view.lesson ? (
        <article className="lesson-card">
          <p className="lesson-note">{view.lesson.body}</p>
          <Citation citation={view.lesson.citation} quote={false} />
        </article>
      ) : null}
      {view.status === 'ready' ? view.check.map((item) => {
        const question = questionView(item);
        return (
          <fieldset key={item.id} className="lesson-card grid gap-3">
            <legend className="font-semibold">{question.prompt}</legend>
            {question.kind === 'mcq' ? question.options.map((option) => (
              <label key={option} className="lesson-check">
                <input type="radio" name={`rem-${item.id}`} checked={answers[item.id] === option} onChange={() => { setAnswers((current) => ({ ...current, [item.id]: option })); }} />
                {option}
              </label>
            )) : null}
            {question.kind === 'match_pairs' ? question.left.map((left, index) => {
              const chosen = answers[item.id];
              const selected = Array.isArray(chosen) ? chosen[index] ?? '' : '';
              return (
              <label key={left} className="grid gap-1">
                {left}
                <select className={fieldClass} value={selected} onChange={(event) => {
                  const existing = answers[item.id];
                  const next = Array.isArray(existing) ? [...existing] : question.left.map(() => '');
                  next[index] = event.target.value;
                  setAnswers((current) => ({ ...current, [item.id]: next }));
                }}>
                  <option value="">Choose a match</option>
                  {question.right.map((right) => <option key={right} value={right}>{right}</option>)}
                </select>
              </label>
              );
            }) : null}
            {question.kind === 'short_answer' || question.kind === 'flashcard' ? (
              <input className={fieldClass} aria-label="Your answer" value={typeof answers[item.id] === 'string' ? answers[item.id] : ''} onChange={(event) => { setAnswers((current) => ({ ...current, [item.id]: event.target.value })); }} />
            ) : null}
          </fieldset>
        );
      }) : null}
      {result ? <p role="status">{result}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <div className="lesson-actions">
        {view.status === 'ready' ? <Button disabled={pending} onClick={() => { void submit(); }}>{pending ? 'Submitting check' : 'Submit both answers'}</Button> : null}
        <Link to="/student">Go home</Link>
      </div>
    </section>
  );
}
