import { ConceptSchema, LessonViewSchema, SaveConceptSchema } from '@vidhyasaathy/contracts';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { putJson } from '../../api/client';
import { audienceFrom } from '../../content/audience';
import { ConceptListSchema, NoteListSchema } from '../../content/schemas';
import { usePageMeta } from '../../meta';
import { useMutation } from '../../setup/useMutation';
import { useRemote } from '../../setup/useRemote';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/ErrorState';
import { Field } from '../../ui/Field';
import { Skeleton } from '../../ui/Skeleton';
import { fieldClass } from '../../ui/Field';
import { ConceptLearn } from '../../learn/ConceptLearn';
import { AccessDenied } from '../AccessDenied';
import { LessonFrame } from './LessonFrame';

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function ConceptPage() {
  const { pathname } = useLocation();
  const { chapterId = '', conceptId = '' } = useParams();
  const audience = audienceFrom(pathname);
  const concepts = useRemote(chapterId ? `/chapters/${chapterId}/concepts` : null, ConceptListSchema);
  const notes = useRemote(chapterId ? `/chapters/${chapterId}/notes` : null, NoteListSchema);
  const form = useMutation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prereqs, setPrereqs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState('');
  const [simpler, setSimpler] = useState(false);
  const student = audience === 'student';
  const lesson = useRemote(student && conceptId ? `/concepts/${conceptId}/lesson${simpler ? '?simpler=1' : ''}` : null, LessonViewSchema);
  const concept = (concepts.data ?? []).find((item) => item.id === conceptId) ?? null;
  usePageMeta(concept ? `${concept.title} — VidhyaSaathy` : 'Concept — VidhyaSaathy', 'One concept, its prerequisites, and the notes tagged with it.');

  useEffect(() => {
    if (!concept || hydrated === concept.id) return;
    setHydrated(concept.id);
    setTitle(concept.title);
    setDescription(concept.description);
    setPrereqs(concept.prerequisiteIds);
  }, [concept, hydrated]);

  if (concepts.denied || notes.denied || lesson.denied || (concepts.data && !concept)) return <AccessDenied />;
  if ((concepts.status === 'error' && !concepts.data) || (notes.status === 'error' && !notes.data)) {
    return <ErrorState title="Could not load this concept" message={concepts.message ?? notes.message ?? 'Try again.'} onRetry={() => { concepts.reload(); notes.reload(); }} />;
  }
  if (!concept || !concepts.data || !notes.data || (student && !lesson.data && lesson.status !== 'error')) {
    return <LessonFrame paper={student} kicker="Concept" title="Concept"><Skeleton /></LessonFrame>;
  }
  if (student && lesson.data?.found) {
    return (
      <LessonFrame paper kicker="Idea" title={concept.title} script="Read it at your depth." stale={concepts}>
        <p className="lesson-actions"><Link to={`/${audience}/chapters/${chapterId}`}>Back to the chapter</Link></p>
        <ConceptLearn lesson={lesson.data} onSimpler={() => { setSimpler(true); }} />
      </LessonFrame>
    );
  }
  const selected = concept;

  const names = new Map(concepts.data.map((item) => [item.id, item.title]));
  const tagged = notes.data.filter((note) => note.conceptIds.includes(concept.id));
  const outside = concept.prerequisiteIds.filter((id) => !names.has(id)).length;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await form.submit(SaveConceptSchema, { title, description, prerequisiteIds: prereqs }, async (data) => {
      await putJson(`/concepts/${selected.id}`, ConceptSchema, data);
    });
    if (saved) concepts.reload();
  }

  return (
    <LessonFrame paper={student} kicker="Concept" title={concept.title} script="The idea this chapter teaches." stale={concepts}>
      <p className="lesson-actions">
        <Link to={`/${audience}/chapters/${chapterId}`}>Back to the chapter</Link>
        {student ? <Link to={`/student/concepts/${concept.id}/remediation`}>Short lesson and check</Link> : null}
      </p>
      <div className="lesson-card">
        {concept.description ? <p>{concept.description}</p> : <p>No description yet.</p>}
        <h2>Prerequisites</h2>
        {concept.prerequisiteIds.length === 0 ? <p>None in this subject yet.</p> : (
          <ul aria-label="Prerequisites">
            {concept.prerequisiteIds.filter((id) => names.has(id)).map((id) => <li key={id}>{names.get(id)}</li>)}
            {outside > 0 ? <li>{outside === 1 ? 'A concept from another chapter in this subject.' : `${outside} concepts from other chapters in this subject.`}</li> : null}
          </ul>
        )}
        <h2>Notes</h2>
        {tagged.length === 0 ? <p>{student ? 'No released note is tagged with this concept.' : 'No note is tagged with this concept.'}</p> : (
          <ul className="lesson-list" aria-label="Tagged notes">
            {tagged.map((note) => <li key={note.id}><Link to={`/${audience}/notes/${note.id}`}>{note.title}</Link></li>)}
          </ul>
        )}
      </div>
      {student ? null : (
        <form className="grid gap-4" noValidate aria-busy={form.pending} onSubmit={(event) => { void onSubmit(event); }}>
          <h2>Edit concept</h2>
          <Field id="concept-edit-title" label="Concept title" name="title" type="text" value={title} onChange={setTitle} error={form.errorFor('title')} hint={null} autoComplete="off" maxLength={160} />
          <div className="grid gap-1">
            <label htmlFor="concept-edit-description" className="font-semibold">Description</label>
            <textarea id="concept-edit-description" name="description" rows={3} value={description} onChange={(event) => { setDescription(event.target.value); }} className={`${fieldClass} min-h-24 py-2`} />
          </div>
          <fieldset className="grid gap-1">
            <legend className="font-semibold">Prerequisites in this chapter</legend>
            {concepts.data.filter((item) => item.id !== concept.id).map((item) => (
              <label key={item.id} className="lesson-check">
                <input type="checkbox" checked={prereqs.includes(item.id)} onChange={() => { setPrereqs((currentIds) => toggle(currentIds, item.id)); }} />
                {item.title}
              </label>
            ))}
          </fieldset>
          {form.formError ? <p role="alert">{form.formError}</p> : null}
          <Button type="submit" disabled={form.pending}>{form.pending ? 'Saving concept' : 'Save concept'}</Button>
        </form>
      )}
    </LessonFrame>
  );
}
