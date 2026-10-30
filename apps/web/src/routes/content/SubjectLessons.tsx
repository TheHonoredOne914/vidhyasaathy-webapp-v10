import { ChapterSchema, SaveChapterSchema } from '@vidhyasaathy/contracts';
import { type FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { postJson } from '../../api/client';
import type { Audience } from '../../content/audience';
import { chapterStatusLabel } from '../../content/format';
import { ChapterListSchema } from '../../content/schemas';
import { usePageMeta } from '../../meta';
import { classLabel } from '../../setup/labels';
import { SubjectListSchema } from '../../setup/schemas';
import { useCatalog } from '../../setup/useCatalog';
import { useMutation } from '../../setup/useMutation';
import { useRemote } from '../../setup/useRemote';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Field } from '../../ui/Field';
import { Skeleton } from '../../ui/Skeleton';
import { AccessDenied } from '../AccessDenied';
import { LessonFrame } from './LessonFrame';

const description = 'Chapters in this subject, and the place to add the next chapter.';

function ChapterList({ audience, chapters }: { audience: Audience; chapters: { id: string; title: string; status: 'not_started' | 'in_progress' | 'completed' }[] }) {
  if (chapters.length === 0) {
    return (
      <div className="lesson-card">
        <EmptyState title="No chapter yet.">
          <p>{audience === 'student' ? 'Your teacher has not added a chapter here.' : 'Add the first chapter for this subject.'}</p>
        </EmptyState>
      </div>
    );
  }
  if (audience === 'student') {
    return (
      <ol className="learn-path" aria-label="Chapters">
        {chapters.map((chapter, index) => (
          <li key={chapter.id} className={chapter.status === 'completed' ? 'is-done' : chapter.status === 'in_progress' ? 'is-current' : ''}>
            <span className="learn-path-n">{index + 1}</span>
            <Link to={`/student/chapters/${chapter.id}`}>{chapter.title}</Link>
            <span className="lesson-status" data-testid="chapter-status">{chapterStatusLabel(chapter.status)}</span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ul className="lesson-list" aria-label="Chapters">
      {chapters.map((chapter) => (
        <li key={chapter.id}>
          <Link to={`/${audience}/chapters/${chapter.id}`}>{chapter.title}</Link>
        </li>
      ))}
    </ul>
  );
}

export function StudentSubject() {
  const { subjectId = '' } = useParams();
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const chapters = useRemote(subjectId ? `/subjects/${subjectId}/chapters` : null, ChapterListSchema);
  const subject = (subjects.data ?? []).find((item) => item.id === subjectId) ?? null;
  const name = subject?.name ?? 'Subject';
  usePageMeta(`${name} — VidhyaSaathy`, description);
  if (subjects.denied || chapters.denied || (subjects.data && !subject)) return <AccessDenied />;
  if ((subjects.status === 'error' && !subjects.data) || (chapters.status === 'error' && !chapters.data)) {
    return <ErrorState title="Could not load chapters" message={subjects.message ?? chapters.message ?? 'Try again.'} onRetry={() => { subjects.reload(); chapters.reload(); }} />;
  }
  if (!subjects.data || !chapters.data || !subject) return <LessonFrame kicker="Subject" title="Chapters"><Skeleton /></LessonFrame>;
  return (
    <LessonFrame paper kicker={subject.name} title="Your path" script="Open a chapter and keep going." stale={chapters}>
      <ChapterList audience="student" chapters={chapters.data} />
      <p className="lesson-actions"><Link to="/student?panel=subjects">All subjects</Link></p>
    </LessonFrame>
  );
}

export function StaffSubject({ subjectId, audience }: { subjectId: string; audience: 'admin' | 'teacher' }) {
  const catalog = useCatalog();
  const chapters = useRemote(subjectId ? `/subjects/${subjectId}/chapters` : null, ChapterListSchema);
  const form = useMutation();
  const [title, setTitle] = useState('');
  const subject = (catalog.subjects.data ?? []).find((item) => item.id === subjectId) ?? null;
  const name = subject?.name ?? 'Subject';
  usePageMeta(`${name} — VidhyaSaathy`, description);
  const home = audience === 'admin' ? '/admin/subjects' : '/teacher/subjects';

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await form.submit(SaveChapterSchema, {
      subjectId,
      title,
      position: chapters.data?.length ?? 0,
    }, async (data) => {
      await postJson('/chapters', ChapterSchema, data);
    });
    if (!saved) return;
    setTitle('');
    chapters.reload();
  }

  if (catalog.failed?.denied || chapters.denied || (catalog.subjects.data && !subject)) return <AccessDenied />;
  if (catalog.failed) return <ErrorState title="Could not load this subject" message={catalog.failed.message ?? 'Try again.'} onRetry={catalog.reload} />;
  if (chapters.status === 'error' && !chapters.data) return <ErrorState title="Could not load chapters" message={chapters.message ?? 'Try again.'} onRetry={chapters.reload} />;
  if (!subject || !chapters.data || catalog.loading) return <LessonFrame kicker="Subject" title="Chapters"><Skeleton /></LessonFrame>;

  return (
    <LessonFrame kicker={classLabel(catalog.classes.data ?? [], subject.classId)} title={subject.name} script="Notes, then a session." stale={chapters}>
      <ChapterList audience={audience} chapters={chapters.data} />
      <form className="grid gap-4" noValidate aria-busy={form.pending} onSubmit={(event) => { void onSubmit(event); }}>
        <h2>Add a chapter</h2>
        <Field id="chapter-title" label="Chapter title" name="title" type="text" value={title} onChange={setTitle} error={form.errorFor('title')} hint={null} autoComplete="off" maxLength={160} />
        {form.formError ? <p role="alert">{form.formError}</p> : null}
        <Button type="submit" disabled={form.pending}>{form.pending ? 'Adding chapter' : 'Add chapter'}</Button>
      </form>
      <p className="lesson-actions"><Link to={home}>All subjects</Link></p>
    </LessonFrame>
  );
}

export function TeacherSubjectPage() {
  const { subjectId = '' } = useParams();
  return <StaffSubject subjectId={subjectId} audience="teacher" />;
}
