import { AttemptSchema, TeacherDashboardSchema } from '@vidhyasaathy/contracts';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import { useSession } from '../session';
import { CatalogGate } from '../setup/CatalogGate';
import { useCatalog } from '../setup/useCatalog';
import { useRemote } from '../setup/useRemote';
import { StaleNote } from '../ui/StaleNote';
import { Scribble } from '../student/notebook/icons';
import { Chip } from '../student/notebook/ui';
import { LineIcon } from '../student/notebook/screens/polish3c/LineIcon';
import { ScreenState } from '../student/notebook/screens/polish3c/ScreenState';
import { sectionConcepts } from '../student/notebook/screens/polish3c/teacher';
import '../student/notebook/pages/teacher-home.css';

const AttemptsSchema = z.array(AttemptSchema);
const tint = (rate: number) => rate >= .85 ? '#C6E6CF' : rate >= .7 ? '#DDEFD9' : rate >= .55 ? '#FFF4CF' : rate >= .4 ? '#FCE7B8' : '#F5D3CE';

export function TeacherHome() {
  usePageMeta(PAGE.teacher.title, PAGE.teacher.description);
  const session = useSession();
  const catalog = useCatalog();
  const dashboard = useRemote('/dashboard/teacher', TeacherDashboardSchema);
  const review = useRemote('/attempts?pendingOnly=true', AttemptsSchema);
  const me = session.me;
  if (!me) return null;
  const desk = dashboard.data;
  const classes = catalog.classes.data ?? [];
  const sections = catalog.sections.data ?? [];
  const subjects = catalog.subjects.data ?? [];
  const concepts = sectionConcepts(desk?.classes ?? []);
  const focus = [...concepts].sort((a, b) => b.needingPractice - a.needingPractice).find((row) => row.needingPractice > 0);
  const nudges = [...new Map((desk?.bands ?? []).filter((row) => row.band === '0-25' || row.band === '25-50').map((row) => [row.profileId, row])).values()];
  const today = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short' }).format(new Date());
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23' }).format(new Date()));
  return <div className="nb-grid nb-grid--wide-rail p3c-teacher">
    <div className="nb-col">
      <div className="th-head"><header className="nb-head"><div className="nb-head__eyebrow">{today} · {me.school.name}</div><h1 className="nb-h1">Good {hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'}, {me.profile.name}</h1><Scribble /></header><div className="th-actions"><Link className="nb-btn nb-btn--ghost" to="/teacher/homework">New homework</Link><Link className="nb-btn nb-btn--primary" to={desk?.sessions[0] ? `/teacher/sessions/${desk.sessions[0].id}` : '/teacher/subjects'}>{desk?.sessions[0] ? 'Open session' : 'Plan a session'}</Link></div></div>
      <StaleNote stale={session.stale} updatedAt={session.updatedAt} message={session.message} testId="updated-at" />
      <ScreenState loading={!desk && dashboard.status === 'loading'} error={!desk ? dashboard.message : null} retry={dashboard.reload} />
      {desk ? <div className="kpis">
        <section className="nb-card kpi"><span className="nb-label">Students</span><b>{desk.classes.reduce((sum, row) => sum + row.students, 0)}</b><div className="nb-meta">In your assigned sections</div></section>
        <section className="nb-card kpi"><span className="nb-label">Sessions completed</span><b>{desk.classes.reduce((sum, row) => sum + row.completedSessions, 0)}</b><div className="nb-meta">Recorded learning sessions</div></section>
        <section className="nb-card kpi"><span className="nb-label">To review</span><b>{desk.reviewQueue}</b><div className="nb-meta">Answers waiting for you</div></section>
        <section className="nb-card kpi th-revisit"><span className="nb-label">Concepts to revisit</span><b>{concepts.filter((row) => row.needingPractice > 0).length}</b><div className="nb-meta">From recorded practice</div></section>
      </div> : null}
      <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Class mastery</h2><div className="nb-tabs"><span className="nb-tab is-active">By section</span><button className="nb-tab" type="button" disabled title="Individual mastery is not available in this summary">By student</button></div></div>
        <div className="nb-meta th-caption">Recorded answer accuracy · unassessed concepts stay New</div>
        {desk && concepts.length && desk.classes.length ? <div className="th-heat-scroll"><div className="heat" aria-label="Concept accuracy by section" style={{ gridTemplateColumns: `minmax(8rem, 2fr) repeat(${desk.classes.length}, minmax(4rem, 1fr))` }}>
          <div>Concept</div>{desk.classes.map((group) => { const section = sections.find((row) => row.id === group.sectionId); return <div className="h" key={group.sectionId}>{section ? `${classes.find((row) => row.id === section.classId)?.name ?? ''} · ${section.name}` : 'Assigned section'}</div>; })}
          {concepts.map((concept) => <Fragment key={concept.conceptId}><div className="n">{concept.title}</div>{desk.classes.map((group) => {
            const rate = group.concepts.find((row) => row.conceptId === concept.conceptId)?.passRate ?? null;
            return <div className={`c${rate === null ? ' is-new' : ''}`} key={group.sectionId} style={rate === null ? undefined : { background: tint(rate) }}>{rate === null ? 'New' : `${Math.round(rate * 100)}%`}</div>;
          })}</Fragment>)}
        </div></div> : <p className="nb-empty">Your class concepts will appear after learning begins.</p>}
        <div className="nb-sticky th-suggestion"><span className="nb-sticky__who">Saathy suggests</span>{focus ? <>Revisit {focus.title}. {focus.needingPractice} student{focus.needingPractice === 1 ? '' : 's'} across your sections could use more practice.</> : 'A teaching suggestion will appear when there is enough recorded practice.'}</div>
      </section>
      <section className="nb-card" id="classes"><div className="nb-card__head"><h2 className="nb-h3">Your classes</h2><Link className="nb-link" to="/teacher/subjects">Publish notes</Link></div><CatalogGate catalog={catalog}>
        {classes.length ? classes.map((item) => <div className="th-class" key={item.id}><Link className="nb-row__t" to={`/teacher/classes/${item.id}`}>{item.name}</Link><div className="th-links">{sections.filter((row) => row.classId === item.id).map((row) => <Link key={row.id} to={`/teacher/sections/${row.id}`}>Section {row.name}</Link>)}{subjects.filter((row) => row.classId === item.id).map((row) => <Link key={row.id} to={`/teacher/subjects/${row.id}`}>{row.name}</Link>)}</div></div>) : <p className="nb-empty">No class is assigned to you. Ask your school administrator.</p>}
      </CatalogGate></section>
    </div>
    <aside className="nb-col">
      <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Lesson review</h2>{review.data ? <Chip tone="orange">{review.data.length} waiting</Chip> : null}</div><div className="nb-meta">Student answers to check</div>
        <ScreenState loading={!review.data && review.status === 'loading'} error={!review.data ? review.message : null} retry={review.reload} />
        {review.data?.slice(0, 5).map((item) => <div className="rv" key={item.id}><span className="th-round"><LineIcon name="book" /></span><div><b>{desk?.assignments.find((row) => row.id === item.assignmentId)?.title ?? 'Student answer'}</b><span className="nb-meta">Waiting for teacher review</span></div><Link className="nb-btn nb-btn--ghost nb-btn--sm" to="/teacher/review">Review</Link></div>)}
        {review.data?.length === 0 ? <p className="nb-empty">Nothing is waiting.</p> : null}<Link className="nb-link" to="/teacher/review">Open review queue</Link>
      </section>
      <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Could use a nudge</h2><span className="nb-meta">private to you</span></div>
        {nudges.slice(0, 5).map((row) => <div className="stu" key={row.profileId}><span className="nb-avatar">{row.studentName.slice(0, 1)}</span><div><b className="nb-row__t">{row.studentName}</b><div className="nb-meta">Revisit {row.chapterTitle}</div></div><Link className="nb-btn nb-btn--quiet nb-btn--sm" to="/teacher/review">Review</Link></div>)}
        {desk && nudges.length === 0 ? <p className="nb-empty">No private follow-up is flagged yet.</p> : null}<p className="nb-meta th-caption">Only you see this list. Private nudge delivery isn't available yet.</p>
      </section>
      <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Homework</h2><Link className="nb-link" to="/teacher/homework">See all</Link></div>{desk?.assignments.slice(0, 6).map((item) => <Link className="nb-row" key={item.id} to={`/teacher/assignments/${item.id}`}><span className="nb-row__t">{item.title}</span><Chip tone="sand">Open</Chip></Link>)}{desk?.assignments.length === 0 ? <p className="nb-empty">No homework is out.</p> : null}</section>
    </aside>
  </div>;
}
