import { useState } from 'react';
import { ArrowRight, Clock, BookOpen } from 'lucide-react';
import { activities, concepts, DEMO_DATE, observations, parentChildIds, studentActivities, subjectProgress, type Activity } from './data';
import { useDemo } from './store';
import { Panel, Stats } from './DemoLayout';
import { DemoChart } from './Charts';

export function ParentWorkspace() {
  const { data } = useDemo();
  const children = data.students.filter((student) => parentChildIds.includes(student.id));
  const [childId, setChildId] = useState(parentChildIds[0]!);
  const child = children.find((row) => row.id === childId) ?? children[0]!;
  const [days, setDays] = useState(7);
  const [subjectId, setSubjectId] = useState('all');
  const [detail, setDetail] = useState<Activity | null>(null);
  const rows = studentActivities(child.id, days).filter((row) => subjectId === 'all' || row.subjectId === subjectId);
  const minutes = rows.reduce((sum, row) => sum + row.minutes, 0);
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.parse(`${DEMO_DATE}T12:00:00Z`) - (days - index - 1) * 86400000);
    const day = date.toISOString().slice(0, 10);
    return { name: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' }), minutes: rows.filter((row) => row.day === day).reduce((sum, row) => sum + row.minutes, 0) };
  });
  const assignments = data.assignments.filter((row) => row.classId === child.classId && (subjectId === 'all' || row.subjectId === subjectId));
  const childWords = observations.filter((row) => row.studentId === child.id && concepts.some((concept) => concept.id === row.conceptId && (subjectId === 'all' || concept.subjectId === subjectId)));
  function changeChild(id: string) { setChildId(id); setDetail(null); }
  return <>
    <div className="demo-heading"><div><p className="demo-eyebrow">The parent notebook</p><h1>Small steps. A clearer picture.</h1><p>See what is clicking for {child.name}, and where a little help matters.</p></div><span className="demo-heading-icon"><HeartMark /></span></div>
    <div className="demo-toolbar"><div className="demo-tabs" aria-label="Choose a child">{children.map((row) => <button key={row.id} aria-pressed={row.id === child.id} onClick={() => changeChild(row.id)}>{row.name}<small>{data.classes.find((item) => item.id === row.classId)?.name}</small></button>)}</div><label>Time window<select value={days} onChange={(event) => { setDays(Number(event.target.value)); setDetail(null); }}><option value={7}>Last 7 days</option><option value={14}>Last 14 days</option></select></label><label>Subject<select value={subjectId} onChange={(event) => { setSubjectId(event.target.value); setDetail(null); }}><option value="all">All subjects</option>{data.subjects.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label></div>
    <Stats items={[{ label: 'Time spent learning', value: `${minutes} min`, note: `Across the last ${days} days` }, { label: 'Days with a little progress', value: new Set(rows.map((row) => row.day)).size, note: 'Every return is a good start' }, { label: 'Ideas feeling secure', value: childWords.filter((row) => ['Mastered', 'Top form'].includes(row.word)).length, note: 'From the sample concept observations' }, { label: 'Homework to finish', value: assignments.filter((row) => !row.completedBy.includes(child.id)).length, note: 'For the selected subjects' }]} />
    <div className="demo-columns"><div className="demo-stack">
      <Panel title="A week in the notebook" note="Short, regular visits add up. Hover or use the arrow keys to explore."><DemoChart data={daily} label={`Daily activity for ${child.name} · last ${days} days`} /></Panel>
      <Panel title="Subject progress" note="Secure concepts out of those observed in this demo; this is not an exam mark."><div className="demo-subjects">{data.subjects.filter((row) => subjectId === 'all' || row.id === subjectId).map((subject) => { const progress = subjectProgress(child.id, subject.id); return <button key={subject.id} className="demo-subject" onClick={() => setSubjectId(subject.id)}><span><BookOpen size={20} />{subject.name}<ArrowRight size={18} /></span><strong>{progress.secure} of {progress.total} concepts secure</strong><progress value={progress.secure} max={progress.total || 1} aria-label={`${subject.name} secure concepts`} /><small>Open this subject's activity and concepts</small></button>; })}</div></Panel>
      <Panel title="Concept notebook" note="These sample observations describe understanding, not ability."><div className="demo-list">{childWords.map((row) => <details key={row.conceptId}><summary><span>{concepts.find((concept) => concept.id === row.conceptId)?.name}</span><span className="demo-chip">{row.word}</span></summary><p>{row.word === 'New' ? 'This idea has not been explored yet. It is a fresh start, not a gap.' : row.word === "Let's fix this" ? 'Try one familiar example together, then ask your child to explain the idea back.' : 'Ask for an everyday example. Talking it through can make the idea stick.'}</p></details>)}</div></Panel>
      <Panel title="Assignments" note="Shared with the teacher demo. New sample assignments appear here too."><div className="demo-list">{assignments.map((row) => <details key={row.id}><summary><span>{row.title}</span><span className="demo-chip">{row.completedBy.includes(child.id) ? 'Finished' : 'To do'}</span></summary><p>Due {row.due} · {data.subjects.find((subject) => subject.id === row.subjectId)?.name}</p><p>Give {child.name} a quiet moment to explain the task before starting. This sample task has no live submission.</p></details>)}{!assignments.length && <p>No sample assignments for this selection.</p>}</div></Panel>
    </div><aside className="demo-stack">
      <Panel title="Parent Translator" className="demo-sticky" note="Learning language, made human."><p className="demo-quote">{childWords.some((row) => row.word === "Let's fix this") ? `${child.name} is still joining a few ideas together. A short example and a little patience will help more than extra pressure.` : `${child.name} is building confidence. Asking “How did you figure that out?” helps make the learning their own.`}</p><h3>Try at the dinner table</h3><p>{subjectId === 'maths' ? '“How would you describe where your seat is using two numbers?”' : '“On our trip today, when were we moving fast and when did we stop?”'}</p><p className="demo-muted">{child.note}</p></Panel>
      <Panel title="Where the time went"><DemoChart label="Time by learning activity" data={(['Learn', 'Practise', 'Games', 'Sessions'] as const).map((kind) => ({ name: kind, minutes: rows.filter((row) => row.kind === kind).reduce((sum, row) => sum + row.minutes, 0) }))} /></Panel>
      {(['Games', 'Sessions'] as const).map((kind) => <Panel key={kind} title={kind === 'Games' ? 'Learning through play' : 'Study sessions'}><div className="demo-list">{rows.filter((row) => row.kind === kind).map((row) => <button className="demo-record" key={row.id} onClick={() => setDetail(row)}><strong>{row.title}</strong><small><Clock size={14} /> {row.day} · {row.minutes} min <ArrowRight size={15} /></small></button>)}{!rows.some((row) => row.kind === kind) && <p>No sample {kind.toLowerCase()} in this window.</p>}</div></Panel>)}
    </aside></div>
    {detail && <section className="demo-detail" role="region" aria-label="Activity details" tabIndex={-1} ref={(node) => node?.focus()}><button className="demo-close" onClick={() => setDetail(null)} aria-label="Close activity details">Close</button><p className="demo-eyebrow">Sample activity detail</p><h2>{detail.title}</h2><p>{child.name} · {detail.day} · {detail.minutes} minutes</p><p>{detail.detail}</p><p>{activities.find((row) => row.id === detail.id)?.kind === 'Sessions' ? 'Sample session complete: Intro → Learn → Explore → Practise → Review.' : 'This is a demo history record. The live game stays in the student workspace.'}</p></section>}
  </>;
}
function HeartMark() { return <BookOpen size={42} strokeWidth={1.4} />; }
