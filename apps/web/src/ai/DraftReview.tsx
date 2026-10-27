import { CreateDraftJobSchema, DraftJobSchema, ReviewDraftJobSchema, type AiDraft } from '@vidhyasaathy/contracts';
import { type FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { postJson } from '../api/client';
import { audienceFrom } from '../content/audience';
import { dueMillis } from '../assessment/present';
import { usePageMeta } from '../meta';
import { classLabel } from '../setup/labels';
import { useCatalog } from '../setup/useCatalog';
import { useMutation } from '../setup/useMutation';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { ErrorState } from '../ui/ErrorState';
import { fieldClass } from '../ui/Field';
import { SelectField } from '../ui/SelectField';
import { Skeleton } from '../ui/Skeleton';
import { AccessDenied } from '../routes/AccessDenied';
import { LessonFrame } from '../routes/content/LessonFrame';

function statusText(status: string, message: string | null): string {
  if (status === 'not_configured' || message === 'AI not configured') return 'AI not configured';
  if (status === 'queued' || status === 'running') return 'Drafting from this note.';
  if (status === 'ready') return 'Ready for your review. Students cannot see it yet.';
  if (status === 'approved') return 'Saved as a draft session and quiz. Students do not see them until you publish.';
  if (status === 'rejected') return 'Rejected. Students never see this draft.';
  return message ?? 'A grounded draft could not be created.';
}

export function DraftStart({ noteId, audience }: { noteId: string; audience: 'admin' | 'teacher' }) {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const form = useMutation();
  const [sectionId, setSectionId] = useState('');
  const [gate, setGate] = useState<string | null>(null);
  const sections = (catalog.sections.data ?? []).map((section) => ({
    value: section.id,
    label: `${classLabel(catalog.classes.data ?? [], section.classId)} section ${section.name}`,
  }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sectionId) {
      setGate('Choose a section.');
      return;
    }
    setGate(null);
    await form.submit(CreateDraftJobSchema, { noteId, sectionId }, async (data) => {
      const job = await postJson('/ai/draft-jobs', DraftJobSchema, data);
      void navigate(`/${audience}/ai/drafts/${job.id}`);
    });
  }

  return (
    <form className="lesson-card grid gap-4" noValidate onSubmit={(event) => { void onSubmit(event); }}>
      <h2>Draft a session and quiz</h2>
      <p>Saathy drafts from this note. Nothing reaches students until you approve it and then publish the session and the quiz.</p>
      <SelectField id="draft-section" label="Section" name="sectionId" value={sectionId} onChange={setSectionId} error={null} placeholder="Choose a section" options={sections} />
      {gate ? <p role="alert">{gate}</p> : null}
      {form.formError ? <p role="alert">{form.formError}</p> : null}
      <Button type="submit" disabled={form.pending || catalog.loading}>{form.pending ? 'Starting draft' : 'Draft a session and quiz'}</Button>
    </form>
  );
}

export function DraftReviewPage() {
  const { pathname } = useLocation();
  const { jobId = '' } = useParams();
  const audience = audienceFrom(pathname);
  const job = useRemote(jobId ? `/ai/draft-jobs/${jobId}` : null, DraftJobSchema);
  const review = useMutation();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [hydrated, setHydrated] = useState('');
  const [waitError, setWaitError] = useState<string | null>(null);
  const [dueGate, setDueGate] = useState<string | null>(null);
  const status = job.data?.status;
  usePageMeta('Draft review — VidhyaSaathy', 'Approve or reject a session and quiz drafted from a note. Students see them only after you publish.');

  useEffect(() => {
    if (!job.data?.draft || hydrated === job.data.id) return;
    setHydrated(job.data.id);
    setTitle(job.data.draft.title);
  }, [hydrated, job.data]);

  useEffect(() => {
    if (status !== 'queued' && status !== 'running') return undefined;
    const started = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - started > 20000) {
        setWaitError('The draft is still waiting. Refresh this page.');
        window.clearInterval(timer);
        return;
      }
      job.reload();
    }, 1000);
    return () => { window.clearInterval(timer); };
  }, [job.reload, status]);

  if (audience === 'student' || job.denied) return <AccessDenied />;
  if (job.status === 'error' && !job.data) return <ErrorState title="Could not load this draft" message={job.message ?? 'Try again.'} onRetry={job.reload} />;
  if (!job.data) return <LessonFrame kicker="Draft" title="Draft"><Skeleton /></LessonFrame>;

  const current = job.data;
  const draft: AiDraft | null = current.draft;

  async function decide(decision: 'approve' | 'reject') {
    if (!draft) return;
    if (decision === 'reject') {
      const saved = await review.submit(ReviewDraftJobSchema, { decision: 'reject' }, async (data) => {
        await postJson(`/ai/draft-jobs/${current.id}/review`, DraftJobSchema, data);
      });
      if (saved) job.reload();
      return;
    }
    const dueAt = dueMillis(due);
    if (dueAt === null) {
      setDueGate('Choose a due time before approving.');
      return;
    }
    setDueGate(null);
    const saved = await review.submit(ReviewDraftJobSchema, { decision: 'approve', draft: { ...draft, title }, dueAt }, async (data) => {
      await postJson(`/ai/draft-jobs/${current.id}/review`, DraftJobSchema, data);
    });
    if (saved) job.reload();
  }

  return (
    <LessonFrame kicker="Draft" title={draft?.title ?? 'Draft from a note'} script="Students do not see this until you publish it.">
      <p className="lesson-actions"><Link to={`/${audience}/notes/${current.noteId}`}>Back to the note</Link></p>
      <p data-testid="draft-status">{statusText(current.status, current.message)}</p>
      {waitError ? <p role="alert">{waitError}</p> : null}
      {current.status === 'approved' && current.sessionId && current.assignmentId ? (
        <p className="lesson-actions">
          <Link to={`/${audience}/sessions/${current.sessionId}`}>Open the draft session</Link>
          <Link to={`/${audience}/assignments/${current.assignmentId}`}>Open the draft quiz</Link>
        </p>
      ) : null}
      {current.status === 'ready' && draft ? (
        <form className="lesson-card grid gap-4" onSubmit={(event) => { event.preventDefault(); void decide('approve'); }}>
          <div className="grid gap-1">
            <label htmlFor="draft-title" className="font-semibold">Title</label>
            <input id="draft-title" className={fieldClass} value={title} maxLength={160} onChange={(event) => { setTitle(event.target.value); }} />
          </div>
          <div className="grid gap-1">
            <label htmlFor="draft-due" className="font-semibold">Quiz due</label>
            <input id="draft-due" className={fieldClass} type="datetime-local" value={due} onChange={(event) => { setDue(event.target.value); }} />
          </div>
          <h2>Slides</h2>
          <ul className="lesson-list" aria-label="Draft slides">
            {draft.slides.map((slide) => <li key={`${slide.conceptId}-${slide.title}`}>{slide.title}</li>)}
          </ul>
          <h2>Questions</h2>
          <ul className="lesson-list" aria-label="Draft questions">
            {draft.check.map((item) => <li key={item.prompt}>{item.prompt}</li>)}
          </ul>
          {dueGate ? <p role="alert">{dueGate}</p> : null}
          {review.formError ? <p role="alert">{review.formError}</p> : null}
          <div className="lesson-actions">
            <Button type="submit" disabled={review.pending}>{review.pending ? 'Saving review' : 'Approve draft'}</Button>
            <Button variant="secondary" disabled={review.pending} onClick={() => { void decide('reject'); }}>Reject draft</Button>
          </div>
        </form>
      ) : null}
    </LessonFrame>
  );
}
