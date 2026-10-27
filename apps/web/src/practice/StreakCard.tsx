import { StreakSchema } from '@vidhyasaathy/contracts';
import { useRemote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import { AccessDenied } from '../routes/AccessDenied';
import './practice.css';

export function StreakCard() {
  const remote = useRemote('/practice/streak', StreakSchema);
  if (remote.denied) return <AccessDenied />;
  return (
    <article className="lcard streak-card" data-testid="streak-card">
      <div className="lcard-body">
        <h2>Correct practice</h2>
        <StaleNote stale={remote.stale} updatedAt={remote.updatedAt} message={remote.message} />
        {remote.status === 'loading' && !remote.data ? <Skeleton /> : remote.data ? (
          <>
            <p data-testid="streak-days">{remote.data.currentDays === 1 ? '1 day' : `${remote.data.currentDays} days`} in the current run. Longest run: {remote.data.longestDays === 1 ? '1 day' : `${remote.data.longestDays} days`}.</p>
            <p>A day counts only when a marked answer or a lesson check is correct. Signing in does not count.</p>
            <ul className="streak-days">
              {remote.data.days.map((day) => <li key={day.date}>{day.date}: {day.practiced ? 'Correct practice' : 'None'}</li>)}
            </ul>
          </>
        ) : <ErrorState title="Could not load correct practice" message={remote.message ?? 'Try again.'} onRetry={remote.reload} />}
      </div>
    </article>
  );
}
