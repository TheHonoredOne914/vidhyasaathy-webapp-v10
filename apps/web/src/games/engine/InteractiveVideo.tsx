import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckpointPanel } from './CheckpointPanel';
import { RecapQuestions } from './RecapQuestions';
import { ReteachReplay } from './ReteachReplay';
import { RewardLayer } from './RewardLayer';
import { Saathy, speechBubbles } from './Saathy';
import { flushProgress, recordCheckpointResult } from './progress';
import { buildEndRecap, readRecap, recapOwner, rememberCheckpoint, scheduleRecap, type CheckpointHistory } from './recap';
import { awardCheckpoint, awardFocus, initialRewards, isRewardScene } from './rewards';
import { checkpointTime, validateGame, type CheckpointAnswer, type CheckpointResult, type GameDef, type SceneState } from './types';
import { useReducedMotion } from './useReducedMotion';
import './theme.css';
import { ArenaShell } from '../arena/ArenaShell';

type Attempt = { count: number; hintUsed: boolean; reteachUsed: boolean };
const EMPTY_ATTEMPT: Attempt = { count: 0, hintUsed: false, reteachUsed: false };

export function InteractiveVideo({ game }: { game: GameDef }) {
  if (game.arena) return <ArenaShell game={game} />;
  const error = useMemo(() => {
    try { validateGame(game); return null; } catch (cause) { return cause instanceof Error ? cause.message : 'Invalid game definition.'; }
  }, [game]);
  if (error) return <section className="iv-game"><p role="alert">This game cannot open: {error}</p></section>;
  return <VideoPlayer key={game.id} game={game} />;
}

function VideoPlayer({ game }: { game: GameDef }) {
  const reducedMotion = useReducedMotion();
  const [spacedItem] = useState(() => scheduleRecap(readRecap(), Date.now(), recapOwner()));
  const [phase, setPhase] = useState<'spaced' | 'intro' | 'play' | 'recap' | 'finished'>(spacedItem ? 'spaced' : 'intro');
  const [cursor, setCursor] = useState({ index: 0, ms: 0 });
  const [playing, setPlaying] = useState(false);
  const [frontier, setFrontier] = useState(0);
  const [unlocked, setUnlocked] = useState(0);
  const [rewards, setRewards] = useState(initialRewards);
  const [attempts, setAttempts] = useState<Record<string, Attempt>>({});
  const [answers, setAnswers] = useState<Record<string, CheckpointAnswer>>({});
  const [history, setHistory] = useState<CheckpointHistory[]>([]);
  const [failed, setFailed] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [noteIndex, setNoteIndex] = useState(0);
  const [celebration, setCelebration] = useState(0);
  const [expiredFocus, setExpiredFocus] = useState<string[]>([]);
  const [progressMessage, setProgressMessage] = useState('Answers stay on this device unless linked to school practice.');
  const checkpointStarted = useRef<Record<string, number>>({});
  const answering = useRef(false);
  const offsets = useMemo(() => {
    let offset = 0;
    return game.scenes.map((scene) => { const start = offset; offset += scene.durationMs; return start; });
  }, [game]);
  const scene = game.scenes[cursor.index]!;
  const offset = offsets[cursor.index] ?? 0;
  const checkpoint = scene.checkpoint;
  const solved = rewards.solved.includes(scene.id);
  const attempt = attempts[scene.id] ?? EMPTY_ATTEMPT;
  const atCheckpoint = Boolean(checkpoint && cursor.ms >= checkpointTime(scene));
  const atEnd = cursor.ms >= scene.durationMs;
  const blocked = atCheckpoint && !solved;
  const stopAt = checkpoint && !solved ? checkpointTime(scene) : scene.durationMs;
  const narrationIndex = Math.min(scene.narration.length - 1, Math.floor(cursor.ms / scene.durationMs * scene.narration.length));
  const renderState: SceneState = {
    revealed: checkpoint?.kind !== 'predict' || solved,
    solved, reducedMotion, narrationIndex, highlightId: scene.signals[narrationIndex] ?? null, answers,
  };
  const focus = scene.focusCheck;
  const focusActive = playing && !reducedMotion && focus && cursor.ms >= focus.atMs && cursor.ms < focus.atMs + 4000
    && !expiredFocus.includes(scene.id) && !rewards.focusCaught.includes(scene.id);
  const focusEnded = Boolean(focus && cursor.ms >= focus.atMs + 4000);

  useEffect(() => {
    let active = true;
    const sync = () => { void flushProgress().then((result) => { if (active) setProgressMessage(result.message); }); };
    sync();
    window.addEventListener('online', sync);
    const timer = window.setInterval(sync, 30_000);
    return () => { active = false; window.removeEventListener('online', sync); window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    const pauseHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pauseHidden);
    return () => { document.removeEventListener('visibilitychange', pauseHidden); };
  }, []);

  useEffect(() => {
    if (reducedMotion) setPlaying(false);
  }, [reducedMotion]);

  useEffect(() => {
    if (phase === 'play' && atCheckpoint && !solved && checkpointStarted.current[scene.id] === undefined) checkpointStarted.current[scene.id] = Date.now();
    if (atEnd && (!checkpoint || solved)) setUnlocked((current) => Math.max(current, Math.min(game.scenes.length - 1, cursor.index + 1)));
  }, [phase, atCheckpoint, solved, scene.id, atEnd, checkpoint, cursor.index, game.scenes.length]);

  useEffect(() => {
    answering.current = false;
  }, [scene.id]);

  useEffect(() => {
    if (focusEnded) setExpiredFocus((current) => current.includes(scene.id) ? current : [...current, scene.id]);
  }, [focusEnded, scene.id]);

  useEffect(() => {
    if (!playing || reducedMotion || phase !== 'play' || failed) return;
    let frame = 0;
    let previous: number | null = null;
    let ms = cursor.ms;
    const index = cursor.index;
    function tick(now: number) {
      const delta = previous === null ? 0 : now - previous;
      previous = now;
      ms = Math.min(stopAt, ms + delta);
      setCursor({ index, ms });
      setFrontier((current) => Math.max(current, offset + ms));
      if (ms >= stopAt) { setPlaying(false); return; }
      frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); };
  }, [playing, reducedMotion, phase, failed, cursor.index, stopAt, offset]);

  function say(text: string) {
    setNotes(speechBubbles(text));
    setNoteIndex(0);
  }

  function step() {
    if (blocked || atEnd || failed) return;
    setNotes([]);
    const ms = Math.min(stopAt, cursor.ms + scene.durationMs / scene.narration.length);
    setCursor({ index: cursor.index, ms });
    setFrontier((current) => Math.max(current, offset + ms));
  }

  function togglePlay() {
    if (phase !== 'play' || blocked || atEnd || failed) return;
    if (reducedMotion) { step(); return; }
    setNotes([]);
    setPlaying((current) => !current);
  }

  function seek(value: number) {
    const target = Math.max(0, Math.min(frontier, value));
    let index = 0;
    for (let next = 1; next <= unlocked; next += 1) {
      if ((offsets[next] ?? Infinity) <= target) index = next;
    }
    if (focusActive) setExpiredFocus((current) => [...current, scene.id]);
    setPlaying(false);
    setFailed(null);
    setNotes([]);
    setCursor({ index, ms: Math.min(game.scenes[index]!.durationMs, target - (offsets[index] ?? 0)) });
  }

  function continueScene() {
    if (checkpoint && !solved) return;
    setNotes([]);
    if (!atEnd) { if (reducedMotion) step(); else setPlaying(true); return; }
    if (cursor.index === game.scenes.length - 1) { setPhase('recap'); setPlaying(false); return; }
    const next = cursor.index + 1;
    setUnlocked((current) => Math.max(current, next));
    setCursor({ index: next, ms: 0 });
    setPlaying(false);
  }

  function submit(answer: CheckpointAnswer) {
    if (!checkpoint || solved || !atCheckpoint || answering.current) return;
    answering.current = true;
    const outcome = checkpoint.validate(answer);
    const nextAttempt = { ...attempt, count: attempt.count + 1, reteachUsed: attempt.reteachUsed || !outcome.correct };
    const result: CheckpointResult = {
      conceptId: checkpoint.conceptId, correct: outcome.correct, attempts: nextAttempt.count, hintUsed: attempt.hintUsed,
      ms: Math.max(0, Date.now() - (checkpointStarted.current[scene.id] ?? Date.now())), source: `game:${game.id}`,
    };
    setPlaying(false);
    setAttempts((current) => ({ ...current, [scene.id]: nextAttempt }));
    setHistory((current) => [...current, { sceneId: scene.id, result }]);
    rememberCheckpoint(game.id, scene.id, checkpoint, result);
    void recordCheckpointResult(result, checkpoint, answer).then((status) => { setProgressMessage(status.message); });
    if (outcome.correct) {
      setAnswers((current) => ({ ...current, [scene.id]: answer }));
      setRewards((current) => awardCheckpoint(current, { sceneId: scene.id, sceneIndex: cursor.index, attempts: nextAttempt.count, hintUsed: attempt.hintUsed, reteachUsed: attempt.reteachUsed }));
      if (isRewardScene(cursor.index)) setCelebration((current) => current + 1);
      say(outcome.feedback);
    } else {
      setRewards((current) => ({ ...current, streak: 0 }));
      setFailed(outcome.feedback);
    }
  }

  const header = <header className="iv-header"><div><p className="iv-chapter-caption">{game.chapterRef}</p><h1>{game.title}</h1></div></header>;
  if (phase === 'spaced' && spacedItem) return <section className="iv-game">{header}<RecapQuestions items={[{ id: spacedItem.id, conceptId: spacedItem.conceptId, question: spacedItem.question, priority: 1 }]} spacedItem={spacedItem} onDone={() => { setPhase('intro'); }} /></section>;
  if (phase === 'intro') return <section className="iv-game">{header}<Saathy text="Watch, then act. You choose when to move on." mood="talk" reducedMotion={reducedMotion} /><p>{reducedMotion ? 'Step-through mode: scenes change only when you ask.' : 'Space plays or pauses. Every checkpoint waits for you.'} You can revisit watched scenes. Every third scene has no stars.</p><button type="button" onClick={() => { setPhase('play'); }}>Begin</button></section>;
  if (phase === 'recap') return <section className="iv-game">{header}<RecapQuestions items={buildEndRecap(game, history)} onDone={() => { setPhase('finished'); }} /></section>;
  if (phase === 'finished') return <section className="iv-game">{header}<Saathy text="You recalled it without the scene. That helps it stick." mood="cheer" reducedMotion={reducedMotion} /><RewardLayer rewards={rewards} celebration={0} reducedMotion={reducedMotion} /><p>{progressMessage}</p><button type="button" onClick={() => { seek(0); setPhase('play'); }}>Review watched scenes</button></section>;

  const reteachScene = checkpoint?.reteach.sceneId ? game.scenes.find((candidate) => candidate.id === checkpoint.reteach.sceneId) ?? null : null;
  return (
    <section className="iv-game" tabIndex={0} aria-label={`${game.title} interactive video`} onKeyDown={(event) => {
      if (event.code !== 'Space' || event.repeat || (event.target as Element).closest('button, input, select, textarea, a')) return;
      event.preventDefault(); togglePlay();
    }}>
      {header}
      <div className="iv-scene-heading"><p aria-live="polite">Round {cursor.index + 1} of {game.scenes.length}{!isRewardScene(cursor.index) ? ' · Explore to earn XP' : ''}</p><RewardLayer rewards={rewards} celebration={celebration} reducedMotion={reducedMotion} /></div>
      {failed && checkpoint ? <ReteachReplay key={`${scene.id}-${attempt.count}`} scene={reteachScene} narration={checkpoint.reteach.narration ?? []} hint={checkpoint.reteach.hint} feedback={failed}
        state={{ ...renderState, revealed: reteachScene?.checkpoint?.kind !== 'predict' || rewards.solved.includes(reteachScene.id) }}
        onRetry={() => { setFailed(null); answering.current = false; setNotes([]); }} /> : (
        <>
          <div className="iv-stage" aria-label={`Interactive scene ${cursor.index + 1}`}>
            {scene.render(cursor.ms / scene.durationMs, renderState)}
            {focusActive && focus && <div className="iv-focus"><p>Focus check: {focus.prompt}</p><button type="button" className="iv-focus-target" style={{ left: `${focus.target.x}%`, top: `${focus.target.y}%` }} aria-label={focus.target.label} onClick={() => {
              setRewards((current) => awardFocus(current, scene.id, cursor.index)); setCelebration((current) => current + 1);
            }}><svg viewBox="0 0 44 44" aria-hidden="true"><path d="M22 5 C43 4 45 36 25 39 C1 43 -2 11 22 5Z M13 23 l6 5 12 -15" /></svg></button></div>}
          </div>
          <aside className="iv-side-panel" aria-label="Round task and concept step">
            <p className="iv-panel-kicker">TASK</p><h4>{scene.task ?? scene.narration[narrationIndex] ?? ''}</h4>
            <p className="iv-meter-label">Focus meter</p><div className="iv-meter"><span style={{ width: `${Math.min(100, ((cursor.ms / scene.durationMs) * 70) + (solved ? 30 : 0))}%` }} /></div>
            <div className="iv-concept"><p className="iv-panel-kicker">CONCEPT STEP</p><p>{scene.conceptStep ?? checkpoint?.reteach.hint ?? ''}</p></div>
            <div className="iv-saathy-row"><Saathy text={notes[noteIndex] ?? scene.narration[narrationIndex] ?? ''} mood={solved && notes.length > 0 ? 'cheer' : blocked ? 'think' : 'talk'} reducedMotion={reducedMotion} /></div>
          </aside>
          {noteIndex < notes.length - 1 && <button type="button" onClick={() => { setNoteIndex((current) => current + 1); }}>Next explanation</button>}
          {blocked && checkpoint && <CheckpointPanel key={`${scene.id}-${attempt.count}`} checkpoint={checkpoint} hintUsed={attempt.hintUsed} onAnswer={submit} onHint={() => {
            setAttempts((current) => ({ ...current, [scene.id]: { ...attempt, hintUsed: true } })); say(checkpoint.reteach.hint);
          }} />}
        </>
      )}
      <div className="iv-controls" aria-label="Video controls">
        <div className="iv-actions">
          <button type="button" onClick={togglePlay} disabled={blocked || atEnd || Boolean(failed)} aria-label={reducedMotion ? 'Step through scene' : playing ? 'Pause video' : 'Play video'}>{reducedMotion ? 'Next step' : playing ? 'Pause' : 'Play'}</button>
          <button type="button" disabled={frontier === 0 || Boolean(failed)} onClick={() => { seek(offset + cursor.ms - 10_000); }}>Replay last 10 seconds</button>
          <button type="button" disabled={Boolean(failed) || (Boolean(checkpoint) && !solved) || (!atEnd && !atCheckpoint)} onClick={continueScene}>{atEnd ? cursor.index === game.scenes.length - 1 ? 'Continue to recap' : 'Continue to next scene' : 'Continue'}</button>
        </div>
        <label className="iv-slider">Watched scenes only
          <input type="range" aria-label="Scrub watched scenes" min={0} max={Math.max(1, frontier)} step={1} value={Math.min(frontier, offset + cursor.ms)} disabled={frontier === 0 || Boolean(failed)} aria-valuetext={`${Math.floor((offset + cursor.ms) / 1000)} seconds watched position`} onChange={(event) => { seek(Number(event.target.value)); }} />
        </label>
        <nav className="iv-chapters" aria-label="Scene chapters">{game.scenes.map((chapter, index) => <button type="button" key={chapter.id} disabled={index > unlocked || Boolean(failed)} aria-label={`Scene ${index + 1}${index > unlocked ? ', locked' : ''}`} aria-current={index === cursor.index ? 'step' : undefined} onClick={() => { seek(offsets[index] ?? 0); }}><span className="iv-chapter-dot" aria-hidden="true" /><span>{index + 1}</span></button>)}</nav>
      </div>
      <footer className="iv-footer"><span>ROUND {cursor.index + 1}/{game.scenes.length}</span><span>✓ {rewards.solved.length}</span><span>★ {rewards.stars * 10} XP</span><span>🔥 {rewards.streak} streak</span><span>⏱ {Math.floor((offset + cursor.ms) / 1000)}s</span></footer>
      <p className="iv-progress" role="status">{progressMessage}</p>
    </section>
  );
}
