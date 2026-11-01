import { AssignmentDetailSchema, SaveHomeworkDraftSchema, HomeworkDraftSavedSchema, type Answer } from '@vidhyasaathy/contracts';
import { useEffect, useRef, useState } from 'react';
import { putJson } from '../../../../api/client';
import { useAttemptSync } from '../../../../assessment/AttemptSync';
import { questionView, studentScore, type QuestionView } from '../../../../assessment/present';
import { AttemptListSchema } from '../../../../assessment/schemas';
import { useRemote } from '../../../../setup/useRemote';
import { Icon } from '../../icons';
import { Saathy } from '../../Saathy';
import { Chip } from '../../ui';
import { NotebookState } from './NotebookState';
import { QuizStrip, type QuizStep } from './QuizStrip';
import '../../pages/homework.css';

const HomeworkDraftListSchema = SaveHomeworkDraftSchema.extend({ updatedAt: HomeworkDraftSavedSchema.shape.updatedAt }).array();

export function dueChip(dueAt: number) {
  const date = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(dueAt));
  const sameDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
  if (dueAt < Date.now()) return { text: `Overdue · was due ${date}`, tone: 'red' as const };
  return { text: sameDay.format(dueAt) === sameDay.format(Date.now()) ? 'Today' : `Due ${date}`, tone: 'orange' as const };
}

export function worksheetAnswer(view: QuestionView, draft: string, matches: string[]): Answer | null {
  if (view.kind === 'match_pairs') return matches.length === view.left.length && view.left.every((_, index) => Boolean(matches[index])) && new Set(matches).size === matches.length ? matches : null;
  return draft.trim() || null;
}

export function Worksheet({ assignmentId, subject }: { assignmentId: string; subject?: string }) {
  const assignment = useRemote(assignmentId ? `/assignments/${assignmentId}` : null, AssignmentDetailSchema);
  const attempts = useRemote(assignmentId ? `/assignments/${assignmentId}/attempts` : null, AttemptListSchema);
  const storedDrafts = useRemote(assignmentId ? `/student/homework/${assignmentId}/draft` : null, HomeworkDraftListSchema);
  const sync = useAttemptSync();
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Record<string, string[]>>({});
  const [working, setWorking] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const started = useRef(Date.now());
  useEffect(() => {
    setIndex(0); setDrafts({}); setMatches({}); setWorking({}); setSaved({}); setNotice('');
  }, [assignmentId]);
  useEffect(() => {
    if (!storedDrafts.data) return;
    const strings: Record<string, string> = {};
    const pairs: Record<string, string[]> = {};
    const times: Record<string, number> = {};
    for (const draft of storedDrafts.data) {
      if (typeof draft.answer === 'string') strings[draft.itemId] = draft.answer;
      else if (Array.isArray(draft.answer)) pairs[draft.itemId] = draft.answer;
      times[draft.itemId] = draft.updatedAt;
    }
    setDrafts((current) => ({ ...strings, ...current }));
    setMatches((current) => ({ ...pairs, ...current }));
    setSaved((current) => ({ ...times, ...current }));
  }, [storedDrafts.data]);
  useEffect(() => { started.current = Date.now(); setNotice(''); }, [index]);
  useEffect(() => {
    if (!sync.revision) return;
    assignment.reload(); attempts.reload();
  }, [assignment.reload, attempts.reload, sync.revision]);
  const retry = () => { assignment.reload(); attempts.reload(); storedDrafts.reload(); };
  if (!assignmentId || assignment.denied || attempts.denied || storedDrafts.denied) return <NotebookState title="Worksheet" message="This worksheet is not available. Ask your teacher to check your access." />;
  if (assignment.status === 'error' || attempts.status === 'error' || storedDrafts.status === 'error') return <NotebookState title="Worksheet" message="Could not open this worksheet. Your saved answers are safe." retry={retry} />;
  if (!assignment.data || !attempts.data || !storedDrafts.data) return <NotebookState title="Worksheet" loading />;
  const detail = assignment.data;
  const views = detail.items.map(questionView);
  const view = views[index];
  const byItem = new Map(attempts.data.map((row) => [row.itemId, row]));
  const attempt = view ? byItem.get(view.id) : undefined;
  const queued = view ? sync.queuedAnswerKeys.includes(`${detail.id}/${view.id}`) : false;
  const locked = !!attempt || queued;
  const due = dueChip(detail.dueAt);
  const steps: QuizStep[] = views.map((row, i) => byItem.get(row.id)?.correct === true ? 'right' : byItem.get(row.id)?.correct === false ? 'wrong' : i === index ? 'current' : 'todo');

  async function save(submit: boolean) {
    if (!view) return;
    const answer = worksheetAnswer(view, drafts[view.id] ?? '', matches[view.id] ?? []);
    if (!answer) { setNotice(view.kind === 'match_pairs' ? 'Match each one to a different value.' : 'Write or choose your answer first.'); return; }
    setBusy(true); setNotice('');
    try {
      if (submit) {
        await sync.queue({ clientEventId: crypto.randomUUID(), assignmentId, itemId: view.id, answer, timeMs: Math.min(86_400_000, Math.max(0, Date.now() - started.current)), clientTs: Date.now() });
        attempts.reload(); assignment.reload();
        setNotice('Answer saved. It will be sent when you are online.');
      } else {
        const result = await putJson(`/student/homework/${assignmentId}/draft`, HomeworkDraftSavedSchema, { itemId: view.id, answer });
        setSaved((current) => ({ ...current, [view.id]: result.updatedAt }));
      }
    } catch { setNotice(submit ? 'Could not save this answer on this device. Try again.' : 'Could not save your draft. Your writing is still here; try again.'); }
    finally { setBusy(false); }
  }

  return <section className="nb-card ws">
    <span className="nb-tape" />
    <div className="ws-head"><div><Chip tone={due.tone}>{due.text}</Chip><h2>{detail.title}</h2><div className="nb-meta">{subject ? `${subject} · ` : ''}{detail.teacherName}{view ? ` · question ${index + 1} of ${views.length}` : ''}</div></div><div className="nb-saathy-tip"><Saathy mood="think" size="3.2rem" /><div className="nb-text">Hints only here. Your teacher wants your own working.</div></div></div>
    <p className="nb-meta" data-testid="assignment-score">{studentScore(detail.score)}</p>
    {view ? <>
      <QuizStrip steps={steps} />
      <fieldset className="wq" disabled={locked || busy}><legend className="q"><b>Q{index + 1}.</b> {view.prompt}</legend>
        {view.kind === 'mcq' ? <div className="ws-options">{view.options.map((option, i) => <label className={`ws-option${(drafts[view.id] ?? attempt?.answer) === option ? ' is-selected' : ''}`} key={option}><input type="radio" name={`answer-${assignmentId}-${view.id}`} checked={(drafts[view.id] ?? attempt?.answer) === option} onChange={() => setDrafts((current) => ({ ...current, [view.id]: option }))} /><span className="nb-opt__key">{String.fromCharCode(97 + i)}</span><span>{option}</span></label>)}</div> : null}
        {view.kind === 'match_pairs' ? view.left.map((left, i) => <label className="ws-match" key={left}>{left}<select value={matches[view.id]?.[i] ?? (Array.isArray(attempt?.answer) ? attempt.answer[i] : '') ?? ''} onChange={(event) => { const next = [...(matches[view.id] ?? view.left.map(() => ''))]; next[i] = event.target.value; setMatches((current) => ({ ...current, [view.id]: next })); }}><option value="">Choose a match</option>{view.right.map((right) => <option key={right}>{right}</option>)}</select></label>) : null}
        {view.kind === 'short_answer' || view.kind === 'flashcard' ? <label className="ws-writing">Your answer<textarea className="ans" maxLength={1000} placeholder="Write your working here…" value={drafts[view.id] ?? (typeof attempt?.answer === 'string' ? attempt.answer : '')} onChange={(event) => setDrafts((current) => ({ ...current, [view.id]: event.target.value }))} /></label> : <label className="ws-writing">Your working <span className="nb-meta">(kept on this page only)</span><textarea className="ans" maxLength={1000} value={working[view.id] ?? ''} placeholder="Write your working here…" onChange={(event) => setWorking((current) => ({ ...current, [view.id]: event.target.value }))} /></label>}
      </fieldset>
      {attempt ? <p className="nb-note" role="status">{attempt.needsReview || attempt.correct == null ? 'Waiting for your teacher.' : attempt.correct ? 'That is the one.' : "Let's fix this. Ask your teacher to look at your working."}</p> : queued ? <p className="nb-note" role="status">Saved on this device. Waiting to send.</p> : null}
      <div className="ws-actions"><button className="nb-btn nb-btn--quiet" disabled title="Photo attachments are not available yet."><svg className="i" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7l2-3h4l2 3" /><circle cx="12" cy="13" r="3.5" /></svg>Add a photo of my working</button><span className="nb-meta">Photos are not available here yet.</span></div>
      {!locked ? <div className="ws-actions"><button className="nb-btn nb-btn--quiet" disabled={busy} onClick={() => { void save(false); }}>Save draft</button><button className="nb-btn nb-btn--primary" disabled={busy} onClick={() => { void save(true); }}>{busy ? 'Saving…' : 'Submit answer'}</button></div> : null}
      {notice ? <p className="nb-note" role="status">{notice}</p> : null}
      {sync.notice ? <p className="nb-note" role="alert">An answer is waiting to send. <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={() => { void sync.retry(); }}>Try again</button></p> : null}
      <div className="ws-footer"><button className="nb-btn nb-btn--ghost" disabled={index === 0 || busy} onClick={() => setIndex((current) => current - 1)}><Icon name="back" />{index ? `Q${index}` : 'Back'}</button><span className="nb-meta">{saved[view.id] ? `Draft saved ${new Date(saved[view.id]!).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : locked ? 'Answer saved' : 'Not saved yet'}</span><button className="nb-btn nb-btn--primary nb-btn--lg" disabled={index === views.length - 1 || busy} onClick={() => setIndex((current) => current + 1)}>Next question <Icon name="arrow" /></button></div>
    </> : <p className="nb-note">Your teacher has not added questions to this worksheet yet.</p>}
  </section>;
}
