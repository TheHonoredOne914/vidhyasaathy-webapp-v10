import { useState } from 'react';
import { originalGames } from '../../../games/originals/catalog';
import { Link } from 'react-router-dom';
import { GamesSchema } from '../../../games/gameApi';
import { useRemote } from '../../../setup/useRemote';
import { Chip, PageHead, Tabs } from '../ui';
import { Saathy } from '../Saathy';
import '../pages/games.css';

function GameArt({ id }: { id: string }) {
  const paths: Record<string, string> = {
    newton: 'M20 80l40-50M55 25l10 10M15 88h70', motion: 'M15 80V20M15 80h70M15 78L80 28M15 78L80 55',
    sound: 'M20 50h8M38 35q10 15 0 30M52 26q16 24 0 48M66 17q22 33 0 66',
    float: 'M10 55q10-6 20 0t20 0 20 0 20 0M32 32h18v18H32z', energy: 'M15 25q30 0 45 40t30 15',
    graphs: 'M15 80V20M15 80h70M40 50h1M62 36h1', poly: 'M18 20h26v26H18zM50 20h32v26H50zM18 52h26v30H18zM50 52h32v30H50z',
  };
  return <svg viewBox="0 0 100 100" aria-hidden="true">{id === 'atom' ? <><circle cx="50" cy="50" r="5" /><ellipse cx="50" cy="50" rx="34" ry="13" /><ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(60 50 50)" /><ellipse cx="50" cy="50" rx="34" ry="13" transform="rotate(120 50 50)" /></> : id === 'cell' ? <><ellipse cx="50" cy="50" rx="36" ry="26" /><circle cx="52" cy="48" r="9" /><path d="M28 38q6 4 2 9M70 64q-5-3-1-8" /></> : id === 'matter' ? <><circle cx="30" cy="35" r="7" /><circle cx="62" cy="28" r="7" /><circle cx="48" cy="60" r="7" /><circle cx="75" cy="65" r="7" /></> : <path d={paths[id] ?? paths.graphs} />}</svg>;
}

// Only local student game links may become navigation targets.
export function playableGameHref(id: string, href: string): boolean {
  return id !== 'atom' && /^\/student\/[^?#]*\/engine\/[a-z]+(?:[?#].*)?$/.test(href) && !href.includes('/atom') && !href.includes('\\');
}

export function GamesBoard() {
  const shelf = useRemote('/student/games', GamesSchema);
  const [tab, setTab] = useState('all');
  const data = shelf.data;
  const featured = data?.todaysGame && data.todaysGame.gameId !== 'atom' ? data.todaysGame : null;
  const games = data?.games.filter((game) => tab === 'all' || game.subjectId === tab) ?? [];
  return <div className="nb-col p3c-games">
    <div className="gm-head"><PageHead title="Games" sub="Each one is a real idea from your chapters, played instead of read." /><Tabs tabs={[{ id: 'all', label: data ? `All ${data.total}` : 'All' }, ...(data?.subjects.map((subject) => ({ id: subject.id, label: `${subject.name} ${subject.count}` })) ?? [])]} active={tab} onChange={setTab} /></div>
    <section className="nb-card feat"><span className="nb-tape" /><div className="gm gm-feature-art"><div className="art">{featured ? <GameArt id={featured.gameId} /> : null}</div></div><div><Chip tone="orange">Today's game</Chip><h2 className="nb-h2">{featured?.title ?? 'Your next game is on its way'}</h2><p className="nb-text">{featured ? <>{featured.blurb} {featured.lessonNote}</> : shelf.status === 'loading' ? 'Opening your game shelf…' : 'Keep going with your chapters. Your game will land here.'}</p>{shelf.status === 'error' && !shelf.denied ? <button className="nb-btn nb-btn--ghost nb-btn--sm" onClick={shelf.reload}>Retry</button> : null}</div><div className="gm-feature-action"><Saathy mood="cheer" size="4.6rem" />{featured && playableGameHref(featured.gameId, featured.href) ? <Link className="nb-btn nb-btn--primary nb-btn--lg" to={featured.href}>Play · {featured.estMinutes} min</Link> : null}</div></section>
    <div className="gm-grid">{tab === 'all' && data?.atomForge?.status === 'ready' && data.atomForge.href === '/student/games/atom' ? <article className="nb-card gm"><div className="art"><GameArt id="atom" /></div><b>{data.atomForge.label}</b><div className="foot"><Link className="nb-btn nb-btn--ghost nb-btn--sm" to={data.atomForge.href}>{data.atomForge.label}</Link></div></article> : null}{games.map((game) => {
      const paused = game.gameId === 'atom' || game.state === 'paused';
      const locked = !paused && game.state === 'opens_later';
      const today = !paused && !locked && game.state === 'today';
      return <article className={`nb-card gm${locked ? ' lock' : ''}${today ? ' today' : ''}`} key={game.gameId}><div className="art"><GameArt id={game.gameId} /></div><b>{game.title}</b><span className="nb-meta">{game.topic}</span><div className="foot">{paused ? <Chip tone="sand">Coming back soon</Chip> : locked ? <><span className="nb-meta">{game.opensAfter || 'Opens after its chapter'}</span>{game.chapterLabel ? <Chip dashed>{game.chapterLabel}</Chip> : null}</> : <><span className="nb-meta">{game.best?.label ?? (today ? 'Today' : game.state === 'new' ? 'New' : '')}</span>{playableGameHref(game.gameId, game.href) ? <Link className={`nb-btn nb-btn--${today ? 'primary' : 'ghost'} nb-btn--sm`} to={game.href}>{game.state === 'played' ? 'Again' : 'Play'}</Link> : null}</>}</div></article>;
    })}</div>{data && !games.length ? <p className="nb-note">No games for this subject yet.</p> : null}
    <section className="original-shelf" aria-label="Original learning games"><h2 className="nb-h2">Your original games</h2><p className="nb-text">Full adventures and labs from VidhyaSaathy. Explore freely; assessed practice continues in your chapter games.</p><div className="gm-grid">{originalGames.filter((game) => tab === 'all' || game.subject === 'Across subjects' || data?.subjects.find((subject) => subject.id === tab)?.name.toLowerCase().includes(game.subject === 'Physics' ? 'science' : game.subject.toLowerCase().slice(0, 4))).map((game) => <article className="nb-card gm" key={game.id}><b>{game.title}</b><span className="nb-meta">{game.subject}</span><p>{game.description}</p><Link className="nb-btn nb-btn--ghost" to={`/student/games/original/${game.id}`}>Play original</Link></article>)}</div></section>
  </div>;
}
