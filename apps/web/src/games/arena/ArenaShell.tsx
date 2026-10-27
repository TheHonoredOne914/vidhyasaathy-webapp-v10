import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { recordCheckpointResult } from '../engine/progress';
import type { ArenaApi, ArenaStat, GameDef } from '../engine/types';
import './arena.css';
import './fix2.css';

export function ArenaShell({ game }: { game: GameDef }) {
  const arena = game.arena!;
  const { chapterId } = useParams<{ chapterId: string }>();
  const requested = Number(new URLSearchParams(window.location.search).get('level'));
  const [levelIndex, setLevelIndex] = useState(() => Math.min(arena.levels.length - 1, Math.max(0, Number.isFinite(requested) && requested > 0 ? requested - 1 : 0)));
  const [round, setRound] = useState(() => Math.min(arena.levels.length, Math.max(1, Number.isFinite(requested) && requested > 0 ? requested : 1)));
  const [stat, setStat] = useState<ArenaStat | null>(null);
  const [streak, setStreak] = useState(0);
  const [hintRequested, setHintRequested] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [readout, setReadout] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const primary = useRef<(() => void) | null>(null);
  const level = arena.levels[levelIndex]!;
  const roundRef = useRef(round);
  const hintRequestedRef = useRef(hintRequested);
  const readoutRef = useRef(readout);
  const arenaRef = useRef(arena);
  const gameRef = useRef(game);
  const levelIndexRef = useRef(levelIndex);
  const startedRef = useRef(started);
  const levelRef = useRef(level);
  roundRef.current = round;
  hintRequestedRef.current = hintRequested;
  readoutRef.current = readout;
  arenaRef.current = arena;
  gameRef.current = game;
  levelIndexRef.current = levelIndex;
  startedRef.current = started;
  levelRef.current = level;
  const registerPrimary = useCallback((fn: () => void) => { primary.current = fn; }, []);
  const reportResult = useCallback((correct: boolean) => {
    const currentArena = arenaRef.current;
    const currentGame = gameRef.current;
    const currentLevelIndex = levelIndexRef.current;
    const currentLevel = levelRef.current;
    if (!correct) { setStreak(0); setFeedback('Almost — check the highlighted values and try again.'); return; }
    setStreak((value) => value + 1);
    setFeedback(currentLevelIndex === currentArena.levels.length - 1 ? 'Energy balanced. Mission complete!' : 'Correct! Level unlocked.');
    void recordCheckpointResult({ conceptId: `${currentGame.id}.arena.level-${currentLevelIndex + 1}`, correct: true, attempts: 1, hintUsed: hintRequestedRef.current, ms: Date.now() - startedRef.current, source: `game:${currentGame.id}` }, {
      kind: 'numeric', prompt: currentLevel.title, conceptId: `${currentGame.id}.arena.level-${currentLevelIndex + 1}`, unit: '', validate: () => ({ correct: true, feedback: '' }), reteach: { hint: currentLevel.subtitle },
    }, currentLevelIndex + 1);
  }, []);
  const api = useMemo<ArenaApi>(() => ({
    get round() { return roundRef.current; },
    setStats: setStat,
    get hintRequested() { return hintRequestedRef.current; },
    get readout() { return readoutRef.current; },
    setReadout,
    registerPrimary,
    reportResult,
  }), [registerPrimary, reportResult]);

  useEffect(() => { const id = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => window.clearInterval(id); }, [started]);
  useEffect(() => { setStat(null); setStreak(0); setReadout({}); setFeedback(null); setHintRequested(false); setStarted(Date.now()); primary.current = null; }, [levelIndex]);

  const check = () => { primary.current?.(); level.check(api); };
  const next = () => { if (levelIndex < arena.levels.length - 1) { setLevelIndex((i) => i + 1); setRound((r) => r + 1); } };
  return <main className="arena-page">
    <header className="arena-top"><div className="arena-brand"><Link className="arena-back" to={chapterId ? `/student/chapters/${chapterId}` : '/student'}>← Back to subject</Link><img src="/img/logo.webp" alt="VidhyaSaathy" /><div><strong>{arena.name}</strong><small>BY VIDHYASAATHY · GRADE 9 ARENA</small></div></div><div className="arena-rank"><span>◈</span><b>WARRIOR</b><small>LV 5 · {arena.name} Apprentice</small></div><div className="arena-xp"><div><span /><span /></div><small>1,180 XP · next LV 1500</small></div></header>
    <div className="arena-wrap"><p className="arena-crumb">Worlds › <b>{arena.world}</b> › NCERT Class 9 › {arena.chapterLabel}</p><h1>Level {levelIndex + 1} · {level.title}</h1><p className="arena-subtitle">{level.subtitle}</p>
      <div className="arena-grid"><section className="arena-main"><div className="arena-stage"><level.Stage api={api} /></div><footer className="arena-footer"><span>Round {round} / {arena.levels.length}</span><span>{stat?.label ?? 'Score'} <b>{stat?.value ?? '—'}</b></span><span>Streak <b>{streak}</b></span><span>Time <b>{String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')}</b></span></footer></section>
        <aside className="arena-side"><section className="arena-card task"><small className="arena-kicker">YOUR TASK</small><h2>{level.taskTitle}</h2><p>{level.taskText}</p>{typeof level.taskBody === 'function' ? level.taskBody(api) : level.taskBody}</section><section className="arena-card arena-card-two">{typeof level.card2 === 'function' ? level.card2(api) : level.card2}<div className="arena-actions"><button type="button" onClick={() => setHintRequested(true)}>♧ Hint</button><button type="button" className="arena-primary" onClick={check}> {level.primaryLabel}</button></div></section><section className="arena-concept"><small>SAMJHO · CONCEPT STRIP</small><p>{level.concept}</p></section>{feedback && <div className="arena-feedback" role="status">{feedback}{feedback.startsWith('Correct') && levelIndex < arena.levels.length - 1 && <button type="button" onClick={next}>Next level →</button>}</div>}</aside></div></div>
  </main>;
}
