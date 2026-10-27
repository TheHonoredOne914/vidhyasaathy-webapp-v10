import { Link } from 'react-router-dom';
import { PAGE } from '../../pages';
import { usePageMeta } from '../../meta';
import { PageHeader } from '../../ui/PageHeader';
import { CatalogGate } from '../../setup/CatalogGate';
import { NameList } from '../../setup/NameList';
import { SectionForm } from '../../setup/SectionForm';
import { classLabel } from '../../setup/labels';
import { useCatalog } from '../../setup/useCatalog';
import './admin.css';

export function SectionsScreen() {
  usePageMeta(PAGE.sections.title, PAGE.sections.description);
  const catalog = useCatalog();
  const classes = catalog.classes.data ?? [];
  const sections = catalog.sections.data ?? [];
  return (
    <div className="admin-screen admin-list-page">
      <PageHeader title="Sections" description={PAGE.sections.description} />
      <CatalogGate catalog={catalog}>
        <NameList
          label="Sections"
          emptyTitle="No section yet."
          emptyDetail="Add a section to a class."
          items={sections.map((section) => ({
            id: section.id,
            name: `${classLabel(classes, section.classId)} section ${section.name}`,
            to: `/admin/sections/${section.id}`,
          }))}
        />
        <SectionForm classes={classes} onSaved={catalog.sections.reload} />
        <p className="mt-6"><Link className="text-link" to="/admin">Administrator home</Link></p>
      </CatalogGate>
    </div>
  );
}
