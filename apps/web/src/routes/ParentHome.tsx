import { ChildListSchema, ParentSummarySchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useRemote } from '../setup/useRemote';
import { Scribble } from '../student/notebook/icons';
import { Saathy } from '../student/notebook/Saathy';
import { MasteryChip } from '../student/notebook/ui';
import { ScreenState } from '../student/notebook/screens/polish3c/ScreenState';
import { weekStartIST } from '../student/notebook/screens/polish3c/parent';
import '../student/notebook/pages/parent-home.css';

const dateLabel = (time: number) => new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' }).format(time);

export function ParentHome() {
  usePageMeta(PAGE.parent.title, PAGE.parent.description);
  const children = useRemote('/parent/children', ChildListSchema);
  const [selected, setSelected] = useState('');
  const childId = children.data?.find((row) => row.id === selected)?.id ?? children.data?.[0]?.id;
  const summary = useRemote(childId ? `/parents/children/${childId}/summary` : null, ParentSummarySchema);
  const report = summary.data;
  const child = report?.child;
  const words = report?.progress.masteryWords ?? [];
  const mastered = words.filter((row) => row.word === 'Mastered' || row.word === 'Top form');
  const working = words.filter((row) => row.word === "Let's fix this" || row.word === 'Almost there');
  const assignments = report?.progress.assignments ?? [];
  const completed = assignments.filter((row) => row.score?.status === 'completed').length;
  const upcoming = assignments.filter((row) => row.dueAt !== null && row.dueAt >= Date.now() && row.score?.status !== 'completed').sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
  const monday = weekStartIST();
  if (!children.data) return <ScreenState loading={children.status === 'loading'} error={children.message} retry={children.reload} />;
  if (!children.data.length) return <section className="nb-card"><h1 className="nb-h1">See how your child's doing</h1><p className="nb-empty">No child is linked to this account. Contact your school to check the link.</p><Link className="nb-link" to="/recover">Get account help</Link></section>;
  return <div className="nb-grid p3c-parent"><div className="nb-col">
    <header className="nb-head ph-head"><div className="nb-head__eyebrow">Week of {dateLabel(monday)}</div><h1 className="nb-h1">{child ? `${child.name}'s week` : 'Your child’s week'}</h1><Scribble /></header>
    {child ? <p className="nb-sub ph-sub">{[child.className, child.sectionName, child.schoolName].filter(Boolean).join(' · ')} · latest recorded progress</p> : null}
    {children.data.length > 1 ? <label className="nb-label ph-selector">Child<select className="nb-input" value={childId} onChange={(event) => { setSelected(event.target.value); }}>{children.data.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label> : null}
    <ScreenState loading={!report && summary.status === 'loading'} error={!report ? summary.message : null} retry={summary.reload} />
    {report ? <div className="pk">
      <section className="nb-card"><span className="nb-label">Sessions completed</span><b>{report.progress.completedSessions}</b><div className="nb-meta">Recorded so far</div></section>
      <section className="nb-card"><span className="nb-label">Homework</span><b>{completed} of {assignments.length}</b><div className="nb-meta">Completed assignments so far</div></section>
      <section className="nb-card"><span className="nb-label">Ideas mastered</span><b>{mastered.length}</b><div className="nb-meta">Mastered or Top form</div></section>
    </div> : null}
    <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Subjects</h2>{childId ? <Link className="nb-link" to={`/parent/children/${childId}`}>See progress</Link> : null}</div>
      <p className="nb-empty">Subject summaries aren't available yet. Your child's recorded concepts are below.</p>
      <div className="ph-stickies"><div className="nb-sticky nb-sticky--green"><span className="nb-sticky__who">Got it this week</span><p>Weekly milestones aren't available yet.</p>{mastered.length ? <><span className="nb-meta">Mastered so far</span><p>{mastered.map((row) => row.title).join(', ')}.</p></> : <p className="nb-meta">New milestones will appear as learning continues.</p>}</div>
        <div className="nb-sticky nb-sticky--pink"><span className="nb-sticky__who">Working on</span>{report?.currentFocus.length ? report.currentFocus.map((row) => row.title).join(', ') : working.length ? working.map((row) => row.title).join(', ') : 'A current focus will appear after more practice.'}</div></div>
      {words.length ? <div className="ph-concepts">{words.slice(0, 6).map((row) => <div className="ph-concept" key={row.conceptId}><b className="nb-row__t">{row.title}</b><MasteryChip level={row.word} /></div>)}</div> : null}
    </section>
    <div className="ph-children">{children.data.map((row) => <Link className="nb-link" key={row.id} to={`/parent/children/${row.id}`}>{row.name}'s full progress</Link>)}</div>
  </div><aside className="nb-col">
    <section className="nb-sticky ph-dinner"><span className="nb-tape nb-tape--sky" /><span className="nb-sticky__who">What to ask at dinner</span>{report?.suggestedAction.status === 'available' ? report.suggestedAction.text : report?.currentFocus[0] && child ? `Ask ${child.name} to explain ${report.currentFocus[0].title} in their own words.` : 'Ask which idea felt clearer today. Give them time to explain it in their own words.'}</section>
    <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">From school</h2></div>{report?.teacherUpdates.length ? report.teacherUpdates.map((note) => <div className="rem" key={note.id}><b className="nb-row__t">{note.title}</b><div className="nb-text">{note.body}</div><span className="nb-meta">{dateLabel(note.createdAt)}</span></div>) : <p className="nb-empty">No school note yet.</p>}</section>
    <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">What you can see</h2></div><div className="nb-text">Progress, homework and teacher remarks. <b>Not</b> {child ? `${child.name}'s` : "your child's"} chats with Saathy. Those stay private.</div><div className="nb-saathy-tip ph-tip"><Saathy size={54} /><div className="nb-text">No marks or ranks against other children, ever.</div></div></section>
    <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Coming up</h2></div>{upcoming.length ? upcoming.slice(0, 5).map((row) => <div className="rem" key={row.id}><b className="nb-row__t">{row.title}</b><span className="nb-meta"> · due {dateLabel(row.dueAt!)}</span></div>) : <p className="nb-empty">No upcoming homework is listed.</p>}</section>
  </aside></div>;
}
