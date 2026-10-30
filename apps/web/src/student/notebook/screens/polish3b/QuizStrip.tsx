import { Fragment } from 'react';

export type QuizStep = 'right' | 'wrong' | 'current' | 'todo';

export function QuizStrip({ steps }: { steps: QuizStep[] }) {
  return <div className="nb-strip" aria-label="Questions in this round">{steps.map((state, index) => <Fragment key={index}>
    {index ? <svg className="nb-strip__link" viewBox="0 0 48 18" aria-hidden="true"><path d="M1 10C12 2 31 17 47 7" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" /></svg> : null}
    <span className={`nb-strip__node is-${state}`} aria-label={`Question ${index + 1}: ${state === 'right' ? 'correct' : state === 'wrong' ? 'needs another look' : state}`} aria-current={state === 'current' ? 'step' : undefined}>
      {state === 'right' ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="currentColor" /></svg> : state === 'wrong' ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" /></svg> : index + 1}
    </span>
  </Fragment>)}</div>;
}
