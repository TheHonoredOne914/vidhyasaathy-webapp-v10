import { LearningSessionSchema, SubmitSessionCheckSchema, type PublicItem } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError, postJson } from '../../api/client';
import { LearningSessionSchema as SessionResponse } from '../../content/schemas';
import { usePageMeta } from '../../meta';
import { useRemote } from '../../setup/useRemote';
import { ErrorState } from '../../ui/ErrorState';
import { Skeleton } from '../../ui/Skeleton';
import { fieldClass } from '../../ui/Field';
import { ConfidenceChips, type ConfidenceChoice } from '../../ui/ConfidenceChips';
import { AccessDenied } from '../AccessDenied';

function WhyWrong({ review }: { review: NonNullable<ReturnType<typeof LearningSessionSchema.parse>['review']> }) {
  if (!review.misses.length && !review.bridge) return null;
  return (
    <div className="check-paper" data-testid="why-wrong">
      {review.bridge ? <p>{review.bridge}</p> : null}
      {review.misses.length ? (
        <>
          <h2>Why this was wrong</h2>
          <ul>
            {review.misses.map((miss) => <li key={miss.itemId}><strong>{miss.prompt}</strong><p>{miss.explanation}</p></li>)}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function isPublicItem(item: { type?: string; content?: unknown }): item is PublicItem {
  return !('content' in item);
}

export function SessionPlayer() {
  const { sessionId = '' } = useParams();
  const session = useRemote(sessionId ? `/sessions/${sessionId}` : null, SessionResponse);
  const [cursor, setCursor] = useState(0);
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedConcept, setBlockedConcept] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [confidence, setConfidence] = useState<Record<string, ConfidenceChoice>>({});
  const progress = session.data?.progress ?? null;
  const viewed = progress?.viewedSlides ?? 0;
  const total = progress?.totalSlides ?? 0;
  usePageMeta(session.data ? `${session.data.title} — VidhyaSaathy` : 'Session — VidhyaSaathy', 'Slides open one at a time. The session is complete after the check.');

  useEffect(() => {
    if (!progress) return;
    setCursor(viewed < total ? viewed : Math.max(total - 1, 0));
    setReview(false);
  }, [progress, session.data?.id, total, viewed]);

  if (session.denied) return <AccessDenied />;
  if (session.status === 'error' && !session.data) return <ErrorState title="Could not open this session" message={session.message ?? 'Try again.'} onRetry={session.reload} />;
  if (!session.data || !progress) return <section className="session-stage"><Skeleton /></section>;

  const slides = session.data.slides;
  const slide = slides[Math.min(cursor, Math.max(slides.length - 1, 0))];
  const checks = session.data.check.filter(isPublicItem);
  const showCheck = progress.checkAvailable && !progress.completed && !review;
  const done = progress.completed;

  async function advance(slideId: string) {
    setPending(true);
    setError(null);
    setBlockedConcept(null);
    try {
      await postJson(`/sessions/${sessionId}/advance`, LearningSessionSchema, { slideId });
      session.reload();
    } catch (cause) {
      setBlockedConcept(cause instanceof ApiClientError && cause.code === 'REMEDIATION_REQUIRED' ? slide?.conceptId ?? null : null);
      setError(cause instanceof ApiClientError ? cause.message : 'The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  function answerFor(item: PublicItem): string | string[] | null {
    const value = answers[item.id];
    if (item.type === 'match_pairs') {
      if (!Array.isArray(value) || value.length !== item.left.length || value.some((entry) => !entry)) return null;
      return value;
    }
    if (typeof value !== 'string' || !value.trim()) return null;
    if (item.type === 'mcq' && !item.options.includes(value)) return null;
    return item.type === 'mcq' ? value : value.trim();
  }

  async function submitCheck() {
    const built = checks.map((item) => ({ itemId: item.id, answer: answerFor(item) }));
    if (built.some((entry) => entry.answer === null)) {
      setError('Answer each part of the check.');
      return;
    }
    if (checks.some((item) => !confidence[item.id])) {
      setError('Choose Sure, Unsure, or Guess for each question.');
      return;
    }
    const payload = { answers: built.map((entry) => ({ itemId: entry.itemId, answer: entry.answer as string | string[], confidence: confidence[entry.itemId] })) };
    setPending(true);
    setError(null);
    setBlockedConcept(null);
    try {
      const parsed = SubmitSessionCheckSchema.safeParse(payload);
      if (!parsed.success) {
        setError('Answer each part of the check.');
        return;
      }
      await postJson(`/sessions/${sessionId}/check`, LearningSessionSchema, parsed.data);
      session.reload();
    } catch (cause) {
      setBlockedConcept(cause instanceof ApiClientError && cause.code === 'REMEDIATION_REQUIRED' ? checks[0]?.conceptId ?? null : null);
      setError(cause instanceof ApiClientError ? cause.message : 'The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={done ? 'session-stage is-paper is-done' : 'session-stage is-paper'}>
      <div className="session-stage-inner">
        <p className="lesson-kicker">{session.data.title}</p>
        <div className="learn-dots" aria-hidden="true">
          {slides.map((item, index) => <i key={item.id} className={index === cursor ? 'is-current' : index < viewed ? 'is-done' : ''} />)}
          {progress.checkAvailable || done ? <i className="is-check" /> : null}
        </div>
        {done ? (
          <>
            <h1>Session complete</h1>
            <p className="lesson-hand">You finished the check.</p>
            <p>Every slide was opened, and the check was submitted.</p>
            {session.data.review ? <WhyWrong review={session.data.review} /> : null}
            <p className="lesson-actions"><Link to={`/student/chapters/${session.data.chapterId}`}>Back to the chapter</Link></p>
          </>
        ) : showCheck ? (
          <div className="check-paper">
            {session.data.review ? <WhyWrong review={session.data.review} /> : null}
            <h1>Check</h1>
            <p>The session is complete only after this check is submitted.</p>
            {checks.length === 0 ? <p role="alert">The check is not available yet.</p> : checks.map((item) => (
              <fieldset key={item.id} className="grid gap-3">
                <legend className="font-semibold">{item.prompt}</legend>
                {item.type === 'mcq' ? item.options.map((option) => (
                  <label key={option} className="lesson-check">
                    <input type="radio" name={`check-${item.id}`} value={option} checked={answers[item.id] === option} onChange={() => { setAnswers((current) => ({ ...current, [item.id]: option })); }} />
                    {option}
                  </label>
                )) : null}
                {item.type === 'match_pairs' ? item.left.map((left, index) => {
                  const chosen = answers[item.id];
                  const selected = Array.isArray(chosen) ? chosen[index] ?? '' : '';
                  return (
                  <label key={left} className="grid gap-1">
                    {left}
                    <select className={fieldClass} value={selected} onChange={(event) => {
                      const existing = answers[item.id];
                      const next = Array.isArray(existing) ? [...existing] : item.left.map(() => '');
                      next[index] = event.target.value;
                      setAnswers((current) => ({ ...current, [item.id]: next }));
                    }}>
                      <option value="">Choose a match</option>
                      {item.right.map((right) => <option key={right} value={right}>{right}</option>)}
                    </select>
                  </label>
                  );
                }) : null}
                {item.type === 'short_answer' || item.type === 'flashcard' ? (
                  <input className={fieldClass} aria-label={item.type === 'flashcard' ? 'What you remember' : 'Your answer'} value={typeof answers[item.id] === 'string' ? answers[item.id] : ''} onChange={(event) => { setAnswers((current) => ({ ...current, [item.id]: event.target.value })); }} />
                ) : null}
                {item.sourceRef ? <p className="lesson-cite">From your teacher’s notes · {item.sourceRef.locator}</p> : null}
                <ConfidenceChips name={`confidence-${item.id}`} value={confidence[item.id] ?? ''} onChange={(value) => { setConfidence((current) => ({ ...current, [item.id]: value })); }} />
              </fieldset>
            ))}
            {error ? <p role="alert">{error}</p> : null}
            {blockedConcept ? <p><Link to={`/student/concepts/${blockedConcept}/remediation`}>Open the short lesson and two-question check</Link></p> : null}
            <div className="lesson-actions">
              <button type="button" className="player-btn" disabled={pending || checks.length === 0} onClick={() => { void submitCheck(); }}>{pending ? 'Submitting check' : 'Submit check'}</button>
              <button type="button" className="player-btn secondary" onClick={() => { setReview(true); setCursor(0); }}>Review slides</button>
              <Link to={`/student/chapters/${session.data.chapterId}`}>Save and leave</Link>
            </div>
          </div>
        ) : slide ? (
          <>
            <p>Slide {cursor + 1} of {progress.totalSlides}</p>
            <h1>{slide.title}</h1>
            <p className="lesson-hand">One idea.</p>
            <p className="lesson-note" data-testid="current-slide">{slide.body}</p>
            {slide.noteId ? <p className="lesson-cite"><Link to={`/student/notes/${slide.noteId}`}>From your teacher’s notes</Link></p> : null}
            {error ? <p role="alert">{error}</p> : null}
            {blockedConcept ? <p><Link to={`/student/concepts/${blockedConcept}/remediation`}>Open the short lesson and two-question check</Link></p> : null}
            <div className="lesson-actions">
              {cursor > 0 ? <button type="button" className="player-btn secondary" onClick={() => { setCursor((current) => current - 1); }}>Back</button> : null}
              {cursor < viewed ? <button type="button" className="player-btn" onClick={() => { setCursor((current) => current + 1); }}>Next</button> : null}
              {cursor === viewed && viewed < total ? (
                <button type="button" className="player-btn" disabled={pending} onClick={() => { void advance(slide.id); }}>
                  {pending ? 'Saving slide' : viewed + 1 === total ? 'Continue to the check' : 'Continue'}
                </button>
              ) : null}
              {progress.checkAvailable ? <button type="button" className="player-btn secondary" onClick={() => { setReview(false); }}>Back to the check</button> : null}
              <Link to={`/student/chapters/${session.data.chapterId}`}>Save and leave</Link>
            </div>
          </>
        ) : <p role="alert">This session has no slide to show.</p>}
      </div>
    </section>
  );
}
