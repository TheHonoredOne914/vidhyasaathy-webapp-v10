import { AskResponseSchema, AskSchema, type AskResponse } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { ChapterListSchema } from '../content/schemas';
import { usePageMeta } from '../meta';
import { SubjectListSchema } from '../setup/schemas';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { SaathyMascot } from '../ui/Saathy';
import { ErrorState } from '../ui/ErrorState';
import { fieldClass } from '../ui/Field';
import { SelectField } from '../ui/SelectField';
import { Skeleton } from '../ui/Skeleton';
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
  if (!subjects.data) return <Skeleton />;

  return (
    <div className="stack">
      <div className="greet">
        <SaathyMascot size={48} alt="" />
        <div>
          <h1>Ask Saathy</h1>
          <p>Answers use released notes for one chapter. A question outside those notes is left unanswered.</p>
        </div>
      </div>
      <article className="lcard">
        <div className="lcard-head"><h2>Question</h2></div>
        <form className="lcard-body grid gap-4" onSubmit={(event) => { event.preventDefault(); void send(1, question, socratic); }}>
          {subjects.data.length === 0 ? <p>No subjects assigned yet. Ask your teacher.</p> : (
            <SelectField id="ask-subject" label="Subject" name="subjectId" value={subjectId} placeholder="Choose a subject" options={subjectOptions} error={null} onChange={(value) => { setSubjectId(value); setChapterId(''); setTurns([]); }} />
          )}
          {subjectId ? chapters.status === 'loading' && !chapters.data ? <Skeleton /> : chapters.status === 'error' && !chapters.data ? <ErrorState title="Could not load chapters" message={chapters.message ?? 'Try again.'} onRetry={chapters.reload} /> : (
            <SelectField id="ask-chapter" label="Chapter" name="chapterId" value={chapterId} placeholder="Choose a chapter" options={chapterOptions} error={null} onChange={(value) => { setChapterId(value); setTurns([]); }} />
          ) : null}
          <div className="grid gap-1">
            <label htmlFor="ask-question" className="font-semibold">Question</label>
            <textarea id="ask-question" name="question" rows={3} maxLength={1000} className={`${fieldClass} min-h-24 py-2`} value={question} onChange={(event) => { setQuestion(event.target.value); }} />
          </div>
          <label className="lesson-check">
            <input type="checkbox" checked={socratic} onChange={() => { setSocratic((current) => !current); setTurns([]); }} />
            Socratic mode
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <Button type="submit" disabled={pending}>{pending ? 'Asking' : 'Ask Saathy'}</Button>
        </form>
      </article>
      {turns.map((turn, index) => (
        <article key={`${turn.hintLevel}-${turn.updatedAt}-${index}`} className="lcard" data-testid={index === turns.length - 1 ? 'ai-state' : undefined}>
          <div className="lcard-head"><h2>Reply</h2></div>
          <div className="lcard-body grid gap-3">
            <p>Hint {turn.hintLevel} of 3. Socratic mode is {turn.socratic ? 'on' : 'off'}.</p>
            {index === 0 ? <p className="you-bubble"><strong>You: </strong>{asked}</p> : null}
            <p className="bubble"><strong>Saathy: </strong>{turn.status === 'not_configured' ? 'AI not configured' : turn.message}</p>
            {turn.citations.map((citation) => <Citation key={`${citation.noteId}-${citation.locator}`} citation={citation} />)}
          </div>
        </article>
      ))}
      {last?.status === 'answered' && last.hintLevel < 3 ? (
        <Button disabled={pending} onClick={() => { void send(last.hintLevel + 1, asked, last.socratic); }}>
          {pending ? 'Asking' : `Ask for hint ${last.hintLevel + 1}`}
        </Button>
      ) : null}
    </div>
  );
}
