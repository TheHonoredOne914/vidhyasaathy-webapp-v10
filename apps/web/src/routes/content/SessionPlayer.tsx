import { ChapterSchema, LearningSessionSchema, SubmitSessionCheckSchema, type PublicItem } from '@vidhyasaathy/contracts';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError, postJson } from '../../api/client';
import { LearningSessionSchema as SessionResponse } from '../../content/schemas';
import { usePageMeta } from '../../meta';
import { useRemote } from '../../setup/useRemote';
import { SubjectListSchema } from '../../setup/schemas';
import { fieldClass } from '../../ui/Field';
import { type ConfidenceChoice } from '../../ui/ConfidenceChips';
import { AccessDenied } from '../AccessDenied';
import { Card, ConfidenceRow, NbButton, ProgressBar, Sticky } from '../../student/notebook/ui';
import { PageAsk } from '../../student/notebook/screens/polish3a/PageAsk';
import { SlideNote } from '../../student/notebook/screens/polish3a/SlideNote';
import { Icon } from '../../student/notebook/icons';
import '../../student/notebook/pages/session-player.css';

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
  return <StudentSessionPlayer key={sessionId} sessionId={sessionId} />;
}

function StudentSessionPlayer({ sessionId }: { sessionId: string }) {
  const session = useRemote(sessionId ? `/sessions/${sessionId}` : null, SessionResponse);
  const [saved, setSaved] = useState<typeof session.data>(null);
  const data = saved ?? session.data;
  const chapter = useRemote(data?.chapterId ? `/chapters/${data.chapterId}` : null, ChapterSchema);
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const [cursor, setCursor] = useState(0);
  const [review, setReview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedConcept, setBlockedConcept] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [confidence, setConfidence] = useState<Record<string, ConfidenceChoice>>({});
  const busy = useRef(false);
  const progress = data?.progress ?? null;
  const viewed = progress?.viewedSlides ?? 0;
  const total = progress?.totalSlides ?? 0;
  usePageMeta(data ? `${data.title} — VidhyaSaathy` : 'Session — VidhyaSaathy', 'Slides open one at a time. The session is complete after the check.');

  useEffect(() => {
    if (!progress) return;
    setCursor(viewed < total ? viewed : Math.max(total - 1, 0));
    setReview(false);
  }, [progress, data?.id, total, viewed]);

  if (session.denied) return <AccessDenied />;
  if (session.status === 'error' && !data) return <Card title="Could not open this session"><p role="alert">Your session could not be loaded. Please try again.</p><NbButton onClick={session.reload}>Try again</NbButton></Card>;
  if (!data) return <div className="nb-grid sp-page" aria-label="Opening the session"><div className="nb-skel nb-skel--card" /><div className="nb-skel nb-skel--card" /></div>;
  if (!progress || !data.slides.length) return <Card title="No slides yet"><p>Your teacher has not added slides to this session.</p><NbButton onClick={session.reload}>Check again</NbButton></Card>;

  const slides = data.slides;
  const slide = slides[Math.min(cursor, Math.max(slides.length - 1, 0))];
  const checks = data.check.filter(isPublicItem);
  const showCheck = progress.checkAvailable && !progress.completed && !review;
  const done = progress.completed;
  const subjectName = Array.isArray(subjects.data) && chapter.data ? subjects.data.find((row) => row.id === chapter.data?.subjectId)?.name : undefined;

  async function advance(slideId: string) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError(null);
    setBlockedConcept(null);
    try {
      setSaved(await postJson(`/sessions/${sessionId}/advance`, LearningSessionSchema, { slideId }));
    } catch (cause) {
      setBlockedConcept(cause instanceof ApiClientError && cause.code === 'REMEDIATION_REQUIRED' ? slide?.conceptId ?? null : null);
      setError(cause instanceof ApiClientError && cause.code === 'REMEDIATION_REQUIRED' ? 'Open the short lesson before continuing.' : 'Your slide could not be saved. Please try again.');
    } finally {
      busy.current = false;
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
    if (busy.current) return;
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
    busy.current = true;
    setPending(true);
    setError(null);
    setBlockedConcept(null);
    try {
      const parsed = SubmitSessionCheckSchema.safeParse(payload);
      if (!parsed.success) {
        setError('Answer each part of the check.');
        return;
      }
      setSaved(await postJson(`/sessions/${sessionId}/check`, LearningSessionSchema, parsed.data));
    } catch (cause) {
      setBlockedConcept(cause instanceof ApiClientError && cause.code === 'REMEDIATION_REQUIRED' ? checks[0]?.conceptId ?? null : null);
      setError(cause instanceof ApiClientError && cause.code === 'REMEDIATION_REQUIRED' ? 'Open the short lesson before continuing.' : 'Your check could not be submitted. Please try again.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <div className="nb-grid sp-page">
      <div className="sp-wrap">
        <header className="sp-bar">
          <div><Link className="nb-link" to="/student?panel=study"><Icon name="back" /> Study sessions</Link><h1 className="nb-h1">{data.title}</h1></div>
          <div className="sp-chips">{subjectName ? <span className="nb-chip nb-chip--sky">{subjectName}</span> : null}<span className="nb-chip nb-chip--sand">{showCheck ? 'End-of-session check' : done && !review ? 'Session complete' : slides.length ? `Slide ${cursor + 1} of ${total}` : 'No slides yet'}</span></div>
        </header>
        <div role="progressbar" aria-label="Slides opened" aria-valuemin={0} aria-valuemax={total} aria-valuenow={viewed}><ProgressBar value={viewed / total * 100} /></div>
        {done && !review ? (
          <Card title="Session complete" tape>
            <p className="nb-note">You finished the check.</p>
            <p>Every slide was opened, and the check was submitted.</p>
            {data.review ? <WhyWrong review={data.review} /> : null}
            <div className="sp-actions"><NbButton onClick={() => { setReview(true); setCursor(0); }}>Review slides</NbButton><Link className="nb-link" to={`/student/chapters/${data.chapterId}`}>Back to the chapter</Link></div>
          </Card>
        ) : showCheck ? (
          <Card title="Check" tape className="sp-check">
            {data.review ? <WhyWrong review={data.review} /> : null}
            <p>The session is complete only after this check is submitted.</p>
            {checks.length === 0 ? <p>The check is not available yet.</p> : checks.map((item) => (
              <fieldset key={item.id} className="sp-question" disabled={pending}>
                <legend className="font-semibold">{item.prompt}</legend>
                {item.type === 'mcq' ? item.options.map((option) => (
                  <label key={option} className="sp-option">
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
                <ConfidenceRow value={confidence[item.id] ?? ''} locked={pending} onChange={(value) => { setConfidence((current) => ({ ...current, [item.id]: value })); }} />
              </fieldset>
            ))}
            {error ? <p role="alert">{error}</p> : null}
            {blockedConcept ? <p><Link to={`/student/concepts/${blockedConcept}/remediation`}>Open the short lesson and two-question check</Link></p> : null}
            <div className="sp-actions">
              <NbButton disabled={pending || checks.length === 0} onClick={() => { void submitCheck(); }}>{pending ? 'Submitting check' : 'Submit check'}</NbButton>
              <NbButton variant="ghost" disabled={pending} onClick={() => { setReview(true); setCursor(0); }}>Review slides</NbButton>
              <Link className="nb-link" to={`/student/chapters/${data.chapterId}`}>Save and leave</Link>
            </div>
          </Card>
        ) : slide ? (
          <>
            <section className="slide">
              <span className="nb-tape nb-tape--left" /><span className="nb-tape nb-tape--sky nb-tape--right" />
              <div className="sp-visual"><p className="nb-note">No diagram attached to this slide.</p>{slide.noteId ? <Link className="nb-link" to={`/student/notes/${slide.noteId}`}>Open your teacher’s notes →</Link> : null}</div>
              <div><span className="nb-label">Slide {cursor + 1}</span><h2>{slide.title}</h2><div className="pts" data-testid="current-slide">{slide.body.split(/\n+/).filter(Boolean).map((line, index) => <div className="pt" key={index}><b>{index + 1}</b><span>{line}</span></div>)}</div><div className="sp-teacher"><Sticky color="pink" who="From your teacher">{slide.noteId ? <Link to={`/student/notes/${slide.noteId}`}>Read the notes linked to this slide.</Link> : 'No teacher remark on this slide yet.'}</Sticky></div></div>
            </section>
            {error ? <p role="alert">{error}</p> : null}
            {blockedConcept ? <p><Link to={`/student/concepts/${blockedConcept}/remediation`}>Open the short lesson and two-question check</Link></p> : null}
            <div className="ctrl">
              <NbButton variant="ghost" disabled={pending || cursor === 0} onClick={() => { setCursor((current) => current - 1); }}><Icon name="back" /> Back</NbButton>
              <div className="dots" aria-label="Slides">{Array.from({ length: total }, (_, index) => { const known = slides[index]; return <button type="button" key={known?.id ?? `slot-${index}`} aria-label={`Slide ${index + 1}`} aria-current={index === cursor ? 'step' : undefined} disabled={pending || !known || index > viewed} onClick={() => { setCursor(index); }}><i className={index === cursor ? 'c' : index < viewed ? 'd' : ''} /></button>; })}</div>
              {cursor < viewed && cursor < slides.length - 1 ? <NbButton disabled={pending} size="lg" onClick={() => { setCursor((current) => current + 1); }}>Next →</NbButton> : cursor === viewed && viewed < total ? <NbButton disabled={pending} size="lg" onClick={() => { void advance(slide.id); }}>{pending ? 'Saving slide…' : viewed + 1 === total ? 'Open the check →' : 'Next →'}</NbButton> : <NbButton onClick={() => { setReview(false); }}>{done ? 'Back to summary' : 'Open the check'}</NbButton>}
            </div>
            <Link className="nb-link" to={`/student/chapters/${data.chapterId}`}>Save and leave</Link>
          </>
        ) : <Card title="No slides yet"><p>Your teacher has not added slides to this session.</p><NbButton onClick={session.reload}>Check again</NbButton></Card>}
      </div>
      <aside className="nb-col sp-rail">
        <PageAsk key={showCheck || (done && !review) ? sessionId : slide?.id} chapterId={data.chapterId} title={showCheck || (done && !review) ? 'Ask Saathy about this session' : 'Ask Saathy about this slide'} topic={showCheck || (done && !review) || !slide ? data.title : `${slide.title}. ${slide.body}`.slice(0, 160)} />
        {slide && !showCheck && (!done || review) ? <SlideNote key={slide.id} sessionId={sessionId} slideId={slide.id} ordinal={cursor + 1} /> : null}
        <Card title="In this session" meta={<span className="nb-meta">{total} slides</span>} className="slist" grow>
          {slides.map((item, index) => <button type="button" className={`s${!showCheck && (review || !done) && index === cursor ? ' c' : index < viewed ? ' d' : ''}`} key={item.id} aria-current={!showCheck && (review || !done) && index === cursor ? 'step' : undefined} disabled={pending || index > viewed} onClick={() => { setReview(true); setCursor(index); }}><b>{index + 1}</b><span>{item.title}</span>{index < viewed ? <span aria-label="Opened"><Icon name="check" /></span> : null}</button>)}
          {checks.length ? <button type="button" className={`s${showCheck ? ' c' : ''}`} disabled={pending || (!progress.checkAvailable && !done)} onClick={() => { setReview(false); }}><b>?</b><span>{done ? 'Check submitted' : `Check: ${checks.length} questions`}</span></button> : null}
          {slides.length < total ? <p className="nb-meta">The next slides appear as you go.</p> : null}
          <p className="nb-note">{done ? 'You can revisit these slides any time.' : 'Open each slide, then finish the check.'}</p>
        </Card>
      </aside>
    </div>
  );
}
