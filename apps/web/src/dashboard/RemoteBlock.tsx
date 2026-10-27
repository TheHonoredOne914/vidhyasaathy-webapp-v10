import type { ReactNode } from 'react';
import { AccessDenied } from '../routes/AccessDenied';
import type { Remote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';

export function RemoteBlock<T>({ remote, title, children }: { remote: Remote<T>; title: string; children: (data: T) => ReactNode }) {
  if (remote.denied) return <AccessDenied />;
  const hardError = remote.status === 'error' && !remote.data;
  return (
    <>
      <StaleNote stale={remote.stale && !hardError} updatedAt={remote.updatedAt} message={hardError ? null : remote.message} />
      {remote.status === 'loading' && !remote.data ? <Skeleton /> : remote.data
        ? children(remote.data)
        : <div className="error-card"><ErrorState title={title} message={remote.message ?? 'Try again.'} onRetry={remote.reload} /></div>}
    </>
  );
}
