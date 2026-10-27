import { useId, useState } from 'react';
import type { Checkpoint, CheckpointAnswer } from './types';

export function CheckpointPanel({ checkpoint, onAnswer, onHint, hintUsed }: {
  checkpoint: Checkpoint;
  onAnswer: (answer: CheckpointAnswer) => void;
  onHint: () => void;
  hintUsed: boolean;
}) {
  const id = useId();
  const [answer, setAnswer] = useState<CheckpointAnswer | null>(checkpoint.kind === 'order' ? checkpoint.items.map((item) => item.id) : null);
  const [selectedItem, setSelectedItem] = useState('');
  const [numeric, setNumeric] = useState('');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const placements = answer !== null && typeof answer === 'object' && !Array.isArray(answer) ? answer : {};
  const order = Array.isArray(answer) ? answer : [];
  const ready = checkpoint.kind === 'drag' ? checkpoint.items.every((item) => Boolean(placements[item.id])) : checkpoint.kind === 'quiz' ? checkpoint.questions.every((question) => Boolean(quizAnswers[question.id])) : answer !== null;

  function place(itemId: string, targetId: string) {
    if (checkpoint.kind !== 'drag' || !checkpoint.items.some((item) => item.id === itemId)) return;
    setAnswer({ ...placements, [itemId]: targetId });
    setSelectedItem('');
  }

  function move(index: number, offset: number) {
    const next = [...order];
    const item = next[index];
    const other = next[index + offset];
    if (!item || !other) return;
    next[index] = other;
    next[index + offset] = item;
    setAnswer(next);
  }

  return (
    <form className="iv-checkpoint" aria-label={`${checkpoint.kind} checkpoint`} onSubmit={(event) => { event.preventDefault(); if (ready && answer !== null) onAnswer(answer); }}>
      <fieldset>
        <legend id={`${id}-prompt`}>{checkpoint.prompt}</legend>
        {(checkpoint.kind === 'tap' || checkpoint.kind === 'predict') && (
          <div className="iv-choices">
            {checkpoint.choices.map((choice) => (
              <label key={choice.id} className="iv-choice">
                <input type="radio" name={id} value={choice.id} checked={answer === choice.id} onChange={() => { setAnswer(choice.id); }} />
                {choice.label}
              </label>
            ))}
          </div>
        )}
        {checkpoint.kind === 'drag' && (
          <>
            <p>Drag a label, or select it and then tap its destination.</p>
            <div className="iv-choices">
              {checkpoint.items.map((item) => (
                <button key={item.id} type="button" className="iv-drag-item" aria-pressed={selectedItem === item.id} draggable
                  onDragStart={(event) => { event.dataTransfer.setData('text/plain', item.id); setSelectedItem(item.id); }}
                  onClick={() => { setSelectedItem(item.id); }}
                  onPointerDown={(event) => { setSelectedItem(item.id); event.currentTarget.setPointerCapture(event.pointerId); }}
                  onPointerUp={(event) => {
                    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-drop-zone]');
                    if (target?.dataset.dropZone) place(item.id, target.dataset.dropZone);
                  }}>
                  {item.label}{placements[item.id] ? ` → ${checkpoint.targets.find((target) => target.id === placements[item.id])?.label ?? ''}` : ''}
                </button>
              ))}
            </div>
            <div className="iv-choices">
              {checkpoint.targets.map((target) => (
                <button key={target.id} type="button" data-drop-zone={target.id} aria-label={`Place selected label at ${target.label}`}
                  onDragOver={(event) => { event.preventDefault(); }}
                  onDrop={(event) => { event.preventDefault(); place(event.dataTransfer.getData('text/plain'), target.id); }}
                  onClick={() => { if (selectedItem) place(selectedItem, target.id); }}>{target.label}</button>
              ))}
            </div>
            <p role="status">{selectedItem ? `${checkpoint.items.find((item) => item.id === selectedItem)?.label ?? ''} selected. Choose a destination.` : 'Select a label to move it.'}</p>
          </>
        )}
        {checkpoint.kind === 'slider' && (
          <label className="iv-slider">{typeof answer === 'number' ? answer : checkpoint.min} {checkpoint.unit}
            <input type="range" aria-labelledby={`${id}-prompt`} min={checkpoint.min} max={checkpoint.max} step={checkpoint.step}
              value={typeof answer === 'number' ? answer : checkpoint.min} onChange={(event) => { setAnswer(Number(event.target.value)); }} />
          </label>
        )}
        {checkpoint.kind === 'numeric' && (
          <label className="iv-number">Answer ({checkpoint.unit})
            <input type="number" aria-labelledby={`${id}-prompt`} inputMode="decimal" value={numeric} min={checkpoint.min} max={checkpoint.max} step={checkpoint.step ?? 'any'} required
              onChange={(event) => { setNumeric(event.target.value); setAnswer(event.target.value.trim() && Number.isFinite(event.target.valueAsNumber) ? event.target.valueAsNumber : null); }} />
          </label>
        )}
        {checkpoint.kind === 'order' && (
          <ol className="iv-order">
            {order.map((itemId, index) => {
              const label = checkpoint.items.find((item) => item.id === itemId)?.label ?? itemId;
              return <li key={itemId}><span>{label}</span><button type="button" disabled={index === 0} aria-label={`Move ${label} up`} onClick={() => { move(index, -1); }}>Up</button><button type="button" disabled={index === order.length - 1} aria-label={`Move ${label} down`} onClick={() => { move(index, 1); }}>Down</button></li>;
            })}
          </ol>
        )}
        {checkpoint.kind === 'quiz' && (
          <div className="iv-quiz">
            {checkpoint.questions.map((question, index) => (
              <fieldset key={question.id} className="iv-quiz-question">
                <legend>{index + 1}. {question.prompt}</legend>
                {question.choices.map((choice) => (
                  <label key={choice.id} className="iv-choice"><input type="radio" name={`${id}-${question.id}`} checked={quizAnswers[question.id] === choice.id} onChange={() => { setQuizAnswers((current) => ({ ...current, [question.id]: choice.id })); setAnswer({ ...quizAnswers, [question.id]: choice.id }); }} />{choice.label}</label>
                ))}
              </fieldset>
            ))}
          </div>
        )}
      </fieldset>
      <div className="iv-actions">
        <button type="submit" disabled={!ready}>{checkpoint.kind === 'predict' ? 'Lock prediction' : 'Check answer'}</button>
        <button type="button" onClick={onHint} disabled={hintUsed}>Show hint</button>
      </div>
    </form>
  );
}
