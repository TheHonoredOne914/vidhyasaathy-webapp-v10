import { PAGE } from '../../pages';
import { usePageMeta } from '../../meta';
import { PageHeader } from '../../ui/PageHeader';
import { CatalogGate } from '../../setup/CatalogGate';
import { ClassForm } from '../../setup/ClassForm';
import { NameList } from '../../setup/NameList';
import { useCatalog } from '../../setup/useCatalog';
import { Link } from 'react-router-dom';
import './admin.css';

export function ClassesScreen() {
  usePageMeta(PAGE.classes.title, PAGE.classes.description);
  const catalog = useCatalog();
  const classes = catalog.classes.data ?? [];
  const years = catalog.years.data ?? [];
  return (
    <div className="admin-screen admin-list-page">
      <PageHeader title="Classes" description={PAGE.classes.description} />
      <CatalogGate catalog={catalog}>
        <NameList label="Classes" emptyTitle="No class yet." emptyDetail="Add a class for an academic year." items={classes.map((item) => ({ id: item.id, name: item.name, to: `/admin/classes/${item.id}` }))} />
        <ClassForm years={years} onSaved={catalog.classes.reload} />
        <p className="mt-6"><Link className="text-link" to="/admin">Administrator home</Link></p>
      </CatalogGate>
    </div>
  );
}
