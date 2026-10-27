import { formatUpdatedAt } from '../storage';
import { useSession } from '../session';
import { useAttemptSync } from '../assessment/AttemptSync';

export function OfflineBanner() {
  const session = useSession();
  const sync = useAttemptSync();
  if (!sync.offline && sync.pending === 0 && sync.blocked === 0 && !sync.notice) return null;
  const stamp = sync.updatedAt ?? session.updatedAt;
  const lead = sync.offline
    ? `You are offline.${sync.pending ? ` ${sync.pending} saved on this device.` : ' Answers stay on this device until the connection returns.'}`
      : sync.blocked > 0 ? `${sync.blocked} saved ${sync.blocked === 1 ? 'answer needs' : 'answers need'} attention before sending.`
      : sync.pending > 0 ? `${sync.pending} ${sync.pending === 1 ? 'answer is' : 'answers are'} waiting to send.` : 'Homework could not be updated.';
  return (
    <div role="status" className="offline-banner" data-testid="offline-banner">
      <p>
        {lead}
        {stamp ? ` Updated at ${formatUpdatedAt(stamp)}.` : ''}
        {sync.notice ? ` ${sync.notice}` : ''}
      </p>
      {!sync.offline ? <button type="button" className="text-link offline-retry" onClick={() => { void sync.retry(); }}>Retry</button> : null}
    </div>
  );
}
