import { AskResponseSchema, AskSchema, type AskResponse } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { ChapterListSchema } from '../content/schemas';
import { usePageMeta } from '../meta';
import { SubjectListSchema } from '../setup/schemas';
import { useRemote } from '../setup/useRemote';
import { Saathy } from '../student/notebook/Saathy';
import { PageHead } from '../student/notebook/ui';
import '../student/notebook/pages/ask.css';
import { ErrorState } from '../ui/ErrorState';
import { SelectField } from '../ui/SelectField';
import { Citation } from './Citation';

export function AskPanel() {
  const [params] = useSearchParams();
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const [subjectId, setSubjectId] = useState('');
  const chapters = useRemote(subjectId ? `/subjects/${subjectId}/chapters` : null, ChapterListSchema);
  const [chapterId, setChapterId] = useState('');
  const [question, setQuestion] = useState(params.get('q') ?? '');
  const [socratic, setSocratic] = useState(false);
  const [asked, setAsked] = useState('');
  const [turns, setTurns] = useState<AskResponse[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  usePageMeta('Ask Saathy — VidhyaSaathy', 'Ask a question. Answers come only from released notes for the chapter you choose.');

  const last = turns.at(-1) ?? null;
  const subjectOptions = (subjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name }));
  const chapterOptions = (chapters.data ?? []).map((chapter) => ({ value: chapter.id, label: chapter.title }));

  async function send(hintLevel: number, text: string, mode: boolean) {
    const parsed = AskSchema.safeParse({ chapterId, question: text, hintLevel, socratic: mode });
    if (!parsed.success) {
      setError(chapterId ? 'Enter a question of at least 2 characters.' : 'Choose a chapter.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const response = await postJson('/ask', AskResponseSchema, parsed.data);
      setAsked(text);
      setTurns((current) => hintLevel === 1 ? [response] : [...current, response]);
    } catch (cause) {
      setError(cause instanceof ApiClientError ? cause.message : 'The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  if (subjects.denied || chapters.denied) return <ErrorState title="Ask Saathy is not available" message="This account cannot ask from these notes." onRetry={subjects.reload} />;
  if (subjects.status === 'error' && !subjects.data) return <ErrorState title="Could not load subjects" message={subjects.message ?? 'Try again.'} onRetry={subjects.reload} />;
  if (!subjects.data) return <div className="nb-skel" />;

  return (
    <div className="chat">
      <PageHead eyebrow="Saathy" title="Ask Saathy" sub="Answers use released notes for one chapter." />
      <form className="composer" onSubmit={(event) => { event.preventDefault(); void send(1, question, socratic); }}>
          {subjects.data.length === 0 ? <p className="nb-empty">No subjects assigned yet. Ask your teacher.</p> : (
            <SelectField id="ask-subject" label="Subject" name="subjectId" value={subjectId} placeholder="Choose a subject" options={subjectOptions} error={null} onChange={(value) => { setSubjectId(value); setChapterId(''); setTurns([]); }} />
          )}
          {subjectId ? chapters.status === 'loading' && !chapters.data ? <div className="nb-skel" /> : chapters.status === 'error' && !chapters.data ? <p className="nb-empty" role="alert">Could not load chapters. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={chapters.reload}>Try again</button></p> : (
            <SelectField id="ask-chapter" label="Chapter" name="chapterId" value={chapterId} placeholder="Choose a chapter" options={chapterOptions} error={null} onChange={(value) => { setChapterId(value); setTurns([]); }} />
          ) : null}
          <label className="nb-meta" htmlFor="ask-question">Question</label>
          <textarea id="ask-question" name="question" rows={2} maxLength={1000} className="nb-input" value={question} onChange={(event) => { setQuestion(event.target.value); }} />
          <label className="nb-meta">
            <input type="checkbox" checked={socratic} onChange={() => { setSocratic((current) => !current); setTurns([]); }} />
            Step by step
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" className="nb-btn nb-btn--primary" disabled={pending}>{pending ? 'Asking' : 'Ask'}</button>
      </form>
      <div className="thread">
      {turns.map((turn, index) => (
        <div key={`${turn.hintLevel}-${turn.updatedAt}-${index}`} data-testid={index === turns.length - 1 ? 'ai-state' : undefined}>
          {index === 0 ? <div className="msg me"><div className="b"><div className="meta">You</div>{asked}</div></div> : null}
          <div className="msg"><Saathy mood="think" size="2.6rem" /><div className="b"><div className="meta">Saathy</div>{turn.status === 'not_configured' ? 'AI not configured' : turn.message}{turn.citations.map((citation) => <Citation key={`${citation.noteId}-${citation.locator}`} citation={citation} />)}</div></div>
        </div>
      ))}
      </div>
      {last?.status === 'answered' && last.hintLevel < 3 ? (
        <button type="button" className="nb-btn nb-btn--ghost" disabled={pending} onClick={() => { void send(last.hintLevel + 1, asked, last.socratic); }}>
          {pending ? 'Asking' : `Ask for hint ${last.hintLevel + 1}`}
        </button>
      ) : null}
    </div>
  );
}
