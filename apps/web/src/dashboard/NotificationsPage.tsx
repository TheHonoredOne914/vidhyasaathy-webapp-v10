import { NotificationListSchema, NotificationSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { postJson } from '../api/client';
import { formatDue } from '../assessment/present';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useSession } from '../session';
import { useRemote } from '../setup/useRemote';
import { Chip, PageHead } from '../student/notebook/ui';
import { Scribble } from '../student/notebook/icons';
import { Saathy } from '../student/notebook/Saathy';
import { ScreenState } from '../student/notebook/screens/polish3c/ScreenState';
import { LineIcon } from '../student/notebook/screens/polish3c/LineIcon';
import { PreferenceToggle } from '../student/notebook/screens/polish3c/PreferenceToggle';
import { useNotificationPreferences } from '../student/notebook/screens/polish3c/useNotificationPreferences';
import '../student/notebook/pages/notifications.css';

const statusLabel = { queued: 'Waiting', delivered: 'Delivered', failed: 'Failed' } as const;

export function NotificationsPage() {
  usePageMeta(PAGE.notifications.title, PAGE.notifications.description);
  const session = useSession();
  const list = useRemote('/notifications', NotificationListSchema);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const preferences = useNotificationPreferences();
  const home = session.me ? `/${session.me.profile.role === 'admin' ? 'admin' : session.me.profile.role}` : '/';

  async function mark(path: string) {
    if (pending) return;
    setPending(true);
    setActionError(null);
    try {
      if (path === '/notifications/read-all') await postJson(path, z.object({ updatedAt: z.number() }).strict(), {});
      else await postJson(path, NotificationSchema, {});
      list.reload();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The request could not be completed.');
    } finally {
      setPending(false);
    }
  }

  if (list.status === 'loading' && !list.data) return <ScreenState loading retry={list.reload} />;
  if (list.status === 'error' && !list.data) return <ScreenState error={list.message} retry={list.reload} />;
  const notes = list.data?.notifications ?? [];
  if (session.me?.profile.role === 'student') {
    const unread = notes.filter((item) => item.readAt === null).length;
    const choices = [
      ['notifyHomework', 'Homework from teachers', 'New work and marks'],
      ['notifySessions', "Saathy's nudges", 'Lessons and next steps'],
      ['notifyStreak', 'Streak reminders', 'A gentle daily reminder'],
      ['notifyGame', 'New games', 'When one unlocks'],
      ['notifyParentView', 'Parent updates', 'When your progress is shared'],
    ] as const;
    const actionLabels = { open: 'Open', continue: 'Continue', do_it: 'Do it', score: 'See score' };
    return <div className="nb-grid p3c-notifications">
      <div className="nb-col">
        <div className="nt-head"><header className="nb-head"><h1 className="nb-h1">Notifications</h1><Scribble /><p className="nb-sub">{unread ? `${unread} unread ${unread === 1 ? 'note' : 'notes'} in your notebook` : "You're all caught up."}</p></header>
          <button className="nb-btn nb-btn--quiet" type="button" disabled={pending || !unread} onClick={() => { void mark('/notifications/read-all'); }}><LineIcon name="check" /> Mark all read</button></div>
        {actionError ? <p className="pen" role="alert">{actionError}</p> : null}
        {(['today', 'earlier'] as const).map((group) => <section className="nb-card" key={group}>
          <div className="nb-card__head"><h2 className="nb-h3">{group === 'today' ? 'Today' : 'Earlier'}</h2></div>
          {(list.data?.groups[group] ?? []).map((item) => <article className={`nt${item.readAt === null ? ' new' : ''}`} key={item.id}>
            <div className={`ic nt-icon--${item.kind}`}><LineIcon name={item.topic === 'game' ? 'game' : item.kind === 'announcement' ? 'book' : item.kind === 'parent_summary' ? 'people' : 'bell'} /></div>
            <div><b>{item.title}</b><div className="nb-meta">{item.body}</div>{item.failure ? <p role="status" className="nb-meta">{item.failure}</p> : null}</div>
            <div className="nt-action"><time className="nb-meta" dateTime={new Date(item.createdAt).toISOString()}>{new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(item.createdAt)}</time>
              {item.href.startsWith('/') && !item.href.startsWith('//') ? <Link className="nb-btn nb-btn--ghost nb-btn--sm" to={item.href} onClick={() => { if (!item.readAt) void mark(`/notifications/${item.id}/read`); }}>{actionLabels[item.action]}</Link> : !item.readAt ? <button className="nb-btn nb-btn--ghost nb-btn--sm" disabled={pending} onClick={() => { void mark(`/notifications/${item.id}/read`); }}>Mark read</button> : null}
              {item.status === 'failed' ? <button className="nb-btn nb-btn--quiet nb-btn--sm" disabled={pending} onClick={() => { void mark(`/notifications/${item.id}/retry`); }}>Try delivery again</button> : null}
            </div>
          </article>)}
          {!list.data?.groups[group].length ? <p className="nb-meta">{group === 'today' ? 'No new notes today. Your notebook is ready when you are.' : 'Your earlier notes will stay here.'}</p> : null}
        </section>)}
      </div>
      <aside className="nb-col">
        {!preferences.data ? <ScreenState loading={preferences.status === 'loading'} error={preferences.message} retry={preferences.reload} /> : <>
          <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Tell me about</h2></div>
            {choices.map(([key, title, detail]) => <div className="tg" key={key}><div><b>{title}</b><div className="nb-meta">{detail}</div></div><PreferenceToggle label={title} on={preferences.data![key]} disabled={preferences.pending} onChange={(value) => { void preferences.save({ [key]: value }); }} /></div>)}
          </section>
          <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Quiet hours</h2><PreferenceToggle label="Quiet hours" on={preferences.data.quietAfter21} disabled={preferences.pending} onChange={(value) => { void preferences.save({ quietAfter21: value }); }} /></div><p className="nb-text">Nothing after 9 pm or before 7 am. Sleep matters more than streaks.</p></section>
          {preferences.error ? <p role="alert">{preferences.error} <button className="nb-btn nb-btn--quiet nb-btn--sm" onClick={preferences.reload}>Try again</button></p> : null}
        </>}
        <div className="nb-sticky nb-sticky--blue nt-sleep"><span className="nb-tape" /><div className="nt-sleep-copy"><Saathy mood="sleep" size="3.6rem" /><span>9:00 pm. Saathy kept your place. See you tomorrow.</span></div></div>
        <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Who can reach you here</h2></div><div className="nt-policy"><b>Your teachers</b><Chip tone="green">On</Chip></div><div className="nt-policy"><b>School office</b><Chip tone="green">On</Chip></div><div className="nt-policy"><b>Other students</b><Chip tone="sand">Never</Chip></div></section>
      </aside>
    </div>;
  }
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
