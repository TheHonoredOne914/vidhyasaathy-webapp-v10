import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { BookOpen, GraduationCap, Heart, School, RotateCcw } from 'lucide-react';
import { DemoProvider, useDemo } from './store';
import { DEMO_DATE } from './data';
import './demo.css';

function Layout() {
  const { reset, storageNote } = useDemo();
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState('');
  const [resetVersion, setResetVersion] = useState(0);
  return <div className="demo-workspace">
    <aside className="demo-rail"><Link to="/signin" className="demo-brand"><span>V</span> VidhyaSaathy</Link><p className="demo-eyebrow">A little clarity, every day</p><nav aria-label="Demo workspaces">
      <NavLink to="/demo/parent"><Heart size={20} /> Parent notebook</NavLink>
      <NavLink to="/demo/teacher"><GraduationCap size={20} /> Teacher desk</NavLink>
      <NavLink to="/demo/admin"><School size={20} /> School office</NavLink>
    </nav><div className="demo-rail-note"><BookOpen size={28} /><h2>Room to grow.</h2><p>One shared sample school. See learning from every side.</p></div><Link to="/signin" className="demo-exit">Back to sign-in</Link></aside>
    <div className="demo-body"><header className="demo-top"><span className="demo-badge">DEMO · Fictional sample data</span><span>Snapshot: {DEMO_DATE}</span><button onClick={() => setConfirmReset(true)}><RotateCcw size={16} /> Reset demo</button></header>
      {confirmReset && <section className="demo-reset" aria-label="Reset sample changes"><p>Restore the original sample records? This clears only dashboard demo edits in this browser.</p><button onClick={() => { reset(); setResetVersion((value) => value + 1); setConfirmReset(false); setNotice('Sample records restored.'); }}>Restore sample</button><button onClick={() => setConfirmReset(false)}>Keep my edits</button></section>}
      <p className="demo-storage" role="status">{notice ? `${notice} ${storageNote}` : storageNote}</p><main id="demo-main" key={resetVersion}><Outlet /></main><footer className="demo-footer">Demo workspace · Sample activity, assignments and observations · No live school records</footer>
    </div>
  </div>;
}
export function DemoLayout() { return <DemoProvider><Layout /></DemoProvider>; }
export function Panel({ title, note, children, className = '' }: { title: string; note?: string; children: ReactNode; className?: string }) {
  return <section className={`demo-panel ${className}`}><header><h2>{title}</h2>{note && <p>{note}</p>}</header>{children}</section>;
}
export function Stats({ items }: { items: { label: string; value: string | number; note: string }[] }) {
  return <div className="demo-stats">{items.map((item) => <article key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></article>)}</div>;
}
