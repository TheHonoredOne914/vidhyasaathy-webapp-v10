import { ChapterSchema, ConceptSchema, NoteSchema, SaveChapterSchema, SaveConceptSchema, SaveNoteSchema } from '@vidhyasaathy/contracts';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { postJson, putJson } from '../../api/client';
import { audienceFrom } from '../../content/audience';
import { contentStateLabel, sessionProgressLabel } from '../../content/format';
import { ConceptListSchema, NoteListSchema, SessionListSchema } from '../../content/schemas';
import { usePageMeta } from '../../meta';
import { useMutation } from '../../setup/useMutation';
import { useRemote, type Remote } from '../../setup/useRemote';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Field } from '../../ui/Field';
import { Skeleton } from '../../ui/Skeleton';
import { fieldClass } from '../../ui/Field';
import { AccessDenied } from '../AccessDenied';
import { AssignmentList } from '../../assessment/AssignmentList';
import { ConceptMap } from '../../ai/ConceptMap';
import { DiagnosticPanel } from './DiagnosticPanel';
import { LessonFrame } from './LessonFrame';
import { ChapterPlaySteps } from '../../games/ChapterPlaySteps';

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function ChapterPage() {
  const { pathname } = useLocation();
  const { chapterId = '' } = useParams();
  const audience = audienceFrom(pathname);
  const navigate = useNavigate();
  const chapter = useRemote(chapterId ? `/chapters/${chapterId}` : null, ChapterSchema);
  const concepts = useRemote(chapterId ? `/chapters/${chapterId}/concepts` : null, ConceptListSchema);
  const notes = useRemote(chapterId ? `/chapters/${chapterId}/notes` : null, NoteListSchema);
  const sessions = useRemote(chapterId ? `/chapters/${chapterId}/sessions` : null, SessionListSchema);
  const conceptForm = useMutation();
  const noteForm = useMutation();
  const chapterForm = useMutation();
  const [title, setTitle] = useState('');
  const [conceptTitle, setConceptTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prereqs, setPrereqs] = useState<string[]>([]);
  const [noteTitle, setNoteTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagged, setTagged] = useState<string[]>([]);
  const [noteGate, setNoteGate] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState('');
  const student = audience === 'student';
  const parts: Remote<unknown>[] = [chapter, concepts, notes, sessions];
  usePageMeta(chapter.data ? `${chapter.data.title} — VidhyaSaathy` : 'Chapter — VidhyaSaathy', 'Concepts, notes, and sessions for one chapter.');

  useEffect(() => {
    if (!chapter.data || hydrated === chapter.data.id) return;
    setHydrated(chapter.data.id);
    setTitle(chapter.data.title);
  }, [chapter.data, hydrated]);

  if (parts.some((part) => part.denied)) return <AccessDenied />;
  const failed = parts.find((part) => part.status === 'error' && !part.data);
  if (failed) {
    return <div className="error-card"><ErrorState title="Could not load this chapter" message={failed.message ?? 'Try again.'} onRetry={() => { parts.forEach((part) => { part.reload(); }); }} /></div>;
  }
  if (!chapter.data || !concepts.data || !notes.data || !sessions.data) {
    return <LessonFrame kicker="Chapter" title="Chapter"><Skeleton /></LessonFrame>;
  }

  const current = chapter.data;
  const conceptRows = concepts.data;
  const noteRows = notes.data;
  const sessionRows = sessions.data;

  async function saveChapter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await chapterForm.submit(SaveChapterSchema, {
      subjectId: current.subjectId, title, position: current.position,
    }, async (data) => {
      await putJson(`/chapters/${current.id}`, ChapterSchema, data);
    });
    if (saved) chapter.reload();
  }

  async function addConcept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await conceptForm.submit(SaveConceptSchema, {
      title: conceptTitle, description, prerequisiteIds: prereqs,
    }, async (data) => {
      await postJson(`/chapters/${current.id}/concepts`, ConceptSchema, data);
    });
    if (!saved) return;
    setConceptTitle('');
    setDescription('');
    setPrereqs([]);
    concepts.reload();
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (tagged.length === 0) {
      setNoteGate('Tag at least one concept.');
      return;
    }
    setNoteGate(null);
    let createdId = '';
    const saved = await noteForm.submit(SaveNoteSchema, { title: noteTitle, body, conceptIds: tagged }, async (data) => {
      const created = await postJson(`/chapters/${current.id}/notes`, NoteSchema, data);
      createdId = created.id;
    });
    if (!saved || !createdId) return;
    navigate(`/${audience}/notes/${createdId}`);
  }

  return (
    <LessonFrame paper={student} kicker="Chapter" title={current.title} script={student ? 'Read, then check.' : 'Tag a note before you publish.'} stale={chapter}>
      <p className="lesson-actions"><Link to={`/${audience}/subjects/${current.subjectId}`}>Back to chapters</Link></p>
      {student ? <ChapterPlaySteps chapterId={current.id} /> : null}
      {student ? null : (
        <form className="grid gap-4" noValidate aria-busy={chapterForm.pending} onSubmit={(event) => { void saveChapter(event); }}>
          <h2>Chapter title</h2>
          <Field id="chapter-rename" label="Chapter title" name="title" type="text" value={title} onChange={setTitle} error={chapterForm.errorFor('title')} hint={null} autoComplete="off" maxLength={160} />
          {chapterForm.formError ? <p role="alert">{chapterForm.formError}</p> : null}
          <Button type="submit" disabled={chapterForm.pending}>{chapterForm.pending ? 'Saving chapter' : 'Save chapter'}</Button>
        </form>
      )}

      <div className="lesson-card">
        <h2>Concepts</h2>
        {conceptRows.length === 0 ? <p>No concept in this chapter yet.</p> : <ConceptMap concepts={conceptRows} audience={audience} chapterId={current.id} />}
      </div>
      {student ? null : (
        <form className="grid gap-4" noValidate aria-busy={conceptForm.pending} onSubmit={(event) => { void addConcept(event); }}>
          <h2>Add a concept</h2>
          <Field id="concept-title" label="Concept title" name="title" type="text" value={conceptTitle} onChange={setConceptTitle} error={conceptForm.errorFor('title')} hint={null} autoComplete="off" maxLength={160} />
          <div className="grid gap-1">
            <label htmlFor="concept-description" className="font-semibold">Description</label>
            <textarea id="concept-description" name="description" rows={3} value={description} onChange={(event) => { setDescription(event.target.value); }} className={`${fieldClass} min-h-24 py-2`} />
          </div>
          {conceptRows.length === 0 ? null : (
            <fieldset className="grid gap-1">
              <legend className="font-semibold">Prerequisites in this chapter</legend>
              {conceptRows.map((concept) => (
                <label key={concept.id} className="lesson-check">
                  <input type="checkbox" checked={prereqs.includes(concept.id)} onChange={() => { setPrereqs((currentIds) => toggle(currentIds, concept.id)); }} />
                  {concept.title}
                </label>
              ))}
            </fieldset>
          )}
          {conceptForm.formError ? <p role="alert">{conceptForm.formError}</p> : null}
          <Button type="submit" disabled={conceptForm.pending}>{conceptForm.pending ? 'Adding concept' : 'Add concept'}</Button>
        </form>
      )}

      <div className="lesson-card">
        <h2 id="chapter-notes">Notes</h2>
        {noteRows.length === 0 ? (
          <EmptyState title={student ? 'No notes have been released for this chapter.' : 'No note yet.'}>
            <p>{student ? 'A published note will show up here.' : 'Write a note and tag at least one concept.'}</p>
          </EmptyState>
        ) : (
          <ul className="lesson-list" aria-label="Notes">
            {noteRows.map((note) => (
              <li key={note.id}>
                <Link to={`/${audience}/notes/${note.id}`}>{note.title}</Link>
                {student ? null : <span className="lesson-status">{contentStateLabel(note.status, note.releaseAt)}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
      {student || conceptRows.length === 0 ? null : (
        <form className="grid gap-4" noValidate aria-busy={noteForm.pending} onSubmit={(event) => { void addNote(event); }}>
          <h2>Add a note</h2>
          <Field id="note-title" label="Note title" name="title" type="text" value={noteTitle} onChange={setNoteTitle} error={noteForm.errorFor('title')} hint={null} autoComplete="off" maxLength={160} />
          <div className="grid gap-1">
            <label htmlFor="note-body" className="font-semibold">Note</label>
            <textarea id="note-body" name="body" rows={6} value={body} onChange={(event) => { setBody(event.target.value); }} className={`${fieldClass} min-h-32 py-2`} />
          </div>
          <fieldset className="grid gap-1">
            <legend className="font-semibold">Concepts</legend>
            {conceptRows.map((concept) => (
              <label key={concept.id} className="lesson-check">
                <input type="checkbox" checked={tagged.includes(concept.id)} onChange={() => { setTagged((currentIds) => toggle(currentIds, concept.id)); }} />
                {concept.title}
              </label>
            ))}
          </fieldset>
          {noteGate ? <p role="alert">{noteGate}</p> : null}
          {noteForm.formError ? <p role="alert">{noteForm.formError}</p> : null}
          <Button type="submit" disabled={noteForm.pending}>{noteForm.pending ? 'Saving note' : 'Save note'}</Button>
        </form>
      )}

      {student ? <DiagnosticPanel chapterId={current.id} /> : null}
      <div className="lesson-card">
        <h2>Sessions</h2>
        {sessionRows.length === 0 ? (
          <EmptyState title={student ? 'No session has been released for this chapter.' : 'No session yet.'}>
            <p>{student ? 'A published session for your section will show up here.' : 'Create a session after the chapter has a concept.'}</p>
          </EmptyState>
        ) : (
          <ul className="lesson-list" aria-label="Sessions">
            {sessionRows.map((session) => (
              <li key={session.id}>
                <Link to={student ? `/student/sessions/${session.id}` : `/${audience}/sessions/${session.id}`}>{session.title}</Link>
                <span className="lesson-status">{student ? sessionProgressLabel(session.progress, session.status) : contentStateLabel(session.status, session.releaseAt)}</span>
              </li>
            ))}
          </ul>
        )}
        {student || conceptRows.length === 0 ? null : (
          <p className="lesson-actions"><Link to={`/${audience}/chapters/${current.id}/sessions/new`}>Create a session</Link></p>
        )}
        {student ? <p className="lesson-actions"><Link to={`/student/chapters/${current.id}/practice`}>Optional practice</Link></p> : null}
      </div>
      <div className="lesson-card">
        <h2>Assignments</h2>
        <AssignmentList chapterId={current.id} />
        {student || conceptRows.length === 0 ? null : (
          <p className="lesson-actions">
            <Link to={`/${audience}/chapters/${current.id}/questions`}>Question bank</Link>
            <Link to={`/${audience}/chapters/${current.id}/assignments/new`}>Assign homework or a quiz</Link>
          </p>
        )}
      </div>
    </LessonFrame>
  );
}
