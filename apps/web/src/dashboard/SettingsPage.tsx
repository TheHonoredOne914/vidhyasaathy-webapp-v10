import { NotificationSettingsSchema, SaveNotificationSettingsSchema } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { putJson } from '../api/client';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useSession } from '../session';
import { useMutation } from '../setup/useMutation';
import { useRemote } from '../setup/useRemote';
import { Button } from '../ui/Button';
import { fieldClass } from '../ui/Field';
import { clockFromMinutes, minutesFromClock } from './format';
import { RemoteBlock } from './RemoteBlock';
import './dashboard.css';

export function SettingsPage() {
  usePageMeta(PAGE.alertSettings.title, PAGE.alertSettings.description);
  const session = useSession();
  const remote = useRemote('/notification-settings', NotificationSettingsSchema);
  const mutation = useMutation();
  const [enabled, setEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [saved, setSaved] = useState(false);
  const [clockError, setClockError] = useState<string | null>(null);
  const role = session.me?.profile.role;

  useEffect(() => {
    if (!remote.data) return;
    setEnabled(remote.data.enabled);
    setQuietStart(clockFromMinutes(remote.data.quietStart));
    setQuietEnd(clockFromMinutes(remote.data.quietEnd));
    setReducedMotion(remote.data.reducedMotion);
    document.documentElement.dataset.motion = remote.data.reducedMotion ? 'reduce' : 'full';
    localStorage.setItem('vs-reduced-motion', remote.data.reducedMotion ? '1' : '0');
  }, [remote.data]);

  return (
    <section className="dash">
      <header className="dash-banner">
        <h1>Settings</h1>
        <p className="dash-hand">Your alerts and motion.</p>
      </header>
      <RemoteBlock remote={remote} title="Could not load settings">
        {(data) => (
          <form className="dash-panel" onSubmit={(event) => {
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
            <label className="dash-check"><input type="checkbox" checked={enabled} onChange={(event) => { setEnabled(event.target.checked); }} /> Alerts on</label>
            <label htmlFor="quiet-start">Quiet hours start</label>
            <input id="quiet-start" type="time" value={quietStart} onChange={(event) => { setQuietStart(event.target.value); }} className={fieldClass} />
            <label htmlFor="quiet-end">Quiet hours end</label>
            <input id="quiet-end" type="time" value={quietEnd} onChange={(event) => { setQuietEnd(event.target.value); }} className={fieldClass} />
            <p>Use the same start and end to allow alerts all day. Alerts wait while quiet hours are on.</p>
            <label className="dash-check"><input type="checkbox" checked={reducedMotion} onChange={(event) => { setReducedMotion(event.target.checked); }} /> Reduced motion</label>
            <p>A language choice is not offered.</p>
            {role === 'student' ? <p><Link className="text-link" to="/recover">Ask the school to reset your PIN.</Link></p> : <p><Link className="text-link" to="/recover">Password help</Link></p>}
            <p>Sign out from the menu when you are finished.</p>
            {clockError ? <p role="alert">{clockError}</p> : null}
            {mutation.formError ? <p role="alert">{mutation.formError}</p> : null}
            {saved ? <p role="status">Saved.</p> : null}
            <Button type="submit" disabled={mutation.pending}>Save settings</Button>
          </form>
        )}
      </RemoteBlock>
    </section>
  );
}
