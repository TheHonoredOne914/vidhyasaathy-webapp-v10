import { Link } from 'react-router-dom';
import { PAGE } from '../../pages';
import { usePageMeta } from '../../meta';
import { PageHeader } from '../../ui/PageHeader';
import { CatalogGate } from '../../setup/CatalogGate';
import { NameList } from '../../setup/NameList';
import { SubjectForm } from '../../setup/SubjectForm';
import { classLabel } from '../../setup/labels';
import { useCatalog } from '../../setup/useCatalog';
import './admin.css';

export function SubjectsScreen() {
  usePageMeta(PAGE.subjects.title, PAGE.subjects.description);
  const catalog = useCatalog();
  const classes = catalog.classes.data ?? [];
  const subjects = catalog.subjects.data ?? [];
  return (
    <div className="admin-screen admin-list-page">
      <PageHeader title="Subjects" description={PAGE.subjects.description} />
      <CatalogGate catalog={catalog}>
        <NameList
          label="Subjects"
          emptyTitle="No subject yet."
          emptyDetail="Add a subject to a class."
          items={subjects.map((subject) => ({
            id: subject.id,
            name: `${classLabel(classes, subject.classId)}: ${subject.name}`,
            to: `/admin/subjects/${subject.id}`,
          }))}
        />
        <SubjectForm classes={classes} onSaved={catalog.subjects.reload} />
        <p className="mt-6"><Link className="text-link" to="/admin">Administrator home</Link></p>
      </CatalogGate>
    </div>
  );
}
