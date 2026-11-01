import { ChapterSchema, CheckpointResultSchema, LessonViewSchema, ProgressSchema, type PublicLesson } from '@vidhyasaathy/contracts';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiClientError, postJson } from '../../../../api/client';
import { ConceptListSchema, NoteListSchema } from '../../../../content/schemas';
import { LearnBlocks, MovingObject, SliderGraph } from '../../../../learn/blocks';
import { usePageMeta } from '../../../../meta';
import { AccessDenied } from '../../../../routes/AccessDenied';
import { useRemote } from '../../../../setup/useRemote';
import { Icon, Scribble } from '../../icons';
import { Saathy } from '../../Saathy';
import { Card, ConfidenceRow, MasteryChip, NbButton, Tabs } from '../../ui';
import { LessonReview, YourTurn } from './LessonReview';
import { PageAsk } from './PageAsk';

const TABS = [{ id: 'notes', label: 'Notes' }, { id: 'story', label: 'Story' }, { id: 'diagram', label: 'Diagram' }, { id: 'exam', label: 'Exam style' }];

function QuickCheck({ step, index, total, conceptId }: { step: PublicLesson['steps'][number]; index: number; total: number; conceptId: string }) {
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState<'' | 'sure' | 'unsure' | 'guess'>('');
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const started = useRef(Date.now());
  async function check() {
    if (busy.current) return;
    if (!answer || !confidence) { setError('Pick an answer and choose how sure you feel.'); return; }
    busy.current = true; setPending(true); setError('');
    try { setResult(await postJson(`/concepts/${conceptId}/lesson/checkpoint`, CheckpointResultSchema, { attemptId: crypto.randomUUID(), itemId: step.checkpoint.id, answer, confidence, timeMs: Date.now() - started.current })); }
    catch (cause) { setError(cause instanceof ApiClientError ? cause.message : 'Could not check. Try again.'); }
    finally { busy.current = false; setPending(false); }
  }
  return <div className="ls-check"><div className="ls-check-head"><span className="nb-label">Quick check · {index + 1} of {total}</span><span className="nb-meta">Doesn't count. Just for you.</span></div><div className="nb-note ls-question">{step.checkpoint.prompt}</div>
    <div className="opts" role="group" aria-label={`Quick check ${index + 1} options`}>{step.checkpoint.options.map((option) => <button type="button" key={option} aria-pressed={answer === option} disabled={pending} className={`o${answer === option ? ' is-picked' : ''}${answer === option && result?.correct ? ' ok' : ''}`} onClick={() => { setAnswer(option); setResult(null); }}>{answer === option && result?.correct ? <Icon name="check" /> : null}{option}</button>)}</div>
    <ConfidenceRow value={confidence} locked={pending} onChange={setConfidence} /><NbButton size="sm" disabled={pending} onClick={() => { void check(); }}>{pending ? 'Checking…' : 'Check'}</NbButton>
    {result ? <p role="status" className={result.correct ? 'ls-correct' : 'nb-redpen'}>{result.explanation}</p> : null}{error ? <p role="alert">{error}</p> : null}
  </div>;
}

export function StudentLessonPage() {
  const { chapterId = '', conceptId = '' } = useParams();
  const [simpler, setSimpler] = useState(false);
  const [tab, setTab] = useState('notes');
  const chapter = useRemote(`/chapters/${chapterId}`, ChapterSchema);
  const concepts = useRemote(`/chapters/${chapterId}/concepts`, ConceptListSchema);
  const notes = useRemote(`/chapters/${chapterId}/notes`, NoteListSchema);
  const lesson = useRemote(`/concepts/${conceptId}/lesson${simpler ? '?simpler=1' : ''}`, LessonViewSchema);
  const progress = useRemote('/progress', ProgressSchema);
  const concept = concepts.data?.find((item) => item.id === conceptId);
  usePageMeta(`${concept?.title ?? 'Lesson'} — VidhyaSaathy`, 'One idea, a worked example and a quiet check.');
  if (chapter.denied || concepts.denied || lesson.denied || (concepts.data && !concept)) return <AccessDenied />;
  const failed = [chapter, concepts, lesson].find((remote) => remote.status === 'error' && !remote.data);
  if (failed) return <Card title="Could not open this lesson"><p role="alert">{failed.message}</p><NbButton onClick={() => { chapter.reload(); concepts.reload(); lesson.reload(); }}>Try again</NbButton></Card>;
  if (!concept || !chapter.data || !lesson.data) return <div className="nb-grid" aria-label="Loading lesson"><div className="nb-skel" /><div className="nb-skel" /></div>;
  const page = lesson.data.found ? lesson.data : null;
  const index = concepts.data!.findIndex((item) => item.id === conceptId);
  const previous = concepts.data?.[index - 1];
  const mastery = progress.data?.masteryWords.find((row) => row.conceptId === conceptId)?.word ?? 'New';
  const graph = page?.blocks.find((block) => block.kind === 'slider_graph');
  const moving = page?.blocks.find((block) => block.kind === 'moving_object');
  const prereq = concepts.data?.find((item) => concept.prerequisiteIds.includes(item.id));
  const practice = `/student/chapters/${chapterId}/practice`;
  const toc = [{ id: 'bridge', title: 'Bridge from what you know' }, { id: 'meaning', title: 'What it means' }, { id: 'see-it', title: 'See it' }, { id: 'quick-check', title: 'Quick check' }, { id: 'worked', title: 'Worked example' }, { id: 'mix-up', title: 'Common mix-up' }];
  return <div className="nb-grid ls-page"><div className="nb-col">
    <header className="ls-head"><div><div className="ls-crumb"><Link to={`/student/chapters/${chapterId}`}><Icon name="back" />{chapter.data.title}</Link><span className="nb-meta">/</span>Idea {index + 1} of {concepts.data!.length}</div><h1 className="nb-h1">{concept.title}</h1><Scribble /><p className="nb-sub">{concept.description}</p></div><div className="ls-controls"><MasteryChip level={mastery} /><Tabs tabs={TABS} active={tab} onChange={setTab} /><NbButton variant="quiet" size="sm" disabled={simpler || lesson.status === 'loading' || !page} onClick={() => { setSimpler(true); }}><Icon name="refresh" />{simpler ? 'Simpler explanation' : 'Explain simpler'}</NbButton></div></header>
    <div className="ls-body">
      {page ? <>
        <section id="bridge" className="nb-sticky nb-sticky--blue ls-bridge"><Saathy mood="happy" size="3.6rem" /><div><span className="nb-sticky__who">Bridge · you already know this</span><div className="nb-text">{page.bridge.link}</div></div>{prereq ? <Link className="nb-btn nb-btn--ghost nb-btn--sm" to={`/student/chapters/${chapterId}/concepts/${prereq.id}`}>Revise {prereq.title}</Link> : <details><summary className="nb-btn nb-btn--ghost nb-btn--sm">Revise {page.bridge.prereqTitle}</summary><p className="nb-text">{page.bridge.repair ?? page.bridge.link}</p></details>}</section>
        <section className="ls-sheet"><span className="nb-tape" />
          <div className="ls-two"><div id="meaning"><h2>1. What it means</h2><p>{page.note}</p>{page.summary.formulas.map((formula) => <div className="ls-formula" key={formula}>{formula}</div>)}</div><div id="see-it"><h2>2. See it</h2>{graph?.kind === 'slider_graph' ? <SliderGraph block={graph} /> : moving?.kind === 'moving_object' ? <MovingObject block={moving} /> : <div className="ls-visual-summary">{page.summary.lines.map((line, lineIndex) => <div className="step" key={line}><b>{lineIndex + 1}</b><span>{line}</span></div>)}</div>}</div></div>
          {tab === 'story' ? <section className="ls-tab-content"><h2>Follow the idea</h2>{page.steps.map((step) => <p key={step.checkpoint.id}>{step.body}</p>)}</section> : null}
          {tab === 'diagram' ? <section className="ls-tab-content"><h2>Try it for yourself</h2><LearnBlocks blocks={page.blocks} conceptId={conceptId} /></section> : null}
          {tab === 'exam' ? <section className="ls-tab-content"><h2>Write it clearly</h2><p>{page.worked.unhinted}</p><ul>{page.summary.lines.map((line) => <li key={line}>{line}</li>)}</ul></section> : null}
          <div id="quick-check" className="ls-checks">{page.steps.map((step, stepIndex) => <div key={step.checkpoint.id}>{tab !== 'story' ? <p className="ls-step-body">{step.body}</p> : null}<QuickCheck step={step} index={stepIndex} total={page.steps.length} conceptId={conceptId} /></div>)}</div>
          <h2 id="worked">3. A worked example</h2><p>{page.worked.prompt}</p><div className="ls-worked"><div>{page.worked.hinted.map((line, lineIndex) => <div className="step" key={line}><b>{lineIndex + 1}</b><span>{line}</span></div>)}<p className="pen">{page.worked.unhinted}</p></div><YourTurn key={conceptId} lesson={page} /></div>
        </section>
        <div id="mix-up" className="ls-body">{page.misconceptions.map((item) => <section key={item.slip} className="ls-mis"><Saathy mood="oops" size="3.6rem" /><div><div className="x">Common mix-up: “{item.slip}”</div><div className="nb-text">{item.fix}</div></div></section>)}</div>
        {tab !== 'diagram' && page.blocks.length ? <details className="ls-review nb-card"><summary className="nb-h3">Explore the idea</summary><LearnBlocks blocks={page.blocks} conceptId={conceptId} /></details> : null}
        <LessonReview lesson={page} />
      </> : <Card title="What it means"><p className="nb-note">{concept.description || 'Your teacher has not added a lesson for this idea yet.'}</p>{notes.status === 'error' ? <><p role="alert">Could not load the notes.</p><NbButton onClick={notes.reload}>Try again</NbButton></> : notes.data?.filter((note) => note.conceptIds.includes(conceptId)).map((note) => <p key={note.id}><Link to={`/student/notes/${note.id}`}>{note.title}</Link></p>)}</Card>}
      <footer className="ls-footer">{previous ? <Link className="nb-btn nb-btn--ghost" to={`/student/chapters/${chapterId}/concepts/${previous.id}`}><Icon name="back" />{previous.title}</Link> : <Link className="nb-btn nb-btn--ghost" to={`/student/chapters/${chapterId}`}><Icon name="back" />Back to the chapter</Link>}<Link className="nb-btn nb-btn--primary nb-btn--lg" to={practice}>I've got it · take the check <Icon name="arrow" /></Link></footer>
    </div>
  </div><aside className="nb-col"><Card title="On this page" className="toc">{page ? toc.map((item) => <a className="t" href={`#${item.id}`} key={item.id}><i />{item.title}</a>) : <p className="nb-text">The lesson will appear here when it is ready.</p>}<Link className="t" to={practice}><i />Practice check</Link></Card><Card title="Watch the bit that matters"><div className="ls-video-empty"><Icon name="book" /><p className="nb-text">No verified video for this idea yet.</p></div><p className="nb-meta">Keep going with the notes and worked example.</p></Card><PageAsk chapterId={chapterId} topic={concept.title} title="Ask about this page" /></aside></div>;
}
