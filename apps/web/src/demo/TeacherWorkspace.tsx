import { useState, type FormEvent } from 'react';
import { ArrowRight, Search, ClipboardList } from 'lucide-react';
import { AssignmentSchema, concepts, DEMO_DATE, observations, studentActivities, type Student } from './data';
import { useDemo } from './store';
import { Panel, Stats } from './DemoLayout';
import { DemoChart } from './Charts';
import { DemoDialog } from './DemoDialog';

export function TeacherWorkspace() {
  const { data, update } = useDemo();
  const [classId, setClassId] = useState(data.classes[0]!.id);
  const selectedClass = data.classes.find((row) => row.id === classId) ?? data.classes[0]!;
  const [search, setSearch] = useState('');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [tab, setTab] = useState('roster');
  const [radarConcept, setRadarConcept] = useState<string | null>(null);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const students = data.students.filter((row) => row.classId === selectedClass.id);
  const selectedStudent = students.find((row) => row.id === studentId);
  const needsHelp = (id: string) => observations.filter((row) => row.studentId === id && row.word === "Let's fix this");
  const roster = students.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()) && (!radarConcept || observations.some((item) => item.studentId === row.id && item.conceptId === radarConcept && item.word === "Let's fix this")));
  const assignments = data.assignments.filter((row) => row.classId === selectedClass.id);
  const activity = students.flatMap((row) => studentActivities(row.id, 7));
  function switchClass(id: string) { setClassId(id); setStudentId(null); setRadarConcept(null); setSearch(''); setAssignmentOpen(false); }
  return <>
    <div className="demo-heading"><div><p className="demo-eyebrow">The teacher desk</p><h1>A clear view of your classroom.</h1><p>Notice the small gaps. Choose the next helpful step.</p></div><span className="demo-heading-icon"><ClipboardList size={42} strokeWidth={1.4} /></span></div>
    <div className="demo-toolbar"><label>Your class<select value={selectedClass.id} onChange={(event) => switchClass(event.target.value)}>{data.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><p>{data.teachers.filter((row) => row.classId === selectedClass.id).map((row) => row.name).join(', ') || 'No sample teacher linked'}</p><button className="demo-primary" onClick={() => setAssignmentOpen(true)}>Create assignment</button></div>
    <Stats items={[{ label: 'In your class', value: students.length, note: selectedClass.name }, { label: 'Active this week', value: new Set(activity.map((row) => row.studentId)).size, note: 'At least one sample activity' }, { label: 'Need a helping hand', value: students.filter((row) => needsHelp(row.id).length).length, note: 'A concept needs another explanation' }, { label: 'Assignments', value: assignments.length, note: 'Shared with the parent notebook' }]} />
    <div className="demo-tabs demo-view-tabs" aria-label="Teacher view">{['roster', 'reports'].map((value) => <button key={value} onClick={() => setTab(value)} aria-pressed={tab === value}>{value === 'roster' ? 'Class notebook' : 'Weekly reports'}</button>)}</div>
    <div className="demo-columns"><div className="demo-stack">
      {tab === 'roster' ? <Panel title="Everyone, in view" note="Select a student for their sample learning story."><label className="demo-search"><Search size={18} /><span className="demo-sr">Search students</span><input placeholder="Find a student…" value={search} onChange={(event) => setSearch(event.target.value)} /></label>{radarConcept && <p className="demo-filter">Showing: {concepts.find((row) => row.id === radarConcept)?.name}<button onClick={() => setRadarConcept(null)}>Clear concept filter</button></p>}<div className="demo-table-scroll"><table><thead><tr><th>Student</th><th>This week</th><th>Next helpful step</th><th>Detail</th></tr></thead><tbody>{roster.map((student) => <tr key={student.id}><th scope="row">{student.name}</th><td>{studentActivities(student.id, 7).reduce((sum, row) => sum + row.minutes, 0)} min</td><td>{needsHelp(student.id).length ? 'A guided example' : !studentActivities(student.id, 7).length ? 'A gentle catch-up' : 'Keep exploring'}</td><td><button aria-label={`Open ${student.name}'s detail`} onClick={() => setStudentId(student.id)}><ArrowRight size={18} /></button></td></tr>)}</tbody></table></div>{!roster.length && <p className="demo-empty">No students match. Try a different name or clear the concept filter.</p>}</Panel> : <Panel title="Weekly class report" note={`Sample week ending ${DEMO_DATE}. Activity is descriptive, not an assessment.`}><DemoChart label="Learning time by student this week" data={students.map((student) => ({ name: student.name, minutes: studentActivities(student.id, 7).reduce((sum, row) => sum + row.minutes, 0) }))} /><div className="demo-list">{students.map((student) => <button className="demo-record" key={student.id} onClick={() => setStudentId(student.id)}><strong>{student.name}</strong><span>{student.note}</span><small>Open individual report <ArrowRight size={14} /></small></button>)}</div></Panel>}
      {selectedStudent && <StudentDetail student={selectedStudent} close={() => setStudentId(null)} />}
      <Panel title="Assignments on the desk" note="Saved locally for this shared demo school."><div className="demo-list">{assignments.map((row) => <details key={row.id}><summary><span>{row.title}</span><span className="demo-chip">{students.filter((student) => row.completedBy.includes(student.id)).length}/{students.length} finished</span></summary><p>Due {row.due} · {data.subjects.find((subject) => subject.id === row.subjectId)?.name}</p><p>Finished: {students.filter((student) => row.completedBy.includes(student.id)).map((student) => student.name).join(', ') || 'No one yet'}</p><p>To do: {students.filter((student) => !row.completedBy.includes(student.id)).map((student) => student.name).join(', ') || 'Everyone has finished'}</p></details>)}{!assignments.length && <p>No assignments yet. Create the first sample task for this class.</p>}</div></Panel>
    </div><aside className="demo-stack"><Panel title="Classroom Radar" className="demo-sticky" note="Concepts that need another explanation. Select one to find the students.">{concepts.map((concept) => { const count = students.filter((student) => needsHelp(student.id).some((row) => row.conceptId === concept.id)).length; return <button key={concept.id} className="demo-radar" onClick={() => { setRadarConcept(concept.id); setTab('roster'); setSearch(''); }}><span>{concept.name}</span><strong>{count} {count === 1 ? 'student' : 'students'}</strong><progress max={Math.max(students.length, 1)} value={count} aria-label={`${concept.name}: ${count} students need help`} /></button>; })}<p className="demo-muted">New concepts are fresh starts. They never count as gaps here.</p></Panel><Panel title="A note for your next lesson"><p>Begin with one familiar situation. Let students describe it before introducing the graph or notation.</p><p className="demo-muted">Rohan may need catch-up. Priya benefits from Hindi terms alongside English. Switch classes to see their notes.</p></Panel></aside></div>
    {assignmentOpen && <AssignmentEditor classId={selectedClass.id} onClose={() => setAssignmentOpen(false)} onSave={(assignment) => { update((current) => ({ ...current, assignments: [...current.assignments, assignment] })); setAssignmentOpen(false); setNotice(`“${assignment.title}” saved for ${selectedClass.name}. It is also visible in the parent demo.`); }} />}
    <p role="status">{notice}</p>
  </>;
}

function StudentDetail({ student, close }: { student: Student; close: () => void }) {
  const rows = studentActivities(student.id, 7);
  return <Panel title={`${student.name}'s learning story`} note="Sample student detail · last 7 days"><button className="demo-close" onClick={close}>Close detail</button><p className="demo-quote">{student.note}</p><p>{rows.length} activities · {rows.reduce((sum, row) => sum + row.minutes, 0)} minutes</p><div className="demo-list">{observations.filter((row) => row.studentId === student.id).map((row) => <div className="demo-line" key={row.conceptId}><span>{concepts.find((concept) => concept.id === row.conceptId)?.name}</span><span className="demo-chip">{row.word}</span></div>)}</div>{!observations.some((row) => row.studentId === student.id) && <p>New sample student. No activity or concept observations yet.</p>}<h3>Recent sample sessions</h3>{rows.filter((row) => row.kind === 'Sessions').map((row) => <p key={row.id}>{row.title} · {row.day} · {row.minutes} min</p>)}</Panel>;
}

function AssignmentEditor({ classId, onClose, onSave }: { classId: string; onClose: () => void; onSave: (assignment: ReturnType<typeof AssignmentSchema.parse>) => void }) {
  const { data } = useDemo();
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(data.subjects[0]!.id);
  const [due, setDue] = useState('2026-11-06');
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    const result = AssignmentSchema.safeParse({ id: `assignment-${crypto.randomUUID()}`, title, subjectId, classId, due, completedBy: [] });
    if (!result.success || !Number.isFinite(Date.parse(due)) || due < DEMO_DATE) { setError('Add a title and a due date on or after the demo snapshot, 2 Nov 2026.'); return; }
    onSave(result.data);
  }
  return <DemoDialog title="A little practice for the class" onClose={onClose}><p>Demo assignment · {data.classes.find((row) => row.id === classId)?.name}</p><form onSubmit={submit}><label>Assignment title<input autoFocus required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Explain a journey graph" /></label><label>Subject<select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>{data.subjects.map((row) => <option value={row.id} key={row.id}>{row.name}</option>)}</select></label><label>Due date<input type="date" min={DEMO_DATE} required value={due} onChange={(event) => setDue(event.target.value)} /></label>{error && <p role="alert">{error}</p>}<div className="demo-actions"><button type="submit" className="demo-primary">Save sample assignment</button><button type="button" onClick={onClose}>Cancel</button></div></form></DemoDialog>;
}
