import { useState, type FormEvent } from 'react';
import { Search, School, Pencil, Plus } from 'lucide-react';
import { ClassSchema, SubjectSchema, StudentSchema, TeacherSchema, studentActivities, type DemoState } from './data';
import { useDemo } from './store';
import { Panel, Stats } from './DemoLayout';
import { DemoChart } from './Charts';
import { DemoDialog } from './DemoDialog';

type Collection = 'classes' | 'teachers' | 'students' | 'subjects';
type RecordRow = DemoState[Collection][number];
const labels: Record<Collection, string> = { classes: 'Classes', teachers: 'Teachers', students: 'Students', subjects: 'Subjects' };
const singular: Record<Collection, string> = { classes: 'class', teachers: 'teacher', students: 'student', subjects: 'subject' };

export function AdminWorkspace() {
  const { data, update } = useDemo();
  const [tab, setTab] = useState<Collection>('classes');
  const [search, setSearch] = useState('');
  const [classId, setClassId] = useState('all');
  const [editing, setEditing] = useState<{ row?: RecordRow } | null>(null);
  const [notice, setNotice] = useState('');
  const rows = data[tab].filter((row) => row.name.toLowerCase().includes(search.toLowerCase()) && (classId === 'all' || ('classId' in row ? row.classId === classId : tab === 'classes' ? row.id === classId : data.teachers.some((teacher) => teacher.classId === classId && teacher.subjectId === row.id))));
  function save(row: RecordRow) {
    update((current) => {
      const next = { ...current };
      // Each editor uses the corresponding runtime schema before updating the shared store.
      if (tab === 'students') next.students = replace(current.students, StudentSchema.parse(row));
      if (tab === 'teachers') next.teachers = replace(current.teachers, TeacherSchema.parse(row));
      if (tab === 'classes') next.classes = replace(current.classes, ClassSchema.parse(row));
      if (tab === 'subjects') next.subjects = replace(current.subjects, SubjectSchema.parse(row));
      return next;
    });
    setEditing(null); setNotice(`${row.name} saved in the shared demo. Filters cleared to show the record.`); setSearch(''); setClassId('all');
  }
  return <>
    <div className="demo-heading"><div><p className="demo-eyebrow">The school office</p><h1>Everything in its place.</h1><p>A small sample school, ready to explore. Add a record or make it your own.</p></div><span className="demo-heading-icon"><School size={42} strokeWidth={1.4} /></span></div>
    <Stats items={(Object.keys(labels) as Collection[]).map((key) => ({ label: labels[key], value: data[key].length, note: key === 'students' ? 'Five familiar learners to start with' : 'Linked by consistent sample IDs' }))} />
    <div className="demo-tabs demo-view-tabs" aria-label="School records">{(Object.keys(labels) as Collection[]).map((key) => <button key={key} aria-pressed={tab === key} onClick={() => { setTab(key); setSearch(''); setEditing(null); }}>{labels[key]} <small>{data[key].length} records</small></button>)}</div>
    <div className="demo-columns"><div className="demo-stack"><Panel title={`Your ${labels[tab].toLowerCase()}`} note="Sample records only. Edits are reflected across all three demo workspaces."><div className="demo-toolbar"><label className="demo-search"><Search size={18} /><span className="demo-sr">Search {labels[tab].toLowerCase()}</span><input value={search} placeholder={`Search ${labels[tab].toLowerCase()}…`} onChange={(event) => setSearch(event.target.value)} /></label><label>Class filter<select value={classId} onChange={(event) => setClassId(event.target.value)}><option value="all">All classes</option>{data.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><button className="demo-primary" onClick={() => setEditing({})}><Plus size={16} /> Add {singular[tab]}</button></div>
      <div className="demo-table-scroll"><table><thead><tr><th>Name</th><th>{tab === 'classes' ? 'Students' : tab === 'subjects' ? 'Teachers' : 'Class'}</th><th>{tab === 'teachers' ? 'Subject' : 'Notes'}</th><th>Edit</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><th>{row.name}</th><td>{'classId' in row ? data.classes.find((item) => item.id === row.classId)?.name : tab === 'classes' ? data.students.filter((student) => student.classId === row.id).length : data.teachers.filter((teacher) => teacher.subjectId === row.id).map((teacher) => teacher.name).join(', ') || 'No teacher linked'}</td><td>{'subjectId' in row ? data.subjects.find((subject) => subject.id === row.subjectId)?.name : 'note' in row ? row.note || 'No note yet' : tab === 'classes' ? data.teachers.filter((teacher) => teacher.classId === row.id).map((teacher) => teacher.name).join(', ') || 'No teacher linked' : 'Sample school subject'}</td><td><button aria-label={`Edit ${row.name}`} onClick={() => setEditing({ row })}><Pencil size={17} /></button></td></tr>)}</tbody></table></div>{!rows.length && <p className="demo-empty">No records match these filters. Try another name or select all classes.</p>}</Panel>
      <Panel title="A week across the school" note="Sample learning minutes by class, including games and sessions."><DemoChart label="Class activity · last 7 days" data={data.classes.map((group) => ({ name: group.name, minutes: data.students.filter((student) => student.classId === group.id).flatMap((student) => studentActivities(student.id, 7)).reduce((sum, row) => sum + row.minutes, 0) }))} /></Panel>
    </div><aside className="demo-stack"><Panel title="A connected little school" className="demo-sticky"><h3>Try the whole story</h3><ol><li>Add a student to a class.</li><li>Open the teacher desk and find them in the roster.</li><li>Create an assignment for that class.</li><li>See it in the parent notebook for a linked child.</li></ol><p>New students begin with no observations. Existing sample activity stays with its student ID when a name changes.</p></Panel><Panel title="Your sample, your browser"><p>Changes stay in this browser after a refresh. “Reset demo” restores only these fictional dashboard records.</p><p className="demo-muted">No school accounts, passwords or live data are changed here.</p></Panel></aside></div>
    <p role="status">{notice}</p>
    {editing && <RecordEditor key={`${tab}-${editing.row?.id ?? 'new'}`} collection={tab} row={editing.row} onClose={() => setEditing(null)} onSave={save} />}
  </>;
}
function replace<T extends { id: string }>(rows: T[], row: T): T[] { return rows.some((item) => item.id === row.id) ? rows.map((item) => item.id === row.id ? row : item) : [...rows, row]; }

function RecordEditor({ collection, row, onClose, onSave }: { collection: Collection; row?: RecordRow; onClose: () => void; onSave: (row: RecordRow) => void }) {
  const { data } = useDemo();
  const [name, setName] = useState(row?.name ?? '');
  const [classId, setClassId] = useState(row && 'classId' in row ? row.classId : data.classes[0]!.id);
  const [subjectId, setSubjectId] = useState(row && 'subjectId' in row ? row.subjectId : data.subjects[0]!.id);
  const [note, setNote] = useState(row && 'note' in row ? row.note : '');
  const [error, setError] = useState('');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError('Please add a name.'); return; }
    if (data[collection].some((item) => item.id !== row?.id && item.name.toLowerCase() === name.trim().toLowerCase())) { setError('That sample name already exists. Choose a different name.'); return; }
    const base = { id: row?.id ?? `demo-${crypto.randomUUID()}`, name: name.trim() };
    onSave(collection === 'students' ? { ...base, classId, note } : collection === 'teachers' ? { ...base, classId, subjectId } : base);
  }
  return <DemoDialog title={`${row ? 'Edit' : 'Add'} sample ${singular[collection]}`} onClose={onClose}><form onSubmit={submit}><label>Name<input autoFocus required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>{(collection === 'students' || collection === 'teachers') && <label>Class<select value={classId} onChange={(event) => setClassId(event.target.value)}>{data.classes.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}{collection === 'teachers' && <label>Subject<select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>{data.subjects.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}{collection === 'students' && <label>A helpful note<textarea maxLength={240} value={note} onChange={(event) => setNote(event.target.value)} /></label>}{error && <p role="alert">{error}</p>}<div className="demo-actions"><button type="submit" className="demo-primary">Save sample record</button><button type="button" onClick={onClose}>Cancel</button></div></form></DemoDialog>;
}
