import { DushmanListSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../meta';
import { useRemote } from '../setup/useRemote';
import { Icon } from './notebook/icons';
import { Saathy } from './notebook/Saathy';
import { NotebookState } from './notebook/screens/polish3b/NotebookState';
import { Bubble, Chip, MasteryChip, PageHead } from './notebook/ui';

export function DushmanDesk() {
  usePageMeta('Dushman — VidhyaSaathy', 'The ideas that keep fighting back, lined up for a rematch.');
  const remote = useRemote('/student/dushman', DushmanListSchema);
  if (remote.status === 'loading' && !remote.data) return <div className="nb-col"><NotebookState title="Dushman" loading /></div>;
  if (remote.status === 'error' && !remote.data) return <div className="nb-col"><NotebookState title="Could not open the list" message="Your notebook is safe. Try opening it again." retry={remote.reload} /></div>;
  if (!remote.data) return null;

  const entries = remote.data.entries;

  return <div className="nb-col" data-testid="student-dushman">
    <PageHead eyebrow="Dushman" title="Your rematch list" sub="Ideas land here when answers show they are still shaky. Beat one in a round and it leaves the list for good." />
    {entries.length ? entries.map((entry) => <section className="nb-card" key={entry.conceptId}>
      <span className="nb-tape" aria-hidden="true" />
      <div className="nb-card__head"><MasteryChip level={entry.word} /><Chip tone="red">Waiting for a rematch</Chip></div>
      <h2 className="nb-h2" style={{ margin: 'var(--nb-s2) 0 var(--nb-s3)' }}>{entry.name}</h2>
      <Link className="nb-btn nb-btn--primary nb-btn--lg" to={entry.href}>Take it on <Icon name="arrow" /></Link>
    </section>) : <section className="nb-card">
      <span className="nb-tape" aria-hidden="true" />
      <h2 className="nb-h2">Nobody on the list today.</h2>
      <p className="nb-note">An idea joins this page only when your answers show it keeps slipping. Answer a few questions and the list updates itself.</p>
      <div className="nb-saathy-tip" style={{ marginTop: 'var(--nb-s3)' }}><Saathy mood="cheer" size="3.4rem" /><Bubble hand>Nothing to fight today. Keep the streak warm!</Bubble></div>
      <Link className="nb-btn nb-btn--primary" style={{ marginTop: 'var(--nb-s3)', display: 'inline-flex' }} to="/student?panel=games">Open the games shelf</Link>
    </section>}
  </div>;
}
