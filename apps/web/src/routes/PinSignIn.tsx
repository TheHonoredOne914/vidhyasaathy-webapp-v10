import { Link } from 'react-router-dom';
import { AuthIcon } from '../auth/AuthIcon';
import { AuthLayout, AuthScene } from '../auth/AuthLayout';
import { StudentPinForm } from '../auth/StudentAccess';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';

export function PinSignIn() {
  usePageMeta(PAGE.pin.title, PAGE.pin.description);
  return (
    <AuthLayout withinShell>
      <section className="vs-auth-signin vs-auth-student-page">
        <div className="vs-auth-intro"><span className="vs-auth-eyebrow">student sign in</span><h1>Welcome back.</h1><p>Your own page, your own PIN. Pick up where you left off.</p></div>
        <div className="vs-auth-signin-card"><h2><AuthIcon name="student" size={22} /> Student PIN sign in</h2><StudentPinForm /><p className="vs-auth-register-link"><Link to="/claim">Activate another student account <AuthIcon name="arrow" size={15} /></Link></p></div>
        <Link className="vs-auth-under-card" to="/signin">Staff or parent sign in <AuthIcon name="arrow" size={14} /></Link>
      </section>
      <AuthScene />
    </AuthLayout>
  );
}
