import { useState } from 'react';
import { releaseInstant } from '../../content/files';
import { Button } from '../../ui/Button';
import { fieldClass } from '../../ui/Field';

export function ReleaseActions({
  pending,
  error,
  onPublish,
}: {
  pending: boolean;
  error: string | null;
  onPublish: (releaseAt: number | null) => void;
}) {
  const [when, setWhen] = useState('');
  const scheduled = releaseInstant(when);
  return (
    <div className="lesson-actions">
      <Button disabled={pending} onClick={() => { onPublish(null); }}>Publish now</Button>
      <div className="grid gap-1">
        <label htmlFor="release-at" className="font-semibold">Release time</label>
        <input id="release-at" className={fieldClass} type="datetime-local" value={when} onChange={(event) => { setWhen(event.target.value); }} />
      </div>
      <Button variant="secondary" disabled={pending || scheduled === null} onClick={() => { if (scheduled !== null) onPublish(scheduled); }}>Schedule release</Button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
