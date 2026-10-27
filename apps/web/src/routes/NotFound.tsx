import { Link } from 'react-router-dom';
import { PAGE } from '../pages';
import { usePageMeta } from '../meta';
import '../theme/vs-theme.css';
import { Saathy } from '../ui/Saathy';

export function NotFound() {
  usePageMeta(PAGE.notFound.title, PAGE.notFound.description);
  return (
    <section className="vs-page vs-status-page" aria-labelledby="not-found-title">
      <div className="vs-card vs-status-card">
        <Saathy mood="think" size={120} alt="Saathy, your cloud learning companion" />
        <p className="vs-status-code" aria-hidden="true">404</p>
        <p className="vs-eyebrow">Let’s get you back</p>
        <h1 id="not-found-title">Page not found</h1>
        <p className="vs-status-description">{PAGE.notFound.description}</p>
        <Link className="vs-action" to="/">Back to VidhyaSaathy <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
