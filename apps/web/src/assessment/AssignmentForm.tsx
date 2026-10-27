import { AssignmentDetailSchema, ChapterSchema, PublishAssignmentSchema, SaveAssignmentSchema } from '@vidhyasaathy/contracts';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { postJson, putJson } from '../api/client';
import { audienceFrom } from '../content/audience';
import { contentStateLabel } from '../content/format';
import { usePageMeta } from '../meta';
import { classLabel } from '../setup/labels';
import { useCatalog } from '../setup/useCatalog';
import { useMutation } from '../setup/useMutation';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { Field, fieldClass } from '../ui/Field';
import { SelectField } from '../ui/SelectField';
import { Skeleton } from '../ui/Skeleton';
import { AccessDenied } from '../routes/AccessDenied';
import { LessonFrame } from '../routes/content/LessonFrame';
import { BankListSchema, type AssignmentDetail } from './schemas';
import { dueInput, dueMillis, formatDue, questionView } from './present';

export function AssignmentFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const audience = audienceFrom(pathname);
  const assignmentId = params.assignmentId;
  const existing = useRemote(assignmentId ? `/assignments/${assignmentId}` : null, AssignmentDetailSchema);
  const chapterId = existing.data?.chapterId ?? params.chapterId ?? '';
  const chapter = useRemote(chapterId ? `/chapters/${chapterId}` : null, ChapterSchema);
  const bank = useRemote(chapterId ? `/chapters/${chapterId}/items` : null, BankListSchema);
  const catalog = useCatalog();
  const form = useMutation();
  const publish = useMutation();
  const [title, setTitle] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [kind, setKind] = useState<'homework' | 'quiz'>('homework');
  const [due, setDue] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [gate, setGate] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  usePageMeta(title ? `${title} — VidhyaSaathy` : 'Assignment — VidhyaSaathy', 'Choose bank questions, a section, and a due date for homework or a quiz.');

  useEffect(() => {
    if (!existing.data || hydrated) return;
    setHydrated(true);
    setTitle(existing.data.title);
    setSectionId(existing.data.sectionId);
    setKind(existing.data.kind);
    setDue(dueInput(existing.data.dueAt));
    setPicked(existing.data.itemIds);
  }, [existing.data, hydrated]);

  const denied = existing.denied || chapter.denied || bank.denied;
  if (denied) return <AccessDenied />;
  const failed = [existing, chapter, bank].find((part) => part.status === 'error' && !part.data);
  if (failed || (catalog.failed && !catalog.sections.data)) {
    return <ErrorState title="Could not load this assignment" message={failed?.message ?? catalog.failed?.message ?? 'Try again.'} onRetry={() => { existing.reload(); chapter.reload(); bank.reload(); catalog.reload(); }} />;
  }
  if (!chapter.data || !bank.data || (assignmentId && !existing.data) || catalog.loading) {
    return <LessonFrame kicker="Assignment" title="Assignment"><Skeleton /></LessonFrame>;
  }

  const detail: AssignmentDetail | null = existing.data;
  const published = detail?.status === 'published';
  const subject = (catalog.subjects.data ?? []).find((item) => item.id === chapter.data?.subjectId);
  const sectionOptions = (catalog.sections.data ?? []).filter((section) => !subject || section.classId === subject.classId)
    .map((section) => ({ value: section.id, label: `${classLabel(catalog.classes.data ?? [], section.classId)} section ${section.name}` }));

  function toggle(id: string) {
    setPicked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const dueAt = dueMillis(due);
    if (!sectionId) {
      setGate('Choose a section.');
      return;
    }
    if (dueAt === null) {
      setGate('Enter a due date.');
      return;
    }
    if (picked.length === 0) {
      setGate('Choose at least one question.');
      return;
    }
    setGate(null);
    let createdId = '';
    const saved = await form.submit(SaveAssignmentSchema, {
      sectionId, title, kind, dueAt, itemIds: picked,
    }, async (data) => {
      if (assignmentId) {
        await putJson(`/assignments/${assignmentId}`, AssignmentDetailSchema, data);
        return;
      }
      const created = await postJson(`/chapters/${chapterId}/assignments`, AssignmentDetailSchema, data);
      createdId = created.id;
    });
    if (!saved) return;
    if (createdId) navigate(`/${audience}/assignments/${createdId}`);
    else existing.reload();
  }

  async function publishNow() {
    if (!assignmentId) return;
    const saved = await publish.submit(PublishAssignmentSchema, {}, async () => {
      await postJson(`/assignments/${assignmentId}/publish`, AssignmentDetailSchema, {});
    });
    if (saved) existing.reload();
  }

  return (
    <LessonFrame kicker={kind === 'quiz' ? 'Quiz' : 'Homework'} title={detail?.title ?? 'New assignment'} script="Pick questions from the bank." stale={existing.data ? existing : chapter}>
      <p className="lesson-actions"><Link to={`/${audience}/chapters/${chapterId}`}>Back to the chapter</Link></p>
      {published && detail ? (
        <div className="lesson-card">
          <h2>{contentStateLabel(detail.status, null)}</h2>
          <p>Due {formatDue(detail.dueAt)}. {detail.teacherName}.</p>
          <ul className="lesson-list" aria-label="Questions">
            {detail.items.map((item) => {
              const view = questionView(item);
              return <li key={view.id}>{view.prompt}{view.answer ? <span className="lesson-status"> Answer: {view.answer}</span> : null}</li>;
            })}
          </ul>
        </div>
      ) : (
        <form className="grid gap-4" noValidate aria-busy={form.pending} onSubmit={(event) => { void save(event); }}>
          <Field id="assignment-title" label="Assignment title" name="title" type="text" value={title} onChange={setTitle} error={form.errorFor('title')} hint={null} autoComplete="off" maxLength={160} />
          <SelectField id="assignment-section" label="Section" name="sectionId" value={sectionId} onChange={setSectionId} error={form.errorFor('sectionId')} placeholder="Choose a section" options={sectionOptions} />
          <fieldset className="grid gap-1">
            <legend className="font-semibold">Kind</legend>
            <label className="lesson-check"><input type="radio" name="kind" checked={kind === 'homework'} onChange={() => { setKind('homework'); }} /> Homework</label>
            <label className="lesson-check"><input type="radio" name="kind" checked={kind === 'quiz'} onChange={() => { setKind('quiz'); }} /> Quiz</label>
          </fieldset>
          <div className="grid gap-1">
            <label htmlFor="assignment-due" className="font-semibold">Due</label>
            <input id="assignment-due" className={fieldClass} type="datetime-local" value={due} onChange={(event) => { setDue(event.target.value); }} />
          </div>
          <fieldset className="grid gap-1">
            <legend className="font-semibold">Questions</legend>
            {bank.data.length === 0 ? <p>Add a question in the bank before you assign it.</p> : bank.data.map((item) => (
              <label key={item.id} className="lesson-check">
                <input type="checkbox" checked={picked.includes(item.id)} onChange={() => { toggle(item.id); }} />
                {item.content.prompt}
              </label>
            ))}
          </fieldset>
          {gate ? <p role="alert">{gate}</p> : null}
          {form.formError ? <p role="alert">{form.formError}</p> : null}
          <Button type="submit" disabled={form.pending}>{form.pending ? 'Saving assignment' : 'Save assignment'}</Button>
        </form>
      )}
      {detail && detail.status === 'draft' ? (
        <div className="lesson-card">
          <h2>Publish</h2>
          <p>Students in the section can open this after you publish it.</p>
          {publish.formError ? <p role="alert">{publish.formError}</p> : null}
          <Button disabled={publish.pending} onClick={() => { void publishNow(); }}>{publish.pending ? 'Publishing' : 'Publish now'}</Button>
        </div>
      ) : null}
    </LessonFrame>
  );
}
