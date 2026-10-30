import { NoteSchema, PublishContentSchema, SaveNoteSchema, UploadFileSchema } from '@vidhyasaathy/contracts';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiClientError, apiFetch, postJson, putJson } from '../../api/client';
import { audienceFrom } from '../../content/audience';
import { filePayload } from '../../content/files';
import { fileSize } from '../../content/format';
import { ConceptListSchema } from '../../content/schemas';
import { usePageMeta } from '../../meta';
import { useMutation } from '../../setup/useMutation';
import { useRemote } from '../../setup/useRemote';
import { Button } from '../../ui/Button';
import { ErrorState } from '../../ui/ErrorState';
import { Field } from '../../ui/Field';
import { Skeleton } from '../../ui/Skeleton';
import { fieldClass } from '../../ui/Field';
import { AccessDenied } from '../AccessDenied';
import { DraftStart } from '../../ai/DraftReview';
import { LessonFrame } from './LessonFrame';
import { ReleaseActions } from './ReleaseActions';

function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function NotePage() {
  const { pathname } = useLocation();
  const { noteId = '' } = useParams();
  const audience = audienceFrom(pathname);
  const note = useRemote(noteId ? `/notes/${noteId}` : null, NoteSchema);
  const concepts = useRemote(note.data ? `/chapters/${note.data.chapterId}/concepts` : null, ConceptListSchema);
  const form = useMutation();
  const upload = useMutation();
  const publish = useMutation();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagged, setTagged] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState('');
  const [gate, setGate] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const student = audience === 'student';
  const current = note.data;
  usePageMeta(current ? `${current.title} — VidhyaSaathy` : 'Note — VidhyaSaathy', 'A teacher note for this chapter, including a file when one is attached.');

  useEffect(() => {
    if (!current || hydrated === current.id) return;
    setHydrated(current.id);
    setTitle(current.title);
    setBody(current.body);
    setTagged(current.conceptIds);
  }, [current, hydrated]);

  useEffect(() => {
    if (!current?.file || !current.file.contentType.startsWith('image/')) {
      setPreview(null);
      return undefined;
    }
    const controller = new AbortController();
    let url = '';
    void apiFetch(`/notes/${current.id}/file`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) return;
      url = URL.createObjectURL(await response.blob());
      setPreview(url);
    }).catch((error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    });
    return () => {
      controller.abort();
      if (url) URL.revokeObjectURL(url);
    };
  }, [current]);

  if (note.denied || concepts.denied) return <AccessDenied />;
  if (note.status === 'error' && !note.data) return <ErrorState title="Could not open this note" message={note.message ?? 'Try again.'} onRetry={note.reload} />;
  if (!current) return <LessonFrame paper kicker="Note" title="Note"><Skeleton /></LessonFrame>;
  const row = current;

  const draft = !student && current.status === 'draft';
  const names = (concepts.data ?? []).filter((concept) => current.conceptIds.includes(concept.id)).map((concept) => concept.title);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (tagged.length === 0) {
      setGate('Tag at least one concept.');
      return;
    }
    setGate(null);
    const saved = await form.submit(SaveNoteSchema, { title, body, conceptIds: tagged }, async (data) => {
      await putJson(`/notes/${row.id}`, NoteSchema, data);
    });
    if (saved) note.reload();
  }

  async function onFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const input = formElement.elements.namedItem('file');
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!file) {
      setFileError('Choose a PDF, PNG, JPEG, or text file.');
      return;
    }
    setFileError(null);
    let payload;
    try {
      payload = await filePayload(file);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'The file could not be read.');
      return;
    }
    const saved = await upload.submit(UploadFileSchema, payload, async (data) => {
      await postJson(`/notes/${row.id}/file`, NoteSchema, data);
    });
    if (!saved) return;
    formElement.reset();
    note.reload();
  }

  async function download() {
    setFileError(null);
    try {
      const response = await apiFetch(`/notes/${row.id}/file`);
      if (!response.ok) {
        setFileError('The file could not be downloaded.');
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = row.file?.filename ?? 'note';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setFileError(error instanceof ApiClientError ? error.message : 'The file could not be downloaded.');
    }
  }

  async function onPublish(releaseAt: number | null) {
    const saved = await publish.submit(PublishContentSchema, releaseAt === null ? {} : { releaseAt }, async (data) => {
      await postJson(`/notes/${row.id}/publish`, NoteSchema, data);
    });
    if (saved) note.reload();
  }

  return (
    <LessonFrame paper kicker="Note" title={current.title} script="From your teacher." stale={note}>
      <p className="lesson-actions"><Link to={`/${audience}/chapters/${current.chapterId}`}>Back to the chapter</Link></p>
      <article className="lesson-card">
        <p className="lesson-note">{current.body}</p>
        <p>{names.length ? `Concepts: ${names.join(', ')}` : 'Concepts are loading.'}</p>
        <p>Last updated {new Date(current.updatedAt).toLocaleString()}.</p>
        {current.file ? (
          <>
            <p>{current.file.filename} ({fileSize(current.file.size)})</p>
            {preview ? <img className="lesson-preview" src={preview} alt={current.file.filename} /> : null}
            <Button variant="secondary" onClick={() => { void download(); }}>Download file</Button>
          </>
        ) : <p>No file attached.</p>}
        {fileError ? <p role="alert">{fileError}</p> : null}
      </article>
      {draft && !current.file ? (
        <form className="grid gap-4" noValidate aria-busy={upload.pending} onSubmit={(event) => { void onFile(event); }}>
          <h2>Upload a file</h2>
          <div className="grid gap-1">
            <label htmlFor="note-file" className="font-semibold">File</label>
            <input id="note-file" name="file" className={fieldClass} type="file" accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain" />
          </div>
          {upload.formError ? <p role="alert">{upload.formError}</p> : null}
          <Button type="submit" disabled={upload.pending}>{upload.pending ? 'Uploading file' : 'Upload file'}</Button>
        </form>
      ) : null}
      {draft ? (
        <form className="grid gap-4" noValidate aria-busy={form.pending} onSubmit={(event) => { void save(event); }}>
          <h2>Edit note</h2>
          <Field id="note-edit-title" label="Note title" name="title" type="text" value={title} onChange={setTitle} error={form.errorFor('title')} hint={null} autoComplete="off" maxLength={160} />
          <div className="grid gap-1">
            <label htmlFor="note-edit-body" className="font-semibold">Note</label>
            <textarea id="note-edit-body" name="body" rows={8} value={body} onChange={(event) => { setBody(event.target.value); }} className={`${fieldClass} min-h-36 py-2`} />
          </div>
          <fieldset className="grid gap-1">
            <legend className="font-semibold">Concepts</legend>
            {(concepts.data ?? []).map((concept) => (
              <label key={concept.id} className="lesson-check">
                <input type="checkbox" checked={tagged.includes(concept.id)} onChange={() => { setTagged((ids) => toggle(ids, concept.id)); }} />
                {concept.title}
              </label>
            ))}
          </fieldset>
          {gate ? <p role="alert">{gate}</p> : null}
          {form.formError ? <p role="alert">{form.formError}</p> : null}
          <Button type="submit" disabled={form.pending}>{form.pending ? 'Saving note' : 'Save changes'}</Button>
        </form>
      ) : null}
      {audience === 'admin' || audience === 'teacher' ? <DraftStart noteId={current.id} audience={audience} /> : null}
      {draft ? (
        <div className="lesson-card">
          <h2>Publish</h2>
          <p>Students see this note only after it is released. A published note stays as it is.</p>
          <ReleaseActions pending={publish.pending} error={publish.formError} onPublish={(releaseAt) => { void onPublish(releaseAt); }} />
        </div>
      ) : student ? null : (
        <div className="lesson-card"><p>Published notes stay as they are. Create a new note to revise.</p></div>
      )}
    </LessonFrame>
  );
}
