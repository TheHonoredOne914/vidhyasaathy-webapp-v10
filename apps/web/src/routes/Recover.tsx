import { Link } from 'react-router-dom';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import { Logo } from '../ui/Logo';

export function Recover() {
  usePageMeta(PAGE.recover.title, PAGE.recover.description);
  return (
    <div className="auth-page">
      <main id="content" className="auth-frame">
        <section className="auth-panel">
          <Logo />
          <h1>Password and PIN help</h1>
          <p>Contact your school administrator for account recovery. Self-service password resets and phone verification are not available yet.</p>
          <h2>Forgot your student PIN?</h2>
          <p>Ask a parent or teacher to contact the school. Never share your PIN or activation code.</p>
          <nav aria-label="Primary"><Link className="text-link" to="/signin">Sign in</Link></nav>
          <p><Link className="text-link" to="/signin/student">Student PIN sign in</Link></p>
          <p><Link className="text-link" to="/privacy">Privacy and account help</Link></p>
        </section>
        <div className="auth-visual"><img src="/img/hero-scene.jpg" alt="" /></div>
      </main>
    </div>
  );
}
