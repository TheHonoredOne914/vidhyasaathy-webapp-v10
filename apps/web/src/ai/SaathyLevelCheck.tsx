import { DiagnosticResultSchema, PublicItemSchema } from '@vidhyasaathy/contracts';
import { NOT_TAUGHT } from '@vidhyasaathy/core/learning';
import { useRef, useState } from 'react';
import { z } from 'zod';
import { ApiClientError, postJson } from '../api/client';
import { useRemote } from '../setup/useRemote';
import { Saathy } from '../student/notebook/Saathy';
import { MathText } from './SaathyArtifacts';

const OfferSchema = z.object({ chapterId: z.string(), offered: z.boolean(), questions: z.array(PublicItemSchema.and(z.object({ sourceClass: z.number() }))) });

// Dhruv's one-card-at-a-time interaction, backed by the existing prerequisite
// diagnostic. The client receives neither answer keys nor mastery numbers.
export function SaathyLevelCheck({ chapterId, onContinue, busy: chatBusy }: { chapterId: string; onContinue: () => void; busy: boolean }) {
  const offer = useRemote(`/chapters/${encodeURIComponent(chapterId)}/notebook-diagnostic`, OfferSchema);
  const [answers, setAnswers] = useState<{ itemId: string; answer: string; confidence: 'unsure'; timeMs: number }[]>([]);
  const [selected, setSelected] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const started = useRef(Date.now());
  const question = offer.data?.questions[answers.length];
  const done = !!message || offer.data?.offered === false;
  async function next() {
    if (!question || !selected || lock.current) return;
    const nextAnswers = [...answers, { itemId: question.id, answer: selected, confidence: 'unsure' as const, timeMs: Math.min(86400000, Date.now() - started.current) }];
    if (nextAnswers.length < (offer.data?.questions.length ?? 0)) {
      setAnswers(nextAnswers); setSelected(''); started.current = Date.now(); return;
    }
    lock.current = true; setPending(true); setError('');
    try {
      const result = await postJson(`/chapters/${encodeURIComponent(chapterId)}/diagnostic`, DiagnosticResultSchema, { answers: nextAnswers });
      setMessage(`${result.word}. ${result.message} Your earlier ideas are saved; this chapter starts New.`);
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.code === 'DIAGNOSTIC_DONE') offer.reload();
      else setError('Your check could not be saved. Try again.');
    } finally { lock.current = false; setPending(false); }
  }
  return <section className="saathy-card" aria-label="Level Check">
    <div className="nb-row"><Saathy mood={done ? 'happy' : 'think'} size="2.8rem" /><h3 className="nb-h3">Level Check</h3></div>
    <p className="nb-note">Earlier ideas only. No marks. “Haven’t learned this yet” carries no penalty.</p>
    {offer.status === 'error' ? <button className="nb-btn nb-btn--ghost" onClick={offer.reload}>Retry loading check</button> : !offer.data ? <p>Opening your earlier-class questions…</p> : done ? <><p role="status">{message || 'Your earlier check is already saved. Ready to explore?'}</p><button type="button" className="nb-btn nb-btn--sm" disabled={chatBusy} onClick={onContinue}>Continue learning</button></> : question?.type === 'mcq' ? <>
      <p className="nb-meta">Question {answers.length + 1} of {offer.data.questions.length} · NCERT Class {question.sourceClass}{question.sourceRef ? ` · ${question.sourceRef.locator}` : ''}</p>
      <p><MathText text={question.prompt} /></p>
      <div className="mini-q">{question.options.map((option) => <button type="button" className={`nb-opt${selected === option ? ' is-picked' : ''}`} aria-pressed={selected === option} disabled={pending} key={option} onClick={() => setSelected(option)}>{option === NOT_TAUGHT ? "Haven't learned this yet" : <MathText text={option} />}</button>)}</div>
      <button type="button" className="nb-btn nb-btn--sm" disabled={!selected || pending} onClick={() => { void next(); }}>{pending ? 'Saving…' : answers.length + 1 === offer.data.questions.length ? 'Save my check' : 'Next idea'}</button>
    </> : null}
    {error ? <p role="alert">{error}</p> : null}
  </section>;
}
