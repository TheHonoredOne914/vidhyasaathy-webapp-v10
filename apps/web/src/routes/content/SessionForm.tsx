import { ChapterSchema, LearningSessionSchema, PublishContentSchema, SaveLearningSessionSchema, type LearningSession } from '@vidhyasaathy/contracts';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { postJson, putJson } from '../../api/client';
import { audienceFrom } from '../../content/audience';
import { contentStateLabel } from '../../content/format';
import { ConceptListSchema, NoteListSchema } from '../../content/schemas';
import { usePageMeta } from '../../meta';
import { classLabel } from '../../setup/labels';
import { useCatalog } from '../../setup/useCatalog';
import { useMutation } from '../../setup/useMutation';
import { useRemote } from '../../setup/useRemote';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/ErrorState';
import { Field } from '../../ui/Field';
import { SelectField } from '../../ui/SelectField';
import { Skeleton } from '../../ui/Skeleton';
import { fieldClass } from '../../ui/Field';
import { AccessDenied } from '../AccessDenied';
import { LessonFrame } from './LessonFrame';
import { ReleaseActions } from './ReleaseActions';

type SlideDraft = { key: string; conceptId: string; title: string; body: string; noteId: string };
type CheckDraft = { key: string; conceptId: string; prompt: string; optionA: string; optionB: string; answer: string; noteId: string };

function blankSlide(): SlideDraft {
  return { key: crypto.randomUUID(), conceptId: '', title: '', body: '', noteId: '' };
}

function blankCheck(): CheckDraft {
  return { key: crypto.randomUUID(), conceptId: '', prompt: '', optionA: '', optionB: '', answer: '', noteId: '' };
}

function authoredMcq(item: LearningSession['check'][number]): item is LearningSession['check'][number] & {
  content: { type: 'mcq'; conceptId: string; prompt: string; options: string[]; answer: string; sourceRef: { noteId: string } | null };
} {
  return 'content' in item && item.content.type === 'mcq';
}

export function SessionFormPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const audience = audienceFrom(pathname);
  const sessionId = params.sessionId;
  const session = useRemote(sessionId ? `/sessions/${sessionId}` : null, LearningSessionSchema);
  const chapterId = session.data?.chapterId ?? params.chapterId ?? '';
  const chapter = useRemote(chapterId ? `/chapters/${chapterId}` : null, ChapterSchema);
  const chapterConcepts = useRemote(chapterId ? `/chapters/${chapterId}/concepts` : null, ConceptListSchema);
  const chapterNotes = useRemote(chapterId ? `/chapters/${chapterId}/notes` : null, NoteListSchema);
  const catalog = useCatalog();
  const form = useMutation();
  const publish = useMutation();
  const [title, setTitle] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [slides, setSlides] = useState<SlideDraft[]>([blankSlide()]);
  const [check, setCheck] = useState<CheckDraft>(blankCheck());
  const [gate, setGate] = useState<string | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  usePageMeta(title ? `${title} — VidhyaSaathy` : 'Session — VidhyaSaathy', 'Slides that open one at a time, then a check the student submits at the end.');

  useEffect(() => {
    if (!session.data || hydrated) return;
    const row = session.data;
    setHydrated(true);
    setTitle(row.title);
    setSectionId(row.sectionId);
    setSlides(row.slides.map((slide) => ({
      key: slide.id, conceptId: slide.conceptId, title: slide.title, body: slide.body, noteId: slide.noteId ?? '',
    })));
    const item = row.check[0];
    if (row.check.length === 1 && item && authoredMcq(item) && item.content.options.length === 2) {
      setCheck({
        key: item.id,
        conceptId: item.content.conceptId,
        prompt: item.content.prompt,
        optionA: item.content.options[0] ?? '',
        optionB: item.content.options[1] ?? '',
        answer: item.content.answer,
        noteId: item.content.sourceRef?.noteId ?? '',
      });
    } else {
      setLocked('This session’s check cannot be edited on this page.');
    }
  }, [hydrated, session.data]);

  if (session.denied || chapter.denied || chapterConcepts.denied || chapterNotes.denied || catalog.failed?.denied) return <AccessDenied />;
  if (catalog.failed) return <ErrorState title="Could not load sections" message={catalog.failed.message ?? 'Try again.'} onRetry={catalog.reload} />;
  if ((sessionId && session.status === 'error' && !session.data) || (chapter.status === 'error' && !chapter.data) || (chapterConcepts.status === 'error' && !chapterConcepts.data) || (chapterNotes.status === 'error' && !chapterNotes.data)) {
    return <ErrorState title="Could not open this session" message={session.message ?? chapter.message ?? 'Try again.'} onRetry={() => { session.reload(); chapter.reload(); chapterConcepts.reload(); chapterNotes.reload(); }} />;
  }
  const chapterRow = chapter.data;
  const conceptRows = chapterConcepts.data;
  const noteRows = chapterNotes.data;
  if ((sessionId && !session.data) || !chapterRow || !conceptRows || !noteRows || catalog.loading || !chapterId) {
    return <LessonFrame kicker="Session" title="Session"><Skeleton /></LessonFrame>;
  }

  const concepts = conceptRows;
  const notes = noteRows;
  const savedSession = session.data;
  const published = savedSession?.status === 'published';
  const subject = (catalog.subjects.data ?? []).find((item) => item.id === chapterRow.subjectId);
  const sectionOptions = (catalog.sections.data ?? []).filter((section) => !subject || section.classId === subject.classId)
    .map((section) => ({ value: section.id, label: `${classLabel(catalog.classes.data ?? [], section.classId)} section ${section.name}` }));

  const back = chapterId ? `/${audience}/chapters/${chapterId}` : `/${audience}/subjects`;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problem = !sectionId ? 'Choose a section.'
      : !title.trim() ? 'Enter a session title.'
        : slides.some((slide) => !slide.conceptId || !slide.title.trim() || !slide.body.trim()) ? 'Add a concept, title, and text on every slide.'
          : !check.conceptId || !check.prompt.trim() ? 'Add a concept and a question for the check.'
            : !check.optionA.trim() || !check.optionB.trim() || check.optionA.trim() === check.optionB.trim() ? 'Use two different options.'
              : check.answer !== check.optionA && check.answer !== check.optionB ? 'Choose the correct option.'
                : null;
    setGate(problem);
    if (problem) return;
    const source = notes.find((note) => note.id === check.noteId);
    const payload = {
      sectionId,
      title,
      slides: slides.map((slide) => ({ conceptId: slide.conceptId, title: slide.title, body: slide.body, noteId: slide.noteId || null })),
      check: [{
        type: 'mcq' as const,
        conceptId: check.conceptId,
        prompt: check.prompt,
        difficulty: 1,
        sourceRef: source ? { noteId: source.id, locator: source.title } : null,
        options: [check.optionA, check.optionB],
        answer: check.answer,
      }],
    };
    const saved = await form.submit(SaveLearningSessionSchema, payload, async (data) => {
      if (savedSession) {
        await putJson(`/sessions/${savedSession.id}`, LearningSessionSchema, data);
        return;
      }
      const created = await postJson(`/chapters/${chapterId}/sessions`, LearningSessionSchema, data);
      navigate(`/${audience}/sessions/${created.id}`, { replace: true });
    });
    if (saved && savedSession) session.reload();
  }

  async function onPublish(releaseAt: number | null) {
    if (!savedSession) return;
    const saved = await publish.submit(PublishContentSchema, releaseAt === null ? {} : { releaseAt }, async (data) => {
      await postJson(`/sessions/${savedSession.id}/publish`, LearningSessionSchema, data);
    });
    if (saved) session.reload();
  }

  const conceptOptions = concepts.map((concept) => ({ value: concept.id, label: concept.title }));
  const noteOptions = notes.map((note) => ({ value: note.id, label: note.title }));

  return (
    <LessonFrame kicker="Session" title={session.data?.title ?? 'New session'} script="One idea per slide." stale={sessionId ? session : null}>
      <p className="lesson-actions"><Link to={back}>Back to the chapter</Link></p>
      {published || locked ? (
        <div className="lesson-card">
          <p>{locked ?? 'Published sessions stay as they are. Create a new session to revise.'}</p>
          {savedSession ? <p>{contentStateLabel(savedSession.status, savedSession.releaseAt)}</p> : null}
          {savedSession?.slides.map((slide) => (
            <section key={slide.id}>
              <h2>{slide.title}</h2>
              <p className="lesson-note">{slide.body}</p>
            </section>
          ))}
        </div>
      ) : (
        <form className="grid gap-4" noValidate aria-busy={form.pending} onSubmit={(event) => { void save(event); }}>
          <Field id="session-title" label="Session title" name="title" type="text" value={title} onChange={setTitle} error={form.errorFor('title')} hint={null} autoComplete="off" maxLength={160} />
          <SelectField id="session-section" label="Section" name="sectionId" value={sectionId} onChange={setSectionId} error={form.errorFor('sectionId')} placeholder="Choose a section" options={sectionOptions} />
          {slides.map((slide, index) => (
            <fieldset key={slide.key} className="grid gap-4">
              <legend className="font-semibold">Slide {index + 1}</legend>
              <SelectField id={`slide-concept-${slide.key}`} label="Concept" name="conceptId" value={slide.conceptId} onChange={(value) => { setSlides((rows) => rows.map((row) => row.key === slide.key ? { ...row, conceptId: value } : row)); }} error={null} placeholder="Choose a concept" options={conceptOptions} />
              <Field id={`slide-title-${slide.key}`} label="Title" name="title" type="text" value={slide.title} onChange={(value) => { setSlides((rows) => rows.map((row) => row.key === slide.key ? { ...row, title: value } : row)); }} error={null} hint={null} autoComplete="off" maxLength={160} />
              <div className="grid gap-1">
                <label htmlFor={`slide-body-${slide.key}`} className="font-semibold">Text</label>
                <textarea id={`slide-body-${slide.key}`} rows={4} value={slide.body} onChange={(event) => { setSlides((rows) => rows.map((row) => row.key === slide.key ? { ...row, body: event.target.value } : row)); }} className={`${fieldClass} min-h-24 py-2`} />
              </div>
              <SelectField id={`slide-note-${slide.key}`} label="Note" name="noteId" value={slide.noteId} onChange={(value) => { setSlides((rows) => rows.map((row) => row.key === slide.key ? { ...row, noteId: value } : row)); }} error={null} placeholder="No note" options={noteOptions} />
              {slides.length > 1 ? <Button variant="secondary" aria-label={`Remove slide ${index + 1}`} onClick={() => { setSlides((rows) => rows.filter((row) => row.key !== slide.key)); }}>Remove</Button> : null}
            </fieldset>
          ))}
          <Button variant="secondary" onClick={() => { setSlides((rows) => [...rows, blankSlide()]); }}>Add slide</Button>
          <fieldset className="grid gap-4">
            <legend className="font-semibold">Check</legend>
            <SelectField id="check-concept" label="Concept" name="conceptId" value={check.conceptId} onChange={(value) => { setCheck((row) => ({ ...row, conceptId: value })); }} error={null} placeholder="Choose a concept" options={conceptOptions} />
            <Field id="check-prompt" label="Question" name="prompt" type="text" value={check.prompt} onChange={(value) => { setCheck((row) => ({ ...row, prompt: value })); }} error={null} hint={null} autoComplete="off" maxLength={160} />
            <Field id="check-a" label="Option 1" name="optionA" type="text" value={check.optionA} onChange={(value) => { setCheck((row) => ({ ...row, optionA: value, answer: row.answer === row.optionA ? value : row.answer })); }} error={null} hint={null} autoComplete="off" maxLength={1000} />
            <Field id="check-b" label="Option 2" name="optionB" type="text" value={check.optionB} onChange={(value) => { setCheck((row) => ({ ...row, optionB: value, answer: row.answer === row.optionB ? value : row.answer })); }} error={null} hint={null} autoComplete="off" maxLength={1000} />
            <SelectField id="check-answer" label="Correct answer" name="answer" value={check.answer} onChange={(value) => { setCheck((row) => ({ ...row, answer: value })); }} error={null} placeholder="Choose the correct option" options={[check.optionA, check.optionB].filter(Boolean).map((option) => ({ value: option, label: option }))} />
            <SelectField id="check-note" label="Source note" name="noteId" value={check.noteId} onChange={(value) => { setCheck((row) => ({ ...row, noteId: value })); }} error={null} placeholder="No source note" options={noteOptions} />
          </fieldset>
          {gate ? <p role="alert">{gate}</p> : null}
          {form.formError ? <p role="alert">{form.formError}</p> : null}
          <Button type="submit" disabled={form.pending}>{form.pending ? 'Saving session' : 'Save session'}</Button>
        </form>
      )}
      {savedSession && savedSession.status === 'draft' ? (
        <div className="lesson-card">
          <h2>Publish</h2>
          <p>Students in the section can open the session only after its release. Referenced notes must already be released.</p>
          <ReleaseActions pending={publish.pending} error={publish.formError} onPublish={(releaseAt) => { void onPublish(releaseAt); }} />
        </div>
      ) : null}
    </LessonFrame>
  );
}
