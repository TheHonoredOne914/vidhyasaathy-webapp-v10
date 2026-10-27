import { StudentEnrollmentSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../meta';
import { useSession } from '../session';
import { SaathyMascot } from '../ui/Saathy';
import { CatalogGate } from '../setup/CatalogGate';
import { NameList } from '../setup/NameList';
import { useCatalog } from '../setup/useCatalog';
import { useRemote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import { AccessDenied } from './AccessDenied';

export function StudentWelcome() {
  usePageMeta('Let’s learn! — VidhyaSaathy', 'Welcome to your school learning space.');
  const { me } = useSession();
  const enrollment = useRemote('/student/enrollment', StudentEnrollmentSchema);
  if (enrollment.denied) return <AccessDenied />;
  return <section className="student-screen stack">
    <div className="greet"><SaathyMascot size={40} alt="" /><div><h1>Let’s learn!</h1><p>Welcome, {me?.profile.name}.</p></div></div>
    <article className="lcard"><div className="lcard-head"><h2>Your class</h2></div><div className="lcard-body">
      {enrollment.status === 'loading' ? <Skeleton /> : enrollment.data ? <>
        <StaleNote stale={enrollment.stale} updatedAt={enrollment.updatedAt} message={enrollment.message} />
        <p>{me?.school.name}</p><p>{enrollment.data.className ? `${enrollment.data.className} · Section ${enrollment.data.sectionName}` : 'Your class has not been assigned. Ask your teacher for help.'}</p>
      </> : <ErrorState title="Could not load your class" message={enrollment.message ?? 'Try again.'} onRetry={enrollment.reload} />}
    </div></article>
    <article className="lcard"><div className="lcard-head"><h2>Today</h2></div><div className="lcard-body"><p>Nothing due today. Explore your subjects.</p><p>When Ask Saathy is available, it will use your school’s notes to offer hints, not just answers. Your chats are private.</p><p>Ask Saathy is not available yet.</p><Link className="navy-btn" to="/student">Start learning</Link></div></article>
  </section>;
}

export function TeacherOnboarding() {
  usePageMeta('Welcome, teacher — VidhyaSaathy', 'Your assigned classes and subjects.');
  const catalog = useCatalog();
  return <section className="setup-wizard">
    <p className="app-kicker">Welcome to your school</p><h1>Ready for your first class?</h1>
    <CatalogGate catalog={catalog}>
      <NameList label="Assigned classes" emptyTitle="No class assigned yet." emptyDetail="Ask your administrator to assign your class and subject." items={(catalog.classes.data ?? []).map((item) => ({ id: item.id, name: item.name }))} />
      <NameList label="Assigned subjects" emptyTitle="No subject assigned yet." emptyDetail="Your administrator manages these assignments." items={(catalog.subjects.data ?? []).map((item) => ({ id: item.id, name: item.name }))} />
      <p>Your assigned classes lead to sections and student rosters. Resource publishing, draft approval and demo study sessions are not available yet.</p>
      <Link className="text-link" to="/teacher">Go to teacher home</Link>
    </CatalogGate>
  </section>;
}
