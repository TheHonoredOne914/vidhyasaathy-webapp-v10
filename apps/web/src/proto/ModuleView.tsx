import type { LearningEvent, LearningModule } from '@vidhyasaathy/contracts';
import { useRef, useState } from 'react';
import { Card, MasteryChip } from '../student/notebook/ui';
import { learningApi, type AnswerResult } from './adapter';
import { restoredPractice } from './progress';
import { MotionWidget } from '../ai/visuals/demo-widgets';

export const MODULE_LABELS: Record<LearningModule['type'], string> = { concept: 'Learn', guided_example: 'Worked example', explorer: 'Explore', practice: 'Practise', repair: "Let's fix this", revision: 'Review' };
export function phaseFor(type: LearningModule['type']) { return type === 'guided_example' || type === 'repair' ? 'Learn' : MODULE_LABELS[type]; }

function Explorer({ module, changed }: { module: LearningModule; changed: () => void }) {
  const [x, setX] = useState(3);
  const [y, setY] = useState(2);
  const geometry = /coordinate|cartesian|quadrant|abscissa|ordinate/i.test(`${module.objective} ${module.content}`);
  const motion = /distance|displacement|speed|velocity|acceleration|motion graph/i.test(`${module.objective} ${module.content}`);
  const [notes, setNotes] = useState('');
  if (!geometry && !motion) return <label>Write a prediction, then check it against the chapter.<textarea rows={4} value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={changed} /></label>;
  return <section aria-label={geometry ? 'Coordinate explorer' : 'Journey explorer'}>
    <p className="nb-note">{geometry ? 'Move the point. Read horizontal position first, then vertical position.' : 'Move east, then return west along the same track. Compare the whole path with the final position.'}</p>
    <label>{geometry ? 'x-coordinate' : 'Eastward distance (m)'}: {x}<input type="range" min={geometry ? -5 : 0} max={geometry ? 5 : 10} value={x} onChange={(event) => setX(Number(event.target.value))} onPointerUp={changed} onKeyUp={changed} /></label>
    <label>{geometry ? 'y-coordinate' : 'Westward return (m)'}: {y}<input type="range" min={geometry ? -5 : 0} max={geometry ? 5 : 10} value={y} onChange={(event) => setY(Number(event.target.value))} onPointerUp={changed} onKeyUp={changed} /></label>
    <svg className="proto-explorer" viewBox="0 0 360 260" role="img" aria-label={geometry ? `Point at (${x}, ${y})` : `Start at 0, turn at ${x}, finish at ${x - y} metres`}>
      {geometry ? <><g stroke="#D6E2E6">{Array.from({ length: 11 }, (_, i) => <path key={i} d={`M${80 + i * 20} 30V230 M80 ${30 + i * 20}H280`} />)}</g><path d="M60 130H310M180 15V245" stroke="#193E69" strokeWidth="2" /><text x="315" y="135">x</text><text x="187" y="20">y</text><text x="185" y="145">0</text><circle cx={180 + x * 20} cy={130 - y * 20} r="6" fill="#28517C" /><text x="12" y="253">({x}, {y})</text></> : <><path d="M25 140H335" stroke="#517DAB" /><path d={`M180 90H${180 + x * 12}V120H${180 + (x - y) * 12}`} stroke="#28517C" strokeWidth="4" fill="none" /><circle cx="180" cy="140" r="5" fill="#041D3D" /><circle cx={180 + (x - y) * 12} cy="120" r="6" fill="#517DAB" /><text x="25" y="185">Distance: {x + y} m</text><text x="25" y="215">Displacement: {Math.abs(x - y)} m {x > y ? 'east' : x < y ? 'west' : ''}</text><text x="140" y="165">Start: 0 m</text></>}
    </svg>
    <p aria-live="polite">{geometry ? x === 0 && y === 0 ? 'At the origin.' : x === 0 ? 'On the y-axis.' : y === 0 ? 'On the x-axis.' : `Quadrant ${x > 0 ? y > 0 ? 'I' : 'IV' : y > 0 ? 'II' : 'III'}.` : 'Try returning to the starting point. What changes? What becomes zero?'}</p>
  </section>;
}

export function ModuleView({ module, sessionId, onComplete, onEvidence, repair, pending, events }: {
  module: LearningModule; sessionId: string; onComplete: () => void; onEvidence: () => void;
  repair?: LearningModule | undefined; pending: boolean; events: LearningEvent[];
}) {
  const restored = restoredPractice(module, events);
  const [questionIndex, setQuestionIndex] = useState(restored.index);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(restored.result);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revealed, setRevealed] = useState(1);
  const [repairOpen, setRepairOpen] = useState(!!restored.result && !restored.result.correct);
  const [flipped, setFlipped] = useState(false);
  const [confidence, setConfidence] = useState('');
  const actionId = useRef<{ answer: string; id: string } | null>(null);
  const lock = useRef(false);
  const questions = module.questions ?? [];
  const question = questions[questionIndex];
  const steps = module.content.split(/(?<=[.!?])\s+|\n/).filter(Boolean);
  async function submit(value: string) {
    if (!question || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    if (actionId.current?.answer !== value) actionId.current = { answer: value, id: crypto.randomUUID() };
    try {
      const response = await learningApi.answer(sessionId, module.id, question.id, value, actionId.current.id);
      setResult(response); setRepairOpen(!response.correct); onEvidence();
    } catch { setError('Your answer has not been confirmed. Retry to save this attempt.'); }
    finally { lock.current = false; setBusy(false); }
  }
  function retryQuestion() { setResult(null); setAnswer(''); setRepairOpen(false); actionId.current = null; }
  return <Card title={MODULE_LABELS[module.type]} meta={module.objective} tape>
    {module.type === 'guided_example' ? <><ol className="proto-copy">{steps.slice(0, revealed).map((step, index) => <li key={index}>{step}</li>)}</ol>{revealed < steps.length ? <button className="nb-btn nb-btn--ghost" onClick={() => setRevealed((value) => value + 1)}>Show next step</button> : null}</> : module.type === 'revision' ? <button className="proto-flashcard" aria-pressed={flipped} onClick={() => setFlipped(!flipped)}>{flipped ? module.content : `${module.objective} — What do you remember?`}<small>{flipped ? 'Show prompt' : 'Turn to check your recall'}</small></button> : <p className="proto-copy">{module.content}</p>}
    {module.type === 'concept' && /distance|speed|velocity|motion/i.test(module.objective) ? <MotionWidget params={{}} /> : null}
    {module.type === 'concept' && /coordinate|cartesian|quadrant/i.test(module.objective) ? <Explorer module={module} changed={() => undefined} /> : null}
    {module.type === 'explorer' ? <Explorer module={module} changed={() => { void learningApi.event(sessionId, module.id, 'explorer_changed', crypto.randomUUID()).catch(() => setError('The exploration could not be saved. Check your connection before continuing.')); }} /> : null}
    {question ? <form onSubmit={(event) => { event.preventDefault(); void submit(answer); }}>
      <fieldset disabled={busy || pending || !!result}><legend>{question.prompt}</legend>
        {question.options?.length ? question.options.map((option) => <label className="proto-choice" key={option}><input type="radio" name={`answer-${question.id}`} value={option} checked={answer === option} onChange={() => setAnswer(option)} />{option}</label>) : <label>Your answer<input type="text" maxLength={2000} value={answer} onChange={(event) => setAnswer(event.target.value)} /></label>}
      </fieldset>
      <fieldset disabled={busy || pending || !!result}><legend>How does this feel? (for your own reflection)</legend>{['Still exploring', 'Nearly sure', 'Ready to explain'].map((label) => <button className="nb-chip" key={label} type="button" aria-pressed={confidence === label} onClick={() => setConfidence(label)}>{label}</button>)}</fieldset>
      {!result ? <div className="proto-actions"><button type="submit" className="nb-btn" disabled={!answer.trim() || busy || pending}>{busy ? 'Checking…' : 'Check my answer'}</button><button type="button" className="nb-btn nb-btn--ghost" disabled={busy || pending} onClick={() => { setAnswer("Haven't learned this yet"); void submit("Haven't learned this yet"); }}>Haven't learned this yet</button></div> : null}
    </form> : null}
    {result ? <div className="proto-feedback" role="status"><MasteryChip level={result.word} /><p>{result.feedback}</p></div> : null}
    {repairOpen ? <section aria-label="Repair this idea"><h3>{result?.notTaught ? 'Start with the idea' : "Let's fix this"}</h3><p className="proto-copy">{repair?.content ?? result?.feedback}</p><button className="nb-btn nb-btn--ghost" onClick={retryQuestion}>Try the question again</button></section> : null}
    {error ? <p role="alert">{error}</p> : null}
    {question && result?.correct && questionIndex < questions.length - 1 ? <button className="nb-btn" onClick={() => { setQuestionIndex((value) => value + 1); retryQuestion(); }}>Next question</button> : null}
      <div className="proto-actions"><button className="nb-btn" onClick={onComplete} disabled={pending || busy || (!!question && !result?.correct) || (!!question && questionIndex < questions.length - 1) || (module.type === 'guided_example' && revealed < steps.length)}>{pending ? 'Saving your step…' : 'Next idea'}</button></div>
    {!question && module.type === 'practice' ? <p className="nb-note">There is no published question for this idea yet. Continue with your chapter material.</p> : null}
  </Card>;
}
