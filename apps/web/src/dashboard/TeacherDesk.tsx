import { TeacherDashboardSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import type { z } from 'zod';
import { formatDue } from '../assessment/present';
import { HeatMap } from './HeatMap';

type Dashboard = z.infer<typeof TeacherDashboardSchema>;

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => `${index * 20},${24 - (value / max) * 20}`).join(' ');
  return <svg className="stat-sparkline" viewBox="0 0 100 28" role="img" aria-label="Recent activity trend"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function TeacherDesk({ data, sections }: { data: Dashboard; sections: { id: string; name: string }[] }) {
  return (
    <div className="dash">
      <p>Recorded {formatDue(data.updatedAt)}.</p>
      <div className="stat-grid" aria-label="Teacher overview">
        <article className="stat-tile"><span>Students in view</span><strong>{data.classes.reduce((sum, group) => sum + group.students, 0)}</strong><Sparkline values={data.classes.map((group) => group.students)} /></article>
        <article className="stat-tile"><span>Session checks</span><strong>{data.classes.reduce((sum, group) => sum + group.completedSessions, 0)}</strong><Sparkline values={data.classes.map((group) => group.completedSessions)} /></article>
        <article className="stat-tile"><span>Review queue</span><strong>{data.reviewQueue}</strong><Sparkline values={[data.reviewQueue, data.reviewQueue, data.reviewQueue ? data.reviewQueue - 1 : 0]} /></article>
        <article className="stat-tile stat-tile-warm"><span>Needs a closer look</span><strong>{data.classes.reduce((sum, group) => sum + group.concepts.reduce((inner, concept) => inner + concept.needingPractice, 0), 0)}</strong><Sparkline values={data.classes.map((group) => group.concepts.reduce((sum, concept) => sum + concept.needingPractice, 0))} /></article>
      </div>
      <article className="dash-panel">
        <h2>Today</h2>
        {data.sessions.length ? (
          <ul className="dash-list">
            {data.sessions.map((session) => (
              <li key={session.id} className="heat-none">
                <Link className="text-link" to={`/teacher/sessions/${session.id}`}>{session.title}</Link>
              </li>
            ))}
          </ul>
        ) : <div className="dash-placeholder"><strong>No session is released today.</strong><span>Publish a session when your class is ready.</span></div>}
        <p>{data.reviewQueue} answers are waiting for review.</p>
        <p className="dash-actions">
          <Link className="text-link" to="/teacher/review">Review queue</Link>
          <Link className="text-link" to="/teacher/subjects">Upload a note or create a session</Link>
          <Link className="text-link" to="/teacher/homework">Assign homework</Link>
        </p>
      </article>
      <article className="dash-panel risk-panel">
        <div className="section-heading"><div><p className="dash-kicker">From the dashboard</p><h2>Students needing a closer look</h2></div><span>Names stay on the roster</span></div>
        {data.classes.length ? <ul className="risk-list">{data.classes.map((group) => {
          const needsPractice = group.concepts.reduce((sum, concept) => sum + concept.needingPractice, 0);
          const focus = group.concepts.filter((concept) => concept.needingPractice > 0).sort((a, b) => b.needingPractice - a.needingPractice).slice(0, 2).map((concept) => concept.title).join(' · ');
          return <li key={group.sectionId}><span><strong>{needsPractice} learning flag{needsPractice === 1 ? '' : 's'}</strong><small>{focus || 'No concept is currently flagged.'}</small></span><Link className="text-link" to={`/teacher/sections/${group.sectionId}`}>Open roster</Link></li>;
        })}</ul> : <div className="dash-placeholder"><strong>No class data is available yet.</strong><span>Class learning signals will appear here.</span></div>}
      </article>
      <article className="dash-panel">
        <h2>Homework and quizzes</h2>
        {data.assignments.length ? (
          <ul className="dash-list">
            {data.assignments.map((item) => (
              <li key={item.id} className="heat-none">
                <Link className="text-link" to={`/teacher/assignments/${item.id}`}>{item.title}</Link>
                <p>{item.kind}. Due {formatDue(item.dueAt)}. {item.status === 'published' ? 'Published.' : 'Draft.'}</p>
              </li>
            ))}
          </ul>
        ) : <div className="dash-placeholder"><strong>No homework or quiz is assigned.</strong><span>Assignments you create will appear here.</span></div>}
      </article>
      {data.classes.length ? data.classes.map((group) => {
        const section = sections.find((item) => item.id === group.sectionId);
        return (
          <article className="dash-panel" key={group.sectionId}>
            <h2>{section ? `Section ${section.name}` : 'Section'}</h2>
            <p>{group.students} students. {group.completedSessions} session checks finished. Names stay on the roster.</p>
            <HeatMap concepts={group.concepts} />
            {group.doubtBatches.length ? (
              <ul className="dash-list">
                {group.doubtBatches.map((batch) => (
                  <li key={batch.chapterId} className="heat-some">
                    <Link className="text-link" to={`/teacher/chapters/${batch.chapterId}`}>{batch.title}</Link>
                    <p>{batch.count} student questions.</p>
                  </li>
                ))}
              </ul>
            ) : <p>No student question is waiting.</p>}
            <p className="dash-actions">
              <Link className="text-link" to={`/teacher/sections/${group.sectionId}/insights`}>Concept checks</Link>
              <Link className="text-link" to={`/teacher/sections/${group.sectionId}`}>Roster</Link>
            </p>
          </article>
        );
      }) : <div className="dash-placeholder"><strong>No class is assigned to you.</strong><span>Your school’s class list will appear here.</span></div>}
    </div>
  );
}
