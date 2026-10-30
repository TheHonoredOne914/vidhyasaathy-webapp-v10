import { ProgressSchema, StreakSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { Saathy } from '../student/notebook/Saathy';
import { Chip, MasteryChip, PageHead, ProgressBar } from '../student/notebook/ui';
import '../student/notebook/pages/progress.css';

const WORDS = ["Let's fix this", 'Almost there', 'Mastered', 'Top form', 'New'] as const;

function nextFor(word: string, chapterId: string, conceptId: string) {
  if (word === "Let's fix this") return { href: `/student/chapters/${chapterId}/concepts/${conceptId}`, label: 'Fix this' };
  if (word === 'Almost there') return { href: `/student/chapters/${chapterId}/practice/quick_revision_quiz`, label: 'Try a few' };
  if (word === 'New') return { href: `/student/chapters/${chapterId}/concepts/${conceptId}`, label: 'Start' };
  return { href: `/student/chapters/${chapterId}`, label: 'Open' };
}

export function ProgressPage() {
  usePageMeta(PAGE.studentProgress.title, PAGE.studentProgress.description);
  const progress = useRemote('/progress', ProgressSchema);
  const streak = useRemote('/practice/streak', StreakSchema);
  const data = progress.data;
  const words = data?.masteryWords ?? [];
  const counts = WORDS.map((word) => ({ word, n: words.filter((row) => row.word === word).length }));
  const focus = words.find((row) => row.word === "Let's fix this") ?? words.find((row) => row.word === 'Almost there') ?? words.find((row) => row.word === 'New');

  if (progress.status === 'loading' && !data) return <div className="nb-skel" />;
  if (progress.status === 'error' && !data) return <p className="nb-empty" role="alert">Could not load progress. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={progress.reload}>Try again</button></p>;

  return <div className="nb-grid">
    <div className="nb-col">
      <PageHead eyebrow="Progress" title="How you are doing" sub="Each idea has a friendly word." />
      <div className="pr-rings">{counts.map((row) => <section className="nb-card" key={row.word}><MasteryChip level={row.word} /><b className="nb-h2">{row.n}</b><span className="nb-meta">ideas</span></section>)}</div>
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Ideas</h3></div>
        {words.length ? words.map((row) => { const next = nextFor(row.word, row.chapterId, row.conceptId); return <div className="nb-row" key={row.conceptId}><div><div className="nb-row__t">{row.title}</div><MasteryChip level={row.word} /></div><Link className="nb-btn nb-btn--ghost nb-btn--sm" to={next.href}>{next.label}</Link></div>; }) : <p className="nb-empty">No ideas yet.</p>}
      </section>
    </div>
    <aside className="nb-col">
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">This week</h3></div>
        <div className="cal">{(streak.data?.days ?? []).map((day) => <span className={`d${day.practiced ? ' s' : ''}`} key={day.date}>{new Date(`${day.date}T12:00:00+05:30`).getDate()}</span>)}</div>
        <p className="nb-meta">{streak.data ? `${streak.data.currentDays} day streak` : ''}</p>
      </section>
      {focus ? <div className="nb-sticky nb-sticky--gold"><div className="nb-sticky__who">Keep going</div><p className="nb-note">{focus.title}</p><Link className="nb-link" to={nextFor(focus.word, focus.chapterId, focus.conceptId).href}>{nextFor(focus.word, focus.chapterId, focus.conceptId).label}</Link><Saathy mood="cheer" size="3.4rem" /></div> : null}
      <section className="nb-card nb-grow"><div className="nb-card__head"><h3 className="nb-h3">Homework</h3></div>
        {(data?.assignments ?? []).length ? data!.assignments.map((item) => <Link className="nb-row" key={item.id} to={`/student/assignments/${item.id}`}><div><div className="nb-row__t">{item.title}</div><div className="nb-row__s">{item.teacherName}</div></div><Chip tone={item.score?.status === 'completed' ? 'green' : 'sand'}>{item.score?.status === 'completed' ? 'Done' : 'Open'}</Chip></Link>) : <p className="nb-empty">Nothing assigned.</p>}
        {data?.evidence?.passRate != null ? <ProgressBar value={data.evidence.passRate * 100} color="var(--nb-leaf)" /> : null}
      </section>
    </aside>
  </div>;
}
