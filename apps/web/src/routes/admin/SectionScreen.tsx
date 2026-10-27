import { RosterListSchema, SectionSchema } from '@vidhyasaathy/contracts';
import { Link, useParams } from 'react-router-dom';
import { PAGE } from '../../pages';
import { usePageMeta } from '../../meta';
import { ErrorState } from '../../ui/ErrorState';
import { PageHeader } from '../../ui/PageHeader';
import { Skeleton } from '../../ui/Skeleton';
import { StaleNote } from '../../ui/StaleNote';
import { RosterForm } from '../../setup/RosterForm';
import { classLabel } from '../../setup/labels';
import { useCatalog } from '../../setup/useCatalog';
import { useRemote } from '../../setup/useRemote';
import { AccessDenied } from '../AccessDenied';
import './admin.css';

export function SectionScreen({ audience = 'admin' }: { audience?: 'admin' | 'teacher' }) {
  const { sectionId } = useParams();
  const section = useRemote(sectionId ? `/sections/${sectionId}` : null, SectionSchema);
  const catalog = useCatalog();
  const roster = useRemote(sectionId ? `/sections/${sectionId}/students` : null, RosterListSchema);
  usePageMeta(section.data ? `${section.data.name} — VidhyaSaathy` : PAGE.sectionDetail.title, PAGE.sectionDetail.description);
  const classes = catalog.classes.data ?? [];

  if (section.denied || roster.denied || catalog.failed?.denied) return <AccessDenied />;
  if (catalog.failed) return <ErrorState title="Could not load this section" message={catalog.failed.message ?? 'Try again.'} onRetry={catalog.reload} />;

  if ((section.status === 'loading' && !section.data) || catalog.loading) {
    return (
      <>
        <PageHeader title="Section" description={PAGE.sectionDetail.description} />
        <Skeleton />
      </>
    );
  }
  if (!section.data) {
    return (
      <>
        <PageHeader title="Section" description={PAGE.sectionDetail.description} />
        <ErrorState title="Could not open this section" message={section.message ?? 'The request could not be completed.'} onRetry={section.reload} />
      </>
    );
  }

  const title = `${classLabel(classes, section.data.classId)} section ${section.data.name}`;
  return (
    <div className={audience === 'admin' ? 'admin-screen admin-detail-page' : undefined}>
      <PageHeader title={title} description={PAGE.sectionDetail.description} />
      <StaleNote stale={section.stale || Boolean(catalog.stale)} updatedAt={section.updatedAt ?? catalog.stale?.updatedAt ?? null} message={section.message ?? catalog.stale?.message ?? null} />
      <p className="mb-4">
        <Link className="text-link" to={`/${audience}/classes/${section.data.classId}`}>Open class</Link>
      </p>
      {audience === 'admin' ? <p className="mb-6"><Link className="text-link" to={`/admin/claim-codes?sectionId=${section.data.id}`}>Print activation codes</Link></p> : <p className="mb-6"><Link className="text-link" to={`/teacher/sections/${section.data.id}/insights`}>Concept checks</Link></p>}
      <h2 className="mb-4 text-xl font-semibold">Roster</h2>
      <StaleNote stale={roster.stale} updatedAt={roster.updatedAt} message={roster.message} />
      {roster.status === 'loading' ? <Skeleton /> : roster.data ? (
        roster.data.length ? <ul className="catalog-list" aria-label="Students">{roster.data.map((student) => <li key={student.id}><span>{student.rollNumber ?? 'No roll number'}</span><span>{student.name}</span><span>{student.activated ? 'Activated' : 'Not activated'}</span></li>)}</ul> : <p>No students in this section yet.</p>
      ) : <ErrorState title="Could not load the roster" message={roster.message ?? 'Try again.'} onRetry={roster.reload} />}
      {audience === 'admin' ? <><h2 className="mt-6">Import students</h2><RosterForm sections={[section.data]} classes={classes} onSaved={roster.reload} /><p className="mt-6"><Link className="text-link" to="/admin/sections">All sections</Link></p></> : null}
    </div>
  );
}
