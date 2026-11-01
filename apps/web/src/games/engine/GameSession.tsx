import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { finishSession, getBest, startSession, type GameBest, type GameFinish, type GameSession } from '../gameApi';

type SessionState = { gameId: string; session: GameSession | null; best: GameBest | null; error: boolean; retry: () => void };
const Context = createContext<SessionState | null>(null);
export const useGameSession = () => useContext(Context);

export function GameSessionProvider({ gameId, children }: { gameId: string; children: ReactNode }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [best, setBest] = useState<GameBest | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const eventId = useRef(crypto.randomUUID());
  useEffect(() => {
    const abort = new AbortController();
    setError(false);
    void startSession(gameId, eventId.current, abort.signal).then((value) => {
      if (!abort.signal.aborted) setSession(value);
    }).catch(() => { if (!abort.signal.aborted) setError(true); });
    void getBest(gameId, abort.signal).then((value) => {
      if (!abort.signal.aborted) setBest(value);
    }).catch(() => { /* A missing best must not manufacture a score. */ });
    return () => abort.abort();
  }, [gameId, attempt]);
  return <Context.Provider value={{ gameId, session, best, error, retry: () => setAttempt((value) => value + 1) }}>{children}</Context.Provider>;
}

export function GameFinishSummary() {
  const context = useGameSession();
  const [result, setResult] = useState<GameFinish | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const gameId = context?.gameId;
  const sessionId = context?.session?.sessionId;
  const eventId = useRef(crypto.randomUUID());
  useEffect(() => {
    if (!gameId || !sessionId) return;
    const abort = new AbortController();
    setError(false);
    void finishSession(gameId, sessionId, eventId.current, abort.signal).then((value) => {
      if (!abort.signal.aborted) setResult(value);
    }).catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => abort.abort();
  }, [gameId, sessionId, attempt]);
  if (!context) return null;
  return <p role="status">{result ? `${result.correct} of ${result.answered} · ${result.best.label}${result.personalBest ? ' · Your personal best' : ''} · +${result.xp} XP` : error ? <>Your result has not been confirmed. <button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></> : 'Saving your result…'}</p>;
}
