import type { LearningContext, LearningModule, TeachingMode, TutorResponse } from '@vidhyasaathy/contracts';
import { useRef, useState } from 'react';
import { Card } from '../student/notebook/ui';
import { Saathy } from '../student/notebook/Saathy';
import { learningApi, type AnswerResult } from './adapter';
import { LearningStudio } from '../ai/LearningStudio';

export const TEACHING_MODES: { id: TeachingMode; label: string }[] = [
  { id: 'explain', label: 'Explain' }, { id: 'teach_from_zero', label: 'Teach from zero' },
  { id: 'simpler', label: 'Simpler' }, { id: 'differently', label: 'Differently' },
  { id: 'real_life_example', label: 'Real-life example' }, { id: 'visual', label: 'Visual' },
  { id: 'hint', label: 'Hint' }, { id: 'test_me', label: 'Test me' },
  { id: 'find_my_mistake', label: 'Find my mistake' }, { id: 'practise', label: 'Practise' },
  { id: 'revise', label: 'Revise' }, { id: 'plan_my_learning', label: 'Plan my learning' },
];

function TutorPractice({ module, sessionId, questionId }: { module: LearningModule; sessionId: string; questionId: string }) {
  const question = module.questions?.find((row) => row.id === questionId);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const eventId = useRef(crypto.randomUUID());
  const lock = useRef(false);
  if (!question) return null;
  async function submit() {
    if (!question || lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { setResult(await learningApi.answer(sessionId, module.id, question.id, answer, eventId.current)); }
    catch { setError('Could not confirm the answer. Retry to save this attempt.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <form onSubmit={(event) => { event.preventDefault(); void submit(); }}><fieldset disabled={busy || !!result}><legend>{question.prompt}</legend>{question.options?.length ? question.options.map((option) => <label className="proto-choice" key={option}><input type="radio" name={`tutor-${question.id}`} checked={answer === option} onChange={() => { setAnswer(option); eventId.current = crypto.randomUUID(); }} />{option}</label>) : <label>Your answer<input type="text" value={answer} maxLength={2000} onChange={(event) => { setAnswer(event.target.value); eventId.current = crypto.randomUUID(); }} /></label>}</fieldset>{result ? <><p role="status">{result.feedback}</p>{!result.correct ? <button type="button" className="nb-btn nb-btn--ghost" onClick={() => { setResult(null); setAnswer(''); eventId.current = crypto.randomUUID(); }}>Try this idea again</button> : null}</> : <button type="submit" className="nb-btn nb-btn--ghost" disabled={busy || !answer.trim()}>{busy ? 'Checking…' : 'Check this practice answer'}</button>}{error ? <p role="alert">{error}</p> : null}</form>;
}

export function ContextualSaathy({ context, module, initialMode, onAction }: { context: LearningContext; module: LearningModule; initialMode: TeachingMode; onAction: (reply: TutorResponse) => void }) {
  const [studioOpen, setStudioOpen] = useState(false);
  const [mode, setMode] = useState<TeachingMode>(initialMode);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<{ question: string; mode: string; response: TutorResponse }[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const activeModule = useRef(module.id);
  activeModule.current = module.id;
  async function ask() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const moduleId = module.id;
    const question = text;
    try {
      const response = await learningApi.tutor(context, mode, moduleId, question);
      if (activeModule.current !== moduleId) return;
      setMessages((rows) => [...rows, { question, mode: TEACHING_MODES.find((item) => item.id === mode)?.label ?? mode, response }]);
      setText(''); onAction(response);
    } catch { if (activeModule.current === moduleId) setError('Saathy could not reply. Your learning step is still here. Try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Card title="Saathy, beside your notebook" accent>
    <Saathy mood={busy ? 'think' : 'happy'} size="4.5rem" />
    <p className="nb-note">I am looking at: {module.objective}</p>
    <button type="button" className="nb-btn nb-btn--ghost" onClick={() => setStudioOpen(true)}>Learning modules</button>
    <div className="proto-modes" aria-label="Teaching modes">{TEACHING_MODES.map((item) => <button className={`nb-btn nb-btn--sm ${mode === item.id ? '' : 'nb-btn--ghost'}`} key={item.id} aria-pressed={mode === item.id} onClick={() => setMode(item.id)} disabled={busy}>{item.label}</button>)}</div>
    <div className="proto-chat" role="log" aria-label="Conversation with Saathy" aria-live="polite">{messages.map((message, index) => <article key={index}><b>You · {message.mode}</b>{message.question ? <p>{message.question}</p> : null}<b>Saathy</b><p>{message.response.explanation}</p><p className="nb-note">{message.response.suggestedAction}</p>{message.response.practiceQuestion ? <TutorPractice module={module} sessionId={context.sessionId} questionId={message.response.practiceQuestion.id} /> : null}</article>)}</div>
    <form onSubmit={(event) => { event.preventDefault(); void ask(); }}><label htmlFor="learning-saathy-question">Ask about this step<textarea id="learning-saathy-question" rows={3} maxLength={4000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Where did I get stuck?" disabled={busy} /></label><button type="submit" className="nb-btn" disabled={busy}>{busy ? 'Saathy is thinking…' : `Ask Saathy · ${TEACHING_MODES.find((item) => item.id === mode)?.label}`}</button></form>
    {error ? <p role="alert">{error}</p> : null}
    {studioOpen ? <LearningStudio chapterId={context.chapterId} title={module.objective} onClose={() => setStudioOpen(false)} /> : null}
  </Card>;
}
