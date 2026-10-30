import { GameIdSchema, PracticeAttemptSchema, PracticeSetSchema, type PracticeAttempt, type PublicItem } from '@vidhyasaathy/contracts';
import { gameModules, type GameState } from '@vidhyasaathy/core/games';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { usePageMeta } from '../meta';
import { LessonFrame } from '../routes/content/LessonFrame';
import { AccessDenied } from '../routes/AccessDenied';
import { useRemote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { fieldClass } from '../ui/Field';
import type { ConfidenceChoice } from '../ui/ConfidenceChips';
import { ConfidenceRow, DoodleStrip } from '../student/notebook/ui';
import '../student/notebook/pages/quiz.css';
import { Skeleton } from '../ui/Skeleton';
import { draftAnswer, gameCopy, kindLabel } from './games';
import './practice.css';

function resultLine(correct: boolean, errorType: PracticeAttempt['errorType']) {
  if (correct) return 'That is the one.';
  if (errorType === 'method') return 'The working slipped. The note below names the mix-up.';
  if (errorType === 'careless') return 'Close. A detail slipped, and the note says which one.';
  if (errorType === 'guess') return 'That guess does not match the idea.';
  return 'That choice mixes up the idea.';
}

function PenMark({ kind }: { kind: 'tick' | 'cross' }) {
  const label = kind === 'tick' ? 'Correct option' : 'Your choice';
  return kind === 'tick' ? (
    <svg className="pen-mark tick" viewBox="0 0 24 24" role="img" aria-label={label}>
      <path d="M4 13.5c2.2 2 3.4 3.4 5 6.2C12 13 16 8 21 4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  ) : (
    <svg className="pen-mark cross" viewBox="0 0 24 24" role="img" aria-label={label}>
      <path d="M5 5c5 4 9 8 14 14M19 5C14 9 10 14 5 19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="12" cy="12" rx="9" ry="7.5" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-8 12 12)" />
    </svg>
  );
}

function practiceWords(correct: number, total: number) {
  if (total > 0 && correct === total) return 'Top form on this set.';
  if (correct > 0) return 'Almost there. The notes name what to fix.';
  return 'Let\'s fix this. Read the note, then try again.';
}

export function PracticePlay() {
  const { chapterId = '', gameId = '' } = useParams();
  const parsed = GameIdSchema.safeParse(gameId);
  const id = parsed.success ? parsed.data : null;
  const remote = useRemote(id && chapterId ? `/chapters/${chapterId}/practice?gameId=${id}&limit=6` : null, PracticeSetSchema);
  const [game, setGame] = useState<GameState | null>(null);
  const [choice, setChoice] = useState('');
  const [pairs, setPairs] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceChoice | ''>('');
  const [review, setReview] = useState<null | {
    choice: string; correct: boolean; explanation: string | null; fix: string | null;
    correctOption: string | null; errorType: PracticeAttempt['errorType'];
    event: { clientEventId: string; itemId: string; answer: string | string[]; timeMs: number; clientTs: number; confidence: ConfidenceChoice };
  }>(null);
  const [bridge, setBridge] = useState<string | null>(null);
  const [remediation, setRemediation] = useState<string | null>(null);
  const events = useRef<Record<string, string>>({});
  const loaded = useRef('');
  const [tick, setTick] = useState(() => Date.now());
  const copy = id ? gameCopy(id) : null;
  usePageMeta(copy ? `${copy.title} — VidhyaSaathy` : 'Practice — VidhyaSaathy', 'Optional practice on released questions. It does not change a deadline.');

  useEffect(() => {
    if (!remote.data || !id || remote.data.gameId !== id) return;
    const token = `${chapterId}:${id}:${remote.data.updatedAt}`;
    if (loaded.current === token) return;
    loaded.current = token;
    events.current = {};
    setChoice('');
    setPairs([]);
    setNotice(null);
    setRemediation(null);
    setConfidence('');
    setReview(null);
    setBridge(null);
    if (remote.data.items.length === 0) {
      setGame(null);
      return;
    }
    const startedAt = Date.now();
    setGame(gameModules[remote.data.gameId].start(remote.data.items.map((row) => row.item), { startedAt }));
  }, [chapterId, remote.data, id]);

  useEffect(() => {
    if (!game?.deadline) return;
    const timer = window.setInterval(() => { setTick(Date.now()); }, 1000);
    return () => { window.clearInterval(timer); };
  }, [game?.deadline]);

  if (!id || !copy) {
    return (
      <LessonFrame paper kicker="Practice" title="Practice">
        <p>This game is not on VidhyaSaathy.</p>
        <p className="lesson-actions"><Link to="/student">Go home</Link></p>
      </LessonFrame>
    );
  }
  if (remote.denied) return <AccessDenied />;
  if (!remote.data || remote.status === 'loading') {
    if (remote.status === 'error') return <ErrorState title="Could not load this game" message={remote.message ?? 'Try again.'} onRetry={remote.reload} />;
    return <LessonFrame paper kicker="Practice" title={copy.title}><Skeleton /></LessonFrame>;
  }

  const set = remote.data;
  const expired = game?.deadline != null && tick >= game.deadline;
  const result = game ? gameModules[game.gameId].result(game, expired && game.deadline != null ? game.deadline : tick) : null;
  const done = Boolean(result?.completed);
  const index = game?.answers.length ?? 0;
  const row = set.items[index];
  const item: PublicItem | undefined = done ? undefined : row?.item;

  async function submit(current: PublicItem) {
    if (!game || pending) return;
    const answer = draftAnswer(current, choice, pairs);
    const currentPrompt = current.prompt;
    if (!answer) {
      setNotice(current.type === 'mcq' ? 'Choose an answer.' : current.type === 'match_pairs' ? 'Match each one to a different value.' : 'Enter an answer.');
      return;
    }
    if (!confidence) {
      setNotice('Choose Sure, Unsure, or Guess.');
      return;
    }
    const clientTs = Date.now();
    if (game.deadline != null && clientTs >= game.deadline) return;
    const eventId = events.current[current.id] ?? crypto.randomUUID();
    events.current[current.id] = eventId;
    setPending(true);
    setNotice(null);
    setRemediation(null);
    const input = {
      clientEventId: eventId,
      itemId: current.id,
      answer,
      timeMs: Math.min(86_400_000, Math.max(0, clientTs - game.startedAt)),
      clientTs,
      confidence,
    };
    try {
      const marked = await postJson('/practice/attempts', PracticeAttemptSchema, input);
      const explanation = marked.explanation && marked.explanation !== currentPrompt ? marked.explanation : null;
      setReview({
        choice: typeof answer === 'string' ? answer : '',
        correct: marked.correct === true,
        explanation,
        fix: marked.fix,
        correctOption: marked.correctOption,
        errorType: marked.errorType,
        event: input,
      });
      setNotice(resultLine(marked.correct === true, marked.errorType));
      if (marked.bridge) setBridge(marked.bridge);
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'REMEDIATION_REQUIRED') {
        setRemediation(error.message);
        return;
      }
      setNotice(error instanceof Error ? error.message : 'Could not save this answer.');
    } finally {
      setPending(false);
    }
  }

  const quizState = review?.correct ? ' quiz-right' : review && !review.correct ? ' quiz-wrong' : '';
  const strip = set.items.map((_, slot) => {
    if (review && slot === index) return review.correct ? 'right' as const : 'wrong' as const;
    const answer = game?.answers[slot];
    if (answer) return answer.correct ? 'right' as const : 'wrong' as const;
    if (slot === index) return 'current' as const;
    return 'todo' as const;
  });
  const keys = 'abcdefghijklmnopqrstuvwxyz';
  return (
    <div className={`pg-quiz${quizState}`}>
      <div className="nb-grid">
        <div className="nb-col qz-main">
          <div className="qz-top">
            <Link className="back" to={`/student/chapters/${chapterId}/practice`}>All games</Link>
            <div className="strip-wrap">
              <DoodleStrip states={strip.length ? strip : ['current']} />
              <div className="strip-cap"><span>{copy.title}</span><span>{done ? 'Set complete' : `Question ${index + 1} of ${set.items.length}`}</span></div>
            </div>
          </div>
          {set.bridge || bridge ? <p className="nb-note">{bridge ?? set.bridge}</p> : null}
          {set.items.length === 0 ? <p className="nb-empty">No released questions match this game yet.</p> : null}
          {game?.deadline != null && !done ? <p className="nb-meta">Seconds left: {Math.max(0, Math.ceil((game.deadline - tick) / 1000))}</p> : null}
          {done && result ? (
            <section className="nb-card" data-testid="practice-result">
              <h2 className="nb-h2">Practice complete</h2>
              <p className="nb-note">{practiceWords(result.correct, result.total)}</p>
              <p className="nb-text">Correct answers count toward the practice run. A wrong answer does not.</p>
              <p><Link className="nb-btn nb-btn--primary" to="/student">Go home</Link></p>
            </section>
          ) : null}
          {item && game ? (
            <form onSubmit={(event) => {
              event.preventDefault();
              if (review && game) {
                setGame(gameModules[game.gameId].onAnswer(game, review.event, review.correct));
                setReview(null);
                setChoice('');
                setPairs([]);
                setConfidence('');
                setNotice(null);
                return;
              }
              void submit(item);
            }}>
              <section className="nb-qcard">
                <div className="nb-q__label"><span className="nb-q__num">{index + 1}</span><span className="nb-label">{kindLabel(row?.kind ?? 'new')}</span></div>
                <h1 className="nb-q__text">{item.prompt}</h1>
                {item.type === 'mcq' ? <div className="nb-opts">{item.options.map((option, optionIndex) => {
                  const picked = review ? review.choice === option : choice === option;
                  const right = Boolean(review && review.correctOption === option);
                  const wrong = Boolean(review && !review.correct && review.choice === option);
                  return (
                    <button type="button" key={option} className={`nb-opt${picked ? ' is-selected' : ''}${right ? ' is-correct' : ''}${wrong ? ' is-wrong' : ''}`} disabled={Boolean(review)} onClick={() => { setChoice(option); }}>
                      <span className="nb-opt__key">{keys[optionIndex] ?? optionIndex + 1}</span>
                      <span className="nb-opt__body">{option}</span>
                      <span className="nb-opt__mark">{right ? <PenMark kind="tick" /> : wrong ? <PenMark kind="cross" /> : null}</span>
                    </button>
                  );
                })}</div> : null}
                {item.type === 'match_pairs' ? item.left.map((left, pairIndex) => (
                  <label key={left} className="nb-field">
                    <span className="nb-label">{left}</span>
                    <select className={fieldClass} value={pairs[pairIndex] ?? ''} onChange={(event) => {
                      const next = item.left.map((_, slot) => pairs[slot] ?? '');
                      next[pairIndex] = event.target.value;
                      setPairs(next);
                    }}>
                      <option value="">Choose a match</option>
                      {item.right.map((right) => <option key={right} value={right}>{right}</option>)}
                    </select>
                  </label>
                )) : null}
                {item.type === 'short_answer' || item.type === 'flashcard' ? (
                  <label className="nb-field" htmlFor="practice-text"><span className="nb-label">Your answer</span>
                    <input id="practice-text" className="nb-input nb-input--lined" value={choice} onChange={(event) => { setChoice(event.target.value); }} />
                  </label>
                ) : null}
                {review?.correct ? (
                  <div className="nb-feedback nb-feedback--right">
                    <div><p className="nb-feedback__title">That is the one.</p>{review.explanation ? <p className="nb-feedback__body">{review.explanation}</p> : null}</div>
                  </div>
                ) : null}
                {review && !review.correct ? (
                  <div className="nb-feedback nb-feedback--wrong" data-testid="why-wrong">
                    <div>
                      <p className="nb-feedback__title">Let&apos;s fix this.</p>
                      {review.explanation ? <p className="nb-feedback__body">{review.explanation}</p> : null}
                      <div className="nb-whywrong">
                        <div className="ww-box"><h4>What you did</h4><p className="nb-note">{review.choice}</p></div>
                        <div className="ww-box"><h4>Fix it</h4><p className="nb-note">{review.fix || 'Read the idea again, then try the next one.'}</p></div>
                      </div>
                    </div>
                  </div>
                ) : null}
                {review ? <ConfidenceRow value={confidence} locked onChange={setConfidence} /> : <ConfidenceRow value={confidence} onChange={setConfidence} />}
              </section>
              {notice ? <p className="nb-empty" role="status">{notice}</p> : null}
              {remediation ? <p role="alert">{remediation} <Link to={`/student/concepts/${item.conceptId}/remediation`}>Open the lesson and check</Link></p> : null}
              <div className="qz-foot"><button type="submit" className="nb-btn nb-btn--primary nb-btn--lg" disabled={pending}>{pending ? 'Checking…' : review ? 'Next question' : 'Check'}</button></div>
            </form>
          ) : notice && !done ? <p className="nb-empty" role="status">{notice}</p> : null}
        </div>
        <aside className="nb-col qz-rail">
          <section className="nb-card keep-m">
            <h3 className="nb-h3">This round</h3>
            <p className="nb-text">{review ? (review.correct ? 'That is right.' : review.explanation || 'Have another look.') : 'Pick an answer, then say how sure you are.'}</p>
          </section>
          {set.bridge || bridge ? <section className="nb-card"><h3 className="nb-h3">Hint</h3><p className="nb-note">{bridge ?? set.bridge}</p></section> : null}
        </aside>
      </div>
    </div>
  );
}
