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
import { GamesSchema } from '../games/gameApi';
import './practice.css';

export function PracticeList() {
  const { chapterId = '' } = useParams();
  const chapter = useRemote(chapterId ? `/chapters/${chapterId}` : null, ChapterSchema);
  const board = useRemote('/student/games', GamesSchema);
  usePageMeta(PAGE.practice.title, PAGE.practice.description);
  if (chapter.denied) return <AccessDenied />;
  if (!chapter.data) {
    if (chapter.status === 'error') return <ErrorState title="Could not open practice" message={chapter.message ?? 'Try again.'} onRetry={chapter.reload} />;
    return <LessonFrame paper kicker="Practice" title="Practice"><Skeleton /></LessonFrame>;
  }
  const chapterData = chapter.data;
  return (
    <LessonFrame paper kicker="Practice" title={chapterData.title} script="Optional. Deadlines stay as the teacher set them." stale={chapter}>
      <div className="practice-stage">
      <p className="lesson-actions"><Link to={`/student/chapters/${chapterData.id}`}>Back to the chapter</Link></p>
      <section className="games-hub" aria-labelledby="interactive-games-title">
        <div className="games-hub-heading"><div><p className="lesson-kicker">Play</p><h2 id="interactive-games-title">{chapterData.title} games</h2></div><p>Explore, then save your checkpoints to your learning path.</p></div>
        {board.status === 'error' ? <p role="alert">Could not load games. <button type="button" onClick={board.reload}>Try again</button></p> : !board.data ? <Skeleton /> : <ul className="practice-games" aria-label="Chapter games">{board.data.games.filter((game) => game.chapterId === chapterId).map((game) => <li key={game.gameId}><Link to={game.href}>{game.title}<span>{game.state === 'played' ? 'Played · try again' : game.opensAfter ?? 'Explore this chapter'}</span></Link></li>)}</ul>}
        {board.data && !board.data.games.some((game) => game.chapterId === chapterId) ? <p>Your teacher is preparing a game for this chapter. Try the chapter practice below.</p> : null}
      </section>
      <h2>More chapter practice</h2>
      <ul className="practice-games" aria-label="Games">
        {PRACTICE_GAMES.map((game) => (
          <li key={game.id}>
            <Link to={`/student/chapters/${chapter.data?.id}/practice/${game.id}`}>
              {game.title}
              <span>{game.detail}</span>
            </Link>
          </li>
        ))}
      </ul>
      </div>
    </LessonFrame>
  );
}
