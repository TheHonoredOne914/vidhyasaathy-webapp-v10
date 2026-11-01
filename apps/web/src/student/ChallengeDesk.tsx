import { DailyChallengeAnswerResultSchema, DailyChallengeFinishSchema, DailyChallengeSchema } from '@vidhyasaathy/contracts';
import { DAILY_CHALLENGE_MINUTES } from '@vidhyasaathy/core/daily-challenge';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { usePageMeta } from '../meta';
import { useRemote } from '../setup/useRemote';
import type { ConfidenceChoice } from '../ui/ConfidenceChips';
import { Icon } from './notebook/icons';
import { Saathy } from './notebook/Saathy';
import { NotebookState } from './notebook/screens/polish3b/NotebookState';
import { QuizStrip, type QuizStep } from './notebook/screens/polish3b/QuizStrip';
import { Chip, ConfidenceRow } from './notebook/ui';
import './notebook/pages/quiz.css';

type Review = { outcome: 'yes' | 'not_yet'; why: string | null };

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function ChallengeDesk() {
  usePageMeta('Daily challenge — VidhyaSaathy', `Five questions in ${DAILY_CHALLENGE_MINUTES} minutes. Say how sure you are with every answer.`);
  const remote = useRemote('/student/daily-challenge', DailyChallengeSchema);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState('');
  const [confidence, setConfidence] = useState<ConfidenceChoice | ''>('');
  const [pending, setPending] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [finished, setFinished] = useState<{ status: 'completed' | 'expired'; xp: number; answered: number } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const questionStarted = useRef(Date.now());
  const handingIn = useRef(false);
  const data = remote.data;

  useEffect(() => {
    if (!data || finished) return;
    setSecondsLeft(data.secondsLeft);
  }, [data, finished]);

  async function handIn() {
    if (!data || handingIn.current) return;
    handingIn.current = true;
    setPending(true);
    setNotice(null);
    try {
      const result = await postJson(`/student/daily-challenge/${data.id}/finish`, DailyChallengeFinishSchema, {});
      setFinished({ status: result.status, xp: result.xp, answered: result.answered });
    } catch (cause) {
      handingIn.current = false;
      setNotice(cause instanceof Error ? cause.message : 'The challenge could not be handed in. Try again.');
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (secondsLeft == null || finished) return;
    if (secondsLeft <= 0) {
      // Time is server law; the hand-in is allowed once the five minutes are over.
      void handIn();
      return;
    }
    const timer = window.setTimeout(() => { setSecondsLeft((current) => (current == null ? null : Math.max(0, current - 1))); }, 1000);
    return () => { window.clearTimeout(timer); };
  }, [secondsLeft, finished]);

  async function submit(itemId: string, answer: string) {
    if (!data || pending || !confidence) return;
    setPending(true);
    setNotice(null);
    try {
      const marked = await postJson(`/student/daily-challenge/${data.id}/answer`, DailyChallengeAnswerResultSchema, {
        clientEventId: crypto.randomUUID(), itemId, answer, confidence,
        timeMs: Math.min(86_400_000, Math.max(0, Date.now() - questionStarted.current)),
      });
      setReview({ outcome: marked.outcome, why: marked.why });
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === 'CHALLENGE_CLOSED') {
        setNotice(cause.message);
        void handIn();
      } else {
        setNotice(cause instanceof Error ? cause.message : 'The answer could not be saved. Try again.');
      }
    } finally {
      setPending(false);
    }
  }

  function next(total: number) {
    if (index + 1 >= total) {
      void handIn();
      return;
    }
    setIndex(index + 1);
    setChoice('');
    setConfidence('');
    setReview(null);
    setNotice(null);
    questionStarted.current = Date.now();
  }

  if (remote.status === 'loading' && !data) return <div className="nb-col"><NotebookState title="Daily challenge" loading /></div>;
  if (remote.denied) return <div className="nb-col"><NotebookState title="This challenge is not available" message="Ask your teacher to check your access." /></div>;
  if (remote.status === 'error' && !data) return <div className="nb-col"><NotebookState title="Could not open the challenge" message="Your notebook is safe. Try opening it again." retry={remote.reload} /></div>;
  if (!data) return null;

  if (finished?.status === 'expired') {
    return <div className="nb-col" data-testid="student-challenge-done">
      <section className="nb-card">
        <span className="nb-tape" aria-hidden="true" />
        <Chip tone="sand">Time is up</Chip>
        <h1 className="nb-h2" style={{ marginTop: 'var(--nb-s2)' }}>Today&apos;s five minutes have passed.</h1>
        <p className="nb-note">No questions were tried, so nothing was added today. A new set waits for you tomorrow.</p>
        <Link className="nb-btn nb-btn--primary" style={{ marginTop: 'var(--nb-s3)', display: 'inline-flex' }} to="/student">Back to home</Link>
      </section>
    </div>;
  }

  if (finished) {
    return <div className="nb-col" data-testid="student-challenge-done">
      <section className="nb-card">
        <span className="nb-tape" aria-hidden="true" />
        <Chip tone="green">Challenge done</Chip>
        <h1 className="nb-h2" style={{ marginTop: 'var(--nb-s2)' }}>Five minutes well spent.</h1>
        <p className="nb-note">You answered {finished.answered} of {data.items.length || 5}. The server added {finished.xp} XP to your day.</p>
        <div className="nb-saathy-tip" style={{ marginTop: 'var(--nb-s3)' }}><Saathy mood="cheer" size="3.4rem" /><p className="nb-note">Same time tomorrow — a new set waits for you.</p></div>
        <Link className="nb-btn nb-btn--primary" style={{ marginTop: 'var(--nb-s3)', display: 'inline-flex' }} to="/student">Back to home</Link>
      </section>
    </div>;
  }

  if (data.status === 'completed') {
    return <div className="nb-col" data-testid="student-challenge">
      <section className="nb-card"><span className="nb-tape" aria-hidden="true" /><Chip tone="green">Done for today</Chip>
        <h1 className="nb-h2" style={{ marginTop: 'var(--nb-s2)' }}>Today&apos;s challenge is already handed in.</h1>
        <p className="nb-note">A fresh set of five questions arrives tomorrow.</p>
        <Link className="nb-btn nb-btn--primary" style={{ marginTop: 'var(--nb-s3)', display: 'inline-flex' }} to="/student">Back to home</Link>
      </section>
    </div>;
  }

  if (!data.items.length) {
    return <div className="nb-col" data-testid="student-challenge">
      <NotebookState title="A fresh page" message="No challenge questions are ready yet — the bank for this chapter is still growing. Nothing was lost; tomorrow brings a new try." />
      <Link className="nb-btn nb-btn--primary" style={{ alignSelf: 'flex-start' }} to="/student">Back to home</Link>
    </div>;
  }

  const item = data.items[index];
  const total = data.items.length;
  const steps: QuizStep[] = data.items.map((_, slot) => {
    if (review && slot === index) return review.outcome === 'yes' ? 'right' : 'wrong';
    return slot < index ? 'todo' : slot === index ? 'current' : 'todo';
  });
  const answeredCount = steps.filter((state) => state === 'right' || state === 'wrong').length;

  return <div className="pg-quiz" data-testid="student-challenge">
    <div className="qz-top">
      <Link className="back" to="/student"><Icon name="back" />Home</Link>
      <div className="strip-wrap"><QuizStrip steps={steps} /><div className="strip-cap"><span>Daily challenge · {total} questions</span><span>{finished ? 'Finished' : `Q${index + 1} of ${total}`}</span></div></div>
      {secondsLeft != null ? <Chip tone="sand" dashed><Icon name="clock" /> {clock(secondsLeft)}</Chip> : null}
    </div>
    <div className="nb-quiz">
      <div className="qz-main">
        {item ? <form className="nb-qcard" onSubmit={(event) => {
          event.preventDefault();
          if (!review) { void submit(item.id, choice); return; }
          next(total);
        }}>
          <span className="nb-tape" aria-hidden="true" />
          <div className="nb-q__label"><span className="nb-q__num">{index + 1}</span><span className="nb-label">Daily challenge · {DAILY_CHALLENGE_MINUTES} min</span></div>
          <div className="qz-figure"><div><h1 className="nb-q__text">{item.prompt}</h1><p className="nb-meta">{item.type === 'mcq' ? 'Choose one answer.' : 'This question type is not part of the challenge yet.'}</p></div></div>
          {item.type === 'mcq' ? <div className="nb-opts">{item.options.map((option, optionIndex) => {
            const selected = choice === option;
            const right = Boolean(review && review.outcome === 'yes' && selected);
            const wrong = Boolean(review && review.outcome === 'not_yet' && selected);
            return <button type="button" key={option} className={`nb-opt${selected ? ' is-selected' : ''}${right ? ' is-correct' : ''}${wrong ? ' is-wrong' : ''}${review && !right && !wrong ? ' is-dim' : ''}`} aria-pressed={selected} disabled={Boolean(review) || pending} onClick={() => { setChoice(option); }}><span className="nb-opt__key">{'abcdefghijklmnopqrstuvwxyz'[optionIndex]}</span><span className="nb-opt__body">{option}</span></button>;
          })}</div> : null}
          <ConfidenceRow value={confidence} locked={Boolean(review) || pending} onChange={setConfidence} />
          {!review ? <p className="nb-meta">Be honest — it changes what Saathy gives you next, not your marks.</p> : <>
            <div className={`nb-feedback nb-feedback--${review.outcome === 'yes' ? 'right' : 'wrong'}`} role="status"><Saathy mood={review.outcome === 'yes' ? 'cheer' : 'oops'} size="3.4rem" /><div><p className="nb-feedback__title">{review.outcome === 'yes' ? 'That is the one!' : "Not quite. Let's untangle it."}</p>{review.why ? <p className="nb-feedback__body">{review.why}</p> : null}</div></div>
          </>}
          {notice ? <p role="alert" className="nb-note">{notice}</p> : null}
          <div className="qz-foot"><div className="left"><span className="nb-meta">{answeredCount} answered</span></div><button type="submit" className="nb-btn nb-btn--primary nb-btn--lg" disabled={pending || item.type !== 'mcq' || (!review && (!confidence || !choice))}>{pending ? 'Checking…' : review ? index + 1 >= total ? 'Hand it in' : 'Next question' : 'Check answer'}<Icon name="arrow" /></button></div>
        </form> : null}
      </div>
    </div>
  </div>;
}
