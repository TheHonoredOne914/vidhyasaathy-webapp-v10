import { ProgressSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { ChapterListSchema, ConceptListSchema } from '../../../content/schemas';
import { SubjectListSchema } from '../../../setup/schemas';
import { useRemote } from '../../../setup/useRemote';
import { Icon } from '../icons';
import { Saathy } from '../Saathy';
import { MasteryChip, PageHead, SubjectIcon } from '../ui';
import '../pages/subject-path.css';

const SPOTS = [
  { left: '46%', top: '3rem', side: 'r' },
  { left: '54%', top: '9rem', side: 'r' },
  { left: '58%', top: '15rem', side: 'r' },
  { left: '40%', top: '21rem', side: 'l' },
  { left: '36%', top: '27rem', side: 'l' },
  { left: '48%', top: '33rem', side: 'r' },
  { left: '56%', top: '39rem', side: 'r' },
  { left: '44%', top: '45rem', side: 'l' },
];

const GAMES = [
  { id: 'newton', words: ['force', 'laws of motion'], title: 'Cricket Lab' },
  { id: 'motion', words: ['motion'], title: 'Bus Stop Graphs' },
  { id: 'cell', words: ['cell'], title: 'Bio Quest' },
  { id: 'float', words: ['gravitation', 'float'], title: 'Float or Sink' },
  { id: 'energy', words: ['energy', 'work'], title: 'Energy Slide' },
  { id: 'sound', words: ['sound'], title: 'Echo Corridor' },
] as const;

export function SubjectPathBoard({ subjectId }: { subjectId: string }) {
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const chapters = useRemote(subjectId ? `/subjects/${subjectId}/chapters` : null, ChapterListSchema);
  const progress = useRemote('/progress', ProgressSchema);
  const subject = (subjects.data ?? []).find((item) => item.id === subjectId) ?? null;
  const list = [...(chapters.data ?? [])].sort((a, b) => a.position - b.position);
  const current = list.find((chapter) => chapter.status === 'in_progress') ?? list.find((chapter) => chapter.status === 'not_started') ?? list[0] ?? null;
  const concepts = useRemote(current ? `/chapters/${current.id}/concepts` : null, ConceptListSchema);
  const words = progress.data?.masteryWords ?? [];
  const ideaList = concepts.data ?? [];
  let currentGiven = false;
  const stations = ideaList.map((concept, index) => {
    const word = words.find((row) => row.conceptId === concept.id)?.word ?? 'New';
    const mastered = word === 'Mastered' || word === 'Top form';
    let state = 'next';
    if (mastered) state = 'done';
    else if (!currentGiven) { currentGiven = true; state = word === "Let's fix this" ? 'fix' : 'now'; }
    const spot = SPOTS[index % SPOTS.length]!;
    return { concept, word, state, spot, index };
  });
  const upNext = stations.find((station) => station.state === 'now' || station.state === 'fix');
  const counts = ["Let's fix this", 'Almost there', 'Mastered', 'Top form', 'New'].map((word) => ({ word, n: words.filter((row) => ideaList.some((concept) => concept.id === row.conceptId) && row.word === word).length }));
  const game = current ? GAMES.find((item) => item.words.some((word) => current.title.toLowerCase().includes(word))) : null;
  const nextChapter = current ? list.find((chapter) => chapter.position > current.position) : null;

  if ((subjects.status === 'loading' && !subjects.data) || (chapters.status === 'loading' && !chapters.data)) return <div className="nb-skel" />;
  if (!subject) return <p className="nb-empty">This subject is not on your list.</p>;

  return <div className="nb-grid nb-grid--3col">
    <aside className="nb-col sp-left">
      <section className="nb-card subj"><SubjectIcon subject={subject.name} large /><div><b className="nb-h3">{subject.name}</b><div className="nb-meta">{list.length} chapters</div></div></section>
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Jump to chapter</h3></div>
        {list.map((chapter, index) => <Link className={chapter.id === current?.id ? 'chap on' : 'chap'} key={chapter.id} to={`/student/chapters/${chapter.id}`}><b>{index + 1}</b><span>{chapter.title}</span></Link>)}
      </section>
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Words</h3></div><div className="legend">{counts.map((row) => <MasteryChip key={row.word} level={row.word} />)}</div></section>
    </aside>
    <div className="nb-col sp-map">
      <PageHead eyebrow={subject.name} title={current ? current.title : 'Your path'} />
      {current ? <div className="unit"><div><small>Chapter</small><h2>{current.title}</h2></div></div> : null}
      <div className="trail" style={{ ['--h' as string]: `${Math.max(18, stations.length * 6)}rem`, height: `${Math.max(18, stations.length * 6)}rem` }}>
        {stations.map((station) => <Link className={`st ${station.state} ${station.spot.side}`} key={station.concept.id} style={{ left: station.spot.left, top: station.spot.top }} to={`/student/chapters/${current?.id}/concepts/${station.concept.id}`}><div className="o"><Icon name={station.state === 'done' ? 'check' : station.state === 'fix' ? 'refresh' : 'book'} /></div><div className="lab"><b>{station.concept.title}</b><MasteryChip level={station.word} /></div></Link>)}
        {upNext && current ? <div className="nb-card pop" style={{ left: '58%', top: '22rem' }}><span className="nb-label">Up next</span><h3>{upNext.concept.title}</h3><Link className="nb-btn nb-btn--primary" to={`/student/chapters/${current.id}/concepts/${upNext.concept.id}`}>Start</Link></div> : null}
      </div>
      <div className="nb-saathy-tip"><Saathy mood="cheer" size="4rem" /><p className="nb-note">One idea at a time.</p></div>
      {nextChapter ? <div className="unit lock"><div><small>Next chapter</small><h2>{nextChapter.title}</h2></div><Icon name="lock" /></div> : null}
    </div>
    <aside className="nb-col sp-right">
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">At a glance</h3></div>{counts.map((row) => <div className="wk" key={row.word}><MasteryChip level={row.word} /><span /><span className="nb-meta">{row.n}</span></div>)}</section>
      {game && current ? <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">Today's game</h3></div><p className="nb-note">{game.title}</p><Link className="nb-btn nb-btn--gold nb-btn--sm" to={`/student/chapters/${current.id}/practice/engine/${game.id}`}>Play</Link></section> : null}
    </aside>
  </div>;
}
