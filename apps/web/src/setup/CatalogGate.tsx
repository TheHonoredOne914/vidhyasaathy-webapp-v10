import type { ReactNode } from 'react';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import type { Catalog } from './useCatalog';
import { AccessDenied } from '../routes/AccessDenied';

export function CatalogGate({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  if (catalog.failed?.denied) return <AccessDenied />;
  if (catalog.loading) return <Skeleton />;
  if (catalog.failed) {
    return (
      <ErrorState
        title="Could not load school setup"
        message={catalog.failed.message ?? 'The request could not be completed.'}
        onRetry={catalog.reload}
      />
    );
  }
  return (
    <>
      <StaleNote stale={Boolean(catalog.stale)} updatedAt={catalog.stale?.updatedAt ?? null} message={catalog.stale?.message ?? null} />
      {children}
    </>
  );
}
