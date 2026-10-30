import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAttemptSync } from './AttemptSync';
import { audienceFrom } from '../content/audience';
import { contentStateLabel } from '../content/format';
import { useRemote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';
import { AssignmentListSchema } from './schemas';
import { formatDue, scoreText, studentScore } from './present';

export function AssignmentList({ chapterId }: { chapterId?: string }) {
  const { pathname } = useLocation();
  const audience = audienceFrom(pathname);
  const path = chapterId ? `/assignments?chapterId=${chapterId}` : '/assignments';
  const list = useRemote(path, AssignmentListSchema);
  const { revision } = useAttemptSync();
  useEffect(() => { if (revision) list.reload(); }, [revision, list.reload]);
  if (list.status === 'loading' && !list.data) return <Skeleton />;
  if (!list.data) {
    return <ErrorState title="Could not load assignments" message={list.message ?? 'Try again.'} onRetry={list.reload} />;
  }
  return (
    <>
      <StaleNote stale={list.stale} updatedAt={list.updatedAt} message={list.message} />
      {list.data.length === 0 ? <p>{chapterId ? 'No homework or quiz for this chapter yet.' : 'No homework or quiz yet.'}</p> : (
        <ul className="lesson-list" aria-label="Assignments">
          {list.data.map((item) => (
            <li key={item.id}>
              <Link to={audience === 'student' ? `/student/assignments/${item.id}` : `/${audience}/assignments/${item.id}`}>{item.title}</Link>
              <span className="lesson-status">
                {item.kind === 'quiz' ? 'Quiz' : 'Homework'}
                {' · Due '}
                {formatDue(item.dueAt)}
                {' · '}
                {item.score ? <span data-testid="assignment-score">{audience === 'student' ? studentScore(item.score) : scoreText(item.score)}</span> : contentStateLabel(item.status, null)}
                {' · '}
                {item.teacherName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
