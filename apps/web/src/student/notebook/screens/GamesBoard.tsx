import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson } from '../../../api/client';
import { ChapterListSchema } from '../../../content/schemas';
import { SubjectListSchema } from '../../../setup/schemas';
import { useRemote } from '../../../setup/useRemote';
import { Chip, PageHead, Tabs } from '../ui';
import { Saathy } from '../Saathy';
import '../pages/games.css';

const CATALOG = [
  { id: 'newton', title: 'Cricket Lab', topic: 'Force and motion', words: ['force', 'laws of motion'] },
  { id: 'motion', title: 'Bus Stop Graphs', topic: 'Motion graphs', words: ['motion'] },
  { id: 'atom', title: 'Atom Forge', topic: 'Atoms', words: ['atom'], paused: true },
  { id: 'cell', title: 'Bio Quest', topic: 'The cell', words: ['cell', 'unit of life'] },
  { id: 'matter', title: 'Particle Party', topic: 'Matter', words: ['matter'] },
  { id: 'float', title: 'Float or Sink', topic: 'Gravitation', words: ['gravitation', 'floatation'] },
  { id: 'energy', title: 'Energy Slide', topic: 'Work and energy', words: ['work', 'energy'] },
  { id: 'sound', title: 'Echo Corridor', topic: 'Sound', words: ['sound'] },
  { id: 'graphs', title: 'Treasure Grid', topic: 'Coordinates', words: ['coordinate'] },
  { id: 'poly', title: 'Polynomial Factory', topic: 'Polynomials', words: ['polynomial'] },
] as const;

type Chapter = { id: string; title: string; subjectId: string };

function GameArt({ id }: { id: string }) {
  if (id === 'newton') return <svg viewBox="0 0 100 100"><path d="M20 80l40-50M55 25l10 10" /><circle cx="72" cy="70" r="7" /><path d="M15 88h70" strokeDasharray="4 5" /></svg>;
  if (id === 'motion') return <svg viewBox="0 0 100 100"><path d="M15 80V20M15 80h70" /><path d="M15 78L80 28" /><path d="M15 78L80 55" strokeDasharray="5 4" /></svg>;
  if (id === 'atom') return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="5" /><ellipse cx="50" cy="50" rx="34" ry="13" /><ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(60 50 50)" /><ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(120 50 50)" /></svg>;
  if (id === 'cell') return <svg viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="36" ry="26" /><circle cx="52" cy="48" r="9" /><path d="M28 38q6 4 2 9M70 64q-5-3-1-8" /></svg>;
  if (id === 'matter') return <svg viewBox="0 0 100 100"><circle cx="30" cy="35" r="7" /><circle cx="62" cy="28" r="7" /><circle cx="48" cy="60" r="7" /><circle cx="75" cy="65" r="7" /><path d="M22 70l-6 6M86 35l6-6M40 20l-3-8" /></svg>;
  if (id === 'float') return <svg viewBox="0 0 100 100"><path d="M10 55q10-6 20 0t20 0 20 0 20 0" /><rect x="32" y="32" width="18" height="18" rx="2" /><circle cx="70" cy="72" r="8" /></svg>;
  if (id === 'energy') return <svg viewBox="0 0 100 100"><path d="M15 25q30 0 45 40t30 15" /><circle cx="25" cy="22" r="6" /></svg>;
  if (id === 'sound') return <svg viewBox="0 0 100 100"><path d="M20 50h8" /><path d="M38 35q10 15 0 30M52 26q16 24 0 48M66 17q22 33 0 66" /></svg>;
  if (id === 'graphs') return <svg viewBox="0 0 100 100"><path d="M15 80V20M15 80h70" /><circle cx="40" cy="50" r="4" /><circle cx="62" cy="36" r="4" /></svg>;
  return <svg viewBox="0 0 100 100"><rect x="18" y="20" width="26" height="26" rx="3" /><rect x="50" y="20" width="32" height="26" rx="3" /><rect x="18" y="52" width="26" height="30" rx="3" /><rect x="50" y="52" width="32" height="30" rx="3" /></svg>;
}

export function GamesBoard() {
  const subjects = useRemote('/student/subjects', SubjectListSchema);
  const [tab, setTab] = useState('all');
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const ids = subjects.data?.map((subject) => subject.id).join(',') ?? '';
  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    void Promise.all(ids.split(',').map((id) => getJson(`/subjects/${id}/chapters`, ChapterListSchema, controller.signal).catch(() => [])))
      .then((lists) => { if (!controller.signal.aborted) setChapters(lists.flat()); });
    return () => { controller.abort(); };
  }, [ids]);

  const subjectId = tab === 'all' ? null : tab;
  const pool = (chapters ?? []).filter((chapter) => !subjectId || chapter.subjectId === subjectId);
  function match(words: readonly string[]) {
    return pool.find((chapter) => words.some((word) => chapter.title.toLowerCase().includes(word))) ?? null;
  }
  const playable = CATALOG.filter((game) => !('paused' in game && game.paused) && match(game.words));
  const featured = playable[0] ?? CATALOG[0];
  const featuredChapter = match(featured.words);

  return <div className="nb-col">
    <PageHead eyebrow="Play" title="Games" sub="A short game after the idea it belongs to." />
    <Tabs tabs={[{ id: 'all', label: 'All' }, ...(subjects.data ?? []).map((subject) => ({ id: subject.id, label: subject.name }))]} active={tab} onChange={setTab} />
    <section className="nb-card feat">
      <div className="art" aria-hidden="true"><GameArt id={featured.id} /></div>
      <div>
        <span className="nb-label">Today's game · {featured.title}</span>
        <h2 className="nb-h2">{featured.topic}</h2>
        <p className="nb-text">{featuredChapter ? 'This chapter is open.' : 'Opens when that chapter is on your list.'}</p>
      </div>
      <div>{featuredChapter && !('paused' in featured && featured.paused) ? <Link className="nb-btn nb-btn--primary" to={`/student/chapters/${featuredChapter.id}/practice/engine/${featured.id}`}>Play · 5 min</Link> : <Saathy mood="think" size="4rem" />}</div>
    </section>
    <div className="gm-grid">{CATALOG.map((game) => {
      const chapter = match(game.words);
      const paused = 'paused' in game && game.paused;
      const locked = paused || !chapter;
      const className = `nb-card gm${locked ? ' lock' : ''}${game.id === featured.id && !locked ? ' today' : ''}`;
      const body = <>
        <div className="art" aria-hidden="true"><GameArt id={game.id} /></div>
        <b>{game.title}</b>
        <span className="nb-meta">{game.topic}</span>
        <div className="foot">{paused ? <Chip tone="sand">Coming back soon</Chip> : locked ? <span className="nb-meta">Opens after the chapter is added</span> : <span className="nb-link">Play</span>}</div>
      </>;
      return paused || !chapter ? <article className={className} key={game.id}>{body}</article> : <Link className={className} key={game.id} to={`/student/chapters/${chapter.id}/practice/engine/${game.id}`}>{body}</Link>;
    })}</div>
  </div>;
}
