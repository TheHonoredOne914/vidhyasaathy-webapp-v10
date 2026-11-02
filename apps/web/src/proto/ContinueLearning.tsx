import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../session';
import { Card } from '../student/notebook/ui';
import { resumeEntries, sessionPath } from './adapter';

export function ContinueLearning({ list = false }: { list?: boolean }) {
  const { me } = useSession();
  const [, refresh] = useState(0);
  useEffect(() => {
    const changed = () => refresh((value) => value + 1);
    window.addEventListener('learning-resume-changed', changed);
    window.addEventListener('storage', changed);
    return () => { window.removeEventListener('learning-resume-changed', changed); window.removeEventListener('storage', changed); };
  }, []);
  const entries = me ? resumeEntries(me.profile.id) : [];
  const rows = list ? entries : entries.filter((row) => !row.completed).slice(0, 1);
  return <Card title={list ? 'Your learning journeys' : 'Continue learning'} tape>
    {rows.map((row) => <div key={row.id} className="nb-row"><div><b>{row.title}</b><p className="nb-note">{row.completed ? 'Finished · open your review' : 'Your current step is saved'} · {new Date(row.updatedAt).toLocaleDateString('en-IN')}</p></div><Link className="nb-btn" to={sessionPath(row.id)}>{row.completed ? 'Review' : 'Continue learning'}</Link></div>)}
    {!rows.length ? <p className="nb-note">Choose a chapter and let Saathy guide your next learning journey.</p> : null}
    <Link className="nb-link" to="/student?panel=subjects">Choose a chapter</Link>
    {list ? <p className="nb-note">These are session shortcuts saved in this browser. Your learning evidence and position are loaded from the server when you open a session.</p> : null}
  </Card>;
}
