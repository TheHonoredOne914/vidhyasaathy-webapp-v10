import { Link } from 'react-router-dom';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import '../theme/vs-theme.css';

export function Onboarding() {
  usePageMeta(PAGE.onboarding.title, PAGE.onboarding.description);
  return (
    <section className="vs-page" aria-labelledby="onboarding-title">
      <header className="vs-page-header">
        <p className="vs-eyebrow">Start with your school</p>
        <h1 id="onboarding-title">How people join</h1>
        <p>{PAGE.onboarding.description}</p>
      </header>
      <div className="vs-join-grid">
        <section className="vs-card" aria-labelledby="join-admin-title">
          <h2 id="join-admin-title" className="vs-card-heading">Administrator</h2>
          <div className="vs-card-body">
            <p>Register the school, then add the academic year, classes, sections, subjects, teacher invitations, and the student roster.</p>
            <Link className="vs-action" to="/register-school">Register a school <span aria-hidden="true">→</span></Link>
          </div>
        </section>
        <section className="vs-card" aria-labelledby="join-teacher-title">
          <h2 id="join-teacher-title" className="vs-card-heading">Teacher</h2>
          <div className="vs-card-body">
            <p>Open the invitation link from your administrator, choose a password, and sign in. You will see only the classes named in that invitation.</p>
          </div>
        </section>
        <section className="vs-card" aria-labelledby="join-student-title">
          <h2 id="join-student-title" className="vs-card-heading">Student</h2>
          <div className="vs-card-body">
            <p>Use the activation code printed by the school and choose a 4 digit PIN. On this browser, choose your name and enter that PIN to sign in again.</p>
            <Link className="vs-action" to="/claim">Activation code <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </div>
    </section>
  );
}
