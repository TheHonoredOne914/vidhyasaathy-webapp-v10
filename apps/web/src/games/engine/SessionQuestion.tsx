import { useRef, useState } from 'react';
import { ConfidenceRow } from '../../student/notebook/ui';
import { submitAnswer, type GameAnswerResult, type GameSubmission } from '../gameApi';
import { useGameSession } from './GameSession';

// The session's public bank item is the only scored question. Simulation readouts
// never decide correctness or write evidence.
export function SessionQuestion({ checkpointKey, onAnswered }: { checkpointKey: string; onAnswered?: (result: GameAnswerResult) => void }) {
  const context = useGameSession();
  const item = context?.session?.checkpoints[checkpointKey];
  const [value, setValue] = useState('');
  const [confidence, setConfidence] = useState<'' | GameSubmission['confidence']>('');
  const [result, setResult] = useState<GameAnswerResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef<GameSubmission | null>(null);
  const busy = useRef(false);
  const started = useRef(Date.now());
  if (!context || !item || !context.session) return <p className="nb-note">This checkpoint is not available yet.</p>;
  const { gameId, session } = context;
  const numeric = item.format === 'numeric';
  const ready = !!value.trim() && !!confidence && (!numeric || Number.isFinite(Number(value)));
  async function submit() {
    if (!item || !session || !ready || busy.current || result) return;
    request.current ??= { clientEventId: crypto.randomUUID(), checkpointKey, answer: item.options.length ? { optionId: value } : numeric ? { numeric: Number(value) } : { text: value.trim() }, confidence: confidence as GameSubmission['confidence'], timeMs: Math.max(0, Date.now() - started.current) };
    busy.current = true; setPending(true); setError(false);
    try { const next = await submitAnswer(gameId, session.sessionId, request.current); setResult(next); onAnswered?.(next); }
    catch { setError(true); }
    finally { busy.current = false; setPending(false); }
  }
  return <form className="nb-q" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
    <fieldset disabled={pending || !!result || error}><legend>{item.stem}</legend>
      {item.options.length ? <div className="nb-opts">{item.options.map((option, index) => <label key={option.id} className={`nb-opt${result?.correctOptionId === option.id ? ' is-right' : result && !result.correct && value === option.id ? ' is-wrong' : value === option.id ? ' is-picked' : ''}`}><input type="radio" name={checkpointKey} value={option.id} checked={value === option.id} onChange={() => setValue(option.id)} /><span className="nb-opt__key">{String.fromCharCode(65 + index)}</span><span>{option.text}</span></label>)}</div> : <input className="nb-text" aria-label="Your answer" type={numeric ? 'number' : 'text'} step={numeric ? 'any' : undefined} value={value} onChange={(event) => setValue(event.target.value)} />}
    </fieldset>
    <ConfidenceRow value={confidence} locked={pending || !!result || error} onChange={setConfidence} />
    {!result ? <button className="nb-btn nb-btn--primary" disabled={!ready || pending} type="submit">{pending ? 'Checking…' : error ? 'Retry answer' : 'Check answer'}</button> : <div className={`nb-feedback ${result.correct ? 'nb-feedback--right' : 'nb-feedback--wrong'}`} role="status"><b>{result.correct ? 'Spot on!' : 'Let’s look at it.'}</b><p>{result.explanation}</p>{result.misconceptionNote ? <p>{result.misconceptionNote}</p> : null}</div>}
    {error ? <p className="nb-note" role="alert">Your answer has not been confirmed. Retry to save the same answer.</p> : null}
  </form>;
}
