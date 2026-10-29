import { GameIdSchema, PracticeAttemptSchema, PracticeSetSchema, type PublicItem } from '@vidhyasaathy/contracts';
import { gameModules, type GameState } from '@vidhyasaathy/core/games';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { usePageMeta } from '../meta';
import { LessonFrame } from '../routes/content/LessonFrame';
import { AccessDenied } from '../routes/AccessDenied';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { fieldClass } from '../ui/Field';
import { ConfidenceChips, type ConfidenceChoice } from '../ui/ConfidenceChips';
import { Skeleton } from '../ui/Skeleton';
import { draftAnswer, gameCopy, kindLabel } from './games';
import './practice.css';

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
  const [wrongs, setWrongs] = useState<{ prompt: string; explanation: string }[]>([]);
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
    setWrongs([]);
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
      <LessonFrame kicker="Practice" title="Practice">
        <p>This game is not on VidhyaSaathy.</p>
        <p className="lesson-actions"><Link to="/student">Go home</Link></p>
      </LessonFrame>
    );
  }
  if (remote.denied) return <AccessDenied />;
  if (!remote.data || remote.status === 'loading') {
    if (remote.status === 'error') return <ErrorState title="Could not load this game" message={remote.message ?? 'Try again.'} onRetry={remote.reload} />;
    return <LessonFrame kicker="Practice" title={copy.title}><Skeleton /></LessonFrame>;
  }

  const set = remote.data;
  const expired = game?.deadline != null && tick >= game.deadline;
  const result = game ? gameModules[game.gameId].result(game, expired && game.deadline != null ? game.deadline : tick) : null;
  const done = Boolean(result?.completed);
  const index = game?.answers.length ?? 0;
  const row = set.items[index];
  const item: PublicItem | undefined = done ? undefined : row?.item;
  const back = <p className="lesson-actions"><Link to={`/student/chapters/${chapterId}/practice`}>All games</Link></p>;

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
      setGame(gameModules[game.gameId].onAnswer(game, input, marked.correct));
      setChoice('');
      setPairs([]);
      setNotice(marked.correct ? 'Correct.' : 'Not correct.');
      if (!marked.correct && marked.explanation) setWrongs((current) => [...current, { prompt: currentPrompt, explanation: marked.explanation! }]);
      if (marked.bridge) setBridge(marked.bridge);
      setConfidence('');
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

  return (
    <LessonFrame kicker="Practice" title={copy.title} script="Optional. This does not change a deadline." stale={remote}>
      {back}
      <p className="practice-note">{copy.detail}</p>
      {set.bridge || bridge ? <p className="check-paper">{bridge ?? set.bridge}</p> : null}
      {wrongs.length ? (
        <div className="check-paper" data-testid="why-wrong">
          <h2>Why this was wrong</h2>
          <ul>{wrongs.map((miss) => <li key={miss.prompt}><strong>{miss.prompt}</strong><p>{miss.explanation}</p></li>)}</ul>
        </div>
      ) : null}
      {set.items.length === 0 ? <p>No released questions match this game yet.</p> : null}
      {game?.deadline != null && !done ? <p className="practice-clock">Seconds left: {Math.max(0, Math.ceil((game.deadline - tick) / 1000))}</p> : null}
      {done && result ? (
        <div className="lesson-card" data-testid="practice-result">
          <h2>Practice complete</h2>
          <p>{result.correct} of {result.total} correct. {result.answered} answered.</p>
          <p>Correct answers count toward the practice run. A wrong answer does not.</p>
          <p className="lesson-actions"><Link to="/student">Go home</Link></p>
        </div>
      ) : null}
      {item && game ? (
        <form className="lesson-card grid gap-3" onSubmit={(event) => { event.preventDefault(); void submit(item); }}>
          <p>{kindLabel(row?.kind ?? 'new')}. Question {index + 1} of {set.items.length}.</p>
          <fieldset className="grid gap-3">
            <legend className="font-semibold">{item.prompt}</legend>
            {item.type === 'mcq' ? item.options.map((option) => (
              <label key={option} className="lesson-check">
                <input type="radio" name="practice-answer" checked={choice === option} onChange={() => { setChoice(option); }} />
                {option}
              </label>
            )) : null}
            {item.type === 'match_pairs' ? item.left.map((left, pairIndex) => (
              <label key={left} className="grid gap-1">
                {left}
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
              <label className="grid gap-1" htmlFor="practice-text">Your answer
                <input id="practice-text" className={fieldClass} value={choice} onChange={(event) => { setChoice(event.target.value); }} />
              </label>
            ) : null}
            <ConfidenceChips name="practice-confidence" value={confidence} onChange={setConfidence} />
          </fieldset>
          {notice ? <p role="status">{notice}</p> : null}
          {remediation ? <p role="alert">{remediation} <Link to={`/student/concepts/${item.conceptId}/remediation`}>Open the lesson and check</Link></p> : null}
          <Button type="submit" disabled={pending}>{pending ? 'Checking' : 'Check answer'}</Button>
        </form>
      ) : notice && !done ? <p role="status">{notice}</p> : null}
    </LessonFrame>
  );
}
