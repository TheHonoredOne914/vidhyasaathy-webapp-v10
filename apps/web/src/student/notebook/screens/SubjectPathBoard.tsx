import { HomeworkListSchema, ProgressSchema, StudentHomeSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { ChapterListSchema, ConceptListSchema } from '../../../content/schemas';
import { SubjectListSchema } from '../../../setup/schemas';
import { useRemote } from '../../../setup/useRemote';
import { GamesSchema } from '../../../games/gameApi';
import { Icon } from '../icons';
import { Saathy } from '../Saathy';
import { Bubble, MasteryChip, ProgressBar, SubjectIcon } from '../ui';
import '../pages/subject-path.css';

const SPOTS = [
  { left: '46%', top: '3rem', side: 'r' },
  { left: '54%', top: '9rem', side: 'r' },
  { left: '58%', top: '15rem', side: 'r' },
  { left: '50%', top: '21rem', side: 'r' },
  { left: '40%', top: '28.5rem', side: 'r' },
  { left: '34%', top: '36rem', side: 'l' },
  { left: '30%', top: '42rem', side: 'l' },
  { left: '36%', top: '48rem', side: 'l' },
  { left: '46%', top: '54rem', side: 'r' },
  { left: '54%', top: '60rem', side: 'r' },
  { left: '48%', top: '66rem', side: 'r' },
];

export function SubjectPathBoard({ subjectId }: { subjectId: string }) {
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const chapters = useRemote(subjectId ? `/subjects/${subjectId}/chapters` : null, ChapterListSchema);
  const progress = useRemote('/progress', ProgressSchema);
  const home = useRemote('/student/home', StudentHomeSchema);
  const games = useRemote('/student/games', GamesSchema);
  const homework = useRemote('/student/homework', HomeworkListSchema);
  const subject = (subjects.data ?? []).find((item) => item.id === subjectId) ?? null;
  const list = [...(chapters.data ?? [])].sort((a, b) => a.position - b.position);
  const current = list.find((chapter) => chapter.status === 'in_progress') ?? list.find((chapter) => chapter.status === 'not_started') ?? list[0] ?? null;
  const concepts = useRemote(current ? `/chapters/${current.id}/concepts` : null, ConceptListSchema);
  const words = progress.data?.masteryWords ?? [];
  const ideaList = concepts.data ?? [];
  let currentGiven = false;
  const height = Math.max(18, ideaList.length * 6);
  const stations = ideaList.map((concept, index) => {
    const word = words.find((row) => row.conceptId === concept.id)?.word ?? 'New';
    const mastered = word === 'Mastered' || word === 'Top form';
    let state = 'next';
    if (mastered) state = 'done';
    else if (word === "Let's fix this") state = 'fix';
    else if (!currentGiven) { currentGiven = true; state = 'now'; }
    const spot = SPOTS[index % SPOTS.length]!;
    return { concept, word, state, spot, index };
  });
  const upNext = stations.find((station) => station.state === 'now' || station.state === 'fix');
  const counts = ["Let's fix this", 'Almost there', 'Mastered', 'Top form', 'New'].map((word) => ({ word, n: stations.filter((station) => station.word === word).length }));
  const doneCount = stations.filter((station) => station.state === 'done').length;
  const nextChapter = current ? list.find((chapter) => chapter.position > current.position) ?? null : null;
  const subjectGames = (games.data?.games ?? []).filter((game) => game.subjectId === subjectId);
  const due = (homework.data?.items ?? []).find((item) => item.subject === subject?.name && (item.status === 'todo' || item.status === 'overdue'));
  const fix = stations.find((station) => station.word === "Let's fix this");
  const goal = home.data?.todaysGoal;
  const line = stations.map((station) => {
    const x = Number.parseFloat(station.spot.left);
    const y = (Number.parseFloat(station.spot.top) / height) * 100;
    return `${x} ${y.toFixed(1)}`;
  }).join(' L ');
  const split = stations.findIndex((station) => station.state !== 'done');
  const solid = split <= 0 ? '' : stations.slice(0, split + 1).map((station) => {
    const x = Number.parseFloat(station.spot.left);
    const y = (Number.parseFloat(station.spot.top) / height) * 100;
    return `${x} ${y.toFixed(1)}`;
  }).join(' L ');

  if (subjects.denied || chapters.denied) return <section className="nb-card"><h1 className="nb-h1">This page is closed</h1><p className="nb-note">This subject is not open for this login.</p></section>;
  if ((subjects.status === 'loading' && !subjects.data) || (chapters.status === 'loading' && !chapters.data)) return <div className="nb-skel" />;
  if ((subjects.status === 'error' && !subjects.data) || (chapters.status === 'error' && !chapters.data)) return <p className="nb-empty" role="alert">Could not load this subject. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={() => { subjects.reload(); chapters.reload(); }}>Try again</button></p>;
  if (!subject) return <p className="nb-empty">This subject is not on your list.</p>;

  return <div className="nb-grid nb-grid--3col">
    <aside className="nb-col sp-left">
      <Link className="nb-link" to="/student?panel=subjects"><Icon name="back" /> All subjects</Link>
      <section className="nb-card">
        <div className="subj"><SubjectIcon subject={subject.name} large /><div><h1 className="nb-h2" style={{ fontSize: '1.8rem' }}>{subject.name}</h1></div></div>
        {current ? <><div style={{ display: 'flex', justifyContent: 'space-between', margin: '.8rem 0 .3rem' }}><b className="nb-label" style={{ color: 'var(--nb-navy)' }}>{current.title}</b><span className="nb-meta">{doneCount} of {stations.length} ideas completed</span></div><ProgressBar value={stations.length ? (doneCount / stations.length) * 100 : 0} color="var(--nb-blue)" /></> : <p className="nb-empty">No chapter yet.</p>}
      </section>
      <section className="nb-card nb-grow">
        <div className="nb-card__head"><h3 className="nb-h3">Jump to chapter</h3></div>
        {list.length ? list.map((chapter, index) => <Link className={chapter.id === current?.id ? 'chap on' : 'chap'} key={chapter.id} to={`/student/chapters/${chapter.id}`}><b>{index + 1}</b><span>{chapter.title}</span>{chapter.id !== current?.id && chapter.status === 'not_started' ? <Icon name="lock" /> : <span />}</Link>) : <p className="nb-empty">No chapter yet.</p>}
        <div className="nb-h3" style={{ fontSize: '1.2rem', marginTop: '1.2rem' }}>What the colours mean</div>
        <div className="legend">{counts.map((row) => <MasteryChip key={row.word} level={row.word} />)}</div>
      </section>
    </aside>
    <section className="sp-map">
      {current ? <div className="unit"><div><small>{subject.name}</small><h2>{current.title}</h2></div><Link className="nb-btn nb-btn--ghost nb-btn--sm" style={{ background: 'transparent', color: '#fff', borderColor: '#fff' }} to={`/student/chapters/${current.id}`}><Icon name="book" /> Notes</Link></div> : null}
      <div className="trail" style={{ ['--h' as string]: `${height}rem`, height: `${height}rem` }}>
        {stations.length ? <svg className="line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {solid ? <path d={`M ${solid}`} stroke="#3D6FB8" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" /> : null}
          {line ? <path d={`M ${line}`} stroke="#B9AE9B" strokeWidth="3" strokeDasharray="2 9" fill="none" strokeLinecap="round" /> : null}
        </svg> : null}
        {stations.map((station) => <Link className={`st ${station.state} ${station.spot.side}`} key={station.concept.id} style={{ left: station.spot.left, top: station.spot.top }} to={`/student/chapters/${current?.id}/concepts/${station.concept.id}`}><div className="o"><Icon name={station.state === 'fix' ? 'refresh' : 'book'} /></div><div className="lab"><b>{station.concept.title}</b><MasteryChip level={station.word} /></div></Link>)}
        {upNext && current ? <div className="nb-card pop" style={{ left: 'calc(40% + 3.8rem)', top: '25rem', width: '14rem' }}><span className="nb-label" style={{ color: 'var(--nb-gold-deep)' }}>Up next · idea {upNext.index + 1} of {stations.length}</span><h3>{upNext.concept.title}</h3><Link className="nb-btn nb-btn--primary" style={{ width: '100%', justifyContent: 'center' }} to={`/student/chapters/${current.id}/concepts/${upNext.concept.id}`}>Start <Icon name="arrow" /></Link></div> : null}
        {upNext ? <div className="nb-hide-m" style={{ position: 'absolute', left: '58%', top: '37rem' }}><Bubble hand>One idea at a time.</Bubble><Saathy mood="cheer" size="6rem" /></div> : null}
        {!stations.length && concepts.status !== 'loading' ? <p className="nb-empty">Your teacher is still adding ideas to this chapter.</p> : null}
        {concepts.status === 'error' && !concepts.data ? <p className="nb-empty" role="alert">Could not load ideas. <button type="button" className="nb-btn nb-btn--ghost nb-btn--sm" onClick={concepts.reload}>Try again</button></p> : null}
      </div>
      {nextChapter ? <div className="unit lock"><div><small><Icon name="lock" /> Opens after this chapter</small><h2>{nextChapter.title}</h2></div></div> : null}
    </section>
    <aside className="nb-col sp-right">
      <section className="nb-card">
        <div className="nb-card__head"><h3 className="nb-h3">Today's goal</h3></div>
          {home.status === 'loading' && !goal ? <div className="nb-skel" /> : home.status === 'error' && !goal ? <p className="nb-empty" role="alert">Could not load today's goal. <button className="nb-btn nb-btn--ghost nb-btn--sm" type="button" onClick={home.reload}>Try again</button></p> : goal?.total ? <>
            <div className="nb-note">{goal.done} / {goal.total} steps completed</div>
            <ProgressBar value={goal.done / goal.total * 100} />
            {goal.items.map((item) => <Link className="nb-row" key={item.id} to={item.href}><Icon name={item.done ? 'check' : 'arrow'} /><span className="nb-row__t">{item.label}</span></Link>)}
          </> : <p className="nb-empty">Nothing is lined up for today.</p>}
      </section>
      <section className="nb-card">
        <div className="nb-card__head"><h3 className="nb-h3">Next due</h3></div>
        {due ? <p className="nb-note">{due.title}</p> : <p className="nb-empty">Nothing is due in this subject.</p>}
      </section>
      <section className="nb-card"><div className="nb-card__head"><h3 className="nb-h3">{subject.name} games</h3></div>{games.status === 'error' ? <p role="alert">Could not load games. <button type="button" onClick={games.reload}>Try again</button></p> : subjectGames.map((game) => <div className="nb-row" key={game.gameId}><div><p className="nb-note">{game.title}</p><div className="nb-meta">{game.topic}</div><Link className="nb-btn nb-btn--gold nb-btn--sm" to={`/student/chapters/${game.chapterId}/practice`}>Play</Link></div></div>)}{games.data && !subjectGames.length ? <p className="nb-empty">Your teacher is preparing games for this subject.</p> : null}</section>
      {fix && current ? <section className="nb-sticky" style={{ margin: '.4rem .3rem' }}><span className="nb-sticky__who">Fix-it stop</span>{fix.concept.title} is marked <b>Let's fix this</b>.<br /><Link className="nb-btn nb-btn--ghost nb-btn--sm" style={{ marginTop: '.6rem' }} to={`/student/chapters/${current.id}/concepts/${fix.concept.id}`}>Start recap</Link></section> : null}
      <section className="nb-card nb-grow">
        <div className="nb-card__head"><h3 className="nb-h3">{current ? `${current.title} at a glance` : 'At a glance'}</h3><span className="nb-meta">{stations.length} ideas</span></div>
        {counts.map((row) => <div className="wk" key={row.word}><MasteryChip level={row.word} /><span /><span className="nb-meta">{row.n}</span></div>)}
      </section>
    </aside>
  </div>;
}
