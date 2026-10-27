import type { NoteCitation } from '@vidhyasaathy/contracts';
import { Link } from 'react-router-dom';

export function Citation({ citation, quote = true }: { citation: NoteCitation; quote?: boolean }) {
  return (
    <p className="lesson-cite">
      <Link to={`/student/notes/${citation.noteId}`}>From your teacher's notes, {citation.title}, {citation.locator}</Link>
      {quote ? <span className="lesson-note">{citation.quote}</span> : null}
    </p>
  );
}
