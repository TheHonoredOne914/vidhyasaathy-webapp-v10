import { useState } from 'react';
import { useSession } from '../../../../session';
import { Sticky } from '../../ui';

export function SlideNote({ sessionId, slideId, ordinal }: { sessionId: string; slideId: string; ordinal: number }) {
  const { me } = useSession();
  const storageKey = me ? `vs-slide-note:${me.profile.id}:${sessionId}:${slideId}` : null;
  return <StoredSlideNote key={storageKey} storageKey={storageKey} ordinal={ordinal} />;
}

function StoredSlideNote({ storageKey, ordinal }: { storageKey: string | null; ordinal: number }) {
  const [stored, setStored] = useState(() => {
    try { return { value: storageKey ? localStorage.getItem(storageKey) ?? '' : '', error: false }; }
    catch { return { value: '', error: true }; }
  });
  const { value, error } = stored;

  return <Sticky who="Your note">
    <span className="nb-tape nb-tape--green" />
    <label className="nb-meta">For slide {ordinal}
      <textarea className="nb-input nb-input--lined" aria-label="Your note" rows={3} maxLength={1200} value={value} placeholder="Write something to remember…" onChange={(event) => {
        const next = event.target.value;
        try {
          if (!storageKey) throw new Error('No signed-in student');
          if (next) localStorage.setItem(storageKey, next);
          else localStorage.removeItem(storageKey);
          setStored({ value: next, error: false });
        } catch { setStored({ value: next, error: true }); }
      }} />
    </label>
    <div className="nb-meta" role="status">{error ? 'Could not save on this device. Keep this page open.' : value ? `Saved on this device · slide ${ordinal}` : 'Only on this device. Not sent to your teacher.'}</div>
  </Sticky>;
}
