import { ProgressSchema, StudyPlanSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { planHref } from '../../../ai/plan';
import { useRemote } from '../../../setup/useRemote';
import { Chip, PageHead } from '../ui';
import '../pages/homework.css';

function when(dueAt: number) {
  const now = Date.now();
  if (dueAt < now) return { text: 'Overdue', tone: 'red' as const };
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(dueAt));
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  if (day === today) return { text: 'Today', tone: 'orange' as const };
  return { text: new Date(dueAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' }), tone: 'sand' as const };
}

export function HomeworkBoard() {
  const progress = useRemote('/progress', ProgressSchema);
  const plan = useRemote('/study-plan', StudyPlanSchema);
  const rows = [...(progress.data?.assignments ?? [])].sort((a, b) => a.dueAt - b.dueAt);
  const todo = rows.filter((item) => item.score?.status !== 'completed' && item.score?.status !== 'pending_review');
  const back = rows.filter((item) => item.score?.status === 'completed' || item.score?.status === 'pending_review');
  const sessions = (plan.data?.items ?? []).filter((item) => item.kind === 'session');

  if ((progress.status === 'loading' && !progress.data) || (plan.status === 'loading' && !plan.data)) return <div className="nb-skel" />;
  if (progress.status === 'error' && !progress.data) return <p className="nb-empty" role="alert">Could not load homework. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={progress.reload}>Try again</button></p>;

  return <div className="nb-grid nb-grid--5-7">
    <div className="nb-col">
      <PageHead eyebrow="Homework" title="To do" />
      {todo.length ? todo.map((item) => { const tag = when(item.dueAt); return <Link className="nb-row" key={item.id} to={`/student/assignments/${item.id}`}><div><div className="nb-row__t">{item.title}</div><div className="nb-row__s">{item.teacherName}</div></div><Chip tone={tag.tone}>{tag.text}</Chip></Link>; }) : <p className="nb-empty">Nothing left to hand in.</p>}
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Handed back</h3></div>
        {back.length ? back.map((item) => <div className="nb-row" key={item.id}><div><div className="nb-row__t">{item.title}</div><div className="nb-row__s">{item.score?.status === 'pending_review' ? 'Being checked' : `${item.score?.correct ?? 0} / ${item.score?.total ?? 0}`}</div></div></div>) : <p className="nb-empty">Nothing has come back yet.</p>}
      </section>
    </div>
    <div className="nb-col">
      <section className="nb-card nb-grow">
        <div className="nb-card__head"><h3 className="nb-h3">Study sessions</h3></div>
        {sessions.length ? sessions.map((item) => <Link className="nb-row" key={item.id} to={planHref(item)}><div><div className="nb-row__t">{item.title}</div><div className="nb-row__s">{item.resumeAt > 0 ? `Resume at slide ${item.resumeAt + 1}` : 'Not started'}</div></div></Link>) : <p className="nb-empty">No session is waiting.</p>}
        {todo[0] ? <p style={{ marginTop: 'var(--nb-s4)' }}><Link className="nb-btn nb-btn--primary" to={`/student/assignments/${todo[0].id}`}>Open {todo[0].title}</Link></p> : null}
      </section>
    </div>
  </div>;
}
