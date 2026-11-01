import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentHomeSchema } from '@vidhyasaathy/contracts';
import { getJson } from '../../../api/client';
import { GAME_REGISTRY } from '../../../games/engine/registry';
import { ChapterListSchema } from '../../../content/schemas';
import { SubjectListSchema } from '../../../setup/schemas';
import { useRemote } from '../../../setup/useRemote';
import { Chip, PageHead, Tabs } from '../ui';
import { Saathy } from '../Saathy';
import { ScreenState } from './polish3c/ScreenState';
import '../pages/games.css';

const CATALOG = [
  { id: 'newton', title: 'Cricket Lab', topic: 'Force and motion', words: ['force', 'laws of motion'] },
  { id: 'motion', title: 'Bus Stop Graphs', topic: 'Motion graphs', words: ['motion'] },
  { id: 'atom', title: 'Atom Forge', topic: 'Atoms', words: ['atom'] },
  { id: 'cell', title: 'Bio Quest', topic: 'The cell', words: ['cell', 'unit of life'] },
  { id: 'matter', title: 'Particle Party', topic: 'Matter', words: ['matter'] },
  { id: 'float', title: 'Float or Sink', topic: 'Gravitation', words: ['gravitation', 'floatation'] },
  { id: 'energy', title: 'Energy Slide', topic: 'Work and energy', words: ['work', 'energy'] },
  { id: 'sound', title: 'Echo Corridor', topic: 'Sound', words: ['sound'] },
  { id: 'graphs', title: 'Treasure Grid', topic: 'Coordinates', words: ['coordinate'] },
  { id: 'poly', title: 'Polynomial Factory', topic: 'Polynomials', words: ['polynomial'] },
] as const;

type Chapter = { id: string; title: string; subjectId: string; status: string };

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
  const home = useRemote('/student/home', StudentHomeSchema);
  const [tab, setTab] = useState('all');
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const ids = subjects.data?.map((subject) => subject.id).join(',') ?? '';
  useEffect(() => {
    const controller = new AbortController();
    setChapters(null);
    setChapterError(null);
    void Promise.all(ids ? ids.split(',').map((id) => getJson(`/subjects/${id}/chapters`, ChapterListSchema, controller.signal)) : [])
      .then((lists) => { if (!controller.signal.aborted) setChapters(lists.flat()); })
      .catch(() => { if (!controller.signal.aborted) setChapterError('Could not open your game shelf.'); });
    return () => { controller.abort(); };
  }, [ids, attempt]);

  const subjectId = tab === 'all' ? null : tab;
  const pool = (chapters ?? []).filter((chapter) => !subjectId || chapter.subjectId === subjectId);
  function match(words: readonly string[]) {
    return pool.find((chapter) => words.some((word) => chapter.title.toLowerCase().includes(word))) ?? null;
  }
  const recommendation = home.data?.todaysGame;
  const featured = recommendation && !/atom/i.test(`${recommendation.gameId} ${recommendation.title}`)
    ? CATALOG.find((game) => game.id === recommendation.gameId) : null;
  const catalog = CATALOG.filter((game) => tab === 'all' || match(game.words) || (game.id === featured?.id && pool.some((chapter) => recommendation?.href.includes(chapter.id))));
  const retry = () => { subjects.reload(); home.reload(); setAttempt((value) => value + 1); };
  if ((subjects.status === 'error' && !subjects.data) || (home.status === 'error' && !home.data) || chapterError) return <ScreenState error={chapterError ?? subjects.message ?? home.message} retry={retry} />;
  if (!subjects.data || !home.data || !chapters) return <ScreenState loading retry={retry} />;

  return <div className="nb-col p3c-games">
    <div className="gm-head"><PageHead title="Games" sub="Each one is a real idea from your chapters, played instead of read." />
    <Tabs tabs={[{ id: 'all', label: `All ${CATALOG.length}` }, ...subjects.data.map((subject) => ({ id: subject.id, label: subject.name }))]} active={tab} onChange={setTab} /></div>
    <section className="nb-card feat">
      <span className="nb-tape" />
      <div className="gm gm-feature-art"><div className="art" aria-hidden="true"><GameArt id={featured?.id ?? 'newton'} /></div></div>
      <div>
        <Chip tone="orange">Today's game</Chip>
        <h2 className="nb-h2">{featured ? recommendation?.title : 'Your next game is on its way'}</h2>
        <p className="nb-text">{featured ? <>{GAME_REGISTRY.find((game) => game.id === featured.id)?.detail} Goes with {recommendation?.conceptName}.</> : 'Keep going with your chapters. Your game will land here.'}</p>
      </div>
      <div className="gm-feature-action"><Saathy mood="cheer" size="4.6rem" />{featured && recommendation?.href.startsWith('/student/') ? <Link className="nb-btn nb-btn--primary nb-btn--lg" to={recommendation.href}>Play · {recommendation.estMinutes} min</Link> : null}</div>
    </section>
    <div className="gm-grid">{catalog.map((game) => {
      const chapter = game.id === featured?.id ? chapters.find((item) => recommendation?.href.includes(item.id)) ?? match(game.words) : match(game.words);
      const paused = 'paused' in game && game.paused;
      const locked = game.id !== 'atom' && !paused && (!chapter || (chapter.status === 'not_started' && game.id !== featured?.id));
      const className = `nb-card gm${locked ? ' lock' : ''}${game.id === featured?.id && !locked ? ' today' : ''}`;
      const body = <>
        <div className="art" aria-hidden="true"><GameArt id={game.id} /></div>
        <b>{paused ? 'Atom Forge' : GAME_REGISTRY.find((item) => item.id === game.id)?.title}</b>
        <span className="nb-meta">{chapter?.title ?? 'A chapter game'}</span>
        <div className="foot">{paused ? <Chip tone="sand">Coming back soon</Chip> : locked ? <span className="nb-meta">Opens after {chapter?.title ?? 'its chapter'}</span> : <><span className="nb-meta">{game.id === featured?.id ? 'Today' : ''}</span><Link className={`nb-btn nb-btn--${game.id === featured?.id ? 'primary' : 'ghost'} nb-btn--sm`} to={game.id === 'atom' ? `/student/chapters/${chapter?.id ?? pool[0]?.id ?? chapters[0]?.id ?? 'atoms'}/practice/engine/atom` : game.id === featured?.id && recommendation ? recommendation.href : `/student/chapters/${chapter!.id}/practice/engine/${game.id}`}>Play</Link></>}</div>
      </>;
      return <article className={className} key={game.id}>{body}</article>;
    })}</div>
    {!catalog.length ? <p className="nb-empty">No games for this subject yet.</p> : null}
  </div>;
}
