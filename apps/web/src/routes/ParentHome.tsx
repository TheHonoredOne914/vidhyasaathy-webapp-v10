import { ChildListSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { RemoteBlock } from '../dashboard/RemoteBlock';
import '../dashboard/dashboard.css';
import { usePageMeta } from '../meta';
import { useSession } from '../session';
import { useRemote } from '../setup/useRemote';
import { PAGE } from '../pages';

export function ParentHome() {
  usePageMeta(PAGE.parent.title, PAGE.parent.description);
  const { me } = useSession();
  const children = useRemote('/parent/children', ChildListSchema);
  return <div className="dash">
    <header className="parent-welcome">
      <div>
        <p className="dash-kicker">Your family learning desk</p>
        <h1>Hello, {me?.profile.name ?? 'parent'}</h1>
        <p>See the learning moments that matter, at a glance.</p>
      </div>
      <div className="parent-cloud" aria-hidden="true"><span>Saathy</span></div>
    </header>
    <RemoteBlock remote={children} title="Could not load your children">
      {(data) => data.length === 0 ? (
        <article className="dash-panel parent-empty"><p>No child is linked to this account. Contact your school to check your child’s link.</p><Link className="text-link" to="/recover">Get account help</Link></article>
      ) : <>
        <div className="section-heading"><div><p className="dash-kicker">Linked learners</p><h2>Choose a child</h2></div><span>{data.length} {data.length === 1 ? 'learner' : 'learners'}</span></div>
        <div className="child-switcher" aria-label="Linked children">
          {data.map((child, index) => (
            <Link className={`child-card ${index === 0 ? 'is-featured' : ''}`} key={child.id} to={`/parent/children/${child.id}`}>
              <span className="child-avatar" aria-hidden="true">{child.name.slice(0, 1)}</span>
              <span className="child-card-copy"><strong>{child.name}</strong><small>{child.className ? `${child.className} · Section ${child.sectionName ?? '—'}` : 'Class not assigned yet.'}</small></span>
              <span className="child-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </>}
    </RemoteBlock>
    <aside className="privacy-note"><span aria-hidden="true">✦</span><p><strong>A calm view for families.</strong> Private student chats are never shown here. You’ll only see learning progress, assigned work and school updates.</p></aside>
  </div>;
}
