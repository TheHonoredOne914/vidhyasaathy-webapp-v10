import { ProgressSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { formatDue } from '../assessment/present';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useRemote } from '../setup/useRemote';
import { RemoteBlock } from './RemoteBlock';
import '../student/home.css';
import './dashboard.css';

export function ProgressPage() {
  usePageMeta(PAGE.studentProgress.title, PAGE.studentProgress.description);
  const progress = useRemote('/progress', ProgressSchema);
  return (
    <section className="vs-home">
      <header className="vs-home-hero">
        <div className="vs-home-hero-copy">
          <h1>My progress</h1>
          <p>Each idea has a friendly word. Keep going.</p>
        </div>
      </header>
      <RemoteBlock remote={progress} title="Could not load progress">
        {(data) => (
          <>
            <ol className="progress-words">
              {data.masteryWords.map((row) => (
                <li key={row.conceptId}>
                  <span className="progress-ring">{row.word}</span>
                  <strong>{row.title}</strong>
                </li>
              ))}
            </ol>
            <article className="lesson-card">
              <h2>Assignments</h2>
              {data.assignments.length ? (
                <ul className="dash-list">
                  {data.assignments.map((item) => (
                    <li key={item.id}>
                      <Link className="text-link" to={`/student/assignments/${item.id}`}>{item.title}</Link>
                      <p>Due {formatDue(item.dueAt)}. {item.teacherName}.</p>
                    </li>
                  ))}
                </ul>
              ) : <p>No assignment is published.</p>}
            </article>
          </>
        )}
      </RemoteBlock>
      <Link className="text-link" to="/student">Home</Link>
    </section>
  );
}
