import { TeacherDashboardSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { TeacherDesk } from '../dashboard/TeacherDesk';
import { RemoteBlock } from '../dashboard/RemoteBlock';
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
  return (
    <section className="vs-page vs-role-page" aria-labelledby="teacher-title">
      <header className="vs-page-header">
        <p className="vs-eyebrow">Teacher home</p>
        <h1 id="teacher-title">{me.school.name}</h1>
        <p>{me.profile.name} is signed in as the teacher for {me.school.name}.</p>
      </header>
      <nav className="teacher-class-picker" aria-label="Choose a class">
        <span>Class view</span>
        {classes.length ? classes.map((item) => <Link key={item.id} to={`/teacher/classes/${item.id}`}>{item.name}</Link>) : <span className="muted">Your class list will appear here.</span>}
      </nav>
      <StaleNote stale={session.stale} updatedAt={session.updatedAt} message={session.message} testId="updated-at" />
      <Link to="/teacher/notes">Publish notes and resources</Link>
      <RemoteBlock remote={dashboard} title="Could not load today's desk">
        {(data) => <TeacherDesk data={data} sections={sections} />}
      </RemoteBlock>
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
                  <Link className="vs-class-link" to={`/teacher/classes/${item.id}`}>{item.name} <span aria-hidden="true">→</span></Link>
                </h2>
                <div className="vs-card-body vs-class-details">
                  <div>
                    <h3>Sections</h3>
                    <ul aria-label={`${item.name} sections`}>
                      {sections.filter((section) => section.classId === item.id).map((section) => (
                        <li key={section.id}>{classLabel(classes, section.classId)} section {section.name}</li>
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
    </section>
  );
}
