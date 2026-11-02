import type { Me } from '@vidhyasaathy/contracts';
import { Navigate, useSearchParams } from 'react-router-dom';
import { HomeDesk } from '../student/HomeDesk';
import { GamesBoard } from '../student/notebook/screens/GamesBoard';
import { HomeworkBoard } from '../student/notebook/screens/HomeworkBoard';
import { StudySessionsBoard } from '../student/notebook/screens/StudySessionsBoard';
import { SubjectsBoard } from '../student/notebook/screens/SubjectsBoard';
import { AccessDenied } from './AccessDenied';
import { ContinueLearning } from '../proto/ContinueLearning';

const PANELS = new Set(['', 'subjects', 'study', 'homework', 'ask', 'games']);

export function StudentHome({ me, stale, updatedAt, message }: { me: Me; stale: boolean; updatedAt: string | null; message: string | null }) {
  const [params] = useSearchParams();
  const panel = params.get('panel') ?? '';
  if (panel === 'progress') return <Navigate to="/student/progress" replace />;
  if (!PANELS.has(panel)) return <AccessDenied />;
  if (panel === 'subjects') return <SubjectsBoard query={params.get('q') ?? ''} />;
  if (panel === 'games') return <GamesBoard />;
  if (panel === 'homework') return <HomeworkBoard />;
  if (panel === 'study') return <><ContinueLearning list /><StudySessionsBoard /></>;
  if (panel === 'ask') return <Navigate to={`/student/saathy${window.location.search}`} replace />;
  return <HomeDesk me={me} stale={stale} updatedAt={updatedAt} message={message} />;
}
