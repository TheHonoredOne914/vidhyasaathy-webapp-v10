import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { planReturn } from '../../proto/gameReturn';
import { ServerCheckpointPanel } from '../engine/CheckpointPanel';
import { GameFinishSummary, useGameSession } from '../engine/GameSession';
import type { ArenaApi, ArenaStat, GameDef } from '../engine/types';
import './arena.css';
import './fix2.css';

export function ArenaShell({ game }: { game: GameDef }) {
  const arena = game.arena!;
  const context = useGameSession();
  const [params] = useSearchParams();
  const returnTo = planReturn(params);
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);
  const [stat, setStat] = useState<ArenaStat | null>(null);
  const [hintRequested, setHintRequested] = useState(false);
  const [readout, setReadout] = useState<Record<string, string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const primary = useRef<(() => void) | null>(null);
  const started = useRef(Date.now());
  const state = useRef({ index, hintRequested, readout });
  state.current = { index, hintRequested, readout };
  const registerPrimary = useCallback((fn: () => void) => { primary.current = fn; }, []);
  // Simulation feedback is local; only server checkpoint answers earn evidence.
  const reportResult = useCallback((correct: boolean) => setFeedback(correct), []);
  const api = useMemo<ArenaApi>(() => ({
    get round() { return state.current.index + 1; }, setStats: setStat,
    get hintRequested() { return state.current.hintRequested; },
    get readout() { return state.current.readout; }, setReadout, registerPrimary, reportResult,
  }), [registerPrimary, reportResult]);
  useEffect(() => { const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 1000); return () => window.clearInterval(id); }, []);
  useEffect(() => { setStat(null); setReadout({}); setHintRequested(false); setAnswered(false); setFeedback(null); }, [index]);
  const keys = Object.keys(context?.session?.checkpoints ?? {});
  const checkpointKey = keys[index];
  const level = arena.levels[Math.min(index, arena.levels.length - 1)]!;
  const best = context?.best;
  return <main className="arena-page">
    <header className="arena-top"><div className="arena-brand"><Link className="arena-back" to={returnTo ?? '/student?panel=games'}>{returnTo ? 'Back to my plan' : 'Back to PlayLab'}</Link><img src="/img/logo.webp" alt="VidhyaSaathy" /><div><strong>{arena.name}</strong><small>{best?.conceptName ?? game.chapterRef}</small></div></div>{best?.best ? <p>Your best: {best.best.label.replace(/^Best\s+/i, '')}</p> : null}</header>
    <div className="arena-wrap"><p className="arena-crumb">{arena.chapterLabel}</p><h1>{level.title}</h1><p className="arena-subtitle">{level.subtitle}</p>
      <div className="arena-grid"><section className="arena-main"><div className="arena-stage"><level.Stage key={index} api={api} /></div><footer className="arena-footer"><span>{stat?.label ?? 'Explore'} <b>{stat?.value ?? '—'}</b></span><span>Time <b>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</b></span></footer></section>
        <aside className="arena-side"><section className="arena-card task"><small className="arena-kicker">YOUR TASK</small><h2>{level.taskTitle}</h2><p>{level.taskText}</p>{typeof level.taskBody === 'function' ? level.taskBody(api) : level.taskBody}</section>
          <section className="arena-card arena-card-two">{typeof level.card2 === 'function' ? level.card2(api) : level.card2}<button type="button" className="nb-btn nb-btn--primary" onClick={() => { primary.current?.(); level.check(api); }}>{level.primaryLabel}</button><button type="button" onClick={() => setHintRequested(true)}>Hint</button>{feedback !== null ? <p role="status">{feedback ? 'That works. Try the checkpoint next.' : 'Adjust the simulation and try again.'}</p> : null}</section>
          <section className="arena-card">{finished ? <><h2>Mission complete</h2><GameFinishSummary /></> : checkpointKey ? <><ServerCheckpointPanel key={checkpointKey} checkpointKey={checkpointKey} onAnswered={() => setAnswered(true)} />{answered ? <button type="button" className="nb-btn nb-btn--primary" onClick={() => { if (index + 1 < keys.length) setIndex((value) => value + 1); else setFinished(true); }}>{index + 1 < keys.length ? 'Next' : 'Finish'}</button> : null}</> : <p role="status">{context?.error ? <>I can’t reach your checkpoint right now. <button type="button" onClick={context.retry}>Retry</button></> : context?.session ? 'No checkpoint is available yet.' : 'Opening your checkpoint…'}</p>}</section>
          <section className="arena-concept"><small>SAMJHO · CONCEPT STRIP</small><p>{level.concept}</p></section>
        </aside></div></div>
  </main>;
}
