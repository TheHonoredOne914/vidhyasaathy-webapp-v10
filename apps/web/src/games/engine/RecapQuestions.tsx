import { useState } from 'react';
import { reviewRecap, type RecapItem, type RetrievalItem } from './recap';

export function RecapQuestions({ items, spacedItem, onDone }: { items: RetrievalItem[]; spacedItem?: RecapItem; onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const item = items[index];
  if (!item) return <section className="iv-recap"><h3>Recall complete</h3><p>{correct} of {items.length} recalled. Revisit any scene when you need it.</p><button type="button" onClick={onDone}>Return to the scenes</button></section>;
  return (
    <section className="iv-recap" aria-label={spacedItem ? 'Spaced recap before the intro' : 'Three-question recap'}>
      <h3>{spacedItem ? 'Remember this from before?' : `Recall ${index + 1} of ${items.length}`}</h3>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!choice || checked) return;
        setChecked(true);
        if (choice === item.question.answerId) setCorrect((count) => count + 1);
        if (spacedItem) reviewRecap(spacedItem.id, spacedItem.owner);
      }}>
        <fieldset disabled={checked}><legend>{item.question.prompt}</legend><div className="iv-choices">{item.question.choices.map((option) => <label key={option.id} className="iv-choice"><input type="radio" name={`recall-${item.id}`} value={option.id} checked={choice === option.id} onChange={() => { setChoice(option.id); }} />{option.label}</label>)}</div></fieldset>
        {!checked && <button type="submit" disabled={!choice}>Recall answer</button>}
      </form>
      {checked && <><p role="status">{choice === item.question.answerId ? 'Yes. ' : 'Not quite. '}{item.question.explanation}</p><button type="button" onClick={() => {
        if (spacedItem) { onDone(); return; }
        setIndex((current) => current + 1); setChoice(''); setChecked(false);
      }}>{spacedItem ? 'Continue to intro' : 'Next'}</button></>}
      {spacedItem && !checked && <button type="button" onClick={onDone}>Skip for now</button>}
    </section>
  );
}
