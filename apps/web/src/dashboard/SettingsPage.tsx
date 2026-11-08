import { NotificationSettingsSchema, SaveNotificationSettingsSchema } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { putJson } from '../api/client';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useSession } from '../session';
import { useMutation } from '../setup/useMutation';
import { useRemote } from '../setup/useRemote';
import { useNotebookActions } from '../student/notebook/NotebookShell';
import { PageHead, Toggle } from '../student/notebook/ui';
import '../student/notebook/pages/settings.css';
import { clockFromMinutes, minutesFromClock } from './format';
import { RemoteBlock } from './RemoteBlock';
import './dashboard.css';
import { StudentSettings } from '../student/notebook/screens/polish3c/StudentSettings';
import { SaathyProviderSettings } from './SaathyProviderSettings';

export function SettingsPage() {
  const { me } = useSession();
  return me?.profile.role === 'student' ? <StudentSettings /> : <AccountSettings />;
}

function AccountSettings() {
  usePageMeta(PAGE.alertSettings.title, PAGE.alertSettings.description);
  const session = useSession();
  const remote = useRemote('/notification-settings', NotificationSettingsSchema);
  const mutation = useMutation();
  const [enabled, setEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('vidhyasaathy.language') ?? 'English');
  const [saved, setSaved] = useState(false);
  const signOut = useNotebookActions();
  const [clockError, setClockError] = useState<string | null>(null);
  const role = session.me?.profile.role;

  useEffect(() => {
    if (!remote.data) return;
    setEnabled(remote.data.enabled);
    setQuietStart(clockFromMinutes(remote.data.quietStart));
    setQuietEnd(clockFromMinutes(remote.data.quietEnd));
    setReducedMotion(remote.data.reducedMotion);
    document.documentElement.dataset.motion = remote.data.reducedMotion ? 'reduce' : 'full';
    if (remote.data.reducedMotion) document.documentElement.dataset.reduceMotion = 'reduce';
    else delete document.documentElement.dataset.reduceMotion;
    localStorage.setItem('vs-reduced-motion', remote.data.reducedMotion ? '1' : '0');
  }, [remote.data]);

  return (
    <section className="nb-col">
      <PageHead eyebrow="You" title="Settings" sub="Alerts, language, and motion." />
      <RemoteBlock remote={remote} title="Could not load settings">
        {(data) => (
          <form className="nb-card" onSubmit={(event) => {
            event.preventDefault();
            setSaved(false);
            const start = minutesFromClock(quietStart);
            const end = minutesFromClock(quietEnd);
            if (start === null || end === null) {
              setClockError('Enter a start and end time.');
              return;
            }
            setClockError(null);
            void mutation.submit(SaveNotificationSettingsSchema, {
              enabled, quietStart: start, quietEnd: end, reducedMotion, utcOffsetMinutes: data.utcOffsetMinutes,
            }, async (input) => {
              await putJson('/notification-settings', NotificationSettingsSchema, input);
              setSaved(true);
              remote.reload();
            });
          }}>
            <Toggle on={enabled} onChange={setEnabled} label="Alerts on" />
            <label htmlFor="quiet-start">Quiet hours start</label>
            <input id="quiet-start" type="time" value={quietStart} onChange={(event) => { setQuietStart(event.target.value); }} className="nb-input" />
            <label htmlFor="quiet-end">Quiet hours end</label>
            <input id="quiet-end" type="time" value={quietEnd} onChange={(event) => { setQuietEnd(event.target.value); }} className="nb-input" />
            <p className="nb-meta">Use the same start and end to allow alerts all day.</p>
            <Toggle on={reducedMotion} onChange={(value) => {
              setReducedMotion(value);
              document.documentElement.dataset.motion = value ? 'reduce' : 'full';
              if (value) document.documentElement.dataset.reduceMotion = 'reduce';
              else delete document.documentElement.dataset.reduceMotion;
              localStorage.setItem('vs-reduced-motion', value ? '1' : '0');
            }} label="Reduce motion" />
            <label htmlFor="language">Language</label>
            <select id="language" className="nb-input" value={language} onChange={(event) => { setLanguage(event.target.value); localStorage.setItem('vidhyasaathy.language', event.target.value); }}>
              {['English', 'हिन्दी', 'Hinglish', 'मराठी'].map((name) => <option key={name}>{name}</option>)}
            </select>
            {role === 'student' ? <p><Link className="nb-link" to="/recover">Forgot PIN? Ask your teacher</Link></p> : <p><Link className="nb-link" to="/recover">Password help</Link></p>}
            {clockError ? <p role="alert">{clockError}</p> : null}
            {mutation.formError ? <p role="alert">{mutation.formError}</p> : null}
            {saved ? <p role="status">Saved.</p> : null}
            <button type="submit" className="nb-btn nb-btn--primary" disabled={mutation.pending}>Save settings</button>
            {role === 'student' || role === 'teacher' || role === 'parent' ? <button type="button" className="nb-btn nb-btn--ghost" style={{ color: 'var(--nb-redpen)' }} onClick={signOut.requestSignOut}>Sign out</button> : null}
          </form>
        )}
      </RemoteBlock>
      {role === 'admin' ? <SaathyProviderSettings /> : null}
    </section>
  );
}
