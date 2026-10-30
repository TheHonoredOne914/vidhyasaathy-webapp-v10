import { CheckpointResultSchema, ExplainResultSchema, FlashcardResultSchema, RevisionQueuedSchema, type PublicLesson } from '@vidhyasaathy/contracts';
import { useRef, useState } from 'react';
import { ApiClientError, postJson } from '../../../../api/client';
import { ConfidenceRow, NbButton } from '../../ui';

type Confidence = '' | 'sure' | 'unsure' | 'guess';

export function YourTurn({ lesson }: { lesson: PublicLesson }) {
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState<Confidence>('');
  const [hinted, setHinted] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const started = useRef(Date.now());
  async function check() {
    if (busy.current) return;
    if (!answer.trim() || !confidence) { setError('Write an answer and choose how sure you feel.'); return; }
    busy.current = true; setPending(true); setError('');
    try {
      const result = await postJson(`/concepts/${lesson.conceptId}/lesson/faded`, CheckpointResultSchema, { answer, confidence, hinted, timeMs: Date.now() - started.current });
      setMessage(result.explanation);
    } catch (cause) { setError(cause instanceof ApiClientError ? cause.message : 'Could not save. Try again.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <div className="yourturn"><span className="nb-label">Your turn</span><p>{lesson.faded.prompt}</p>
    <label className="nb-text">Your answer<input className="nb-input nb-input--lined" value={answer} disabled={pending} onChange={(event) => { setAnswer(event.target.value); setMessage(''); }} /></label>
    <ConfidenceRow value={confidence} locked={pending} onChange={setConfidence} />
    <div className="ls-actions"><NbButton size="sm" disabled={pending} onClick={() => { void check(); }}>{pending ? 'Checking…' : 'Check my working'}</NbButton><NbButton size="sm" variant="quiet" disabled={pending} onClick={() => { setHinted(true); }}>Show step 1</NbButton></div>
    {hinted ? <p className="nb-redpen">{lesson.faded.hint}</p> : null}
    {message ? <p role="status">{message}</p> : null}{error ? <p role="alert">{error}</p> : null}
  </div>;
}

export function LessonReview({ lesson }: { lesson: PublicLesson }) {
  const [words, setWords] = useState('');
  const [gap, setGap] = useState('');
  const [confidence, setConfidence] = useState<Confidence>('');
  const [explanation, setExplanation] = useState('');
  const [card, setCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [queued, setQueued] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const started = useRef(Date.now());
  const current = lesson.flashcards[card];
  async function run(task: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError('');
    try { await task(); }
    catch (cause) { setError(cause instanceof ApiClientError ? cause.message : 'Could not save. Try again.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <details className="ls-review nb-card"><summary className="nb-h3">Keep it fresh · explain, recall and revise</summary>
    <div className="ls-body">
      <section><h2>Explain it back</h2><label className="nb-text">{lesson.explainBack.ownWords}<textarea className="nb-input nb-input--lined" rows={3} maxLength={500} value={words} disabled={pending} onChange={(event) => { setWords(event.target.value); }} /></label>
        <label className="nb-text">{lesson.explainBack.gap}<input className="nb-input" aria-label="Missing word" value={gap} disabled={pending} onChange={(event) => { setGap(event.target.value); }} /></label>
        <ConfidenceRow value={confidence} locked={pending} onChange={setConfidence} />
        <NbButton disabled={pending} onClick={() => {
          if (words.trim().length < 8 || !gap.trim() || !confidence) { setError('Write a short explanation, fill the gap and choose how sure you feel.'); return; }
          void run(async () => { const result = await postJson(`/concepts/${lesson.conceptId}/lesson/explain`, ExplainResultSchema, { ownWords: words, gap, confidence, timeMs: Date.now() - started.current }); setExplanation(result.explanation); });
        }}>{pending ? 'Saving…' : 'Check my explanation'}</NbButton>{explanation ? <p role="status">{explanation}</p> : null}
      </section>
      <section><h2>Flashcards</h2>{current ? <><div className="ls-flashcard"><div className="nb-meta">Card {card + 1} of {lesson.flashcards.length}</div><p>{current.front}</p>{flipped ? <p className="nb-redpen">{current.back}</p> : null}</div><div className="ls-actions"><NbButton variant="ghost" disabled={pending} onClick={() => { setFlipped(!flipped); }}>{flipped ? 'Front' : 'Flip'}</NbButton>{flipped ? (['knew', 'almost', 'forgot'] as const).map((rating) => <NbButton key={rating} variant="quiet" disabled={pending} onClick={() => { void run(async () => { await postJson(`/concepts/${lesson.conceptId}/lesson/flashcard`, FlashcardResultSchema, { cardId: current.id, rating, timeMs: Date.now() - started.current }); setCard((card + 1) % lesson.flashcards.length); setFlipped(false); started.current = Date.now(); }); }}>{rating === 'knew' ? 'Knew it' : rating === 'almost' ? 'Almost' : 'Show me again'}</NbButton>) : null}</div></> : <p>No flashcards yet.</p>}</section>
      <section><h2>One-page summary</h2><ul>{lesson.summary.lines.map((line) => <li key={line}>{line}</li>)}</ul>{lesson.summary.formulas.map((formula) => <p className="nb-redpen" key={formula}>{formula}</p>)}<div className="ls-actions"><NbButton variant="ghost" onClick={() => { window.print(); }}>Print summary</NbButton><NbButton disabled={pending} onClick={() => { void run(async () => { const result = await postJson(`/concepts/${lesson.conceptId}/lesson/revision`, RevisionQueuedSchema, {}); setQueued(`Saved for revision in ${result.days.join(', ')} days.`); }); }}>Save for revision</NbButton></div>{queued ? <p role="status">{queued}</p> : null}</section>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  </details>;
}
