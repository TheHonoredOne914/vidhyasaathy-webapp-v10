import { LoginSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { AuthIcon } from '../auth/AuthIcon';
import { AuthField as Field } from '../auth/AuthField';
import { AuthLayout, AuthScene } from '../auth/AuthLayout';
import { StudentAccess } from '../auth/StudentAccess';
import { ParentOtpForm } from '../auth/OtpAccess';
import { TeacherAccess } from '../auth/TeacherAccess';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { ROLE_HOME } from '../roles';
import { useSession } from '../session';
import { readStorage, removeStorage, writeStorage } from '../storage';
import { Skeleton } from '../ui/Skeleton';
import { AuthForm } from './AuthForm';

const REMEMBER_KEY = 'vidhyasaathy.rememberEmail';

const ROLES = [
  { id: 'student', label: 'Student', icon: 'student', note: 'Learn, practice\nand grow' },
  { id: 'teacher', label: 'Teacher', icon: 'teacher', note: 'Create, guide\nand inspire' },
  { id: 'admin', label: 'School Admin', icon: 'school', note: 'Connect, manage\nand empower' },
  { id: 'parent', label: 'Parent', icon: 'parent', note: 'See, support\nand celebrate' },
] as const;

export function SignIn() {
  usePageMeta(PAGE.signIn.title, PAGE.signIn.description);
  const session = useSession();
  const location = useLocation();
  const state = location.state as { message?: unknown } | null;
  const message = typeof state?.message === 'string' ? state.message : session.message;
  const [role, setRole] = useState<'student' | 'teacher' | 'admin' | 'parent'>('teacher');
  const [email, setEmail] = useState(() => readStorage(REMEMBER_KEY) ?? '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(() => readStorage(REMEMBER_KEY) !== null);
  if (session.status === 'loading') return <Skeleton />;
  if (session.me && !session.stale) return <Navigate to={ROLE_HOME[session.me.profile.role]} replace />;

  function onEmail(value: string) {
    setEmail(value);
    if (remember) writeStorage(REMEMBER_KEY, value);
  }

  function onRemember(checked: boolean) {
    setRemember(checked);
    if (checked) writeStorage(REMEMBER_KEY, email);
    else removeStorage(REMEMBER_KEY);
  }

  return (
    <AuthLayout>
      <section className="vs-auth-signin">
        <div className="vs-auth-intro">
          <span className="vs-auth-eyebrow">sign in</span>
          <h1>Welcome back.</h1>
          <p>Pick your divider, then write in your details.</p>
        </div>
        {message ? <p role="status" className="vs-auth-message">{message}</p> : null}
        <div className="vs-auth-signin-card">
          <div className="vs-auth-role-heading"><h2>Sign in as</h2><p>A space that feels like yours.</p></div>
          <div className="vs-auth-roles" role="group" aria-label="Choose your role">
            {ROLES.map((item) => <button type="button" key={item.id} className={`vs-auth-role vs-auth-role--${item.id}`} aria-pressed={role === item.id} onClick={() => { setRole(item.id); setPassword(''); }}>
              <AuthIcon name={item.icon} size={18} />
              <strong>{item.label}</strong><span>{item.note}</span>
              <span className="vs-auth-role-indicator"><AuthIcon name={role === item.id ? 'check' : 'arrow'} size={14} /></span>
            </button>)}
          </div>
          <h2 className="vs-auth-divider"><AuthIcon name={role === 'student' ? 'student' : role === 'admin' ? 'school' : role === 'parent' ? 'parent' : 'teacher'} size={22} />{role === 'student' ? 'Student' : role === 'admin' ? 'School admin' : role === 'parent' ? 'Parent' : 'Teacher'}</h2>
          <p className="vs-auth-form-hint">{role === 'student' ? 'Your school gave you an activation code. Use it once, then sign in with your PIN.' : role === 'parent' ? 'Use the phone number linked to your children.' : 'Use the email your school knows you by.'}</p>
          {role === 'student' ? <StudentAccess /> : role === 'parent' ? <ParentOtpForm /> : role === 'teacher' ? <TeacherAccess email={email} onEmail={onEmail} password={password} onPassword={setPassword} remember={remember} onRemember={onRemember} /> : <AuthForm key={role} bare submitIcon formClassName="vs-auth-form" title={PAGE.signIn.title} heading="Welcome back!" description={PAGE.signIn.description} schema={LoginSchema} values={{ email, password }} submitLabel="Sign in" pendingLabel="Signing in" path="/auth/login">
            {(errorFor) => <>
              <Field label="Email" name="email" type="email" value={email} onChange={onEmail} error={errorFor('email')} hint={null} autoComplete="username" inputMode="email" maxLength={254} placeholder="Enter your school email" icon={<AuthIcon name="mail" />} />
              <Field label="Password" name="password" type="password" value={password} onChange={setPassword} error={errorFor('password')} hint={null} autoComplete="current-password" maxLength={128} placeholder="Enter your password" reveal icon={<AuthIcon name="lock" />} />
              <div className="vs-auth-options"><label><input type="checkbox" checked={remember} onChange={(event) => { onRemember(event.target.checked); }} /> Remember me</label><Link to="/recover">Forgot password?</Link></div>
            </>}
          </AuthForm>}
          <p className="vs-auth-register-link">New to VidhyaSaathy? <Link to="/register-school">Register a school <AuthIcon name="arrow" size={15} /></Link></p>
        </div>
        <p className="vs-auth-under-card">Parents can sign in with the phone number linked by their school.</p>
      </section>
      <AuthScene />
    </AuthLayout>
  );
}
