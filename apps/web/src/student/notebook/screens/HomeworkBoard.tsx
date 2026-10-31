import { HomeworkListSchema, StudyPlanSchema } from '@vidhyasaathy/contracts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { planHref } from '../../../ai/plan';
import { useAttemptSync } from '../../../assessment/AttemptSync';
import { useRemote } from '../../../setup/useRemote';
import { Card, Chip, PageHead, Sticky, SubjectIcon, Tabs } from '../ui';
import { NotebookState } from './polish3b/NotebookState';
import { dueChip, Worksheet } from './polish3b/Worksheet';
import '../pages/homework.css';

export function HomeworkBoard() {
  const homework = useRemote('/student/homework?tab=all', HomeworkListSchema);
  const plan = useRemote('/study-plan', StudyPlanSchema);
  const sync = useAttemptSync();
  useEffect(() => { homework.reload(); }, [sync.revision, homework.reload]);
  const [tab, setTab] = useState('todo');
  const [selected, setSelected] = useState('');
  if (homework.denied) return <NotebookState title="Homework" message="This homework notebook is not available. Ask your teacher to check your access." />;
  if (homework.status === 'error') return <NotebookState title="Homework" message="Could not open your homework. Your work is safe." retry={homework.reload} />;
  if (!homework.data) return <NotebookState title="Homework" loading />;
  const { counts, items } = homework.data;
  const todo = items.filter((row) => row.status === 'todo' || row.status === 'overdue');
  const back = items.filter((row) => row.status === 'graded');
  const rows = tab === 'todo' ? todo : tab === 'graded' ? back : items.filter((row) => row.status === 'submitted');
  const active = rows.find((row) => row.id === selected) ?? rows[0];
  const sessions = plan.data?.items.filter((row) => row.kind === 'session') ?? [];
  const rowTile = (row: typeof items[number]) => {
    const due = dueChip(row.dueAt);
    return <button className={`hw${active?.id === row.id ? ' on' : ''}`} key={row.id} onClick={() => { setSelected(row.id); if (row.status === 'graded') setTab('graded'); }} aria-pressed={active?.id === row.id}><SubjectIcon subject={row.subject} /><span><b>{row.title}</b><span className="nb-meta">{row.subject} · {row.teacher} · {row.count} questions</span></span>{row.score ? <span className="back-mark">{row.score.earned}/{row.score.outOf}</span> : <Chip tone={row.status === 'submitted' ? 'sky' : due.tone}>{row.status === 'submitted' ? 'Handed in' : due.text}</Chip>}</button>;
  };
  return <div className="nb-grid nb-grid--5-7 pg-homework">
    <div className="nb-col">
      <PageHead title="Homework" sub={`${counts.todo} to do · ${counts.graded} handed back`} />
      <Tabs tabs={[{ id: 'todo', label: `To do · ${counts.todo}` }, { id: 'graded', label: `Handed back · ${counts.graded}` }, { id: 'submitted', label: `Done · ${counts.submitted}` }]} active={tab} onChange={(value) => { setTab(value); setSelected(''); }} />
      <Card title={tab === 'todo' ? 'To do' : tab === 'graded' ? 'Handed back' : 'Done'}>{rows.length ? rows.map(rowTile) : <p className="nb-note">{tab === 'todo' ? 'Nothing left to hand in.' : tab === 'graded' ? 'Nothing has come back yet.' : 'Your handed-in work will appear here.'}</p>}{active ? <Link className="nb-link" to={`/student/assignments/${active.id}`}>Open full worksheet</Link> : null}</Card>
      {tab !== 'graded' ? <Card title="Handed back" grow>{back.length ? back.map(rowTile) : <p className="nb-note">Nothing has come back yet.</p>}{back.filter((row) => row.comment).map((row) => <Sticky color="blue" who={row.teacher} key={row.id}><b>{row.title}</b><br />{row.comment}</Sticky>)}</Card> : rows.filter((row) => row.comment).map((row) => <Sticky color="blue" who={row.teacher} key={row.id}>{row.comment}</Sticky>)}
      <Card title="Study sessions">{sessions.length ? sessions.map((row) => <Link className="nb-row" key={row.id} to={planHref(row)}><span><b>{row.title}</b><span className="nb-meta">{row.resumeAt > 0 ? `Resume at slide ${row.resumeAt + 1}` : 'Not started'}</span></span></Link>) : <p className="nb-note">{plan.status === 'error' ? <>Could not open your study sessions. <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={plan.reload}>Try again</button></> : plan.denied ? 'Study sessions are not available.' : plan.status === 'loading' ? 'Opening your study sessions…' : 'No session is waiting.'}</p>}</Card>
    </div>
    {active ? <Worksheet key={active.id} assignmentId={active.id} subject={active.subject} /> : <NotebookState title="Your worksheet" message="Choose a homework sheet when your teacher adds one. Your own working goes here." />}
  </div>;
}
