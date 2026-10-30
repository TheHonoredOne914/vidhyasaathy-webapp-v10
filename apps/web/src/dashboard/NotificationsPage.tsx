import { NotificationListSchema, NotificationSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { postJson } from '../api/client';
import { formatDue } from '../assessment/present';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useSession } from '../session';
import { useRemote } from '../setup/useRemote';
import { PageHead } from '../student/notebook/ui';
import '../student/notebook/pages/notifications.css';

const statusLabel = { queued: 'Waiting', delivered: 'Delivered', failed: 'Failed' } as const;

export function NotificationsPage() {
  usePageMeta(PAGE.notifications.title, PAGE.notifications.description);
  const session = useSession();
  const list = useRemote('/notifications', NotificationListSchema);
  const [actionError, setActionError] = useState<string | null>(null);
  const home = session.me ? `/${session.me.profile.role === 'admin' ? 'admin' : session.me.profile.role}` : '/';

  async function mark(path: string) {
    setActionError(null);
    try {
      await postJson(path, NotificationSchema, {});
      list.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The request could not be completed.');
    }
  }

  if (list.status === 'loading' && !list.data) return <div className="nb-skel" />;
  if (list.status === 'error' && !list.data) return <p className="nb-empty" role="alert">Could not load notifications. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={list.reload}>Try again</button></p>;
  const notes = list.data?.notifications ?? [];
  return (
    <div className="nb-col">
      <PageHead eyebrow="Inbox" title="Notifications" sub="Notes from school land here." />
      {actionError ? <p role="alert" className="pen">{actionError}</p> : null}
      {notes.length ? notes.map((item) => (
        <article className="nb-card" key={item.id}>
          {item.href.startsWith('/') ? <Link className="nb-h3" to={item.href}>{item.title}</Link> : <h2 className="nb-h3">{item.title}</h2>}
          <p className="nb-text">{item.body}</p>
          <p className="nb-meta">{statusLabel[item.status]}. {formatDue(item.createdAt)}.</p>
          {item.failure ? <p role="status">{item.failure}</p> : null}
          {item.readAt ? <p className="nb-meta">Read {formatDue(item.readAt)}.</p> : <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={() => { void mark(`/notifications/${item.id}/read`); }}>Mark read</button>}
          {item.status === 'failed' ? <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={() => { void mark(`/notifications/${item.id}/retry`); }}>Try delivery again</button> : null}
        </article>
      )) : <p className="nb-empty">No notification yet.</p>}
      <Link className="nb-link" to={`${home}/settings`}>Alert settings</Link>
    </div>
  );
}
