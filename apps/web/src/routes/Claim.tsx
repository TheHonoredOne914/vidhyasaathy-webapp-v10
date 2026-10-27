import { Link } from 'react-router-dom';
import { AuthIcon } from '../auth/AuthIcon';
import { AuthLayout, AuthScene } from '../auth/AuthLayout';
import { StudentClaimForm } from '../auth/StudentAccess';

export function Claim() {
  return (
    <AuthLayout withinShell>
      <section className="vs-auth-signin vs-auth-student-page">
        <div className="vs-auth-intro"><span className="vs-auth-eyebrow"><AuthIcon name="student" size={16} /> Your learning journey starts here</span><h1>Make it yours<span>.</span></h1><p>One little code. A whole world to discover.<br />Activate your school account and choose your PIN.</p></div>
        <div className="vs-auth-signin-card"><h2><AuthIcon name="key" size={22} /> Activation code</h2><StudentClaimForm /><p className="vs-auth-register-link">Already claimed? <Link to="/signin/student">Student PIN sign in <AuthIcon name="arrow" size={15} /></Link></p></div>
      </section>
      <AuthScene />
    </AuthLayout>
  );
}
