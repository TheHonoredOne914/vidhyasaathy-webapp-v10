import { LoginSchema, MeSchema, PinLoginSchema, SetPinSchema } from '@vidhyasaathy/contracts';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, getJson, inlineFieldErrors, postJson, validateForm } from '../../../api/client';
import { ROLE_HOME } from '../../../roles';
import { useSession } from '../../../session';
import { readStorage, readStudentProfiles, removeStorage, writeStorage } from '../../../storage';
import { Icon } from '../icons';
import { Saathy } from '../Saathy';
import { DemoEntryButtons } from '../../../demo/DemoEntryButtons';
import '../pages/signin-student.css';
import '../shell.css';

const REMEMBER_KEY = 'vidhyasaathy.rememberEmail';
type RoleTab = 'student' | 'teacher' | 'parent';
const LoginResponseSchema = z.union([MeSchema, z.object({ requiresPin: z.literal(true), pinToken: z.string().min(20) })]);
const challengeSchema = z.object({ otpToken: z.string(), otp: z.string().optional() });
const phoneSchema = z.object({ phone: z.string().regex(/^\d{10}$/, 'Enter a 10 digit phone number.') });
const otpSchema = z.object({ otpToken: z.string().min(20), otp: z.string().regex(/^\d{6}$/, 'Enter the 6 digit OTP.') });
const demoStudentsSchema = z.object({ students: z.array(z.object({ id: z.string().uuid(), name: z.string(), school: z.string() })) });

function Boxes({ value, length, onChange, label, secret = false, disabled = false }: { value: string; length: number; onChange: (value: string) => void; label: string; secret?: boolean; disabled?: boolean }) {
  return <div className="boxes">{Array.from({ length }, (_, index) => <input key={index} aria-label={index === 0 ? label : `${label} ${index + 1}`} type={secret ? 'password' : 'text'} disabled={disabled} inputMode="numeric" autoComplete={index === 0 && !secret ? 'one-time-code' : 'off'} maxLength={1} className={`${!disabled && index === value.length ? 'f' : ''} ${value[index] ? '' : 'e'}`} value={value[index] ?? ''} onPaste={(event) => {
    event.preventDefault();
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length - index);
    if (!digits) return;
    onChange((value.slice(0, index) + digits + value.slice(index + digits.length)).slice(0, length));
    const target = event.currentTarget.parentElement?.children[Math.min(index + digits.length, length - 1)];
    if (target instanceof HTMLInputElement) target.focus();
  }} onFocus={(event) => {
    if (index > value.length) {
      const target = event.currentTarget.parentElement?.children[value.length];
      if (target instanceof HTMLInputElement) target.focus();
    } else event.currentTarget.select();
  }} onChange={(event) => {
    const digit = event.target.value.replace(/\D/g, '').slice(-1);
    const next = (value.slice(0, index) + digit + value.slice(index + 1)).slice(0, length);
    onChange(next);
    if (digit && event.target.nextElementSibling instanceof HTMLInputElement) event.target.nextElementSibling.focus();
  }} onKeyDown={(event) => {
    if (event.key === 'Backspace' && !value[index] && event.currentTarget.previousElementSibling instanceof HTMLInputElement) {
      event.preventDefault();
      event.currentTarget.previousElementSibling.focus();
      onChange(value.slice(0, index - 1));
    }
  }} />)}</div>;
}

function Night({ role }: { role: RoleTab }) {
  return <section className="si-r" aria-hidden="true">
    <svg className="stars" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
      {[
        [241, 310, 1, .8], [405, 490, 1, .3], [68, 20, 2, .8], [296, 783, 1, .3], [532, 549, 1.5, .5],
        [176, 108, 1.5, .3], [26, 656, 1.5, .5], [198, 168, 1.5, .5], [381, 88, 1.5, .8], [397, 518, 1, .3],
        [253, 484, 1.5, .3], [560, 307, 1, .5], [586, 721, 1.5, .8], [199, 423, 2, .8], [295, 441, 2, .3],
        [238, 312, 1.5, .3], [83, 47, 2, .8], [287, 531, 2, .8], [351, 148, 1, .3], [422, 207, 2, .5],
        [188, 364, 2, .8], [328, 649, 1, .5], [103, 63, 1, .5], [596, 630, 1, .3], [339, 181, 1.5, .5],
        [26, 43, 1.5, .8], [84, 292, 1.5, .3], [330, 295, 1.5, .3], [420, 635, 1, .5], [196, 454, 1.5, .3],
        [256, 390, 1, .5], [586, 9, 1.5, .3], [465, 173, 1.5, .5], [297, 585, 1, .5], [212, 434, 1, .3],
        [60, 63, 1, .8], [172, 609, 1, .8], [41, 559, 2, .8], [255, 329, 1, .3], [541, 299, 2, .8],
        [205, 489, 1, .3], [449, 420, 2, .3], [224, 431, 2, .3], [438, 220, 2, .3], [32, 37, 1.5, .5],
        [248, 538, 1, .3], [427, 267, 1, .5], [52, 322, 1, .8], [412, 668, 1, .5], [396, 95, 2, .3],
        [586, 169, 1.5, .5], [482, 657, 1.5, .5], [540, 220, 1.5, .5], [401, 508, 1, .5], [195, 45, 2, .8],
        [130, 785, 1.5, .8], [61, 171, 2, .8], [483, 764, 2, .5], [223, 3, 1, .3], [13, 624, 1.5, .3],
        [405, 788, 2, .3], [563, 54, 1, .3], [338, 575, 2, .8], [450, 27, 1, .3], [115, 500, 1.5, .8],
        [142, 42, 1.5, .3], [535, 10, 1.5, .5], [76, 87, 2, .5], [210, 318, 2, .3], [498, 409, 1, .3],
      ].map(([cx, cy, r, opacity], index) => <circle key={index} cx={cx} cy={cy} r={r} fill="#FFFDF8" opacity={opacity} />)}
      {['90 140', '520 620', '470 180', '120 690'].map((point) => <g key={point} transform={`translate(${point})`} stroke="#E8B84A" strokeWidth="2" fill="none"><path d="M0 -8V8M-8 0H8M-5 -5l10 10M5 -5l-10 10" opacity=".7" /></g>)}
    </svg>
    <svg className="moon" viewBox="0 0 40 40"><path d="M28 6a15 15 0 1 0 6 22A12 12 0 0 1 28 6z" fill="none" stroke="#E8B84A" strokeWidth="2" /></svg>
    <Saathy mood={role === 'student' ? 'sleep' : 'happy'} size="13rem" />
    <h2>9:00 pm. Saathy kept your place.</h2>
    <p>{role === 'teacher' ? 'Your class review queue is ready when you are.' : role === 'parent' ? 'A short, honest view of how your child is learning.' : 'Pick up where you stopped, with the same notes and the same doubts.'}</p>
    <div className="nb-sticky" style={{ left: '9%', bottom: '12%', transform: 'rotate(-4deg)' }}><span className="nb-tape" style={{ width: '4rem', top: '-.6rem' }} />Hints first. Never just the answer.</div>
    <div className="nb-sticky nb-sticky--pink" style={{ right: '8%', bottom: '20%', transform: 'rotate(3deg)' }}><span className="nb-tape nb-tape--sky" style={{ width: '4rem', top: '-.6rem' }} />No ranks. Just you vs. last week's you.</div>
  </section>;
}

export function NotebookSignIn() {
  const session = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initial = params.get('role');
  const role: RoleTab = initial === 'parent' || initial === 'teacher' ? initial : 'student';
  const [admin, setAdmin] = useState(false);
  const students = useMemo(readStudentProfiles, []);
  const [demoStudents, setDemoStudents] = useState<z.infer<typeof demoStudentsSchema>['students']>([]);
  useEffect(() => {
    if (role !== 'student' || students.length > 0 || demoStudents.length > 0) return;
    getJson('/auth/demo/students', demoStudentsSchema).then((result) => setDemoStudents(result.students)).catch(() => {});
  }, [role, students.length, demoStudents.length]);
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState(() => readStorage(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => readStorage(REMEMBER_KEY) !== null);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [challenge, setChallenge] = useState<{ otpToken: string; otp?: string } | null>(null);
  const [pinToken, setPinToken] = useState<string | null>(null);
  const [teacherPin, setTeacherPin] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoDemo = import.meta.env.DEV && import.meta.env.VITE_DEMO_AUTO_SIGNIN === 'true';
  const autoStarted = useRef(false);
  const [autoPending, setAutoPending] = useState(autoDemo);
  useEffect(() => {
    if (!autoDemo || session.status === 'loading' || autoStarted.current) return;
    autoStarted.current = true;
    void (async () => {
      try {
        const result = await getJson('/auth/demo/students', demoStudentsSchema);
        const aarav = result.students.find((student) => student.name.toLowerCase() === 'aarav');
        if (!aarav) throw new Error('Demo student Aarav not found.');
        const me = await postJson('/auth/pin-login', MeSchema, { profileId: aarav.id, pin: import.meta.env.VITE_DEMO_AUTO_PIN });
        session.accept(me);
        void navigate(ROLE_HOME[me.profile.role], { replace: true });
      } catch {
        setError('Could not open the demo account. Please sign in manually.');
        setAutoPending(false);
      }
    })();
  }, [autoDemo, session, navigate]);
  if (autoPending) return <div className="si" aria-busy="true">Opening Aarav’s workspace…</div>;
  if (session.status === 'loading') return <div className="si"><section className="si-l" aria-busy="true" aria-label="Opening sign-in"><div className="si-form"><div className="nb-skel" /><div className="nb-skel" /></div></section><Night role={role} /></div>;
  if (session.me && !session.stale) return <Navigate to={ROLE_HOME[session.me.profile.role]} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (role === 'student') {
        const match = students.find((student) => student.name.toLowerCase() === name.trim().toLowerCase())
          ?? demoStudents.find((student) => student.name.toLowerCase() === name.trim().toLowerCase());
        if (!match) { setError('Type a demo student name to continue — Aarav, Meera, Kabir, Priya or Rohan.'); return; }
        const parsed = validateForm(PinLoginSchema, { profileId: match.id, pin });
        if (!parsed.ok) { setError(parsed.fields.pin ?? 'Use a 4 digit PIN.'); return; }
        const me = await postJson('/auth/pin-login', MeSchema, parsed.data);
        session.accept(me);
        void navigate(ROLE_HOME[me.profile.role]);
      } else if (role === 'parent') {
        if (!challenge) {
          const parsed = validateForm(phoneSchema, { phone });
          if (!parsed.ok) { setError(Object.values(parsed.fields)[0] ?? 'Check the phone number.'); return; }
          const result = await postJson('/auth/parent/request-otp', challengeSchema, parsed.data);
          setChallenge({ otpToken: result.otpToken, ...(result.otp ? { otp: result.otp } : {}) });
        } else {
          const parsed = validateForm(otpSchema, { otpToken: challenge.otpToken, otp });
          if (!parsed.ok) { setError(Object.values(parsed.fields)[0] ?? 'Enter the 6 digit code.'); return; }
          const me = await postJson('/auth/parent/verify-otp', MeSchema, parsed.data);
          session.accept(me);
          void navigate(ROLE_HOME[me.profile.role]);
        }
      } else if (pinToken) {
        const parsed = validateForm(SetPinSchema, { pinToken, pin: teacherPin });
        if (!parsed.ok) { setError(parsed.fields.pin ?? 'Choose a 4 digit PIN.'); return; }
        const me = await postJson('/auth/teacher/set-pin', MeSchema, parsed.data);
        session.accept(me);
        void navigate(ROLE_HOME[me.profile.role]);
      } else {
        const parsed = validateForm(LoginSchema, { email, password });
        if (!parsed.ok) { setError(parsed.fields.email ?? parsed.fields.password ?? 'Check your email and password.'); return; }
        if (remember) writeStorage(REMEMBER_KEY, email); else removeStorage(REMEMBER_KEY);
        const result = await postJson('/auth/login', LoginResponseSchema, parsed.data);
        if ('requiresPin' in result) setPinToken(result.pinToken);
        else { session.accept(result); void navigate(ROLE_HOME[result.profile.role]); }
      }
    } catch (caught) {
      if (caught instanceof ApiClientError) {
        const fields = inlineFieldErrors(caught.fields);
        setError(Object.values(fields)[0] ?? caught.message);
      } else setError('The request could not be completed.');
    } finally { setPending(false); }
  }

  const cardBg = role === 'teacher' || admin ? 'var(--nb-sky)' : role === 'parent' ? '#E4F1E2' : 'var(--nb-sticky-yellow)';
  const savedOrDemo = students.length ? students : demoStudents;
  const heading = role === 'teacher' ? 'Good to see you' : role === 'parent' ? "See how your child's doing" : 'Hey, welcome back';
  const sub = role === 'teacher' ? 'Sign in with your school email.' : role === 'parent' ? 'We send a code to the phone number the school has.' : 'Use the name and PIN saved on this browser.';

  return <div className="si">
    <section className="si-l">
      <header className="si-brand"><div className="nb-brand__mark">V</div><div><div className="nb-brand__name">VidhyaSaathy</div><div className="nb-brand__tag">NCERT</div></div><Link className="nb-link" to="/" style={{ marginLeft: 'auto', fontSize: '1rem' }}><Icon name="back" /> Back to home</Link></header>
      <form className="si-form" onSubmit={(event) => { void submit(event); }}>
        <h1>{heading}</h1>
        <svg className="nb-scribble" style={{ width: '9rem' }} viewBox="0 0 140 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 6c20-4 40 3 60-1s45-3 76 0" stroke="#E8B84A" strokeWidth="3.5" fill="none" strokeLinecap="round" /></svg>
        <p className="nb-sub" style={{ marginTop: '.5rem' }}>{sub}</p>
        <nav className="dividers" aria-label="Choose your role">
          {([['student', 'Student', 'cap', 's'], ['teacher', 'Teacher', 'board', 't'], ['parent', 'Parent', 'heart', 'p']] as const).map(([id, label, icon, tone]) => <Link key={id} className={`dv ${tone}${role === id ? ' is-active' : ''}`} aria-current={role === id ? 'page' : undefined} to={id === 'student' ? '/signin/student' : `/signin?role=${id}`} onClick={() => { setAdmin(false); setError(null); setPinToken(null); }}><Icon name={icon} />{label}</Link>)}
        </nav>
        <div className="si-card" style={{ background: cardBg }}>
          {role === 'student' ? <>
            <div className="nb-field"><span className="nb-label">Class code</span><Boxes value="" length={6} label="Class code" onChange={() => {}} disabled /><span className="nb-meta">Demo mode: type any demo student name below and any 4-digit PIN opens the notebook.</span></div>
            {savedOrDemo.length ? <div className="nb-field"><span className="nb-label">{students.length ? 'On this browser' : 'Demo students'}</span><div>{savedOrDemo.map((student) => <button type="button" key={student.id} className="nb-btn nb-btn--ghost nb-btn--sm" style={{ margin: '0 .4rem .4rem 0' }} onClick={() => { setName(student.name); }}>{student.name}</button>)}</div></div> : null}
            <div className="nb-field"><label className="nb-label" htmlFor="student-name">Your name</label><input id="student-name" className="nb-input nb-input--lined" value={name} onChange={(event) => { setName(event.target.value); }} autoComplete="name" />{error ? <span className="pen" role="alert">{error}</span> : <span className="nb-meta">{students.length ? 'Pick a saved name, then your PIN.' : 'Pick a demo student name — any 4-digit PIN works.'}</span>}</div>
            <div className="nb-field"><span className="nb-label">4-digit PIN</span><Boxes value={pin} length={4} label="PIN" onChange={setPin} secret /></div>
            <button className="nb-btn nb-btn--primary nb-btn--lg" style={{ justifyContent: 'center' }} disabled={pending} type="submit">{pending ? 'Opening…' : 'Open my notebook'} <Icon name="arrow" /></button>
            <div className="si-foot"><Link className="nb-link" to="/recover" style={{ fontSize: '1rem' }}>Forgot PIN? Ask your teacher</Link><span>No email needed</span></div>
          </> : role === 'parent' ? <>
            <div className="nb-field"><label className="nb-label" htmlFor="parent-phone">Phone number</label><input id="parent-phone" className="nb-input" inputMode="numeric" maxLength={10} value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); }} autoComplete="tel" /></div>
            <div className="nb-field"><span className="nb-label">6-digit code</span><Boxes value={otp} length={6} label="OTP" onChange={setOtp} disabled={!challenge} />{challenge?.otp ? <span className="nb-meta" role="status">Dev code {challenge.otp}</span> : <span className="nb-meta">{challenge ? 'Enter the code sent to your phone.' : 'Enter your phone number to request a code.'}</span>}</div>
            <div className="nb-field"><label className="nb-label" htmlFor="parent-child-code">Child code <span className="nb-meta">(on the school letter)</span></label><input id="parent-child-code" className="nb-input" value="" placeholder="School-linked account" disabled /><span className="nb-meta">Your school links your children to this account. A child code isn't needed here.</span></div>
            {error ? <span className="pen" role="alert">{error}</span> : null}
            <button className="nb-btn nb-btn--primary nb-btn--lg" style={{ justifyContent: 'center' }} disabled={pending} type="submit">{pending ? 'Opening…' : 'See the progress report'} <Icon name="arrow" /></button>
            <div className="si-foot"><span>You'll see progress, not chats.</span><Link className="nb-link" to="/recover" style={{ fontSize: '1rem' }}>Need help?</Link></div>
          </> : <>
            {pinToken ? <div className="nb-field"><span className="nb-label">Choose a PIN</span><Boxes value={teacherPin} length={4} label="PIN" onChange={setTeacherPin} secret /></div> : <>
              <div className="nb-field"><label className="nb-label" htmlFor="staff-email">{admin ? 'Admin email' : 'School email'}</label><input id="staff-email" className="nb-input" type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (remember) writeStorage(REMEMBER_KEY, event.target.value); }} autoComplete="username" /></div>
              <div className="nb-field"><label className="nb-label" htmlFor="staff-password">Password</label><input id="staff-password" className="nb-input" type="password" value={password} onChange={(event) => { setPassword(event.target.value); }} autoComplete="current-password" /></div>
              <div className="si-remember"><label className="nb-text"><input type="checkbox" checked={remember} onChange={(event) => { const next = event.target.checked; setRemember(next); if (next) writeStorage(REMEMBER_KEY, email); else removeStorage(REMEMBER_KEY); }} />Remember my school email</label><Link className="nb-link" to="/recover" style={{ fontSize: '1rem' }}>Forgot password?</Link></div>
            </>}
            {error ? <span className="pen" role="alert">{error}</span> : null}
            <button className="nb-btn nb-btn--primary nb-btn--lg" style={{ justifyContent: 'center' }} disabled={pending} type="submit">{pending ? 'Opening…' : admin ? 'Open the school desk' : 'Go to my classes'} <Icon name="arrow" /></button>
            <div className="si-foot"><span>New school? Your admin sends you an invite.</span><button type="button" className="nb-link" style={{ fontSize: '1rem' }} onClick={() => { setAdmin((current) => !current); setError(null); }}>{admin ? 'Teacher sign-in' : 'School admin sign-in'}</button></div>
          </>}
        </div>
        <DemoEntryButtons />
      </form>
    </section>
    <Night role={role} />
  </div>;
}
