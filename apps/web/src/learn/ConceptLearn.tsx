import {
  CheckpointResultSchema, ExplainResultSchema, FlashcardResultSchema, RevisionQueuedSchema, type LessonView,
} from '@vidhyasaathy/contracts';
import { useRef, useState } from 'react';
import { ApiClientError, postJson } from '../api/client';
import { ConfidenceChips, type ConfidenceChoice } from '../ui/ConfidenceChips';
import { LearnBlocks } from './blocks';
import './learn.css';

type Found = Extract<LessonView, { found: true }>;

export function ConceptLearn({ lesson, onSimpler }: { lesson: Found; onSimpler: () => void }) {
  const started = useRef(Date.now());
  const [checks, setChecks] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, ConfidenceChoice>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [faded, setFaded] = useState('');
  const [hinted, setHinted] = useState(true);
  const [fadedNote, setFadedNote] = useState<string | null>(null);
  const [words, setWords] = useState('');
  const [gap, setGap] = useState('');
  const [explainNote, setExplainNote] = useState<string | null>(null);
  const [card, setCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [queued, setQueued] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = lesson.flashcards[card];

  async function run<T>(task: () => Promise<T>) {
    setError(null);
    try {
      return await task();
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'Could not save that.');
      return null;
    }
  }

  return (
    <div className="learn-page" data-testid="concept-lesson" data-variant={lesson.variant}>
      <article className="lesson-card learn-bridge">
        <h2>From {lesson.bridge.prereqTitle}</h2>
        <p>{lesson.bridge.link}</p>
        {lesson.bridge.repair && lesson.bridge.minutes ? (
          <>
            <h3>Three-minute repair</h3>
            <p>{lesson.bridge.repair}</p>
          </>
        ) : null}
      </article>

      <article className="lesson-card">
        <h2>{lesson.variant === 'simple' ? 'Simpler note' : lesson.variant === 'stretch' ? 'A step further' : 'The note'}</h2>
        <p className="lesson-note">{lesson.note}</p>
        {lesson.variant === 'simple' ? null : <button type="button" className="player-btn" onClick={onSimpler}>Explain simpler</button>}
      </article>

      <LearnBlocks blocks={lesson.blocks} conceptId={lesson.conceptId} />

      {lesson.steps.map((step) => (
        <article key={step.checkpoint.id} className="lesson-card">
          <p className="lesson-note">{step.body}</p>
          <fieldset>
            <legend>{step.checkpoint.prompt}</legend>
            {step.checkpoint.options.map((option) => (
              <label key={option} className="lesson-check">
                <input type="radio" name={step.checkpoint.id} checked={checks[step.checkpoint.id] === option} onChange={() => { setChecks((currentChecks) => ({ ...currentChecks, [step.checkpoint.id]: option })); }} />
                {option}
              </label>
            ))}
            <ConfidenceChips name={`confidence-${step.checkpoint.id}`} value={confidence[step.checkpoint.id] ?? ''} onChange={(value) => { setConfidence((currentConfidence) => ({ ...currentConfidence, [step.checkpoint.id]: value })); }} />
          </fieldset>
          <button type="button" className="player-btn" onClick={() => {
            const answer = checks[step.checkpoint.id];
            const chosen = confidence[step.checkpoint.id];
            if (!answer || !chosen) {
              setError('Choose an option, and Sure, Unsure, or Guess.');
              return;
            }
            void run(async () => {
              const result = await postJson(`/concepts/${lesson.conceptId}/lesson/checkpoint`, CheckpointResultSchema, { attemptId: crypto.randomUUID(),
                itemId: step.checkpoint.id, answer, confidence: chosen, timeMs: Date.now() - started.current,
              });
              setNotes((currentNotes) => ({ ...currentNotes, [step.checkpoint.id]: result.explanation }));
            });
          }}>Check</button>
          {notes[step.checkpoint.id] ? <p>{notes[step.checkpoint.id]}</p> : null}
        </article>
      ))}

      <article className="lesson-card">
        <h2>Worked example</h2>
        <p>{lesson.worked.prompt}</p>
        <ol>{lesson.worked.hinted.map((line) => <li key={line}>{line}</li>)}</ol>
        <p>{lesson.worked.unhinted}</p>
        <h2>Your turn</h2>
        <p>{lesson.faded.prompt}</p>
        {hinted ? <p>{lesson.faded.hint}</p> : null}
        <label className="grid gap-1">Your answer
          <input value={faded} onChange={(event) => { setFaded(event.target.value); }} />
        </label>
        <ConfidenceChips name="faded-confidence" value={confidence.faded ?? ''} onChange={(value) => { setConfidence((currentConfidence) => ({ ...currentConfidence, faded: value })); }} />
        <div className="lesson-actions">
          <button type="button" className="player-btn" onClick={() => {
            if (!faded.trim() || !confidence.faded) {
              setError('Write an answer, and choose Sure, Unsure, or Guess.');
              return;
            }
            void run(async () => {
              const result = await postJson(`/concepts/${lesson.conceptId}/lesson/faded`, CheckpointResultSchema, { attemptId: crypto.randomUUID(),
                answer: faded, hinted, confidence: confidence.faded, timeMs: Date.now() - started.current,
              });
              setFadedNote(result.explanation);
              if (hinted) setHinted(false);
            });
          }}>{hinted ? 'Check with the hint' : 'Check without the hint'}</button>
        </div>
        {fadedNote ? <p>{fadedNote}</p> : null}
      </article>

      <article className="lesson-card">
        <h2>Where this slips</h2>
        <ul>{lesson.misconceptions.map((item) => <li key={item.slip}><strong>{item.slip}</strong> {item.fix}</li>)}</ul>
      </article>

      <article className="lesson-card">
        <h2>Explain it back</h2>
        <label className="grid gap-1">{lesson.explainBack.ownWords}
          <textarea rows={3} value={words} onChange={(event) => { setWords(event.target.value); }} />
        </label>
        <label className="grid gap-1">{lesson.explainBack.gap}
          <input value={gap} onChange={(event) => { setGap(event.target.value); }} aria-label="Missing word" />
        </label>
        <ConfidenceChips name="explain-confidence" value={confidence.explain ?? ''} onChange={(value) => { setConfidence((currentConfidence) => ({ ...currentConfidence, explain: value })); }} />
        <button type="button" className="player-btn" onClick={() => {
          if (words.trim().length < 8 || !gap.trim() || !confidence.explain) {
            setError('Write a short explanation, fill the gap, and choose Sure, Unsure, or Guess.');
            return;
          }
          void run(async () => {
            const result = await postJson(`/concepts/${lesson.conceptId}/lesson/explain`, ExplainResultSchema, { attemptId: crypto.randomUUID(),
              ownWords: words, gap, confidence: confidence.explain, timeMs: Date.now() - started.current,
            });
            setExplainNote(result.explanation);
            setQueued('This idea is queued for 1, 3 and 7 days.');
          });
        }}>Save this explanation</button>
        {explainNote ? <p>{explainNote}</p> : null}
      </article>

      <article className="lesson-card learn-summary">
        <h2>One-page summary</h2>
        <ul>{lesson.summary.lines.map((line) => <li key={line}>{line}</li>)}</ul>
        <ul>{lesson.summary.formulas.map((formula) => <li key={formula}>{formula}</li>)}</ul>
        <button type="button" className="player-btn secondary" onClick={() => { window.print(); }}>Print this sheet</button>
      </article>

      {current ? (
        <article className="lesson-card">
          <h2>Flashcards</h2>
          <button type="button" className="learn-card" aria-pressed={flipped} onClick={() => { setFlipped((open) => !open); }}>
            {flipped ? current.back : current.front}
          </button>
          <p>Card {card + 1} of {lesson.flashcards.length}</p>
          <div className="lesson-actions">
            {(['knew', 'almost', 'forgot'] as const).map((rating) => (
              <button key={rating} type="button" className="player-btn secondary" onClick={() => {
                void run(async () => {
                  await postJson(`/concepts/${lesson.conceptId}/lesson/flashcard`, FlashcardResultSchema, { attemptId: crypto.randomUUID(),
                    cardId: current.id, rating, timeMs: Date.now() - started.current,
                  });
                  setQueued('This idea is queued for 1, 3 and 7 days.');
                  setFlipped(false);
                  setCard((index) => (index + 1) % lesson.flashcards.length);
                });
              }}>{rating === 'knew' ? 'Knew it' : rating === 'almost' ? 'Almost' : 'Forgot'}</button>
            ))}
          </div>
        </article>
      ) : null}

      <article className="lesson-card">
        <h2>Come back to this</h2>
        <p>Revision is saved for day 1, day 3 and day 7.</p>
        <button type="button" className="player-btn" onClick={() => {
          void run(async () => {
            const result = await postJson(`/concepts/${lesson.conceptId}/lesson/revision`, RevisionQueuedSchema, {});
            setQueued(`Queued for day ${result.days.join(', day ')}.`);
          });
        }}>Save for revision</button>
        {queued ? <p>{queued}</p> : null}
      </article>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
