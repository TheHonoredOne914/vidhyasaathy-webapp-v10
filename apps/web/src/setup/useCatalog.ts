import { useCallback } from 'react';
import { AcademicYearListSchema, ClassListSchema, SectionListSchema, SubjectListSchema } from './schemas';
import { useRemote } from './useRemote';

export function useCatalog() {
  const years = useRemote('/academic-years', AcademicYearListSchema);
  const classes = useRemote('/classes', ClassListSchema);
  const sections = useRemote('/sections', SectionListSchema);
  const subjects = useRemote('/subjects', SubjectListSchema);
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
