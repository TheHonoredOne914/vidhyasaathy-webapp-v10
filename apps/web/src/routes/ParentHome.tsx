import { ChildListSchema, ParentSummarySchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useRemote } from '../setup/useRemote';
import { MasteryChip, PageHead } from '../student/notebook/ui';
import '../student/notebook/pages/parent-home.css';

export function ParentHome() {
  usePageMeta(PAGE.parent.title, PAGE.parent.description);
  const children = useRemote('/parent/children', ChildListSchema);
  const first = children.data?.[0]?.id ?? '';
  const summary = useRemote(first ? `/parents/children/${first}/summary` : null, ParentSummarySchema);
  const child = summary.data?.child ?? null;
  const words = summary.data?.progress.masteryWords ?? [];
  const fix = words.filter((row) => row.word === "Let's fix this").length;
  const almost = words.filter((row) => row.word === 'Almost there').length;
  const mastered = words.filter((row) => row.word === 'Mastered' || row.word === 'Top form').length;

  if (children.status === 'loading' && !children.data) return <div className="nb-skel" />;
  if (children.status === 'error' && !children.data) return <p className="nb-empty" role="alert">Could not load your children. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={children.reload}>Try again</button></p>;
  if ((children.data ?? []).length === 0) return <div className="nb-card"><h1 className="nb-h1">See how your child's doing</h1><p className="nb-text">No child is linked to this account. Contact your school to check the link.</p><Link className="nb-link" to="/recover">Get account help</Link></div>;

  return <div className="nb-grid">
    <div className="nb-col">
      <PageHead eyebrow="Family" title="See how your child's doing" sub={child ? `${child.name}${child.className ? ` · ${child.className}` : ''}` : 'Loading the report.'} />
      <div className="pk">
        <section className="nb-card"><span className="nb-label">Let's fix this</span><b>{summary.data ? fix : '—'}</b></section>
        <section className="nb-card"><span className="nb-label">Almost there</span><b>{summary.data ? almost : '—'}</b></section>
        <section className="nb-card"><span className="nb-label">Mastered</span><b>{summary.data ? mastered : '—'}</b></section>
      </div>
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Ideas</h3></div>
        {words.length ? words.slice(0, 8).map((row) => <div className="sb" key={row.conceptId}><b>{row.title}</b><span /><span /><MasteryChip level={row.word} /></div>) : <p className="nb-empty">{summary.status === 'error' ? 'Could not load this report.' : 'No ideas yet.'}</p>}
      </section>
    </div>
    <aside className="nb-col">
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Children</h3></div>
        {(children.data ?? []).map((item) => <Link className="nb-row" key={item.id} to={`/parent/children/${item.id}`}><div><div className="nb-row__t">{item.name}</div><div className="nb-row__s">{item.className ? `${item.className} · ${item.sectionName ?? ''}` : 'Class not assigned yet.'}</div></div></Link>)}
      </section>
      <section className="nb-card nb-grow"><div className="nb-card__head"><h3 className="nb-h3">From school</h3></div>
        {(summary.data?.teacherUpdates ?? []).length ? summary.data!.teacherUpdates.map((note) => <div className="rem" key={note.id}><b>{note.title}</b><p className="nb-text">{note.body}</p></div>) : <p className="nb-empty">No school note yet.</p>}
        {summary.data?.suggestedAction.status === 'available' ? <p className="nb-note">{summary.data.suggestedAction.text}</p> : null}
      </section>
    </aside>
  </div>;
}
