import { ProgressSchema } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';
import { formatDue } from '../assessment/present';
import { usePageMeta } from '../meta';
import { PAGE } from '../pages';
import { useRemote } from '../setup/useRemote';
import { RemoteBlock } from './RemoteBlock';
import '../student/home.css';
import './dashboard.css';

function nextFor(word: string, chapterId: string, conceptId: string) {
  if (word === "Let's fix this") return { href: `/student/chapters/${chapterId}/practice`, label: 'Practise this' };
  if (word === 'Mastered' || word === 'Top form') return { href: `/student/chapters/${chapterId}/concepts/${conceptId}`, label: 'Review later' };
  return { href: `/student/chapters/${chapterId}/concepts/${conceptId}`, label: 'Open the lesson' };
}

function StateIcon({ word }: { word: string }) {
  const pen = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (word === "Let's fix this") return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...pen} d="M6 16l4-8 4 5 2-3 3 6" /><path {...pen} d="M5 18h14" /></svg>;
  if (word === 'Almost there') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle {...pen} cx="12" cy="12" r="7" /><path {...pen} d="M12 8v4l3 2" /></svg>;
  if (word === 'Mastered') return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...pen} d="M6 12.5l4 4 8-9" /></svg>;
  if (word === 'Top form') return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...pen} d="M12 4l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5z" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...pen} d="M6 5h12v14H6z" /><path {...pen} d="M9 9h6M9 13h6" /></svg>;
}

export function ProgressPage() {
  usePageMeta(PAGE.studentProgress.title, PAGE.studentProgress.description);
  const progress = useRemote('/progress', ProgressSchema);
  return (
    <section className="vs-home">
      <header className="vs-home-hero">
        <div className="vs-home-hero-copy">
          <h1>My progress</h1>
          <p>Each idea has a friendly word. Keep going.</p>
        </div>
      </header>
      <RemoteBlock remote={progress} title="Could not load progress">
        {(data) => (
          <>
            <ol className="progress-cards">
              {data.masteryWords.map((row) => {
                const next = nextFor(row.word, row.chapterId, row.conceptId);
                return (
                  <li key={row.conceptId} className={`progress-card is-${row.word === "Let's fix this" ? 'fix' : row.word === 'Almost there' ? 'almost' : row.word === 'Mastered' ? 'mastered' : row.word === 'Top form' ? 'top' : 'new'}`}>
                    <span className="progress-icon"><StateIcon word={row.word} /></span>
                    <span className="progress-copy"><strong>{row.title}</strong><em>{row.word}</em></span>
                    <Link to={next.href}>{next.label}</Link>
                  </li>
                );
              })}
            </ol>
            <article className="lesson-card">
              <h2>Assignments</h2>
              {data.assignments.length ? (
                <ul className="dash-list">
                  {data.assignments.map((item) => (
                    <li key={item.id}>
                      <Link className="text-link" to={`/student/assignments/${item.id}`}>{item.title}</Link>
                      <p>Due {formatDue(item.dueAt)}. {item.teacherName}.</p>
                    </li>
                  ))}
                </ul>
              ) : <p>No assignment is published.</p>}
            </article>
          </>
        )}
      </RemoteBlock>
      <Link className="text-link" to="/student">Home</Link>
    </section>
  );
}
