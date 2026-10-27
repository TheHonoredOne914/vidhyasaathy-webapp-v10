import type { ReactNode } from 'react';
import { StaleNote } from '../../ui/StaleNote';

export function LessonFrame({
  kicker,
  title,
  script,
  stale = null,
  children,
}: {
  kicker: string;
  title: string;
  script?: string;
  stale?: { stale: boolean; updatedAt: string | null; message: string | null } | null;
  children: ReactNode;
}) {
  return (
    <section className="lesson-shell">
      <header className="lesson-banner">
        <p className="lesson-kicker">{kicker}</p>
        <h1>{title}</h1>
        {script ? <p className="lesson-hand">{script}</p> : null}
      </header>
      {stale ? <StaleNote stale={stale.stale} updatedAt={stale.updatedAt} message={stale.message} /> : null}
      {children}
    </section>
  );
}
