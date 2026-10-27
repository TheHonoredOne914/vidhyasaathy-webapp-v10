import { Link } from 'react-router-dom';
import { PAGE } from '../../pages';
import { usePageMeta } from '../../meta';
import { useSession } from '../../session';
import { PageHeader } from '../../ui/PageHeader';
import { StaleNote } from '../../ui/StaleNote';
import { CatalogGate } from '../../setup/CatalogGate';
import { classLabel } from '../../setup/labels';
import { useCatalog } from '../../setup/useCatalog';
import { SchoolSummarySchema } from '@vidhyasaathy/contracts';
import { useRemote } from '../../setup/useRemote';
import { Skeleton } from '../../ui/Skeleton';
import { ErrorState } from '../../ui/ErrorState';
import './admin.css';

function Sparkline({ value }: { value: number }) {
  const points = `0,22 22,${value ? 16 : 22} 44,${value ? 10 : 22} 66,${value ? 5 : 22}`;
  return <svg className="admin-sparkline" viewBox="0 0 66 26" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function AdminHome() {
  usePageMeta(PAGE.admin.title, PAGE.admin.description);
  const session = useSession();
  const catalog = useCatalog();
  const summary = useRemote('/admin/summary', SchoolSummarySchema);
  const me = session.me;
  if (!me) return null;
  const years = catalog.years.data ?? [];
  const classes = catalog.classes.data ?? [];
  const sections = catalog.sections.data ?? [];
  const subjects = catalog.subjects.data ?? [];
  return (
    <div className="admin-screen admin-dashboard">
      <p className="app-kicker">Overview</p>
      <PageHeader title={me.school.name} description={`${me.profile.name} is signed in as the administrator for ${me.school.name}.`} />
      <StaleNote stale={session.stale} updatedAt={session.updatedAt} message={session.message} testId="updated-at" />
      <StaleNote stale={summary.stale} updatedAt={summary.updatedAt} message={summary.message} />
      {summary.data ? <dl className="summary-grid" aria-label="School overview">
        {([['Classes', summary.data.classes], ['Teachers', summary.data.teachers], ['Students', summary.data.students], ['Activated students', summary.data.activated], ['Pending activation', summary.data.pending], ['Students with a linked parent', summary.data.studentsWithParent]] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd><Sparkline value={value} /></div>)}
      </dl> : summary.status === 'loading' ? <Skeleton /> : <ErrorState title="Could not load school overview" message={summary.message ?? 'Try again.'} onRetry={summary.reload} />}
      <p className="flow-notice">Resource publishing is not available yet.</p>
      <CatalogGate catalog={catalog}>
        <h2 className="text-xl font-semibold">School setup</h2>
        <div className="admin-action-grid" aria-label="School admin shortcuts">
          <Link className="admin-action" to="/admin/setup"><strong>Finish setup</strong><span>School details, year and people</span></Link>
          <Link className="admin-action" to="/admin/announcements"><strong>Post an announcement</strong><span>Keep families in the loop</span></Link>
          <Link className="admin-action" to="/admin/setup?step=roster"><strong>Add students</strong><span>Import a class roster</span></Link>
          <Link className="admin-action" to="/admin/claim-codes"><strong>Print access codes</strong><span>Prepare student handouts</span></Link>
        </div>
        <ul aria-label="School setup" className="mt-3 grid max-w-xl gap-2">
          <li className="break-words">Academic years: {years.length === 0 ? 'none yet' : years.map((year) => year.name).join(', ')}</li>
          <li className="break-words">Classes: {classes.length === 0 ? 'none yet' : classes.map((item) => item.name).join(', ')}</li>
          <li className="break-words">Sections: {sections.length === 0 ? 'none yet' : sections.map((section) => `${classLabel(classes, section.classId)} section ${section.name}`).join(', ')}</li>
          <li className="break-words">Subjects: {subjects.length === 0 ? 'none yet' : subjects.map((subject) => `${classLabel(classes, subject.classId)}: ${subject.name}`).join(', ')}</li>
        </ul>
        <p className="mt-4 flex max-w-xl flex-wrap gap-x-4">
          <Link className="text-link" to="/admin/setup">Open school setup</Link>
          <Link className="text-link" to="/admin/classes">Classes</Link>
          <Link className="text-link" to="/admin/sections">Sections</Link>
          <Link className="text-link" to="/admin/subjects">Subjects</Link>
        </p>
      </CatalogGate>
    </div>
  );
}
