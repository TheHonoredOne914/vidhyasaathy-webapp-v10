import type { Me } from '@vidhyasaathy/contracts';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { AskPanel } from '../ai/AskPanel';
import { AssignmentList } from '../assessment/AssignmentList';
import { SubjectListSchema } from '../setup/schemas';
import { useRemote } from '../setup/useRemote';
import { HomeDesk } from '../student/HomeDesk';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import { AccessDenied } from './AccessDenied';

export function StudentHome({ me, stale, updatedAt, message }: { me: Me; stale: boolean; updatedAt: string | null; message: string | null }) {
  const [params] = useSearchParams();
  const panel = params.get('panel');
  const studying = panel === 'subjects' || panel === 'study';
  const homework = panel === 'homework';
  const ask = panel === 'ask';
  const subjects = useRemote(studying ? '/student/subjects' : null, SubjectListSchema);
  if (panel === 'progress') return <Navigate to="/student/progress" replace />;
  if ((panel && !studying && !homework && !ask) || subjects.denied) return <AccessDenied />;
  const home = !homework && !studying && !ask;
  return <div className={home ? 'student-screen student-screen--home' : 'student-screen'}>
    {homework || studying ? <StaleNote stale={stale} updatedAt={updatedAt} message={message} testId="updated-at" /> : null}
    {homework ? <article className="lcard"><div className="lcard-head"><h1>Homework and quizzes</h1></div><div className="lcard-body"><AssignmentList /><Link className="text-link" to="/student">Go home</Link></div></article> : studying ? <article className="lcard"><div className="lcard-head"><h1>{panel === 'study' ? 'Study sessions' : 'Your subjects'}</h1></div><div className="lcard-body">{panel === 'study' ? <p>Open a subject, then a chapter, to start a session.</p> : null}<StaleNote stale={subjects.stale && subjects.status !== 'error'} updatedAt={subjects.updatedAt} message={subjects.status === 'error' ? null : subjects.message} />{subjects.status === 'loading' && !subjects.data ? <Skeleton /> : subjects.status === 'error' && !subjects.data ? <div className="error-card"><ErrorState title="Could not load subjects" message={subjects.message ?? 'Try again.'} onRetry={subjects.reload} /></div> : subjects.data?.length ? <div className="subject-card-grid">{subjects.data.map((subject) => <Link className="subject-card" key={subject.id} to={`/student/subjects/${subject.id}`}><strong>{subject.name}</strong><span>Open chapters and sessions</span></Link>)}</div> : <p>No subjects assigned yet. Ask your teacher.</p>}<Link className="text-link" to="/student">Go home</Link></div></article> : ask ? <AskPanel /> : <HomeDesk me={me} stale={stale} updatedAt={updatedAt} message={message} />}
    {home ? null : <nav className="student-tabs no-print" aria-label="Student">{[['', 'Home'], ['subjects', 'Study'], ['homework', 'Homework'], ['ask', 'Ask']].map(([value, label]) => <Link key={label} to={value ? `/student?panel=${value}` : '/student'} aria-current={(panel ?? '') === value ? 'page' : undefined}>{label}</Link>)}<Link to="/student/progress">Progress</Link></nav>}
  </div>;
}
