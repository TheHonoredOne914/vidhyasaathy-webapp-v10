import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '../../session';
import { embedGame, gameSaveKey, originalGames, readGameSave } from './catalog';
import './originals.css';

export function OriginalGamePage() {
  const { originalId } = useParams();
  const { me } = useSession();
  const game = originalGames.find((entry) => entry.id === originalId);
  const owner = me ? `${me.school.id}:${me.profile.id}` : '';
  const frame = useRef<HTMLIFrameElement>(null);
  const stage = useRef<HTMLElement>(null);
  const [document, setDocument] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [saveError, setSaveError] = useState(false);
  useEffect(() => {
    if (!game || !owner) return;
    const controller = new AbortController();
    const key = gameSaveKey(owner, game.id);
    const watchdog = setTimeout(() => setError('The game is taking longer than expected. Try reloading it.'), 20_000);
    setDocument(''); setError(''); setReady(false); setSaveError(false);
    function receive(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null') return;
      const data: unknown = event.data;
      if (!data || typeof data !== 'object' || !('gameId' in data) || data.gameId !== game!.id || !('type' in data)) return;
      if (data.type === 'vs-game-ready') { clearTimeout(watchdog); setReady(true); setError(''); return; }
      if (data.type !== 'vs-game-save' || !('values' in data) || !data.values || typeof data.values !== 'object' || Array.isArray(data.values)) return;
      const values = Object.entries(data.values);
      if (values.length > 30 || values.some(([name, value]) => name.length > 200 || typeof value !== 'string' || value.length > 200_000)) return;
      try { localStorage.setItem(key, JSON.stringify(data.values)); setSaveError(false); }
      catch { setSaveError(true); }
    }
    window.addEventListener('message', receive);
    void fetch(`/original-games/${game.file}`, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error('Game could not load');
      const html = await response.text();
      if (!controller.signal.aborted) {
        let saved: Record<string, string> = {};
        try { saved = readGameSave(localStorage, key); } catch { setSaveError(true); }
        setDocument(embedGame(html, game.id, saved));
      }
    }).catch(() => { if (!controller.signal.aborted) setError('This game could not load. Please try again.'); });
    return () => { clearTimeout(watchdog); controller.abort(); window.removeEventListener('message', receive); };
  }, [game, owner, attempt]);

  if (!game) return <section><p role="alert">This game is not available.</p><Link to="/student?panel=games">Back to games</Link></section>;
  return <section className="original-game" ref={stage}>
    <header className="original-game__bar"><Link className="nb-btn nb-btn--ghost" to="/student?panel=games">Back to games</Link><h1>{game.title}</h1><button type="button" className="nb-btn" onClick={() => { void stage.current?.requestFullscreen?.().catch(() => setError('Fullscreen is unavailable. You can keep playing here.')); }}>Fullscreen</button></header>
    <p className="nb-meta">Original game · Explore and practise. These results stay separate from your assessed chapter progress. Games that support saving keep progress in this browser for your profile.</p>
    {saveError ? <p role="alert">This browser could not save your game. You can keep playing, but progress may be lost when you leave.</p> : null}
    {error ? <p role="alert">{error} <button type="button" onClick={() => setAttempt((value) => value + 1)}>Reload game</button></p> : null}
    {!ready && !error ? <p role="status">Opening {game.title}…</p> : null}
    {document ? <iframe key={`${owner}:${game.id}:${attempt}`} ref={frame} title={game.title} srcDoc={document} sandbox="allow-scripts" allow="autoplay 'none'; camera 'none'; microphone 'none'" className="original-game__frame" /> : null}
  </section>;
}
