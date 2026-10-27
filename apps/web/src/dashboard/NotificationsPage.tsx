import { NotificationListSchema, NotificationSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { postJson } from '../api/client';
import { formatDue } from '../assessment/present';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useSession } from '../session';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { RemoteBlock } from './RemoteBlock';
import './dashboard.css';

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

  return (
    <section className="dash">
      <header className="dash-banner">
        <h1>Notifications</h1>
        <p>In-app delivery is sent. Email and WhatsApp stay failed until a channel is configured.</p>
      </header>
      {actionError ? <p role="alert">{actionError}</p> : null}
      <RemoteBlock remote={list} title="Could not load notifications">
        {(data) => data.notifications.length ? (
          <ul className="dash-list">
            {data.notifications.map((item) => (
              <li key={item.id} className={item.status === 'failed' ? 'heat-many' : 'heat-none'}>
                {item.href.startsWith('/') ? <Link className="text-link" to={item.href}>{item.title}</Link> : <h2>{item.title}</h2>}
                <p>{item.body}</p>
                <p>{item.channel}. {statusLabel[item.status]}. {formatDue(item.createdAt)}.</p>
                {item.failure ? <p role="status">{item.failure}</p> : null}
                {item.readAt ? <p>Read {formatDue(item.readAt)}.</p> : <Button onClick={() => { void mark(`/notifications/${item.id}/read`); }}>Mark read</Button>}
                {item.status === 'failed' ? <Button variant="secondary" onClick={() => { void mark(`/notifications/${item.id}/retry`); }}>Try delivery again</Button> : null}
              </li>
            ))}
          </ul>
        ) : <p>No notification yet.</p>}
      </RemoteBlock>
      <Link className="text-link" to={`${home}/settings`}>Alert settings</Link>
    </section>
  );
}
