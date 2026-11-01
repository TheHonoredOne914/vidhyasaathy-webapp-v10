import { CatchupDoneSchema, CatchupSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiClientError, postJson } from '../api/client';
import { usePageMeta } from '../meta';
import { useRemote } from '../setup/useRemote';
import { Icon } from './notebook/icons';
import { Saathy } from './notebook/Saathy';
import { NotebookState } from './notebook/screens/polish3b/NotebookState';
import { Bubble, Chip, PageHead } from './notebook/ui';

const KIND: Record<'recap' | 'session', string> = { recap: 'Quick recap', session: "Tonight's session" };

export function CatchupDesk() {
  usePageMeta('Catch-up — VidhyaSaathy', 'A small plan to catch up after a few days away. About twenty minutes.');
  const remote = useRemote('/student/catchup', CatchupSchema);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ badges: { id: string; name: string }[] } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function complete() {
    setBusy(true);
    setNote(null);
    try {
      const result = await postJson('/student/catchup/complete', CatchupDoneSchema, { clientEventId: crypto.randomUUID() });
      setDone({ badges: result.badges });
    } catch (cause) {
      if (cause instanceof ApiClientError && cause.status === 409) remote.reload();
      setNote(cause instanceof Error ? cause.message : 'The catch-up could not be saved. Try once more.');
    } finally {
      setBusy(false);
    }
  }

  if (remote.status === 'loading' && !remote.data) return <div className="nb-col"><NotebookState title="Catch-up" loading /></div>;
  if (remote.denied || !remote.data) return <div className="nb-col"><NotebookState title="No catch-up right now" message="There is no catch-up waiting today. Open a subject to keep going." /></div>;

  const plan = remote.data;

  return <div className="nb-col" data-testid="student-catchup">
    <PageHead eyebrow="Catch-up" title="Back in small steps" sub={`About ${plan.estMinutes} minutes, split into little pieces. Nothing here is a test.`} />
    {done ? <section className="nb-card">
      <span className="nb-tape" aria-hidden="true" />
      <Chip tone="green">Catch-up done</Chip>
      <h2 className="nb-h2" style={{ marginTop: 'var(--nb-s2)' }}>You are back on the page.</h2>
      {done.badges.length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: 'var(--nb-s2)' }}>
        {done.badges.map((badge) => <Chip key={badge.id} tone="sand">{badge.name}</Chip>)}
      </div> : null}
      <Link className="nb-btn nb-btn--primary" style={{ marginTop: 'var(--nb-s3)', display: 'inline-flex' }} to="/student">Back to home</Link>
    </section> : <section className="nb-card">
      <span className="nb-tape" aria-hidden="true" />
      <div className="nb-card__head"><Chip tone="orange">Today&apos;s plan</Chip><span className="nb-meta">{plan.estMinutes} min</span></div>
      <p className="nb-sub">{plan.copy}</p>
      {plan.steps.map((step) => <Link className="nb-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', marginTop: 'var(--nb-s3)' }} key={step.conceptId} to={step.href}>
        <div><div className="nb-row__t" style={{ fontSize: '1.12rem' }}>{step.name}</div><div className="nb-row__s">{KIND[step.kind]} · {step.estMinutes} min</div></div>
        <Chip tone="sky" dashed>Open <Icon name="arrow" /></Chip>
      </Link>)}
      <div className="nb-saathy-tip" style={{ marginTop: 'var(--nb-s4)' }}>
        <Saathy mood="happy" size="3.4rem" /><Bubble>Take the steps in order. Each one makes the next easier.</Bubble>
      </div>
      <div className="row" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: 'var(--nb-s3)' }}>
        <button type="button" className="nb-btn nb-btn--primary nb-btn--lg" disabled={busy} onClick={() => { void complete(); }}>{busy ? 'Saving…' : 'I finished the steps'}</button>
        <Link className="nb-btn nb-btn--quiet nb-btn--lg" to="/student">Later</Link>
      </div>
      {note ? <p className="nb-empty" role="alert">{note}</p> : null}
    </section>}
  </div>;
}
