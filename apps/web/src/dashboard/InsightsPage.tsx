import { ClassInsightsSchema, ReteachDecisionInputSchema, ReteachDecisionSchema } from '@vidhyasaathy/contracts';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { postJson } from '../api/client';
import { formatDue } from '../assessment/present';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useSession } from '../session';
import { useMutation } from '../setup/useMutation';
import { useRemote } from '../setup/useRemote';
import { SelectField } from '../ui/SelectField';
import { TextArea } from '../ui/TextArea';
import { Button } from '../ui/Button';
import { HeatMap } from './HeatMap';
import { RemoteBlock } from './RemoteBlock';
import './dashboard.css';

export function InsightsPage() {
  const { sectionId = '' } = useParams();
  const session = useSession();
  const insights = useRemote(sectionId ? `/sections/${sectionId}/insights` : null, ClassInsightsSchema);
  const mutation = useMutation();
  const [conceptId, setConceptId] = useState('');
  const [decision, setDecision] = useState<'reteach' | 'practice' | 'monitor' | ''>('');
  const [note, setNote] = useState('');
  const teacher = session.me?.profile.role === 'teacher';
  const home = teacher ? '/teacher' : '/admin';
  usePageMeta(teacher ? PAGE.teacherInsights.title : PAGE.adminInsights.title, teacher ? PAGE.teacherInsights.description : PAGE.adminInsights.description);

  return (
    <section className="dash">
      <header className="dash-banner">
        <h1>Concept checks</h1>
        <p className="dash-hand">Counts, not names.</p>
      </header>
      <RemoteBlock remote={insights} title="Could not load concept checks">
        {(data) => (
          <>
            <p>Recorded {formatDue(data.updatedAt)}. {data.students} students. {data.completedSessions} session checks finished.</p>
            <HeatMap concepts={data.concepts} />
            <article className="dash-panel">
              <h2>Wrong options</h2>
              {data.misconceptions.length ? (
                <ul className="dash-list">
                  {data.misconceptions.map((row) => (
                    <li key={`${row.itemId}-${row.option}`} className="heat-many">{row.count} chose {row.option}</li>
                  ))}
                </ul>
              ) : <p>No wrong option has been counted yet.</p>}
            </article>
            <article className="dash-panel">
              <h2>Student questions</h2>
              {data.doubtBatches.length ? data.doubtBatches.map((batch) => <p key={batch.chapterId}>{batch.title}: {batch.count}</p>) : <p>No student question is waiting.</p>}
            </article>
            <article className="dash-panel">
              <h2>Decisions</h2>
              {data.decisions.length ? data.decisions.map((row) => (
                <p key={row.id}>{row.decision}. {row.note} {formatDue(row.createdAt)}.</p>
              )) : <p>No reteach decision is recorded.</p>}
              {teacher ? (
                <form onSubmit={(event) => {
                  event.preventDefault();
                  void mutation.submit(ReteachDecisionInputSchema, { conceptId, decision, note }, async (input) => {
                    await postJson(`/sections/${sectionId}/reteach`, ReteachDecisionSchema, input);
                    setNote('');
                    insights.reload();
                  });
                }}>
                  <SelectField label="Concept" name="conceptId" value={conceptId} onChange={setConceptId} error={mutation.errorFor('conceptId')} placeholder="Choose a concept" options={data.concepts.map((concept) => ({ value: concept.conceptId, label: concept.title }))} />
                  <fieldset>
                    <legend>Decision</legend>
                    {([['reteach', 'Reteach'], ['practice', 'Practice'], ['monitor', 'Monitor']] as const).map(([value, label]) => (
                      <label key={value} className="dash-check"><input type="radio" name="decision" value={value} checked={decision === value} onChange={() => { setDecision(value); }} />{label}</label>
                    ))}
                  </fieldset>
                  {mutation.errorFor('decision') ? <p role="alert">{mutation.errorFor('decision')}</p> : null}
                  <TextArea label="Note" name="note" value={note} onChange={setNote} error={mutation.errorFor('note')} hint="Say what the class should do next." />
                  {mutation.formError ? <p role="alert">{mutation.formError}</p> : null}
                  <Button type="submit" disabled={mutation.pending}>Save decision</Button>
                </form>
              ) : null}
            </article>
          </>
        )}
      </RemoteBlock>
      <p className="dash-actions">
        {sectionId ? <Link className="text-link" to={`${home}/sections/${sectionId}`}>Roster</Link> : null}
        <Link className="text-link" to={home}>Home</Link>
      </p>
    </section>
  );
}
