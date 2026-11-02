import { Link, useParams } from 'react-router-dom';
import { useChapterWorld } from '../../api/chapterWorld';
import { Card, MasteryChip, PageHead } from '../notebook/ui';
import { Saathy } from '../notebook/Saathy';
import './chapter-world.css';

export function ChapterWorld() {
  const { chapterId = '' } = useParams();
  const world = useChapterWorld(chapterId);
  if (!world.data) return <section className="nb-card" role="status"><Saathy mood="happy" size="5rem" /><h1 className="nb-h1">Your chapter notebook</h1><p>{world.failed ? 'Your chapter could not open just now.' : 'Gathering your ideas and activities…'}</p>{world.failed ? <button className="nb-btn" onClick={world.retry}>Try again</button> : null}</section>;
  const data = world.data;
  const done = data.concepts.filter((idea) => idea.word === 'Mastered' || idea.word === 'Top form').length;
  return <div className="chapter-world">
    <PageHead eyebrow={data.subjectName} title={data.title} sub={`${done} of ${data.concepts.length} ideas mastered. One small step at a time.`} />
    <div className="chapter-world__legend">{(['New', "Let's fix this", 'Almost there', 'Mastered', 'Top form'] as const).map((word) => <MasteryChip key={word} level={word} />)}</div>
    <nav className="chapter-world__stops" aria-label="Your chapter path">{data.stops.map((stop) => <Card key={stop.key} title={stop.title}><p>{stop.detail}</p><p className="nb-note">{stop.state === 'done' ? 'Finished' : stop.state === 'locked' ? 'Ready when you need it' : 'Ready to begin'}</p>{stop.state !== 'locked' ? <Link className="nb-link" to={stop.key === 'play' ? '#chapter-games' : stop.href}>Open {stop.title}</Link> : <span className="nb-meta">{stop.key === 'fix' ? 'No repairs needed right now' : 'More activities coming from your teacher'}</span>}</Card>)}</nav>
    <div className="chapter-world__body"><section className="proto-stack"><Card title="Ideas in this chapter">{data.concepts.map((idea) => <div className="chapter-world__idea" key={idea.conceptId}><Link to={`/student/chapters/${chapterId}/concepts/${idea.conceptId}`}>{idea.name}</Link><MasteryChip level={idea.word} /></div>)}</Card><section id="chapter-games"><Card title="Play with these ideas">{data.games.length ? data.games.map((game) => <div className="chapter-world__idea" key={game.id}><b>{game.title}</b><Link className="nb-btn nb-btn--ghost" to={game.href}>Play</Link></div>) : <p>Your chapter games will appear here when available.</p>}</Card></section></section>
    <aside><Card title="A little plan, just for you" tape><Saathy mood="happy" size="5rem" /><p>Mix a new idea, a worked example and a little practice.</p><Link className="nb-btn nb-btn--primary" to={`/student/chapters/${chapterId}/learn`}>Plan my learning</Link><p><Link className="nb-link" to={`/student/saathy?chapterId=${encodeURIComponent(chapterId)}`}>Ask Saathy about this chapter</Link></p></Card></aside></div>
  </div>;
}
