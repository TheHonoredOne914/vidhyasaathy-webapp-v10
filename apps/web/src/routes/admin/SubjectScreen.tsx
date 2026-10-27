import { useParams } from 'react-router-dom';
import { StaffSubject } from '../content/SubjectLessons';
import './admin.css';

export function SubjectScreen() {
  const { subjectId = '' } = useParams();
  return <div className="admin-screen admin-detail-page"><StaffSubject subjectId={subjectId} audience="admin" /></div>;
}
