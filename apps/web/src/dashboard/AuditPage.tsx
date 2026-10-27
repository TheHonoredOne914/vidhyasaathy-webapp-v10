import { AuditLogListSchema } from '@vidhyasaathy/contracts';
import { formatDue } from '../assessment/present';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useRemote } from '../setup/useRemote';
import { RemoteBlock } from './RemoteBlock';
import './dashboard.css';

export function AuditPage() {
  usePageMeta(PAGE.audit.title, PAGE.audit.description);
  const log = useRemote('/audit-log', AuditLogListSchema);
  return (
    <section className="dash">
      <header className="dash-banner">
        <h1>Activity log</h1>
        <p>Enrolment, links, and permission changes for this school.</p>
      </header>
      <RemoteBlock remote={log} title="Could not load the activity log">
        {(data) => data.entries.length ? (
          <ul className="dash-list">
            {data.entries.map((entry) => (
              <li key={entry.id} className="heat-none">
                <h2>{entry.action}</h2>
                <p>{formatDue(entry.createdAt)}. Request {entry.requestId}.</p>
              </li>
            ))}
          </ul>
        ) : <p>No activity is recorded yet.</p>}
      </RemoteBlock>
    </section>
  );
}
