import { AskResponseSchema, AskSchema, type AskResponse } from '@vidhyasaathy/contracts';
import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { postJson } from '../api/client';
import { ChapterListSchema } from '../content/schemas';
import { usePageMeta } from '../meta';
import { SubjectListSchema } from '../setup/schemas';
import { useRemote } from '../setup/useRemote';
import { Saathy } from '../student/notebook/Saathy';
import { Card, PageHead, Sticky, SubjectIcon, Tabs } from '../student/notebook/ui';
import { NotebookState } from '../student/notebook/screens/polish3b/NotebookState';
import { askMessage } from '../student/notebook/screens/polish3b/ask';
import '../student/notebook/pages/ask.css';
import { Citation } from './Citation';

type Doubt = { id: string; question: string; chapterId: string; chapter: string; subject: string; replies: AskResponse[] };

export function AskPanel() {
  const [params] = useSearchParams();
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const [chosenSubject, setSubject] = useState('');
  const subject = subjects.data?.find((row) => row.id === chosenSubject) ?? subjects.data?.[0];
  const chapters = useRemote(subject ? `/subjects/${subject.id}/chapters` : null, ChapterListSchema);
  const [chosenChapter, setChapter] = useState('');
  const chapter = chapters.data?.find((row) => row.id === chosenChapter) ?? chapters.data?.[0];
  const [question, setQuestion] = useState(params.get('q') ?? '');
  const [socratic, setSocratic] = useState(true);
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  usePageMeta('Ask Saathy — VidhyaSaathy', 'Hints first. Ask from the released notes for your chapter.');
  const latest = doubts.at(-1);
  const last = latest?.replies.at(-1);

  async function send(hintLevel = 1, previous?: Doubt) {
    const text = previous?.question ?? question;
    const parsed = AskSchema.safeParse({ chapterId: previous?.chapterId ?? chapter?.id, question: text, hintLevel, socratic: previous?.replies.at(-1)?.socratic ?? socratic });
    if (!parsed.success) { setError(chapter ? 'Write a doubt of at least two characters.' : 'Choose a chapter first.'); return; }
    setPending(true); setError('');
    try {
      const reply = await postJson('/ask', AskResponseSchema, parsed.data);
      setDoubts((current) => previous ? current.map((row) => row.id === previous.id ? { ...row, replies: [...row.replies, reply] } : row) : [...current, { id: crypto.randomUUID(), question: text, chapterId: parsed.data.chapterId, chapter: chapter?.title ?? '', subject: subject?.name ?? '', replies: [reply] }]);
      if (reply.status === 'answered' || reply.status === 'not_in_notes') setQuestion('');
    } catch { setError('Could not reach your notebook helper. Your question is still here. Try again.'); }
    finally { setPending(false); }
  }

  if (subjects.denied) return <NotebookState title="Ask Saathy" message="This notebook is not available. Ask your teacher to check your access." />;
  if (subjects.status === 'error') return <NotebookState title="Ask Saathy" message="Could not open your subjects. Your question is still here." retry={subjects.reload} />;
  if (!subjects.data) return <NotebookState title="Ask Saathy" loading />;

  return <div className="nb-grid pg-ask">
    <div className="chat">
      <PageHead title="Ask Saathy" sub="Hints first. You do the thinking, I'll keep you on track." />
      <Tabs tabs={[{ id: 'hints', label: 'Hints mode' }, { id: 'explain', label: 'Explain fully' }]} active={socratic ? 'hints' : 'explain'} onChange={(value) => { if (!pending) setSocratic(value === 'hints'); }} />
      <div className="thread" aria-live="polite">
        {!doubts.length ? <div className="msg"><Saathy mood="think" size="3rem" /><div><div className="meta">Saathy</div><div className="b">{subjects.data.length ? 'Choose what we are talking about, then write your doubt below. We will take it one step at a time.' : 'Your subjects will appear here when your teacher adds them.'}</div></div></div> : null}
        {doubts.map((doubt) => <div className="ask-turn" key={doubt.id}>
          <div className="msg me"><div><div className="meta">You · {doubt.chapter}</div><div className="b">{doubt.question}</div></div><span className="ask-you" aria-hidden="true">You</span></div>
          {doubt.replies.map((reply, index) => <div className="msg" key={`${reply.updatedAt}-${index}`} data-testid="ai-state"><Saathy mood="think" size="3rem" /><div><div className="meta">Saathy</div><div className="b"><p>{askMessage(reply)}</p>{reply.citations.map((citation) => <Citation key={`${citation.noteId}-${citation.locator}`} citation={citation} />)}{reply.status === 'unavailable' || reply.status === 'not_configured' ? <button className="nb-btn nb-btn--ghost nb-btn--sm" disabled={pending} onClick={() => { void send(reply.hintLevel, doubt); }}>Try again</button> : null}</div></div></div>)}
        </div>)}
        {pending ? <div className="msg"><Saathy mood="think" size="3rem" /><div className="b" role="status">Looking through your chapter notes…</div></div> : null}
      </div>
      <div className="ask-suggestions">
        {last?.status === 'answered' && last.hintLevel < 3 && latest ? <button className="nb-chip nb-chip--sky" disabled={pending} onClick={() => { void send(last.hintLevel + 1, latest); }}>Ask for the next hint</button> : null}
        {['Give me a hint', 'Explain this step', 'Show an example'].map((text) => <button className="nb-chip nb-chip--sky" disabled={pending || !chapter} key={text} onClick={() => { setQuestion(`${text}: `); input.current?.focus(); }}>{text}</button>)}
      </div>
      <form className="composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <button type="button" className="nb-btn nb-btn--quiet nb-btn--sm" disabled aria-label="Photo attachments are not available yet" title="Photo attachments are not available yet"><svg className="i" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l2-3h4l2 3" /><circle cx="12" cy="13" r="3.5" /></svg></button>
        <label className="ask-input"><span className="nb-label">Your doubt</span><textarea ref={input} rows={2} maxLength={1000} placeholder="Ask a doubt…" value={question} onChange={(event) => setQuestion(event.target.value)} disabled={pending} /></label>
        <button type="submit" className="nb-btn nb-btn--primary" disabled={pending || !chapter || chapters.status !== 'ready'}><svg className="i" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6" /></svg>{pending ? 'Asking…' : 'Send'}</button>
      </form>
      {error ? <p className="nb-note" role="alert">{error} <button className="nb-btn nb-btn--ghost nb-btn--sm" disabled={pending} onClick={() => { void send(); }}>Try again</button></p> : null}
    </div>
    <aside className="nb-col">
      <Card title="Recent doubts">{doubts.length ? [...doubts].reverse().map((doubt) => <button className="doubt" key={doubt.id} disabled={pending} onClick={() => { setSubject(subjects.data?.find((row) => row.name === doubt.subject)?.id ?? ''); setChapter(doubt.chapterId); setQuestion(doubt.question); input.current?.focus(); }}><b>{doubt.question}</b><span className="nb-meta">{doubt.subject} · this visit</span></button>) : <p className="nb-note">Your doubts from this visit will appear here.</p>}</Card>
      <Card title="Talking about">
        {subject ? <><div className="nb-row ask-context"><SubjectIcon subject={subject.name} /><div><div className="nb-row__t">{chapter?.title ?? 'Choose a chapter'}</div><div className="nb-row__s">{subject.name}</div></div></div>
          <label className="ask-select">Subject<select value={subject.id} disabled={pending} onChange={(event) => { setSubject(event.target.value); setChapter(''); }}>{subjects.data.map((row) => <option value={row.id} key={row.id}>{row.name}</option>)}</select></label>
          {chapters.status === 'error' ? <p className="nb-note" role="alert">Could not open your chapters. <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={chapters.reload}>Try again</button></p> : chapters.denied ? <p className="nb-note">These chapters are not available.</p> : !chapters.data ? <p className="nb-note" role="status">Opening your chapters…</p> : chapters.data.length ? <label className="ask-select">Chapter<select value={chapter?.id ?? ''} disabled={pending} onChange={(event) => setChapter(event.target.value)}>{chapters.data.map((row) => <option value={row.id} key={row.id}>{row.title}</option>)}</select></label> : <p className="nb-note">No chapter is ready to ask about yet.</p>}
        </> : <p className="nb-note">No subjects have been added yet.</p>}
      </Card>
      <Sticky color="lilac" who="How Saathy helps">1. Asks what you already know<br />2. Gives one hint at a time<br />3. Lets you finish the step<br /><br />Your chats stay private. Teachers and parents only see which topics you asked about.</Sticky>
      <Card title="Saved explanations" grow><p className="nb-note">No saved explanations here yet.</p></Card>
    </aside>
  </div>;
}
