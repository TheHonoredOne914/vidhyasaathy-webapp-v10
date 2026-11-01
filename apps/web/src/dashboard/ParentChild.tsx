import { ChildListSchema, ParentSummarySchema } from '@vidhyasaathy/contracts';
import { Link, useParams } from 'react-router-dom';
import { formatDue, scoreText } from '../assessment/present';
import { AccessDenied } from '../routes/AccessDenied';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useRemote } from '../setup/useRemote';
import { evidenceLabel } from './format';
import { RemoteBlock } from './RemoteBlock';
import './dashboard.css';

export function ParentChild({ view = 'overview' }: { view?: 'overview' | 'progress' | 'assignments' }) {
  const { childId = '' } = useParams();
  usePageMeta(PAGE.parentChild.title, PAGE.parentChild.description);
  const summary = useRemote(childId ? `/parents/children/${childId}/summary` : null, ParentSummarySchema);
  const children = useRemote('/parent/children', ChildListSchema);
  if (summary.denied) return <AccessDenied />;
  return (
    <section className="dash">
      <RemoteBlock remote={summary} title="Could not load this child">
        {(data) => (
          <>
            <nav className="child-tabs" aria-label="Child pages">
              <Link to={`/parent/children/${childId}`} aria-current={view === 'overview' ? 'page' : undefined}>Overview</Link>
              <Link to={`/parent/children/${childId}/progress`} aria-current={view === 'progress' ? 'page' : undefined}>Progress</Link>
              <Link to={`/parent/children/${childId}/assignments`} aria-current={view === 'assignments' ? 'page' : undefined}>Assignments</Link>
            </nav>
            {view === 'progress' ? <article className="dash-panel">
              <h1>{data.child.name}'s progress</h1>
              <p>{data.observedResult.text}</p>
              <h2>Current focus</h2>
              {data.currentFocus.length ? <ul>{data.currentFocus.map((concept) => <li key={concept.conceptId}>{concept.title} — Let's fix this</li>)}</ul> : <p>New learning will appear after the next check.</p>}
              <h2>Next step</h2><p>{data.suggestedAction.text}</p>
            </article> : view === 'assignments' ? <article className="dash-panel">
              <h1>{data.child.name}'s assignments</h1>
              {data.progress.assignments.length ? <ul className="dash-list">{data.progress.assignments.map((item) => <li key={item.id}>
                <h2>{item.title}</h2><p>Due {formatDue(item.dueAt)}. {scoreText(item.score)}. {item.teacherName}.</p>
              </li>)}</ul> : <p>No assignment is published.</p>}
            </article> : <>
            <header className="dash-banner">
              <Link className="back-link" to="/parent">← All children</Link>
              <h1>{data.child.name}</h1>
              <p>{[data.child.className, data.child.sectionName ? `Section ${data.child.sectionName}` : null, data.child.schoolName].filter(Boolean).join('. ')}</p>
            </header>
            {children.data && children.data.length > 1 ? (
              <nav aria-label="Switch child" className="child-tabs">
                {children.data.map((child) => (
                  <Link key={child.id} className={child.id === childId ? 'is-active' : ''} to={`/parent/children/${child.id}`} aria-current={child.id === childId ? 'page' : undefined}>{child.name}</Link>
                ))}
              </nav>
            ) : null}
            <p className="updated-note">Updated {formatDue(data.updatedAt)} · Private chats are not shown.</p>
            <p className="friendly-summary">{data.progress.evidence.confidence === 'available'
              ? `${data.child.name} is building a strong picture of their learning: ${Math.round((data.progress.evidence.passRate ?? 0) * 100)}% of marked checks are correct.`
              : `${data.child.name} has started building a learning picture. A few more marked checks will make the progress clearer.`}</p>
            <div className="report-grid">
              <article className="report-card report-card-main">
                <div className="report-card-heading"><div><p className="dash-kicker">Learning report</p><h2>Progress so far</h2></div><span className="report-stamp">{data.progress.completedSessions} checks</span></div>
                <p className="report-evidence">{evidenceLabel(data.progress.evidence)}</p>
                <div className="progress-track" aria-label={`${data.progress.completedSessions} session checks finished`}><span style={{ width: `${Math.min(100, data.progress.completedSessions * 12.5)}%` }} /></div>
                <p className="report-footnote">Recorded from marked checks only.</p>
              </article>
              <article className="report-card report-card-focus"><p className="dash-kicker">Right now</p><h2>Current focus</h2>{data.currentFocus.length ? <ul className="focus-list">{data.currentFocus.map((concept) => <li key={concept.conceptId}>{concept.title}</li>)}</ul> : <p>No concept is marked for practice.</p>}</article>
            </div>
            <article className="dash-panel latest-result"><p className="dash-kicker">Latest check</p><h2>{data.latestResult ? data.latestResult.correct === null ? 'Waiting for review' : data.latestResult.correct ? 'A correct step' : 'A step to revisit' : 'No result yet'}</h2><p>{data.latestResult ? `Recorded ${formatDue(data.latestResult.recordedAt)}.` : 'A result will appear after the next marked check.'}</p></article>
            <dl className="summary-parts report-details">
              <div><dt>Observed result</dt><dd>{data.observedResult.text}</dd></div>
              <div><dt>AI interpretation</dt><dd>{data.aiInterpretation.text}</dd></div>
              <div><dt>Teacher confirmed</dt><dd>{data.teacherConfirmed.text}</dd></div>
              <div><dt>Suggested action</dt><dd>{data.suggestedAction.text}</dd></div>
            </dl>
            <article className="dash-panel">
              <h2>How you can help</h2>
              <p>{data.suggestedAction.text}</p>
            </article>
            <article className="dash-panel">
              <div className="section-heading"><div><p className="dash-kicker">Keep an eye on</p><h2>Assigned work</h2></div><span>{data.progress.assignments.length} items</span></div>
              {data.progress.assignments.length ? (
                <ul className="dash-list">
                  {data.progress.assignments.map((item) => (
                    <li key={item.id} className={`assignment-row ${item.score?.status === 'completed' ? 'is-complete' : item.score?.status === 'pending_review' ? 'is-review' : ''}`}>
                      <span className="assignment-status" aria-hidden="true">{item.score?.status === 'completed' ? 'Done' : item.score?.status === 'pending_review' ? 'Review' : 'Open'}</span>
                      <span>
                      <h3>{item.title}</h3>
                      <p>{item.kind}. Due {formatDue(item.dueAt)}. {scoreText(item.score)}. {item.teacherName}. Read only.</p>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p>No assignment is published.</p>}
            </article>
            <article className="dash-panel">
              <div className="section-heading"><div><p className="dash-kicker">From school</p><h2>Announcements</h2></div><Link className="text-link" to="/parent/announcements">See all</Link></div>
              {data.teacherUpdates.length ? data.teacherUpdates.map((item) => (
                <p key={item.id}><strong>{item.title}.</strong> {item.body}</p>
              )) : <p>No teacher update for this class.</p>}
            </article>
            </>}
          </>
        )}
      </RemoteBlock>
      <Link className="text-link" to="/parent">All children</Link>
    </section>
  );
}
