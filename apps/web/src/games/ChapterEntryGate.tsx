import { DiagnosticOfferSchema } from '@vidhyasaathy/contracts';
import type { ReactNode } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';

/** Resolve the server's per-student completion before exposing a chapter. */
export function ChapterEntryGate({ children }: { children: ReactNode }) {
  const { chapterId = '', gameId } = useParams();
  const location = useLocation();
  const offer = useRemote(chapterId && gameId !== 'demo' ? `/chapters/${chapterId}/diagnostic` : null, DiagnosticOfferSchema);
  if (!chapterId || gameId === 'demo') return <>{children}</>;
  if (offer.denied) return <section className="nb-card"><p>This chapter is not open for this login.</p></section>;
  if (offer.status === 'error' && !offer.data) return <section className="nb-card"><p role="alert">Could not open this chapter check.</p><button type="button" onClick={offer.reload}>Try again</button></section>;
  if (!offer.data) return <section className="nb-card"><p role="status">Opening your chapter…</p></section>;
  if (offer.data.offered) return <Navigate replace to={`/student/chapters/${chapterId}/diagnostic`} state={{ returnTo: location.pathname + location.search }} />;
  return <>{children}</>;
}
