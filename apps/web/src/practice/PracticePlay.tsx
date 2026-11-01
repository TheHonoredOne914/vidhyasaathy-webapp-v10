import { GameIdSchema, LessonViewSchema, PracticeAttemptSchema, PracticeSetSchema, ProgressSchema, StudentHomeSchema, DushmanListSchema, type PracticeAttempt, type PublicItem } from '@vidhyasaathy/contracts';
import { gameModules, type GameState } from '@vidhyasaathy/core/games';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ApiClientError, getJson, postJson } from '../api/client';
import { usePageMeta } from '../meta';
import { useRemote } from '../setup/useRemote';
import type { ConfidenceChoice } from '../ui/ConfidenceChips';
import { Card, Chip, ConfidenceRow, MasteryChip, Sticky } from '../student/notebook/ui';
import { Icon } from '../student/notebook/icons';
import { Saathy } from '../student/notebook/Saathy';
import { NotebookState } from '../student/notebook/screens/polish3b/NotebookState';
import { QuizStrip, type QuizStep } from '../student/notebook/screens/polish3b/QuizStrip';
import '../student/notebook/pages/quiz.css';
import { draftAnswer, gameCopy } from './games';

function PenMark({ correct }: { correct: boolean }) {
  return <svg viewBox="0 0 24 24" role="img" aria-label={correct ? 'Correct option' : 'Your choice'}><path d={correct ? 'M4 13.5c2.2 2 3.4 3.4 5 6.2C12 13 16 8 21 4' : 'M5 5c5 4 9 8 14 14M19 5C14 9 10 14 5 19'} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>;
}

export function PracticePlay() {
  const { chapterId = '', gameId = '' } = useParams();
  const [params] = useSearchParams();
  const dushmanRound = params.get('skin') === 'dushman';
  const roundConcept = params.get('concept');
  const parsed = GameIdSchema.safeParse(gameId);
  const id = parsed.success ? parsed.data : null;
  const query = id && chapterId ? `/chapters/${chapterId}/practice?gameId=${id}&limit=6${roundConcept ? `&concept=${encodeURIComponent(roundConcept)}` : ''}` : null;
  const remote = useRemote(query, PracticeSetSchema);
  const home = useRemote('/student/home', StudentHomeSchema);
  const progress = useRemote('/progress', ProgressSchema);
  const [game, setGame] = useState<GameState | null>(null);
  const [choice, setChoice] = useState('');
  const [pairs, setPairs] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<ConfidenceChoice | ''>('');
  const [review, setReview] = useState<null | {
    choice: string; correct: boolean; explanation: string | null; fix: string | null;
    correctOption: string | null; errorType: PracticeAttempt['errorType']; xp: number;
    event: { clientEventId: string; itemId: string; answer: string | string[]; timeMs: number; clientTs: number; confidence: ConfidenceChoice };
  }>(null);
  const [bridge, setBridge] = useState<string | null>(null);
  const [hint, setHint] = useState<'hint' | 'formula' | 'simpler' | null>(null);
  const [repeats, setRepeats] = useState<Record<string, number>>({});
  const [remediation, setRemediation] = useState(false);
  const events = useRef<Record<string, string>>({});
  const loaded = useRef('');
  const questionStarted = useRef(Date.now());
  const [tick, setTick] = useState(() => Date.now());
  const index = game?.answers.length ?? 0;
  const current = remote.data?.items[index]?.item;
  const lesson = useRemote(current ? `/concepts/${current.conceptId}/lesson${hint === 'simpler' ? '?simpler=1' : ''}` : null, LessonViewSchema);
  const notes = lesson.data?.found ? lesson.data : null;
  const copy = id ? gameCopy(id) : null;
  const dushmanName = home.data?.dushman.find((row) => row.conceptId === roundConcept)?.name ?? null;
  usePageMeta(copy ? `${copy.title} — VidhyaSaathy` : 'Practice — VidhyaSaathy', 'Optional practice on released questions.');

  useEffect(() => {
    if (!remote.data || !id || remote.data.gameId !== id) return;
    const token = `${chapterId}:${id}:${remote.data.updatedAt}`;
    if (loaded.current === token) return;
    loaded.current = token;
    events.current = {};
    questionStarted.current = Date.now();
    setChoice(''); setPairs([]); setNotice(null); setRemediation(false); setConfidence('');
    setReview(null); setBridge(null); setHint(null); setRepeats({});
    setGame(gameModules[id].start(remote.data.items.map((row) => row.item), { startedAt: Date.now() }));
  }, [chapterId, remote.data, id]);

  useEffect(() => {
    if (!game?.deadline) return;
    const timer = window.setInterval(() => { setTick(Date.now()); }, 1000);
    return () => { window.clearInterval(timer); };
  }, [game?.deadline]);

  // A finished Dushman round re-checks the queue, so an idea that just reached mastery leaves the list.
  useEffect(() => {
    if (!dushmanRound || !game || game.answers.length === 0) return;
    if (game.answers.length < game.items.length) return;
    void getJson('/student/dushman', DushmanListSchema).catch(() => { /* The next queue read re-checks anyway. */ });
  }, [dushmanRound, game]);

  if (!id || !copy) return <NotebookState title="Practice" message="This game is not in your notebook." />;
  if (remote.denied) return <NotebookState title="This practice is not available" message="Ask your teacher to check your access." />;
  if (remote.status === 'error') return <NotebookState title="Could not open this practice" message="Your notebook is safe. Try opening it again." retry={remote.reload} />;
  if (!remote.data || !game) return <NotebookState title={copy.title} loading />;

  const set = remote.data;
  const expired = game.deadline != null && tick >= game.deadline;
  const result = gameModules[game.gameId].result(game, expired && game.deadline != null ? game.deadline : tick);
  const done = result.completed;
  const item: PublicItem | undefined = done ? undefined : current;
  const mastery = progress.data?.masteryWords.find((word) => word.conceptId === item?.conceptId)?.word;
  const strip: QuizStep[] = set.items.map((_, slot) => {
    if (review && slot === index) return review.correct ? 'right' : 'wrong';
    const answer = game.answers[slot];
    if (answer) return answer.correct ? 'right' : 'wrong';
    return slot === index && !done ? 'current' : 'todo';
  });
  const rightCount = strip.filter((state) => state === 'right').length;
  const repeated = review?.errorType && item ? repeats[`${item.conceptId}:${review.errorType}`] ?? 0 : 0;

  async function submit(currentItem: PublicItem) {
    if (!game || pending || !confidence) return;
    const answer = draftAnswer(currentItem, choice, pairs);
    if (!answer) return;
    const clientTs = Date.now();
    if (game.deadline != null && clientTs >= game.deadline) return;
    const clientEventId = events.current[currentItem.id] ?? crypto.randomUUID();
    events.current[currentItem.id] = clientEventId;
    const input = { clientEventId, itemId: currentItem.id, answer, timeMs: Math.min(86_400_000, Math.max(0, clientTs - questionStarted.current)), clientTs, confidence };
    setPending(true); setNotice(null); setRemediation(false);
    try {
      const marked = await postJson('/practice/attempts', PracticeAttemptSchema, input);
      setReview({ choice: Array.isArray(answer) ? answer.join(' · ') : answer, correct: marked.correct === true,
        explanation: marked.explanation !== currentItem.prompt ? marked.explanation : null,
        fix: marked.fix, correctOption: marked.correctOption, errorType: marked.errorType, xp: 0, event: input });
      if (!marked.correct && marked.errorType) {
        const key = `${currentItem.conceptId}:${marked.errorType}`;
        setRepeats((previous) => ({ ...previous, [key]: (previous[key] ?? 0) + 1 }));
      }
      if (marked.bridge) setBridge(marked.bridge);
      // XP comes from the server, never from a client-side reward table.
      if (home.data) {
        const before = home.data.xp;
        void getJson('/student/home', StudentHomeSchema).then((updated) => {
          setReview((previous) => previous?.event.clientEventId === clientEventId ? { ...previous, xp: Math.max(0, updated.xp - before) } : previous);
          home.reload();
        }).catch(() => { /* The answer is already saved; XP can refresh next time. */ });
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.code === 'REMEDIATION_REQUIRED') setRemediation(true);
      else setNotice(error instanceof ApiClientError && (error.status === 401 || error.status === 403) ? 'You cannot save here right now. Ask your teacher to check your access.' : 'Your answer could not be saved. Please try checking it again.');
    } finally { setPending(false); }
  }

  return <div className={`pg-quiz${review ? review.correct ? ' quiz-right' : ' quiz-wrong' : ''}`}>
    <div className="qz-top">
      <Link className="back" to={dushmanRound ? '/student/dushman' : `/student/chapters/${chapterId}/practice`}><Icon name="back" />{dushmanRound ? 'Dushman list' : notes?.title ?? copy.title}</Link>
      <div className="strip-wrap"><QuizStrip steps={strip} /><div className="strip-cap"><span>{dushmanRound ? 'Dushman round' : copy.title} · {set.items.length} questions</span><span>{done ? 'Finished' : `Q${index + 1} of ${set.items.length}`}</span></div></div>
      {home.data ? <Chip tone="sand">{home.data.xp} XP</Chip> : null}
    </div>
    <div className="nb-quiz">
      <div className="qz-main">
        {dushmanRound ? <section className="nb-card" data-testid="dushman-frame">
          <span className="nb-tape" aria-hidden="true" />
          <div className="nb-card__head"><Chip tone="red">Dushman round</Chip>{home.data?.dushman.find((row) => row.conceptId === roundConcept) ? <span className="nb-meta">Still on your list</span> : null}</div>
          <p className="nb-note" style={{ margin: 0 }}>{dushmanName ? <>Only <b>{dushmanName}</b> questions are dealt in this round.</> : 'Only this one idea is dealt in this round.'} Answer sure and correct, and it leaves your Dushman list on its own.</p>
        </section> : null}
        {game.deadline != null && !done ? <p className="nb-meta">Seconds left: {Math.max(0, Math.ceil((game.deadline - tick) / 1000))}</p> : null}
        {!set.items.length ? <NotebookState title="A fresh page" message={dushmanRound ? 'No questions for this idea are released yet. The Dushman round stays open — try again after the next lesson lands.' : 'No released questions match this practice yet.'} /> : done ? <Card title="Practice complete"><p className="nb-note" data-testid="practice-result">{result.correct === result.total ? 'Top form on this set.' : result.correct ? 'Almost there. Keep the notes you worked on in mind.' : "Let's fix this. Read the notes, then try again."}</p>{dushmanRound ? <p className="nb-note">If this idea held steady, it leaves your Dushman list on its own.</p> : null}<Link className="nb-btn nb-btn--primary" to={dushmanRound ? '/student/dushman' : '/student'}>{dushmanRound ? 'Back to the list' : 'Go home'}</Link></Card> : null}
        {item ? <form className="nb-qcard" onSubmit={(event) => {
          event.preventDefault();
          if (!review) { void submit(item); return; }
          setGame(gameModules[game.gameId].onAnswer(game, review.event, review.correct));
          questionStarted.current = Date.now();
          setReview(null); setChoice(''); setPairs([]); setConfidence(''); setNotice(null); setHint(null); setBridge(null);
        }}>
          <span className="nb-tape" aria-hidden="true" />
          <div className="nb-q__label"><span className="nb-q__num">{index + 1}</span><span className="nb-label">Practice{notes ? ` · ${notes.title}` : ''}</span>{mastery ? <MasteryChip level={mastery} /> : null}</div>
          <div className="qz-figure"><div><h1 className="nb-q__text">{item.prompt}</h1><p className="nb-meta">{item.type === 'mcq' ? 'Choose one answer.' : item.type === 'match_pairs' ? 'Match each idea to a different value.' : 'Write your answer below.'}</p></div></div>
          {item.type === 'mcq' ? <div className="nb-opts">{item.options.map((option, optionIndex) => {
            const right = Boolean(review && review.correctOption === option);
            const wrong = Boolean(review && !review.correct && review.choice === option);
            return <button type="button" key={option} className={`nb-opt${choice === option ? ' is-selected' : ''}${right ? ' is-correct' : ''}${wrong ? ' is-wrong' : ''}${review && !right && !wrong ? ' is-dim' : ''}`} aria-pressed={choice === option} disabled={Boolean(review) || pending} onClick={() => { setChoice(option); }}><span className="nb-opt__key">{'abcdefghijklmnopqrstuvwxyz'[optionIndex]}</span><span className="nb-opt__body">{option}</span><span className="nb-opt__mark">{right || wrong ? <PenMark correct={right} /> : null}</span></button>;
          })}</div> : item.type === 'match_pairs' ? item.left.map((left, pairIndex) => <label key={left} className="nb-field"><span className="nb-label">{left}</span><select className="nb-input" disabled={Boolean(review) || pending} value={pairs[pairIndex] ?? ''} onChange={(event) => { const next = item.left.map((_, slot) => pairs[slot] ?? ''); next[pairIndex] = event.target.value; setPairs(next); }}><option value="">Choose a match</option>{item.right.map((right) => <option key={right} value={right}>{right}</option>)}</select></label>) : <label className="nb-field" htmlFor="practice-text"><span className="nb-label">Your answer</span><input id="practice-text" className="nb-input nb-input--lined" disabled={Boolean(review) || pending} value={choice} onChange={(event) => { setChoice(event.target.value); }} /></label>}
          <ConfidenceRow value={confidence} locked={Boolean(review) || pending} onChange={setConfidence} />
          {!review ? <p className="nb-meta">Be honest. It changes what Saathy gives you next, not your marks.</p> : <>
            <div className={`nb-feedback nb-feedback--${review.correct ? 'right' : 'wrong'}`} role="status"><Saathy mood={review.correct ? 'cheer' : 'oops'} size="3.4rem" /><div><p className="nb-feedback__title">{review.correct ? 'That is the one!' : "Not quite. Let's untangle it."}</p>{review.explanation ? <p className="nb-feedback__body">{review.explanation}</p> : null}</div>{review.xp > 0 ? <span className="nb-xp-pop">+{review.xp} XP</span> : null}</div>
            {!review.correct ? <div className="nb-whywrong" data-testid="why-wrong"><div className="ww-box"><h4>What you did</h4><p className="working"><s>{review.choice}</s></p>{review.fix ? <p className="redmark">{review.fix}</p> : <p className="nb-meta">No misconception note was returned for this answer.</p>}</div><div className="ww-box"><h4>Fix it</h4><p className="working">{review.explanation ?? 'Open the lesson and work through the idea once more.'}</p>{review.correctOption ? <p className="nb-note">The answer: {review.correctOption}</p> : null}</div></div> : null}
          </>}
          {notice ? <p role="alert" className="nb-note">{notice}</p> : null}
          {remediation ? <p role="alert" className="nb-note">Let&apos;s revisit the idea before continuing. <Link to={`/student/concepts/${item.conceptId}/remediation`}>Open the lesson and check</Link></p> : null}
          <div className="qz-foot"><div className="left">{review?.errorType ? <Chip tone="red">Mistake type · {review.errorType}</Chip> : <><button type="button" className="nb-btn nb-btn--ghost" onClick={() => { setHint('hint'); }}>Hint</button><span className="nb-meta">Pick how sure you are to check.</span></>}</div><button type="submit" className="nb-btn nb-btn--primary nb-btn--lg" disabled={pending || (!review && (!confidence || !draftAnswer(item, choice, pairs)))}>{pending ? 'Checking…' : review ? index === set.items.length - 1 ? 'Finish practice' : 'Next question' : 'Check answer'}<Icon name="arrow" /></button></div>
        </form> : null}
      </div>
      <aside className="qz-rail">
        <Card title={review?.correct ? 'Nice going' : 'Stuck?'} className="keep-m"><div className="nb-saathy-tip"><Saathy mood={review?.correct ? 'happy' : 'think'} size="3.4rem" /><p className="nb-note">{review?.correct ? 'Keep that idea with you for the next question.' : "I'll give you a hint, not the answer."}</p></div>{item ? <div className="nb-chips"><button type="button" className="nb-chip" onClick={() => { setHint('hint'); }}>Give me a hint</button>{notes?.summary.formulas.length ? <button type="button" className="nb-chip" onClick={() => { setHint('formula'); }}>Show the formula</button> : null}<button type="button" className="nb-chip" onClick={() => { setHint('simpler'); }}>Explain simpler</button></div> : null}
          {hint ? <p className="nb-note" role="status">{lesson.status === 'loading' ? 'Opening the notes…' : hint === 'formula' ? notes?.summary.formulas.join(' · ') : hint === 'simpler' ? notes?.note ?? 'No simpler note is available yet.' : bridge ?? set.bridge ?? notes?.bridge.repair ?? 'Try writing what you know first. The lesson has a worked example.'}</p> : null}
          {item && hint ? <Link className="nb-link" to={`/student/concepts/${item.conceptId}`}>Open the lesson</Link> : null}
        </Card>
        {notes?.summary.formulas.length ? <Sticky who="From your notes"><h3 className="nb-h3">Keep this handy</h3>{notes.summary.formulas.map((formula) => <p className="nb-note" key={formula}>{formula}</p>)}</Sticky> : null}
        {repeated >= 2 ? <Card title="Twice now"><p className="nb-note">The same kind of slip has come up twice in this round. Take a moment with the lesson before moving on.</p>{item ? <Link className="nb-link" to={`/student/concepts/${item.conceptId}`}>Look at the idea again</Link> : null}</Card> : null}
        <Card title="This round" meta={`${rightCount} right`}><div className="round">{strip.map((state, slot) => <div key={slot} className={state === 'right' ? 'r' : state === 'wrong' ? 'w' : state === 'current' ? 'c' : ''} aria-label={`Question ${slot + 1}: ${state}`}>{state === 'right' ? <Icon name="check" /> : state === 'wrong' ? <Icon name="x" /> : slot + 1}</div>)}</div></Card>
        <Card title="Next up"><p className="nb-note">{set.items[index + 1]?.item.prompt ?? (done ? 'Your practice notes are ready to revisit.' : 'This is the last question in this set.')}</p></Card>
      </aside>
    </div>
  </div>;
}
