import type { Me, PlanItem } from '@vidhyasaathy/contracts';
import { AnnouncementListSchema, StudyPlanSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { formatDue } from '../assessment/present';
import { ConceptListSchema } from '../content/schemas';
import { useRemote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import { SaathyMascot } from '../ui/Saathy';
import { AccessDenied } from '../routes/AccessDenied';
import '../dashboard/dashboard.css';
import { StreakCard } from '../practice/StreakCard';
import { ConceptMap } from './ConceptMap';
import { dueToday, planHref, planKind, resumeLabel } from './plan';

function sameItem(a: PlanItem | null, b: PlanItem | null): boolean {
  return !!a && !!b && a.id === b.id && a.kind === b.kind;
}

export function StudyHome({ me, stale, updatedAt, message }: {
  me: Me;
  stale: boolean;
  updatedAt: string | null;
  message: string | null;
}) {
  const plan = useRemote('/study-plan', StudyPlanSchema);
  const announcements = useRemote('/announcements', AnnouncementListSchema);
  const chapterId = plan.data?.nextAction?.chapterId ?? plan.data?.continue?.chapterId ?? plan.data?.items[0]?.chapterId ?? null;
  const concepts = useRemote(chapterId ? `/chapters/${chapterId}/concepts` : null, ConceptListSchema);
  if (plan.denied || concepts.denied || announcements.denied) return <AccessDenied />;

  const items = plan.data?.items ?? [];
  const next = plan.data?.nextAction ?? null;
  const resume = plan.data?.continue ?? null;
  const rest = items.filter((item) => !sameItem(item, next));
  const quiet = plan.data ? !items.some((item) => dueToday(item)) : false;

  return (
    <div className="stack">
      <div className="greet">
        <SaathyMascot size={48} alt="" />
        <div>
          <p className="app-kicker">Home</p>
          <h1>Hello, {me.profile.name}</h1>
          <p>{me.school.name}</p>
        </div>
      </div>
      <StaleNote stale={stale || plan.stale} updatedAt={plan.updatedAt ?? updatedAt} message={plan.message ?? message} testId="updated-at" />
      <StreakCard />
      {chapterId ? <p><Link className="text-link" to={`/student/chapters/${chapterId}/practice`}>Optional practice for this chapter</Link></p> : null}
      {plan.status === 'loading' && !plan.data ? <Skeleton /> : plan.data ? (
        <>
          <article className="lcard">
            <div className="lcard-head"><h2>Next</h2></div>
            <div className="lcard-body">
              {next ? (
                <>
                  <p>{planKind(next)}. {next.required ? 'Required.' : 'Optional. The plan does not change a deadline.'}</p>
                  {sameItem(resume, next) ? <p>{resumeLabel(next)}</p> : null}
                  {next.dueAt ? <p>Due {formatDue(next.dueAt)}.</p> : null}
                  <Link className="navy-btn" to={planHref(next)}>{next.title}</Link>
                </>
              ) : <p>Nothing is waiting.</p>}
              {quiet ? (
                <>
                  <p>Nothing due today. Explore your subjects.</p>
                  <Link className="navy-btn" to="/student?panel=subjects">Subjects</Link>
                </>
              ) : null}
            </div>
          </article>
          {rest.length ? (
            <article className="lcard">
              <div className="lcard-head"><h2>Today's plan</h2></div>
              <div className="lcard-body">
                <ul className="catalog-list">
                  {rest.map((item) => (
                    <li key={`${item.kind}-${item.id}`}>
                      <Link className="text-link" to={planHref(item)}>{item.title}</Link>
                      <span>{planKind(item)}. {item.required ? 'Required' : 'Optional'}{item.dueAt ? `. Due ${formatDue(item.dueAt)}` : ''}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ) : null}
          {resume && !sameItem(resume, next) ? (
            <article className="lcard">
              <div className="lcard-head"><h2>Continue</h2></div>
              <div className="lcard-body">
                <p>{resumeLabel(resume)}</p>
                <Link className="navy-btn" to={planHref(resume)}>{resume.title}</Link>
              </div>
            </article>
          ) : null}
        </>
      ) : <ErrorState title="Could not load today's plan" message={plan.message ?? 'Try again.'} onRetry={plan.reload} />}
      <article className="lcard">
        <div className="lcard-head"><h2>Concept map</h2></div>
        <div className="lcard-body">
          {!chapterId ? <p>Open a subject to see its concepts.</p> : concepts.status === 'loading' && !concepts.data ? <Skeleton /> : concepts.data ? (
            concepts.data.length ? <ConceptMap concepts={concepts.data} audience="student" chapterId={chapterId} /> : <p>No concept in this chapter yet.</p>
          ) : <ErrorState title="Could not load the concept map" message={concepts.message ?? 'Try again.'} onRetry={concepts.reload} />}
        </div>
      </article>
      <article className="dash-panel">
        <h2>Announcements</h2>
        <StaleNote stale={announcements.stale} updatedAt={announcements.updatedAt} message={announcements.message} />
        {announcements.status === 'loading' && !announcements.data ? <Skeleton /> : announcements.data ? (
          announcements.data.announcements.length ? announcements.data.announcements.map((item) => <p key={item.id}><strong>{item.title}.</strong> {item.body}</p>) : <p>No announcement for your class.</p>
        ) : <ErrorState title="Could not load announcements" message={announcements.message ?? 'Try again.'} onRetry={announcements.reload} />}
      </article>
    </div>
  );
}
