import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useRemote } from '../setup/useRemote';
import { GamesSchema } from './gameApi';

export const ChapterGameProgressSchema = z.object({
  chapterId: z.string(), completedGames: z.array(z.string()), playDone: z.boolean(), next: z.enum(['play', 'fix', 'master']), nextHref: z.string(),
  concepts: z.array(z.object({ conceptId: z.string(), title: z.string(), word: z.string() })),
});

export function ChapterPlaySteps({ chapterId }: { chapterId: string }) {
  const board = useRemote('/student/games', GamesSchema);
  const progress = useRemote(`/chapters/${chapterId}/game-progress`, ChapterGameProgressSchema);
  const games = board.data?.games.filter((row) => row.chapterId === chapterId) ?? [];
  return <section className="lesson-card" aria-labelledby="chapter-play-title">
    <h2 id="chapter-play-title">Your chapter path</h2>
    <nav className="lesson-actions" aria-label="Chapter steps"><a href="#chapter-notes">Read</a><Link to={`/student/chapters/${chapterId}/practice`}>Play{progress.data?.playDone ? ' · Done' : ''}</Link>{progress.data?.playDone ? <Link to={progress.data.nextHref}>{progress.data.next === 'fix' ? 'Fix · Up next' : 'Master · Up next'}</Link> : <span>Fix or Master · after Play</span>}</nav>
    <p>Explore the chapter’s game, then save every checkpoint. Your answers help choose what to practise next.</p>
    {board.status === 'error' || progress.status === 'error' ? <p role="alert">Could not load your game path. <button type="button" onClick={() => { board.reload(); progress.reload(); }}>Try again</button></p> : null}
    <ul className="lesson-list" aria-label="Chapter game progress">{games.map((game) => <li key={game.gameId}><Link to={game.href}>{game.title}</Link><span>{progress.data?.completedGames.includes(game.gameId) ? 'Done' : game.opensAfter ?? 'Ready to explore'}</span></li>)}</ul>
    {progress.data?.playDone ? <p role="status">Play saved. {progress.data.next === 'fix' ? 'Let’s steady an idea before moving on.' : 'Ready for the next chapter challenge.'}</p> : null}
  </section>;
}
