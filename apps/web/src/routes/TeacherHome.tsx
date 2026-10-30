import { TeacherDashboardSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { PageHead, Chip } from '../student/notebook/ui';
import '../student/notebook/pages/teacher-home.css';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import { useSession } from '../session';
import { StaleNote } from '../ui/StaleNote';
import { CatalogGate } from '../setup/CatalogGate';
import { classLabel } from '../setup/labels';
import { useCatalog } from '../setup/useCatalog';
import { useRemote } from '../setup/useRemote';
import '../dashboard/dashboard.css';
import '../theme/vs-theme.css';
import './teacher.css';

export function TeacherHome() {
  usePageMeta(PAGE.teacher.title, PAGE.teacher.description);
  const session = useSession();
  const catalog = useCatalog();
  const dashboard = useRemote('/dashboard/teacher', TeacherDashboardSchema);
  const me = session.me;
  if (!me) return null;
  const classes = catalog.classes.data ?? [];
  const sections = catalog.sections.data ?? [];
  const subjects = catalog.subjects.data ?? [];
  const desk = dashboard.data;
  const students = desk?.classes.reduce((sum, row) => sum + row.students, 0) ?? 0;
  const needing = desk?.classes.reduce((sum, row) => sum + row.concepts.reduce((inner, concept) => inner + concept.needingPractice, 0), 0) ?? 0;
  return (
    <div className="nb-grid nb-grid--wide-rail">
      <div className="nb-col">
      <PageHead eyebrow={me.school.name} title={me.profile.name} sub="Your classes for today." />
      <StaleNote stale={session.stale} updatedAt={session.updatedAt} message={session.message} testId="updated-at" />
      {dashboard.status === 'loading' && !desk ? <div className="nb-skel" /> : null}
      {dashboard.status === 'error' && !desk ? <p className="nb-empty" role="alert">Could not load today's desk. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={dashboard.reload}>Try again</button></p> : null}
      {desk ? <div className="kpis">
        <section className="nb-card kpi"><span className="nb-label">Students</span><b>{students}</b></section>
        <section className="nb-card kpi"><span className="nb-label">To review</span><b>{desk.reviewQueue}</b></section>
        <section className="nb-card kpi"><span className="nb-label">Sessions</span><b>{desk.sessions.length}</b></section>
        <section className="nb-card kpi"><span className="nb-label">Need practice</span><b>{needing}</b></section>
      </div> : null}
      <CatalogGate catalog={catalog}>
        {classes.length === 0 ? (
          <div className="vs-card" id="classes">
            <h2 className="vs-card-heading">No class is assigned to you.</h2>
            <div className="vs-card-body">
              <p>An administrator assigns a class by inviting you to a section and subject.</p>
            </div>
          </div>
        ) : (
          <ul id="classes" aria-label="Classes" className="vs-class-grid">
            {classes.map((item) => (
              <li key={item.id} className="vs-card">
                <h2 className="vs-card-heading">
                  <Link className="vs-class-link" to={`/teacher/classes/${item.id}`}>{/^class\b/i.test(item.name.trim()) ? item.name : `Class ${item.name}`} <span aria-hidden="true">→</span></Link>
                </h2>
                <div className="vs-card-body vs-class-details">
                  <div>
                    <h3>Sections</h3>
                    <ul aria-label={`${item.name} sections`}>
                      {sections.filter((section) => section.classId === item.id).map((section) => (
                        <li key={section.id}>{/^class\b/i.test(classLabel(classes, section.classId).trim()) ? classLabel(classes, section.classId) : `Class ${classLabel(classes, section.classId)}`} - Section {section.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3>Subjects</h3>
                    <ul aria-label={`${item.name} subjects`}>
                      {subjects.filter((subject) => subject.classId === item.id).map((subject) => (
                        <li key={subject.id}><Link className="text-link" to={`/teacher/subjects/${subject.id}`}>{subject.name}</Link></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CatalogGate>
      </div>
      <aside className="nb-col">
        <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Review</h3></div>
          {desk && desk.reviewQueue > 0 ? <Link className="nb-btn nb-btn--primary" to="/teacher/review">{desk.reviewQueue} to check</Link> : <p className="nb-empty">Nothing is waiting.</p>}
        </section>
        <section className="nb-card nb-grow"><div className="nb-card__head"><h3 className="nb-h3">Homework</h3></div>
          {(desk?.assignments ?? []).slice(0, 6).map((item) => <div className="nb-row" key={item.id}><div className="nb-row__t">{item.title}</div><Chip tone="sand">Open</Chip></div>)}
          {desk && desk.assignments.length === 0 ? <p className="nb-empty">No homework is out.</p> : null}
          <Link className="nb-link" to="/teacher/notes">Publish notes</Link>
        </section>
      </aside>
    </div>
  );
}
