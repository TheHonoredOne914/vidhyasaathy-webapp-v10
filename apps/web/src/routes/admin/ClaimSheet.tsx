import { ClaimCodeSheetSchema } from '@vidhyasaathy/contracts';
import { Link, useSearchParams } from 'react-router-dom';
import { PAGE } from '../../pages';
import { usePageMeta } from '../../meta';
import { formatUpdatedAt } from '../../storage';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import { ErrorState } from '../../ui/ErrorState';
import { Skeleton } from '../../ui/Skeleton';
import { StaleNote } from '../../ui/StaleNote';
import { classLabel } from '../../setup/labels';
import { useCatalog } from '../../setup/useCatalog';
import { useRemote } from '../../setup/useRemote';
import '../../theme/vs-theme.css';
import { AccessDenied } from '../AccessDenied';
import './admin.css';

export function ClaimSheet() {
  usePageMeta(PAGE.claimSheet.title, PAGE.claimSheet.description);
  const [params] = useSearchParams();
  const sectionId = params.get('sectionId');
  const sheet = useRemote(sectionId ? `/admin/claim-codes?sectionId=${sectionId}` : null, ClaimCodeSheetSchema);
  const catalog = useCatalog();
  const section = (catalog.sections.data ?? []).find((item) => item.id === sectionId);
  const title = section ? `Activation codes for ${classLabel(catalog.classes.data ?? [], section.classId)} section ${section.name}` : 'Activation codes';
  if (sheet.denied || catalog.failed?.denied) return <AccessDenied />;
  if (catalog.failed) return <ErrorState title="Could not load sections" message={catalog.failed.message ?? 'Try again.'} onRetry={catalog.reload} />;

  if (!sectionId) {
    return (
      <section className="vs-page vs-claim-page admin-screen" aria-label="Printable activation codes">
        <ClaimSheetHeader title="Activation codes" description={PAGE.claimSheet.description} />
        <div className="vs-card vs-empty-card">
          <EmptyState title="No section chosen.">
            <p>Open a section, then print its activation codes.</p>
            <p className="mt-2"><Link className="text-link" to="/admin/sections">Sections</Link></p>
          </EmptyState>
        </div>
      </section>
    );
  }

  if ((sheet.status === 'loading' && !sheet.data) || catalog.loading) {
    return (
      <section className="vs-page vs-claim-page admin-screen" aria-label="Printable activation codes">
        <ClaimSheetHeader title="Activation codes" description={PAGE.claimSheet.description} />
        <Skeleton />
      </section>
    );
  }
  if (!sheet.data) {
    return (
      <section className="vs-page vs-claim-page admin-screen" aria-label="Printable activation codes">
        <ClaimSheetHeader title="Activation codes" description={PAGE.claimSheet.description} />
        <ErrorState title="Could not load activation codes" message={sheet.message ?? 'The request could not be completed.'} onRetry={sheet.reload} />
      </section>
    );
  }

  return (
    <section className="vs-page vs-claim-page admin-screen" aria-label="Printable activation codes">
      <ClaimSheetHeader title={title} description="Each code works once. Give the printed code to the named student." />
      <StaleNote stale={sheet.stale} updatedAt={sheet.updatedAt} message={sheet.message} />
      {sheet.data.entries.length === 0 ? (
        <div className="vs-card vs-empty-card">
          <EmptyState title="No activation codes to print.">
            <p>Import a roster for this section, or issue a code, before printing.</p>
          </EmptyState>
        </div>
      ) : (
        <>
          <p className="no-print mb-4 flex gap-3">
            <Button className="vs-action" onClick={() => { window.print(); }}>Print</Button>
            <Button variant="secondary" onClick={() => { downloadSheet(sheet.data?.entries ?? []); }}>Download CSV</Button>
          </p>
          <ul className="claim-sheet vs-claim-grid" aria-label="Activation codes">
            {sheet.data.entries.map((entry) => (
              <li key={entry.profileId} className="vs-card vs-claim-slip">
                <h2>{entry.name}</h2>
                <p className="vs-claim-meta">Roll number {entry.rollNumber}</p>
                <p className="vs-claim-code">{entry.code}</p>
                <p className="vs-claim-expiry">Expires {formatUpdatedAt(entry.expiresAt)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="no-print mt-6"><Link className="text-link" to="/admin/sections">All sections</Link></p>
    </section>
  );
}

function ClaimSheetHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="vs-page-header">
      <p className="vs-eyebrow">Student access</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function downloadSheet(entries: { name: string; rollNumber: string; code: string }[]) {
  const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = ['name,rollNumber,code', ...entries.map((entry) => [entry.name, entry.rollNumber, entry.code].map(quote).join(','))].join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'student-activation-codes.csv';
  link.click();
  URL.revokeObjectURL(url);
}
