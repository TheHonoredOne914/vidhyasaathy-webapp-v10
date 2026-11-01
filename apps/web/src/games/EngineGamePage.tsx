import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';
import { GamesSchema } from './gameApi';
import { Link } from 'react-router-dom';
import { InteractiveVideo } from './engine/InteractiveVideo';
import { GameSessionProvider } from './engine/GameSession';
import { loadGame } from './engine/registry';
import type { GameDef } from './engine/types';

export function EngineGamePage() {
  const { gameId = '', chapterId = '' } = useParams();
  const board = useRemote(gameId !== 'demo' ? '/student/games' : null, GamesSchema);
  const [game, setGame] = useState<GameDef | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void loadGame(gameId).then((loaded) => { if (active) { setGame(loaded); setLoading(false); } }).catch(() => { if (active) { setGame(null); setLoading(false); } });
    return () => { active = false; };
  }, [gameId]);
  if (loading) return <section className="iv-game"><p>Loading game…</p></section>;
  if (!game) return <section className="iv-game"><p role="alert">This game is not available.</p></section>;
  if (gameId !== 'demo') {
    if (board.denied || (board.status === 'error' && !board.data)) return <section className="iv-game"><p role="alert">Could not check this chapter’s games.</p><button type="button" onClick={board.reload}>Try again</button></section>;
    if (!board.data) return <section className="iv-game"><p>Opening the chapter’s games…</p></section>;
    if (!board.data.games.some((row) => row.gameId === gameId && row.chapterId === chapterId)) return <section className="iv-game"><p role="alert">This game belongs to another chapter.</p><Link to={`/student/chapters/${chapterId}/practice`}>See this chapter’s games</Link></section>;
  }
  return <GameSessionProvider key={gameId} gameId={gameId}><InteractiveVideo game={game} /></GameSessionProvider>;
}
