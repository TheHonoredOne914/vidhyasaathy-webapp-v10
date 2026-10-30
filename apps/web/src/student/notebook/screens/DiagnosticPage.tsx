import { ChapterSchema, DiagnosticOfferSchema, DiagnosticResultSchema } from '@vidhyasaathy/contracts';
import { NOT_TAUGHT } from '@vidhyasaathy/core/learning';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { postJson } from '../../../api/client';
import { usePageMeta } from '../../../meta';
import { AccessDenied } from '../../../routes/AccessDenied';
import { useRemote } from '../../../setup/useRemote';
import { Icon } from '../icons';
import { Saathy } from '../Saathy';
import { Card, ConfidenceRow, MasteryChip, NbButton, Sticky } from '../ui';
import '../pages/diagnostic.css';

type Confidence = '' | 'sure' | 'unsure' | 'guess';

export function DiagnosticPage() {
  const { chapterId = '' } = useParams();
  return <ChapterDiagnostic key={chapterId} chapterId={chapterId} />;
}

function ChapterDiagnostic({ chapterId }: { chapterId: string }) {
  const chapter = useRemote(chapterId ? `/chapters/${chapterId}` : null, ChapterSchema);
  const offer = useRemote(chapterId ? `/chapters/${chapterId}/diagnostic` : null, DiagnosticOfferSchema);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidence, setConfidence] = useState<Record<string, Confidence>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const started = useRef(Date.now());
  const times = useRef<Record<string, number>>({});
  const prompt = useRef<HTMLHeadingElement>(null);
  usePageMeta('Before we start — VidhyaSaathy', 'No marks. This only tells Saathy where to start.');
  const back = <Link className="nb-link" to={`/student/chapters/${chapterId}`}>Back to the chapter</Link>;
  if (offer.denied || chapter.denied) return <AccessDenied />;
  if ((offer.status === 'error' && !offer.data) || (chapter.status === 'error' && !chapter.data)) return <Card title="Before we start"><p className="nb-empty" role="alert">Could not load this check.</p><NbButton onClick={() => { offer.reload(); chapter.reload(); }}>Try again</NbButton>{back}</Card>;
  if (!offer.data || !chapter.data) return <div className="pg-quiz"><div className="nb-grid"><div className="nb-skel" /><div className="nb-skel" /></div></div>;
  if (!offer.data.offered) return <Card title="No earlier-class check"><p className="nb-text">This chapter does not have a prerequisite check yet.</p>{back}</Card>;
  if (message) return <Card title="Where to start"><p className="nb-note" role="status">{message}</p>{back}</Card>;
  const questions = offer.data.questions.filter((item) => item.type === 'mcq');
  const item = questions[index];
  if (!item) return <Card title="Before we start"><p className="nb-empty">No questions in this check.</p>{back}</Card>;
  const picked = answers[item.id] ?? '';
  const skipped = picked === NOT_TAUGHT;
  const options = [...item.options.filter((option) => option !== NOT_TAUGHT), NOT_TAUGHT];
  const completed = questions.filter((question) => answers[question.id]);
  function recordTime() {
    times.current[item.id] = Math.min(86400000, (times.current[item.id] ?? 0) + Date.now() - started.current);
    started.current = Date.now();
  }
  async function advance() {
    if (busy.current) return;
    if (!picked || (!skipped && !confidence[item.id])) { setError('Choose an answer and how sure you feel, or choose “I haven’t learned this yet”.'); return; }
    recordTime(); setError(null);
    if (index + 1 < questions.length) { setIndex(index + 1); return; }
    busy.current = true; setPending(true);
    try {
      const result = await postJson(`/chapters/${chapterId}/diagnostic`, DiagnosticResultSchema, {
        answers: questions.map((question) => ({ itemId: question.id, answer: answers[question.id], confidence: answers[question.id] === NOT_TAUGHT ? 'sure' : confidence[question.id], timeMs: times.current[question.id] ?? 0 })),
      });
      setMessage(result.message);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this check.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <div className="pg-quiz">
    <div className="qz-top"><Link className="back" to={`/student/chapters/${chapterId}`}><Icon name="back" />{chapter.data.title} · before we start</Link>
      <div className="strip-wrap"><div className="nb-strip" aria-label={`${completed.length} answered of ${questions.length}`}>{questions.map((question, slot) => <span className="nb-strip__slot" key={question.id}>{slot ? <span className="nb-strip__link" /> : null}<span className={`nb-strip__node${slot === index ? ' is-current' : answers[question.id] === NOT_TAUGHT ? ' is-notyet' : answers[question.id] ? ' is-answered' : ''}`}>{answers[question.id] === NOT_TAUGHT && slot !== index ? '?' : slot + 1}</span></span>)}</div><div className="strip-cap"><span>Warm-up check · {questions.length} questions</span><span>Question {index + 1} of {questions.length}</span></div></div><span className="nb-chip nb-chip--green">No marks</span>
    </div>
    <div className="nb-quiz"><div className="qz-main"><section className="nb-qcard">
      <span className="nb-tape nb-tape--green qz-tape" /><div className="nb-q__label"><span className="nb-q__num">{index + 1}</span><span className="nb-label">{offer.data.title}</span><span className="nb-chip nb-chip--sand">An earlier idea</span></div>
      <div className="qz-figure"><div><h1 ref={prompt} tabIndex={-1} className="nb-q__text">{item.prompt}</h1><p className="nb-q__hint">No marks. This only tells Saathy where to start.</p>{item.sourceRef ? <p className="nb-meta">{item.sourceRef.locator}</p> : null}</div></div>
      <div className="nb-opts" role="group" aria-label="Your answer">{options.map((option, optionIndex) => {
        const special = option === NOT_TAUGHT;
        return <button type="button" key={option} disabled={pending} aria-pressed={picked === option} className={`nb-opt${picked === option ? ' is-selected' : ''}${special ? ' is-notyet' : ''}`} onClick={() => { setAnswers((current) => ({ ...current, [item.id]: option })); setError(null); }}><span className="nb-opt__key">{special ? '?' : String.fromCharCode(97 + optionIndex)}</span><span className="nb-opt__body">{special ? "I haven't learned this yet" : option}</span><span className="nb-opt__mark">{special ? "No penalty. We'll teach it first." : ''}</span></button>;
      })}</div>
      {!skipped ? <ConfidenceRow value={confidence[item.id] ?? ''} locked={pending} onChange={(value) => { setConfidence((current) => ({ ...current, [item.id]: value })); }} /> : <p className="nb-note" role="status">No penalty. We'll teach it first.</p>}
      {error ? <p className="nb-redpen" role="alert">{error}</p> : null}
      <div className="qz-foot"><div className="left">{index > 0 ? <NbButton variant="ghost" size="sm" disabled={pending} onClick={() => { recordTime(); setIndex(index - 1); setError(null); }}>Back</NbButton> : null}<span className="nb-meta">Skipping is fine too. Nothing here counts against you.</span></div><NbButton size="lg" disabled={pending || !picked || (!skipped && !confidence[item.id])} onClick={() => { void advance(); }}>{pending ? 'Saving…' : index + 1 === questions.length ? 'Finish' : 'Next'}<Icon name="arrow" /></NbButton></div>
    </section></div>
    <aside className="qz-rail"><Sticky color="green" who="Why these questions?" tape="left">These are earlier ideas that {chapter.data.title} stands on. If you haven't learned one, tap <b>“I haven't learned this yet”</b>. We'll teach it before {chapter.data.title}, no penalty.</Sticky>
      <Card><div className="nb-saathy-tip"><Saathy size="4.2rem" /><div><h3 className="nb-h3">Take your time</h3><p className="nb-text">No timer. No marks. Just tell Saathy what you know.</p></div></div><button type="button" className="nb-chip nb-chip--sky" onClick={() => { prompt.current?.focus(); prompt.current?.scrollIntoView({ block: 'center' }); }}>Read it again</button></Card>
      <Card title="So far" meta={<span className="nb-meta">{completed.length} of {questions.length}</span>}>{completed.length ? completed.map((question) => <div className="nb-row qz-answer" key={question.id}><span className={`nb-strip__node${answers[question.id] === NOT_TAUGHT ? ' is-notyet' : ' is-answered'}`}>{answers[question.id] === NOT_TAUGHT ? '?' : questions.indexOf(question) + 1}</span><div><div className="nb-row__t">{question.prompt}</div><div className="nb-row__s">{answers[question.id] === NOT_TAUGHT ? "Not taught yet · we'll start here" : 'Answered · saved when you finish'}</div></div></div>) : <p className="nb-empty">Your answers will appear here.</p>}</Card>
      <Card title="After this" grow><p className="nb-text">Saathy builds your {chapter.data.title} path from these answers. New ideas start as <MasteryChip level="New" />, never as weak spots.</p></Card>
    </aside></div>
  </div>;
}
