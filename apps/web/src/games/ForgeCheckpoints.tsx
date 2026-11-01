import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';
import { GamesSchema } from './gameApi';
import { GameFinishSummary, useGameSession } from './engine/GameSession';
import { ServerCheckpointPanel } from './engine/CheckpointPanel';
import './forge-checkpoints.css';

/** Companion checkpoints keep the independently maintained Forge engine intact. */
export function ForgeCheckpoints() {
  const context = useGameSession();
  const [open, setOpen] = useState(false), [index, setIndex] = useState(0), [answered, setAnswered] = useState(false), [done, setDone] = useState(false);
  const keys = Object.keys(context?.session?.checkpoints ?? {});
  const checkpointKey = keys[index];
  return <aside className="forge-checkpoints"><button className="nb-btn nb-btn--primary" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Return to the Forge' : 'Save chapter checkpoints'}</button>{open ? <section className="nb-card" aria-label="Atom Forge chapter checkpoints"><h2>Structure of the Atom</h2>{done ? <><GameFinishSummary /><Link to="/student?panel=games">Back to games</Link></> : checkpointKey ? <><ServerCheckpointPanel key={checkpointKey} checkpointKey={checkpointKey} onAnswered={() => setAnswered(true)} />{answered ? <button type="button" className="nb-btn nb-btn--primary" onClick={() => { setAnswered(false); if (index + 1 < keys.length) setIndex(index + 1); else setDone(true); }}>{index + 1 < keys.length ? 'Next checkpoint' : 'Save round'}</button> : null}</> : <p>{context?.error ? <button type="button" onClick={context.retry}>Retry checkpoints</button> : 'Opening checkpoints…'}</p>}</section> : null}</aside>;
}

export function ForgeChapterEntry() {
  const board = useRemote('/student/games', GamesSchema);
  const game = board.data?.games.find((row) => row.gameId === 'atom');
  if (game) return <Navigate replace to={game.href} />;
  return <section className="nb-card"><p>{board.status === 'error' ? 'Could not open Atom Forge.' : board.data ? 'Your teacher is preparing Atom Forge.' : 'Opening Atom Forge…'}</p>{board.status === 'error' ? <button type="button" onClick={board.reload}>Try again</button> : null}<Link to="/student?panel=games">Back to games</Link></section>;
}
