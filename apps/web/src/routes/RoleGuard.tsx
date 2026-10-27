import type { Role } from '@vidhyasaathy/contracts';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { useSession } from '../session';

export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const session = useSession();
  if (session.status === 'loading') return <Skeleton />;
  if (!session.me) {
    if (session.status === 'error') {
      return <ErrorState title="Could not open this page" message={session.message ?? 'The request could not be completed.'} onRetry={session.reload} />;
    }
      return <Navigate to="/signin" replace state={{ message: session.message ?? 'Please sign in to continue.' }} />;
  }
  if (session.me.profile.role !== role) return <Navigate to="/access-denied" replace />;
  return children;
}
