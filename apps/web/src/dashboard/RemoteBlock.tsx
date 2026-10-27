import type { ReactNode } from 'react';
import { AccessDenied } from '../routes/AccessDenied';
import type { Remote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';

export function RemoteBlock<T>({ remote, title, children }: { remote: Remote<T>; title: string; children: (data: T) => ReactNode }) {
  if (remote.denied) return <AccessDenied />;
  return (
    <>
      <StaleNote stale={remote.stale} updatedAt={remote.updatedAt} message={remote.message} />
      {remote.status === 'loading' && !remote.data ? <Skeleton /> : remote.data
        ? children(remote.data)
        : <ErrorState title={title} message={remote.message ?? 'Try again.'} onRetry={remote.reload} />}
    </>
  );
}
