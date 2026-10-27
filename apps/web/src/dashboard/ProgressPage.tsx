import { ProgressSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { formatDue, scoreText } from '../assessment/present';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useRemote } from '../setup/useRemote';
import { evidenceLabel } from './format';
import { HeatMap } from './HeatMap';
import { RemoteBlock } from './RemoteBlock';
import './dashboard.css';

export function ProgressPage() {
  usePageMeta(PAGE.studentProgress.title, PAGE.studentProgress.description);
  const progress = useRemote('/progress', ProgressSchema);
  return (
    <section className="dash">
      <header className="dash-banner">
        <h1>Progress</h1>
        <p>Marked checks only. A rate appears after enough attempts.</p>
      </header>
      <RemoteBlock remote={progress} title="Could not load progress">
        {(data) => (
          <>
            <p data-testid="progress-summary">{evidenceLabel(data.evidence)} {data.completedSessions} session checks finished.</p>
            <HeatMap concepts={data.concepts} />
            <article className="dash-panel">
              <h2>Assignments</h2>
              {data.assignments.length ? (
                <ul className="dash-list">
                  {data.assignments.map((item) => (
                    <li key={item.id} className="heat-none">
                      <Link className="text-link" to={`/student/assignments/${item.id}`}>{item.title}</Link>
                      <p>Due {formatDue(item.dueAt)}. {scoreText(item.score)}. {item.teacherName}.</p>
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
