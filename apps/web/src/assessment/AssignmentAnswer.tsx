import { Link, useParams } from 'react-router-dom';
import { usePageMeta } from '../meta';
import { Worksheet } from '../student/notebook/screens/polish3b/Worksheet';

export function AssignmentAnswerPage() {
  const { assignmentId = '' } = useParams();
  usePageMeta('Homework — VidhyaSaathy', 'Your working, one question at a time.');
  return <div className="nb-col pg-worksheet"><Link className="nb-back" to="/student?panel=homework">Back to homework</Link><Worksheet key={assignmentId} assignmentId={assignmentId} /></div>;
}
