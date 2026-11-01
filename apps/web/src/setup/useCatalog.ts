import { useCallback } from 'react';
import { AcademicYearListSchema, ClassListSchema, SectionListSchema, SubjectListSchema } from './schemas';
import { useRemote } from './useRemote';

/** School catalog (staff only). Pass enabled=false for roles that cannot read it, e.g. parents. */
export function useCatalog(enabled = true) {
  const years = useRemote(enabled ? '/academic-years' : null, AcademicYearListSchema);
  const classes = useRemote(enabled ? '/classes' : null, ClassListSchema);
  const sections = useRemote(enabled ? '/sections' : null, SectionListSchema);
  const subjects = useRemote(enabled ? '/subjects' : null, SubjectListSchema);
  const parts = [years, classes, sections, subjects];
  const loading = parts.some((part) => part.status === 'loading' && part.data === null);
  const failed = parts.find((part) => part.status === 'error' && part.data === null) ?? null;
  const stale = parts.find((part) => part.stale && part.updatedAt) ?? null;
  const reload = useCallback(() => {
    years.reload();
    classes.reload();
    sections.reload();
    subjects.reload();
  }, [classes.reload, sections.reload, subjects.reload, years.reload]);
  return { years, classes, sections, subjects, loading, failed, stale, reload };
}

export type Catalog = ReturnType<typeof useCatalog>;
