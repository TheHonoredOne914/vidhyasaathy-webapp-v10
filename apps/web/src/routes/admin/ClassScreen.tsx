import { ClassSchema } from '@vidhyasaathy/contracts';
import { Link, useParams } from 'react-router-dom';
import { PAGE } from '../../pages';
import { usePageMeta } from '../../meta';
import { ErrorState } from '../../ui/ErrorState';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';
import { StaleNote } from '../../ui/StaleNote';
import { NameList } from '../../setup/NameList';
import { useCatalog } from '../../setup/useCatalog';
import { useRemote } from '../../setup/useRemote';
import { AccessDenied } from '../AccessDenied';
import './admin.css';

export function ClassScreen({ audience }: { audience: 'admin' | 'teacher' }) {
  const { classId } = useParams();
  const schoolClass = useRemote(classId ? `/classes/${classId}` : null, ClassSchema);
  const catalog = useCatalog();
  const name = schoolClass.data?.name ?? 'Class';
  const meta = audience === 'admin' ? PAGE.classDetail : PAGE.teacherClass;
  usePageMeta(schoolClass.data ? `${schoolClass.data.name} — VidhyaSaathy` : meta.title, meta.description);
  const sections = (catalog.sections.data ?? []).filter((section) => section.classId === classId);
  const subjects = (catalog.subjects.data ?? []).filter((subject) => subject.classId === classId);
  const home = audience === 'admin' ? '/admin/classes' : '/teacher';

  if (schoolClass.denied || catalog.failed?.denied) return <AccessDenied />;
  if (catalog.failed) return <ErrorState title="Could not load this class" message={catalog.failed.message ?? 'Try again.'} onRetry={catalog.reload} />;

  if ((schoolClass.status === 'loading' && !schoolClass.data) || catalog.loading) {
    return (
      <>
        <PageHeader title="Class" description={meta.description} />
        <Skeleton />
      </>
    );
  }
  if (!schoolClass.data) {
    return (
      <>
        <PageHeader title="Class" description={meta.description} />
        <ErrorState title="Could not open this class" message={schoolClass.message ?? 'The request could not be completed.'} onRetry={schoolClass.reload} />
      </>
    );
  }

  return (
    <div className={audience === 'admin' ? 'admin-screen admin-detail-page' : undefined}>
      <PageHeader title={name} description={meta.description} />
      <StaleNote stale={schoolClass.stale || Boolean(catalog.stale)} updatedAt={schoolClass.updatedAt ?? catalog.stale?.updatedAt ?? null} message={schoolClass.message ?? catalog.stale?.message ?? null} />
      <h2 className="text-xl font-semibold">Sections</h2>
      <NameList
        label="Sections"
        emptyTitle="No section in this class."
        emptyDetail={audience === 'admin' ? 'Add a section from the sections page.' : 'No section in this class is assigned to you.'}
        items={sections.map((section) => ({
          id: section.id,
          name: section.name,
          to: `/${audience}/sections/${section.id}`,
        }))}
      />
      {sections.map((section) => <p key={section.id}><Link className="text-link" to={`/${audience}/sections/${section.id}/insights`}>Concept checks for section {section.name}</Link></p>)}
      <h2 className="text-xl font-semibold">Subjects</h2>
      <NameList
        label="Subjects"
        emptyTitle="No subject in this class."
        emptyDetail={audience === 'admin' ? 'Add a subject from the subjects page.' : 'No subject in this class is assigned to you.'}
        items={subjects.map((subject) => ({
          id: subject.id,
          name: subject.name,
          to: `/${audience}/subjects/${subject.id}`,
        }))}
      />
      <p><Link className="text-link" to={home}>{audience === 'admin' ? 'All classes' : 'Teacher home'}</Link></p>
    </div>
  );
}
