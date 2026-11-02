import type { Role } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import { ROLE_NOUN } from '../roles';
import { useSession } from '../session';
import { EmptyState } from '../ui/EmptyState';
import { PageHeader } from '../ui/PageHeader';
import { StaleNote } from '../ui/StaleNote';
import { StudentHome } from './StudentHome';

const nextStep: Record<Exclude<Role, 'student'>, { label: string; to: string }> = {
  admin: { label: 'Open school setup', to: '/admin/setup' },
  teacher: { label: 'Open your lessons', to: '/teacher/subjects' },
  parent: { label: 'See announcements', to: '/parent/announcements' },
};

const pageFor: Record<Role, 'admin' | 'teacher' | 'student' | 'parent'> = {
  admin: 'admin',
  teacher: 'teacher',
  student: 'student',
  parent: 'parent',
};

export function RoleHome({ role }: { role: Role }) {
  const page = PAGE[pageFor[role]];
  usePageMeta(page.title, page.description);
  const session = useSession();
  const me = session.me;
  if (!me) return <section className="nb-card" role="status" aria-busy="true"><h1 className="nb-h1">Opening your notebook</h1><p>Your saved work will be here in a moment.</p></section>;
  if (role === 'student') {
    return <StudentHome me={me} stale={session.stale} updatedAt={session.updatedAt} message={session.message} />;
  }
  return (
    <>
      <PageHeader title={me.school.name} description={`${me.profile.name} is signed in as the ${ROLE_NOUN[role]} for ${me.school.name}.`} />
      <StaleNote stale={session.stale} updatedAt={session.updatedAt} message={session.message} testId="updated-at" />
      <EmptyState title="There is nothing else to show here yet.">
        <p>This page is only the signed-in home for the {ROLE_NOUN[role]}.</p>
        <Link className="vs-action mt-4 inline-flex" to={nextStep[role].to}>{nextStep[role].label} <span aria-hidden="true">→</span></Link>
      </EmptyState>
    </>
  );
}
