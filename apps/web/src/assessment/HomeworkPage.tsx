import { usePageMeta } from '../meta';
import { Link, useLocation } from 'react-router-dom';
import { audienceFrom } from '../content/audience';
import { LessonFrame } from '../routes/content/LessonFrame';
import { AssignmentList } from './AssignmentList';

export function HomeworkPage() {
  const { pathname } = useLocation();
  const audience = audienceFrom(pathname);
  usePageMeta('Homework — VidhyaSaathy', 'Homework and quizzes, with due dates, status, and the teacher who set them.');
  return (
    <LessonFrame kicker="Homework" title="Assignments" script="Mark the short answers.">
      <p className="lesson-actions"><Link to={`/${audience}/review`}>Review queue</Link></p>
      <div className="lesson-card">
        <h2>All assignments</h2>
        <AssignmentList />
      </div>
    </LessonFrame>
  );
}
