import { StudentStudySessionsSchema, type StudentStudySession } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Chip, PageHead, SubjectIcon, Tabs } from '../ui';
import { NotebookState } from './polish3b/NotebookState';
import { useRemote } from '../../../setup/useRemote';
import '../pages/homework.css';

const DOT = ' \u00b7 ';
const day = (at: number | null) => at === null ? '' : new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

function stateChip(row: StudentStudySession) {
  if (row.state === 'done') return <Chip tone="green">Finished</Chip>;
  if (row.state === 'upcoming') return <Chip tone="sand" dashed>Opens {day(row.releaseAt)}</Chip>;
  if (row.state === 'in_progress') return <Chip tone="orange">Slide {Math.min(row.viewedSlides + 1, row.slides)} of {row.slides}</Chip>;
  return <Chip tone="sky">New</Chip>;
}

export function StudySessionsBoard() {
  const remote = useRemote('/student/study-sessions', StudentStudySessionsSchema);
  const [tab, setTab] = useState('waiting');
  const [selected, setSelected] = useState('');
  if (remote.denied) return <NotebookState title="Study sessions" message="Study sessions are not available. Ask your teacher to check your access." />;
  if (remote.status === 'error' && !remote.data) return <NotebookState title="Study sessions" message="Could not open your study sessions. Your progress is safe." retry={remote.reload} />;
  if (!remote.data) return <NotebookState title="Study sessions" loading />;
  const { counts, sessions } = remote.data;
  const rows = sessions.filter((row) => tab === 'waiting' ? row.state === 'new' || row.state === 'in_progress' : row.state === tab);
  const active = rows.find((row) => row.id === selected) ?? rows[0];
  const empty = tab === 'waiting' ? 'No session is waiting. Your teacher will add the next one.' : tab === 'upcoming' ? 'Nothing is scheduled yet.' : 'Sessions you finish will appear here.';
  return <div className="nb-grid nb-grid--5-7 pg-homework">
    <div className="nb-col">
      <PageHead title="Study sessions" sub={`${counts.waiting} waiting${DOT}${counts.done} finished`} />
      <Tabs tabs={[{ id: 'waiting', label: `Waiting${DOT}${counts.waiting}` }, { id: 'upcoming', label: `Coming up${DOT}${counts.upcoming}` }, { id: 'done', label: `Finished${DOT}${counts.done}` }]} active={tab} onChange={(value) => { setTab(value); setSelected(''); }} />
      <Card title={tab === 'waiting' ? 'Waiting for you' : tab === 'upcoming' ? 'Coming up' : 'Finished'} grow>
        {rows.length ? rows.map((row) => <button className={`hw${active?.id === row.id ? ' on' : ''}`} key={row.id} onClick={() => setSelected(row.id)} aria-pressed={active?.id === row.id}>
          <SubjectIcon subject={row.subject} />
          <span><b>{row.title}</b><span className="nb-meta">{row.subject}{DOT}{row.chapterTitle}{DOT}{row.slides} slides</span></span>
          {stateChip(row)}
        </button>) : <p className="nb-note">{empty}</p>}
      </Card>
    </div>
    {active ? <Card title={active.title} meta={`${active.subject}${DOT}${active.chapterTitle}`} className="ws" grow tape>
      <p className="nb-note">{active.state === 'done' ? `You finished this session on ${day(active.completedAt)}. Open it again to revise the slides.`
        : active.state === 'upcoming' ? `Your teacher has planned this session. It opens on ${day(active.releaseAt)}.`
        : active.state === 'in_progress' ? `You have read ${active.viewedSlides} of ${active.slides} slides. Pick up where you stopped.`
        : `${active.slides} slides and a short check at the end.`}</p>
      <progress max={active.slides} value={active.viewedSlides} aria-label="Slides read" style={{ width: '100%' }} />
      {active.state === 'upcoming' ? null : <Link className="nb-btn" to={`/student/sessions/${active.id}`}>{active.state === 'done' ? 'Revise session' : active.state === 'in_progress' ? 'Resume session' : 'Start session'}</Link>}
      <Link className="nb-link" to={`/student/chapters/${active.chapterId}`}>Open chapter</Link>
    </Card> : <NotebookState title="Your session" message="Choose a study session when your teacher adds one." />}
  </div>;
}
