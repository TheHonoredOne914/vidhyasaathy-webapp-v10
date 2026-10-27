import { Link } from 'react-router-dom';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import { ROLE_HOME } from '../roles';
import { useSession } from '../session';
import { Skeleton } from '../ui/Skeleton';
import '../theme/vs-theme.css';

export function AccessDenied() {
  usePageMeta(PAGE.accessDenied.title, PAGE.accessDenied.description);
  const session = useSession();
  if (session.status === 'loading') return <div className="vs-page"><Skeleton /></div>;
  return (
    <section className="vs-page vs-status-page" aria-labelledby="access-denied-title">
      <div className="vs-card vs-status-card">
        <p className="vs-eyebrow">Role-based access</p>
          <h1 id="access-denied-title">This page isn’t available for this account.</h1>
          <p className="vs-status-description">{session.me ? 'Return home to see what is available to you.' : 'Sign in to open your school workspace.'}</p>
        {session.me ? (
            <Link className="vs-action" to={ROLE_HOME[session.me.profile.role]}>Go home <span aria-hidden="true">→</span></Link>
        ) : (
          <Link className="vs-action" to="/signin">Sign in <span aria-hidden="true">→</span></Link>
        )}
      </div>
    </section>
  );
}
