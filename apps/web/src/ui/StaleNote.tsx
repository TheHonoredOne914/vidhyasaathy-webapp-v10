import { formatUpdatedAt } from '../storage';

export function StaleNote({
  stale,
  updatedAt,
  message,
  testId,
}: {
  stale: boolean;
  updatedAt: string | null;
  message: string | null;
  testId?: string;
}) {
  if (!stale || !updatedAt) return null;
  return (
    <p role="status" className="stale-note mb-4 max-w-xl bg-ice px-3 py-2" {...(testId ? { 'data-testid': testId } : {})}>
      Updated at {formatUpdatedAt(updatedAt)}. {message}
    </p>
  );
}
