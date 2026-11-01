import { WarmupDoneSchema, WarmupStartSchema, type WarmupStart } from '@vidhyasaathy/contracts';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { usePageMeta } from '../meta';
import { Icon } from './notebook/icons';
import { Saathy } from './notebook/Saathy';
import { NotebookState } from './notebook/screens/polish3b/NotebookState';
import { Bubble, Chip } from './notebook/ui';

type Rating = 'knew' | 'almost' | 'forgot';

const RATINGS: readonly { id: Rating; label: string; variant: 'primary' | 'ghost' | 'quiet' }[] = [
  { id: 'knew', label: 'Knew it', variant: 'primary' },
  { id: 'almost', label: 'Almost', variant: 'ghost' },
  { id: 'forgot', label: 'Forgot', variant: 'ghost' },
];

export function WarmupDesk() {
  usePageMeta('Warm-up — VidhyaSaathy', 'Two easy minutes before the real work. Rate each card honestly.');
  const [offer, setOffer] = useState<WarmupStart | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'done' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  async function finish(next: Rating[], warmup: WarmupStart) {
    setBusy(true);
    setMessage(null);
    try {
      await postJson(`/student/warmup/${warmup.warmupId}/complete`, WarmupDoneSchema, {
        clientEventId: crypto.randomUUID(), ratings: next,
      });
      setStatus('done');
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'The warm-up could not be saved. Try once more.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    postJson('/student/warmup/start', WarmupStartSchema, { clientEventId: crypto.randomUUID() })
      .then((warmup) => {
        setOffer(warmup);
        setStatus(warmup.cards.length ? 'ready' : 'done');
      })
      .catch((cause: unknown) => {
        setStatus('error');
        setMessage(cause instanceof ApiClientError ? cause.message : 'The warm-up could not be opened. Try once more.');
      });
  }, []);

  function rate(rating: Rating) {
    if (!offer || busy) return;
    const next = [...ratings, rating];
    setRatings(next);
    setRevealed(false);
    if (index + 1 >= offer.cards.length) void finish(next, offer);
    else setIndex(index + 1);
  }

  const card = offer?.cards[index];

  return <div className="nb-col" data-testid="student-warmup">
    {status === 'loading' ? <NotebookState title="Warm-up" loading /> : null}
    {status === 'error' ? <NotebookState title="No warm-up right now" message={message ?? 'The warm-up could not be opened.'} /> : null}
    {status === 'done' ? <section className="nb-card">
      <span className="nb-tape" aria-hidden="true" />
      <Chip tone="green">Warm-up done</Chip>
      <h1 className="nb-h2" style={{ marginTop: 'var(--nb-s2)' }}>That is the evening set up nicely.</h1>
      <p className="nb-note">Your ratings are saved, so tonight&apos;s plan starts from what you just told it.</p>
      <div className="nb-saathy-tip" style={{ marginTop: 'var(--nb-s3)' }}><Saathy mood="cheer" size="3.4rem" /><Bubble hand>Small and steady. See you at the next one!</Bubble></div>
      <Link className="nb-btn nb-btn--primary" style={{ marginTop: 'var(--nb-s3)' }} to="/student">Back to home</Link>
    </section> : null}
    {status === 'ready' && offer && card ? <section className="nb-card">
      <span className="nb-tape" aria-hidden="true" />
      <div className="nb-card__head"><Chip tone="orange">Warm-up · 2 minutes</Chip><span className="nb-meta">{index + 1} / {offer.cards.length}</span></div>
      <h1 className="nb-h2">{card.front}</h1>
      {revealed ? <p className="nb-note" style={{ fontSize: '1.2rem' }}>{card.back}</p>
        : <button type="button" className="nb-btn nb-btn--ghost" onClick={() => { setRevealed(true); }}><Icon name="refresh" /> Flip the card</button>}
      {revealed ? <>
        <p className="nb-meta" style={{ marginTop: 'var(--nb-s3)' }}>How well did you know it? Honest answers shape tonight&apos;s plan — never marks.</p>
        <div className="row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'var(--nb-s2)' }}>
          {RATINGS.map((item) => <button type="button" key={item.id} disabled={busy} className={`nb-btn nb-btn--${item.variant}`} onClick={() => { rate(item.id); }}>{item.label}</button>)}
        </div>
      </> : null}
      {message ? <p className="nb-empty" role="alert">{message}</p> : null}
    </section> : null}
    {status === 'ready' && !card ? <NotebookState title="A fresh page" message="No warm-up cards are waiting today." /> : null}
  </div>;
}
