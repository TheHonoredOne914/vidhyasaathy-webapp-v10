import { DiagnosticOfferSchema, DiagnosticResultSchema } from '@vidhyasaathy/contracts';
import { NOT_TAUGHT } from '@vidhyasaathy/core/learning';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { postJson } from '../../../api/client';
import { useRemote } from '../../../setup/useRemote';
import { ConfidenceRow, DoodleStrip } from '../ui';
import '../pages/diagnostic.css';

export function DiagnosticPage() {
  const { chapterId = '' } = useParams();
  const offer = useRemote(chapterId ? `/chapters/${chapterId}/diagnostic` : null, DiagnosticOfferSchema);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, '' | 'sure' | 'unsure' | 'guess'>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (offer.status === 'loading' && !offer.data) return <div className="pg-quiz"><div className="nb-skel" /></div>;
  if (offer.status === 'error' && !offer.data) return <p className="nb-empty" role="alert">Could not load this check. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={offer.reload}>Try again</button></p>;
  if (!offer.data?.offered) return <div className="nb-card"><h1 className="nb-h1">No earlier-class check</h1><p className="nb-text">This chapter does not have a prerequisite check yet.</p><Link className="nb-link" to={`/student/chapters/${chapterId}`}>Back to the chapter</Link></div>;

  const questions = offer.data.questions.filter((item) => item.type === 'mcq');
  const item = questions[index];
  if (message) return <div className="nb-card"><h1 className="nb-h1">Where to start</h1><p className="nb-note">{message}</p><Link className="nb-btn nb-btn--primary" to={`/student/chapters/${chapterId}`}>Back to the chapter</Link></div>;
  if (!item) return <p className="nb-empty">No questions in this check.</p>;

  const picked = answers[item.id] ?? '';
  const skipped = picked === NOT_TAUGHT;
  const options = item.options.includes(NOT_TAUGHT) ? item.options : [...item.options, NOT_TAUGHT];

  async function finish(nextAnswers: Record<string, string>, nextConfidence: Record<string, '' | 'sure' | 'unsure' | 'guess'>) {
    setPending(true);
    setError(null);
    try {
      const result = await postJson(`/chapters/${chapterId}/diagnostic`, DiagnosticResultSchema, {
        answers: questions.map((question) => ({
          itemId: question.id,
          answer: nextAnswers[question.id],
          confidence: nextAnswers[question.id] === NOT_TAUGHT ? 'sure' : nextConfidence[question.id],
          timeMs: 0,
        })),
      });
      setMessage(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this check.');
    } finally {
      setPending(false);
    }
  }

  function advance() {
    if (!picked) { setError('Choose an answer.'); return; }
    if (!skipped && !confidence[item.id]) { setError('Choose Sure, Unsure, or Guess.'); return; }
    setError(null);
    if (index + 1 >= questions.length) { void finish(answers, confidence); return; }
    setIndex(index + 1);
  }

  return <div className="pg-quiz"><div className="nb-grid">
    <div className="nb-col">
      <header className="nb-head"><div><div className="nb-head__eyebrow">{offer.data.title}</div><h1 className="nb-h1">Question {index + 1} of {questions.length}</h1><p className="nb-sub">No marks. This only tells Saathy where to start.</p></div></header>
      <DoodleStrip states={questions.map((_, slot) => slot < index ? 'right' : slot === index ? 'current' : 'todo')} />
      <section className="nb-qcard">
        <p className="nb-q__text">{item.prompt}</p>
        <div className="nb-opts">{options.map((option, optionIndex) => {
          const special = option === NOT_TAUGHT;
          const on = picked === option;
          return <button type="button" key={option} className={`nb-opt${on ? ' is-picked' : ''}${special ? ' nb-opt--skip' : ''}`} style={special ? { gridColumn: '1 / -1', borderStyle: 'dashed' } : undefined} onClick={() => { setAnswers((current) => ({ ...current, [item.id]: option })); }}><span className="nb-opt__key">{String.fromCharCode(97 + optionIndex)}</span><span>{option}</span></button>;
        })}</div>
        {skipped ? null : <ConfidenceRow value={confidence[item.id] ?? ''} onChange={(value) => { setConfidence((current) => ({ ...current, [item.id]: value })); }} />}
        {error ? <p className="pen" role="alert" style={{ color: 'var(--nb-redpen)', fontFamily: 'var(--nb-font-hand)' }}>{error}</p> : null}
        <button type="button" className="nb-btn nb-btn--primary" disabled={pending} onClick={advance}>{pending ? 'Opening…' : index + 1 >= questions.length ? 'Save this check' : 'Next'}</button>
      </section>
    </div>
    <aside className="nb-col"><section className="nb-card"><h3 className="nb-h3">So far</h3><p className="nb-text">{index} of {questions.length} answered.</p></section></aside>
  </div></div>;
}
