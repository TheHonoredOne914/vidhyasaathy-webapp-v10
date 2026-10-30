import { StudentEnrollmentSchema, StudentHomeSchema } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../../../meta';
import { PAGE } from '../../../../pages';
import { useSession } from '../../../../session';
import { useRemote } from '../../../../setup/useRemote';
import { useNotebookActions } from '../../NotebookShell';
import { Saathy } from '../../Saathy';
import { Scribble } from '../../icons';
import { LineIcon } from './LineIcon';
import { PreferenceToggle } from './PreferenceToggle';
import { ScreenState } from './ScreenState';
import { useNotificationPreferences } from './useNotificationPreferences';

function UnavailableChoices({ values, label }: { values: string[]; label: string }) {
  return <div className="opt-row" aria-label={label}>{values.map((value) => <button className="c" type="button" disabled key={value}>{value}</button>)}</div>;
}

export function StudentSettings() {
  usePageMeta(PAGE.alertSettings.title, PAGE.alertSettings.description);
  const { me } = useSession();
  const actions = useNotebookActions();
  const preferences = useNotificationPreferences();
  const enrollment = useRemote('/student/enrollment', StudentEnrollmentSchema);
  const home = useRemote('/student/home', StudentHomeSchema);
  const [bigger, setBigger] = useState(() => localStorage.getItem('vs-bigger-text') === '1');
  const [plain, setPlain] = useState(() => localStorage.getItem('vs-plain-font') === '1');

  useEffect(() => {
    document.documentElement.dataset.biggerText = String(bigger);
    document.documentElement.dataset.plainFont = String(plain);
    localStorage.setItem('vs-bigger-text', bigger ? '1' : '0');
    localStorage.setItem('vs-plain-font', plain ? '1' : '0');
  }, [bigger, plain]);
  useEffect(() => {
    if (!preferences.data) return;
    const reduced = preferences.data.reducedMotion;
    document.documentElement.dataset.motion = reduced ? 'reduce' : 'full';
    if (reduced) document.documentElement.dataset.reduceMotion = 'reduce';
    else delete document.documentElement.dataset.reduceMotion;
    localStorage.setItem('vs-reduced-motion', reduced ? '1' : '0');
  }, [preferences.data]);

  return <div className="nb-grid p3c-settings">
    <div className="nb-col">
      <header className="nb-head st-head"><h1 className="nb-h1">Settings</h1><Scribble /><p className="nb-sub">Make VidhyaSaathy work the way you do.</p></header>
      <div className="st-grid">
        <section className="nb-card">
          <div className="nb-card__head"><h2 className="nb-h3">Learn your way</h2></div>
          <div className="nb-meta">How Saathy explains new ideas first</div>
          <UnavailableChoices label="Explanation style" values={['Notes', 'Story', 'Diagram', 'Exam style']} />
          <div className="nb-meta st-label">When you're stuck</div>
          <UnavailableChoices label="Help style" values={['Hints first', 'Explain fully']} />
          <div className="nb-meta st-label">Questions per practice set</div>
          <UnavailableChoices label="Practice length" values={['5', '8', '12']} />
          <p className="nb-meta st-label">Learning preferences aren't available yet.</p>
        </section>
        <section className="nb-card">
          <div className="nb-card__head"><h2 className="nb-h3">Daily goal</h2><span className="nb-meta">resets at midnight</span></div>
          <UnavailableChoices label="Daily minutes" values={['10 min', '15 min', '25 min', '40 min']} />
          <div className="nb-meta st-label">Remind me at</div>
          <UnavailableChoices label="Reminder time" values={['Change']} />
          <p className="nb-meta st-label">A minutes goal and reminder time aren't available yet.</p>
          {home.data ? <div className="nb-sticky st-goal">{home.data.todaysGoal.total ? `${home.data.todaysGoal.done} of ${home.data.todaysGoal.total} notebook tasks done today. Nice and steady.` : 'Your next notebook task will appear here.'}</div> : <ScreenState loading={home.status === 'loading'} error={home.message} retry={home.reload} />}
        </section>
        <section className="nb-card">
          <div className="nb-card__head"><h2 className="nb-h3">Easier to read</h2></div>
          <div className="st-toggle"><div><b className="nb-row__t">Bigger text</b><div className="nb-meta">All notes and questions</div></div><PreferenceToggle on={bigger} label="Bigger text" onChange={setBigger} /></div>
          <div className="st-toggle"><div><b className="nb-row__t">Plain font for notes</b><div className="nb-meta">Swap handwriting for print</div></div><PreferenceToggle on={plain} label="Plain font for notes" onChange={setPlain} /></div>
          {preferences.data ? <div className="st-toggle"><div><b className="nb-row__t">Reduce motion</b><div className="nb-meta">Fewer animations</div></div><PreferenceToggle on={preferences.data.reducedMotion} disabled={preferences.pending} label="Reduce motion" onChange={(value) => { void preferences.save({ reducedMotion: value }); }} /></div> : <ScreenState loading={preferences.status === 'loading'} error={preferences.message} retry={preferences.reload} />}
          {preferences.error ? <p role="alert">{preferences.error}</p> : null}
          <div className="nb-card nb-card--flat st-preview"><span className="nb-meta">Preview</span><div className="nb-note">Acceleration is how fast <span className="nb-hl">velocity</span> changes.</div></div>
          <p className="nb-meta">Text and font choices stay on this browser.</p>
        </section>
        <section className="nb-card">
          <div className="nb-card__head"><h2 className="nb-h3">Language</h2></div><div className="nb-meta">Saathy can explain in</div>
          <UnavailableChoices label="Explanation language" values={['English', 'हिन्दी', 'Hinglish', 'मराठी']} />
          <div className="nb-meta st-label">Questions and notes stay in English, as in your NCERT book.</div>
          <p className="nb-meta st-label">Changing explanation language isn't available yet.</p>
        </section>
      </div>
    </div>
    <aside className="nb-col">
      <section className="nb-card st-profile"><span className="nb-tape" /><div className="nb-avatar">{me?.profile.name.slice(0, 1)}</div><h2 className="nb-h2">{me?.profile.name}</h2>
        {enrollment.data ? <div className="nb-meta">{[enrollment.data.className, enrollment.data.sectionName, enrollment.data.rollNumber ? `Roll ${enrollment.data.rollNumber}` : null, me?.school.name].filter(Boolean).join(' · ')}</div> : <ScreenState loading={enrollment.status === 'loading'} error={enrollment.message} retry={enrollment.reload} />}
        <Link className="nb-btn nb-btn--ghost nb-btn--sm st-label" to="/recover">Change PIN</Link><p className="nb-meta">Ask your teacher for a PIN reset.</p>
      </section>
      <section className="nb-card"><div className="nb-card__head"><h2 className="nb-h3">Account</h2></div>
        <Link className="lk" to="/privacy">Privacy &amp; what's shared<LineIcon name="arrow" /></Link>
        <div className="lk">Linked parent<span className="nb-meta">Ask your teacher</span></div>
        <Link className="lk" to="/recover">Help &amp; feedback<LineIcon name="arrow" /></Link>
        <button type="button" className="lk st-signout" onClick={actions.requestSignOut}>Sign out<LineIcon name="arrow" /></button>
        <div className="nb-saathy-tip st-label"><Saathy size={52} /><div className="nb-text">Your parent sees progress and homework, never your chats with me.</div></div>
      </section>
    </aside>
  </div>;
}
