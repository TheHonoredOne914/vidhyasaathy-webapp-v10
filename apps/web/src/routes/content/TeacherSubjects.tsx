import { Link } from 'react-router-dom';
import { usePageMeta } from '../../meta';
import { classLabel } from '../../setup/labels';
import { CatalogGate } from '../../setup/CatalogGate';
import { useCatalog } from '../../setup/useCatalog';
import { EmptyState } from '../../ui/EmptyState';
import { LessonFrame } from './LessonFrame';

export function TeacherSubjects() {
  usePageMeta('Lessons — VidhyaSaathy', 'Subjects where you add chapters, notes, and sessions.');
  const catalog = useCatalog();
  const classes = catalog.classes.data ?? [];
  const subjects = catalog.subjects.data ?? [];
  return (
    <LessonFrame kicker="Teacher" title="Lessons" script="One chapter at a time.">
      <CatalogGate catalog={catalog}>
        {subjects.length === 0 ? (
          <div className="lesson-card">
            <EmptyState title="No subject is assigned to you.">
              <p>An administrator assigns a subject when they invite you.</p>
            </EmptyState>
          </div>
        ) : (
          <ul className="lesson-list" aria-label="Subjects">
            {subjects.map((subject) => (
              <li key={subject.id}>
                <Link to={`/teacher/subjects/${subject.id}`}>{classLabel(classes, subject.classId)}: {subject.name}</Link>
              </li>
            ))}
          </ul>
        )}
      </CatalogGate>
    </LessonFrame>
  );
}
