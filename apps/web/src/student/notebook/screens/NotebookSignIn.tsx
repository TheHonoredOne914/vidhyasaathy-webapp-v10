import { LoginSchema, MeSchema, PinLoginSchema, SetPinSchema } from '@vidhyasaathy/contracts';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { ApiClientError, inlineFieldErrors, postJson, validateForm } from '../../../api/client';
import { ROLE_HOME } from '../../../roles';
import { useSession } from '../../../session';
import { readStorage, readStudentProfiles, removeStorage, writeStorage } from '../../../storage';
import { Icon } from '../icons';
import { Saathy } from '../Saathy';
import '../pages/signin-student.css';
import '../shell.css';

const REMEMBER_KEY = 'vidhyasaathy.rememberEmail';
type RoleTab = 'student' | 'teacher' | 'parent';
const LoginResponseSchema = z.union([MeSchema, z.object({ requiresPin: z.literal(true), pinToken: z.string().min(20) })]);
const challengeSchema = z.object({ otpToken: z.string(), otp: z.string().optional() });
const phoneSchema = z.object({ phone: z.string().regex(/^\d{10}$/, 'Enter a 10 digit phone number.') });
const otpSchema = z.object({ otpToken: z.string().min(20), otp: z.string().regex(/^\d{6}$/, 'Enter the 6 digit OTP.') });

function Boxes({ value, length, onChange, label }: { value: string; length: number; onChange: (value: string) => void; label: string }) {
  return <div className="boxes">{Array.from({ length }, (_, index) => <input key={index} aria-label={index === 0 ? label : `${label} ${index + 1}`} inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'} maxLength={1} className={`${index === value.length ? 'f' : ''} ${value[index] ? '' : 'e'}`} value={value[index] ?? ''} onChange={(event) => {
    const digit = event.target.value.replace(/\D/g, '').slice(-1);
    const next = (value.slice(0, index) + digit + value.slice(index + 1)).slice(0, length);
    onChange(next);
    if (digit && event.target.nextElementSibling instanceof HTMLInputElement) event.target.nextElementSibling.focus();
  }} onKeyDown={(event) => {
    if (event.key === 'Backspace' && !value[index] && event.currentTarget.previousElementSibling instanceof HTMLInputElement) {
      event.currentTarget.previousElementSibling.focus();
      onChange(value.slice(0, index - 1));
    }
  }} />)}</div>;
}

function Night({ role }: { role: RoleTab }) {
  return <section className="si-r" aria-hidden="true">
    <svg className="stars" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice"><circle cx="80" cy="40" r="1.5" fill="#FFFDF8" /><circle cx="240" cy="120" r="1" fill="#FFFDF8" opacity=".6" /><circle cx="420" cy="70" r="2" fill="#FFFDF8" /><circle cx="520" cy="200" r="1" fill="#FFFDF8" opacity=".5" /><circle cx="140" cy="300" r="1.5" fill="#FFFDF8" opacity=".7" /><circle cx="360" cy="420" r="1" fill="#FFFDF8" /><circle cx="80" cy="640" r="1.5" fill="#FFFDF8" opacity=".5" /><circle cx="500" cy="700" r="2" fill="#FFFDF8" opacity=".8" /></svg>
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
  const [role, setRole] = useState<RoleTab>(initial === 'parent' || initial === 'teacher' || initial === 'student' ? initial : window.location.pathname.endsWith('/student') ? 'student' : 'student');
  const [admin, setAdmin] = useState(false);
  const students = useMemo(readStudentProfiles, []);
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
  if (session.status === 'loading') return <p className="nb-empty" style={{ padding: '2rem' }}>Opening…</p>;
  if (session.me && !session.stale) return <Navigate to={ROLE_HOME[session.me.profile.role]} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      if (role === 'student') {
        const match = students.find((student) => student.name.toLowerCase() === name.trim().toLowerCase());
        if (!match) { setError(students.length ? 'That name is not on this browser yet. Pick a saved name, or ask your teacher.' : 'This browser has no student notebook yet. Ask your teacher for the activation code.'); return; }
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
  const heading = role === 'teacher' ? 'Good to see you' : role === 'parent' ? "See how your child's doing" : 'Hey, welcome back';
  const sub = role === 'teacher' ? 'Sign in with your school email.' : role === 'parent' ? 'We send a code to the phone number the school has.' : 'Use the name and PIN saved on this browser.';

  return <div className="si">
    <section className="si-l">
      <header className="si-brand"><div className="nb-brand__mark">V</div><div><div className="nb-brand__name">VidhyaSaathy</div><div className="nb-brand__tag">Class 9 · NCERT</div></div><Link className="nb-link" to="/" style={{ marginLeft: 'auto', fontSize: '1rem' }}><Icon name="back" /> Back to home</Link></header>
      <form className="si-form" onSubmit={(event) => { void submit(event); }}>
        <h1>{heading}</h1>
        <svg className="nb-scribble" style={{ width: '9rem' }} viewBox="0 0 140 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 6c20-4 40 3 60-1s45-3 76 0" stroke="#E8B84A" strokeWidth="3.5" fill="none" strokeLinecap="round" /></svg>
        <p className="nb-sub" style={{ marginTop: '.5rem' }}>{sub}</p>
        <nav className="dividers" aria-label="Choose your role">
          {([['student', 'Student', 'cap', 's'], ['teacher', 'Teacher', 'board', 't'], ['parent', 'Parent', 'heart', 'p']] as const).map(([id, label, icon, tone]) => <Link key={id} className={`dv ${tone}${role === id ? ' is-active' : ''}`} to={id === 'student' ? '/signin/student' : `/signin?role=${id}`} onClick={() => { setRole(id); setAdmin(false); setError(null); }}><Icon name={icon} />{label}</Link>)}
        </nav>
        <div className="si-card" style={{ background: cardBg }}>
          {role === 'student' ? <>
            {students.length ? <div className="nb-field"><span className="nb-label">On this browser</span><div>{students.map((student) => <button type="button" key={student.id} className="nb-btn nb-btn--ghost nb-btn--sm" style={{ margin: '0 .4rem .4rem 0' }} onClick={() => { setName(student.name); }}>{student.name}</button>)}</div></div> : null}
            <div className="nb-field"><label className="nb-label" htmlFor="student-name">Your name</label><input id="student-name" className="nb-input nb-input--lined" value={name} onChange={(event) => { setName(event.target.value); }} autoComplete="name" />{error ? <span className="pen" role="alert">{error}</span> : <span className="nb-meta">{students.length ? 'Pick a saved name, then your PIN.' : 'Ask your teacher to activate this notebook first.'}</span>}</div>
            <div className="nb-field"><span className="nb-label">4-digit PIN</span><Boxes value={pin} length={4} label="PIN" onChange={setPin} /></div>
            <button className="nb-btn nb-btn--primary nb-btn--lg" style={{ justifyContent: 'center' }} disabled={pending} type="submit">{pending ? 'Opening…' : 'Open my notebook'} <Icon name="arrow" /></button>
            <div className="si-foot"><Link className="nb-link" to="/recover" style={{ fontSize: '1rem' }}>Forgot PIN? Ask your teacher</Link><span>No email needed</span></div>
          </> : role === 'parent' ? <>
            <div className="nb-field"><label className="nb-label" htmlFor="parent-phone">Phone number</label><input id="parent-phone" className="nb-input" inputMode="numeric" maxLength={10} value={phone} onChange={(event) => { setPhone(event.target.value.replace(/\D/g, '').slice(0, 10)); }} autoComplete="tel" /></div>
            {challenge ? <div className="nb-field"><span className="nb-label">6-digit code</span><Boxes value={otp} length={6} label="OTP" onChange={setOtp} />{challenge.otp ? <span className="nb-meta" role="status">Dev code {challenge.otp}</span> : <span className="nb-meta">Enter the code sent to your phone.</span>}</div> : null}
            {error ? <span className="pen" role="alert">{error}</span> : null}
            <button className="nb-btn nb-btn--primary nb-btn--lg" style={{ justifyContent: 'center' }} disabled={pending} type="submit">{pending ? 'Opening…' : 'See the progress report'} <Icon name="arrow" /></button>
            <div className="si-foot"><span>You'll see progress, not chats.</span><Link className="nb-link" to="/recover" style={{ fontSize: '1rem' }}>Need help?</Link></div>
          </> : <>
            {pinToken ? <div className="nb-field"><span className="nb-label">Choose a PIN</span><Boxes value={teacherPin} length={4} label="PIN" onChange={setTeacherPin} /></div> : <>
              <div className="nb-field"><label className="nb-label" htmlFor="staff-email">{admin ? 'Admin email' : 'School email'}</label><input id="staff-email" className="nb-input" type="email" value={email} onChange={(event) => { setEmail(event.target.value); if (remember) writeStorage(REMEMBER_KEY, event.target.value); }} autoComplete="username" /></div>
              <div className="nb-field"><label className="nb-label" htmlFor="staff-password">Password</label><input id="staff-password" className="nb-input" type="password" value={password} onChange={(event) => { setPassword(event.target.value); }} autoComplete="current-password" /></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span className="nb-text" style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}><button type="button" className={remember ? 'nb-toggle is-on' : 'nb-toggle'} aria-pressed={remember} onClick={() => { const next = !remember; setRemember(next); if (next) writeStorage(REMEMBER_KEY, email); else removeStorage(REMEMBER_KEY); }} /><span>Keep me signed in on this laptop</span></span><Link className="nb-link" to="/recover" style={{ fontSize: '1rem' }}>Forgot password?</Link></div>
            </>}
            {error ? <span className="pen" role="alert">{error}</span> : null}
            <button className="nb-btn nb-btn--primary nb-btn--lg" style={{ justifyContent: 'center' }} disabled={pending} type="submit">{pending ? 'Opening…' : admin ? 'Open the school desk' : 'Go to my classes'} <Icon name="arrow" /></button>
            <div className="si-foot"><span>New school? Your admin sends you an invite.</span><button type="button" className="nb-link" style={{ fontSize: '1rem' }} onClick={() => { setAdmin((current) => !current); setError(null); }}>{admin ? 'Teacher sign-in' : 'School admin sign-in'}</button></div>
          </>}
        </div>
      </form>
    </section>
    <Night role={role} />
  </div>;
}
