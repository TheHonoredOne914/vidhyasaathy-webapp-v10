import { ChapterSchema } from '@vidhyasaathy/contracts';
import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../meta';
import { LessonFrame } from '../routes/content/LessonFrame';
import { AccessDenied } from '../routes/AccessDenied';
import { PAGE } from '../pages';
import { useRemote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { PRACTICE_GAMES } from './games';
import { GAME_REGISTRY } from '../games/engine/registry';
import './practice.css';

export function PracticeList() {
  const { chapterId = '' } = useParams();
  const chapter = useRemote(chapterId ? `/chapters/${chapterId}` : null, ChapterSchema);
  usePageMeta(PAGE.practice.title, PAGE.practice.description);
  if (chapter.denied) return <AccessDenied />;
  if (!chapter.data) {
    if (chapter.status === 'error') return <ErrorState title="Could not open practice" message={chapter.message ?? 'Try again.'} onRetry={chapter.reload} />;
    return <LessonFrame kicker="Practice" title="Practice"><Skeleton /></LessonFrame>;
  }
  const chapterData = chapter.data;
  return (
    <LessonFrame kicker="Practice" title={chapterData.title} script="Optional. Deadlines stay as the teacher set them." stale={chapter}>
      <p className="lesson-actions"><Link to={`/student/chapters/${chapterData.id}`}>Back to the chapter</Link></p>
      <ul className="practice-games" aria-label="Games">
        {PRACTICE_GAMES.map((game) => (
          <li key={game.id}>
            <Link to={`/student/chapters/${chapter.data?.id}/practice/${game.id}`}>
              {game.title}
              <span>{game.detail}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link to={`/student/chapters/${chapter.data.id}/practice/engine/demo`}>
            The Atom’s Smallest Orbit
            <span>Interactive video: predict, tap, slide, order, and match.</span>
          </Link>
        </li>
      </ul>
      <section className="games-hub" aria-labelledby="interactive-games-title">
        <div className="games-hub-heading">
          <div>
            <p className="lesson-kicker">Interactive lab</p>
            <h2 id="interactive-games-title">Play to remember</h2>
          </div>
          <p>Short guided scenes with checkpoints. Pick one when you want to explore.</p>
        </div>
        <ul className="practice-games practice-games--interactive" aria-label="Interactive learning games">
          {GAME_REGISTRY.filter((game) => game.id !== 'demo').map((game) => (
            <li key={game.id}>
          <Link to={`/student/chapters/${chapterData.id}/practice/engine/${game.id}`}>
                {game.title}
                <span>{game.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </LessonFrame>
  );
}
