import { DiagnosticOfferSchema } from '@vidhyasaathy/contracts';
import { useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';

/** A prerequisite check is an invitation, never a gate to learning. */
export function ChapterEntryGate({ children }: { children: ReactNode }) {
  const { chapterId = '', gameId } = useParams();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem(`chapter-warmup:${chapterId}`) === 'dismissed'; } catch { return false; } });
  const offer = useRemote(chapterId && gameId !== 'demo' ? `/chapters/${chapterId}/diagnostic` : null, DiagnosticOfferSchema);
  if (!chapterId || gameId === 'demo') return <>{children}</>;
  return <>{offer.data?.offered && !dismissed ? <section className="nb-card"><h2 className="nb-h3">Want a 3-minute warm-up check first?</h2><p>Only earlier ideas, with no penalty for anything you have not learned yet.</p><Link className="nb-btn nb-btn--ghost" to={`/student/chapters/${chapterId}/diagnostic`} state={{ returnTo: location.pathname + location.search }}>Start check</Link><button className="nb-btn nb-btn--quiet" onClick={() => { setDismissed(true); try { localStorage.setItem(`chapter-warmup:${chapterId}`, 'dismissed'); } catch { /* Learning remains open without storage. */ } }}>Not now</button></section> : null}{children}</>;
}
