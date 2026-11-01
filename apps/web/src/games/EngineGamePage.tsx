import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { InteractiveVideo } from './engine/InteractiveVideo';
import { GameSessionProvider } from './engine/GameSession';
import { loadGame } from './engine/registry';
import type { GameDef } from './engine/types';

export function EngineGamePage() {
  const { gameId = '' } = useParams();
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
  return <GameSessionProvider key={gameId} gameId={gameId}><InteractiveVideo game={game} /></GameSessionProvider>;
}
