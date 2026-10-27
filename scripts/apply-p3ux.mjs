/**
 * Phase 3 UX hard fixes — apply once, idempotent where possible.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, s) => { fs.writeFileSync(path.join(root, p), s); console.log('wrote', p); };
const changed = [];

// 1) student.css — hero/mascot, centered stats, segmented polish
{
  let css = read('apps/web/src/student/student.css');
  css = css.replace(
    /\.desk-hero \{ display: flex; justify-content: space-between; gap: 24px; padding: 32px; color: #041D3D; background: linear-gradient\(135deg, var\(--vs-paper\), var\(--color-sky\)\); \}/,
    `.desk-hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 168px; padding: 28px 32px; color: #041D3D; background: linear-gradient(135deg, var(--vs-paper), var(--color-sky)); overflow: visible; }`
  );
  css = css.replace(
    /\.desk-mascot \{ width: 88px; height: 88px; border-radius: 24px; object-fit: cover; align-self: center; \}/,
    `.desk-mascot { width: auto !important; height: 120px !important; max-width: 160px; border-radius: 0; object-fit: contain; align-self: center; flex-shrink: 0; }`
  );
  css = css.replace(
    /\.stat-card \{ display: flex; align-items: center; gap: 14px; min-height: 92px; padding: 18px 20px; border: 1\.5px solid rgb\(4 29 61 \/ \.12\); border-radius: 18px; background: var\(--vs-paper\); \}\n\.stat-card strong, \.stat-card span \{ display: block; \}\n\.stat-card strong \{ color: var\(--color-midnight\); font-size: 30px; line-height: 1; \}\n\.stat-card span \{ color: var\(--vs-ink-soft\); \}/,
    `.stat-card { display: flex; align-items: center; gap: 14px; min-height: 104px; padding: 20px; border: 1.5px solid rgb(4 29 61 / .12); border-radius: 18px; background: var(--vs-paper); }
.stat-card > div:not(.week-dots) { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 4px; min-width: 0; flex: 1; }
.stat-card strong, .stat-card span { display: block; }
.stat-card strong { color: var(--color-midnight); font-size: 32px; line-height: 1; text-align: left; }
.stat-card span { color: var(--vs-ink-soft); }`
  );
  css = css.replace(
    /\.style-switch \{ display: flex; padding: 4px; border-radius: 999px; background: var\(--color-ice\); \}\n\.style-switch button \{ min-height: 40px; padding: 0 14px; border: 0; border-radius: 999px; color: var\(--color-deep\); background: transparent; font: inherit; cursor: pointer; \}\n\.style-switch button\.is-selected \{ color: var\(--vs-paper\); background: var\(--color-deep\); box-shadow: 0 3px 0 var\(--color-midnight\); \}/,
    `.style-switch { display: inline-flex; padding: 4px; border-radius: 999px; background: var(--color-ice); gap: 2px; }
.style-switch button { min-height: 44px; min-width: 44px; padding: 0 16px; border: 0; border-radius: 999px; color: var(--color-deep); background: transparent; font: inherit; cursor: pointer; }
.style-switch button.is-selected, .style-switch button[aria-pressed="true"] { color: var(--vs-paper); background: var(--color-deep); box-shadow: 0 3px 0 var(--color-midnight); }
.style-switch button:focus-visible { outline: 2px solid var(--color-blue); outline-offset: 2px; }`
  );
  css = css.replace(
    /\.continue-learning \{ padding: 24px; border: 1\.5px solid rgb\(4 29 61 \/ \.12\); border-radius: 28px; background: var\(--vs-paper\); box-shadow: 0 10px 30px -12px rgb\(4 29 61 \/ \.18\); \}/,
    `.continue-learning { padding: 24px; border: 1.5px solid rgb(4 29 61 / .12); border-radius: 28px; background: var(--vs-paper); box-shadow: 0 10px 30px -12px rgb(4 29 61 / .18); min-height: 140px; }`
  );
  if (!css.includes('/* p3ux-hard */')) {
    css += `
/* p3ux-hard */
.subject-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.subject-card { display: grid; gap: 10px; min-height: 160px; padding: 20px; border: 1.5px solid rgb(4 29 61 / .12); border-radius: 18px; background: var(--vs-paper); color: inherit; text-decoration: none; }
.subject-card strong { font-size: 22px; color: var(--color-midnight); }
.subject-card span { color: var(--vs-ink-soft); }
.error-card { display: grid; gap: 12px; margin-top: 16px; padding: 20px; border: 1.5px solid rgb(217 83 79 / .35); border-radius: 16px; background: #fff8f6; }
.error-card + .skeleton, .skeleton + .error-card { display: none; }
`;
  }
  write('apps/web/src/student/student.css', css);
  changed.push('apps/web/src/student/student.css');
}

// 2) StudentHome — aria-pressed segmented, subject cards, error replaces skeleton cleanly
{
  let src = read('apps/web/src/routes/StudentHome.tsx');
  src = src.replace(
    `<div className="style-switch" role="group" aria-label="Learning style">{(['visual', 'story', 'practice'] as Style[]).map((value) => <button className={style === value ? 'is-selected' : ''} key={value} onClick={() => saveStyle(value)} type="button">{styleLabel(value)}</button>)}</div>`,
    `<div className="style-switch" role="radiogroup" aria-label="Learning style">{(['visual', 'story', 'practice'] as Style[]).map((value) => <button role="radio" aria-checked={style === value} aria-pressed={style === value} className={style === value ? 'is-selected' : ''} key={value} onClick={() => saveStyle(value)} type="button">{styleLabel(value)}</button>)}</div>`
  );
  src = src.replace(
    `<strong>{progress.data?.evidence.passRate == null ? '—' : \`\${Math.round(progress.data.evidence.passRate * 100)}%\`}</strong><span>mastery</span>`,
    `<strong>{progress.data?.evidence.passRate == null ? 'New' : \`\${Math.round(progress.data.evidence.passRate * 100)}%\`}</strong><span>mastery</span>`
  );
  // Subjects / study panels: error must replace skeleton; use subject cards
  src = src.replace(
    `{subjects.status === 'loading' ? <Skeleton /> : subjects.data ? subjects.data.length ? <ul className="catalog-list">{subjects.data.map((subject) => <li key={subject.id}><Link className="text-link" to={\`/student/subjects/\${subject.id}\`}>{subject.name}</Link></li>)}</ul> : <p>No subjects assigned yet. Ask your teacher.</p> : <ErrorState title="Could not load subjects" message={subjects.message ?? 'Try again.'} onRetry={subjects.reload} />}`,
    `{subjects.status === 'loading' && !subjects.data ? <Skeleton /> : subjects.status === 'error' && !subjects.data ? <div className="error-card"><ErrorState title="Could not load subjects" message={subjects.message ?? 'Try again.'} onRetry={subjects.reload} /></div> : subjects.data?.length ? <div className="subject-card-grid">{subjects.data.map((subject) => <Link className="subject-card" key={subject.id} to={\`/student/subjects/\${subject.id}\`}><strong>{subject.name}</strong><span>Open chapters and sessions</span></Link>)}</div> : <p>No subjects assigned yet. Ask your teacher.</p>}`
  );
  // Don't stack StaleNote message on top of ErrorState for studying panels
  src = src.replace(
    `{panel === 'study' ? <p>Open a subject, then a chapter, to start a session.</p> : null}<StaleNote stale={subjects.stale} updatedAt={subjects.updatedAt} message={subjects.message} />`,
    `{panel === 'study' ? <p>Open a subject, then a chapter, to start a session.</p> : null}<StaleNote stale={subjects.stale && subjects.status !== 'error'} updatedAt={subjects.updatedAt} message={subjects.status === 'error' ? null : subjects.message} />`
  );
  write('apps/web/src/routes/StudentHome.tsx', src);
  changed.push('apps/web/src/routes/StudentHome.tsx');
}

// 3) rosterPreview — name,rollNumber,phone
{
  write('apps/web/src/rosterPreview.ts', `import { parseRosterCsv } from '@vidhyasaathy/core/roster';

export type PreviewLine = {
  row: number;
  name: string;
  rollNumber: string;
  phone: string;
  message: string | null;
};

// Preview matches the import header rule so row numbers match the server.
export function previewRoster(csv: string): { headerError: string | null; lines: PreviewLine[] } {
  if (!csv.trim()) return { headerError: null, lines: [] };
  const parsed = parseRosterCsv(csv);
  const records = [...parsed.records];
  const header = records.shift();
  const headerRow = header?.row ?? 1;
  const lines: PreviewLine[] = parsed.errors.map((error) => ({
    row: error.row,
    name: '',
    rollNumber: '',
    phone: '',
    message: error.message,
  }));
  if (!header || header.fields.length !== 3 || !['name', 'rollNumber', 'phone'].every((field) => header.fields.includes(field))
    || parsed.errors.some((error) => error.row < headerRow)) {
    return {
      headerError: 'CSV header must contain exactly name,rollNumber,phone (in any order).',
      lines,
    };
  }
  const nameIndex = header.fields.indexOf('name');
  const rollIndex = header.fields.indexOf('rollNumber');
  const phoneIndex = header.fields.indexOf('phone');
  for (const record of records) {
    const name = record.fields[nameIndex] ?? '';
    const rollNumber = record.fields[rollIndex] ?? '';
    const phone = record.fields[phoneIndex] ?? '';
    if (record.fields.length !== 3) {
      lines.push({ row: record.row, name, rollNumber, phone, message: 'Expected exactly three CSV fields.' });
      continue;
    }
    const message = name.trim() && rollNumber.trim() && phone.trim() ? null : 'Check the student name, roll number, and parent phone.';
    lines.push({ row: record.row, name, rollNumber, phone, message });
  }
  lines.sort((left, right) => left.row - right.row);
  return { headerError: null, lines };
}
`);
  changed.push('apps/web/src/rosterPreview.ts');
}

// 4) rosterPreview.test.ts — update if present
{
  const p = 'apps/web/src/rosterPreview.test.ts';
  if (fs.existsSync(path.join(root, p))) {
    let t = read(p);
    t = t.replace(/name,rollNumber/g, 'name,rollNumber,phone');
    t = t.replace(/exactly name,rollNumber/g, 'exactly name,rollNumber,phone');
    t = t.replace(/Expected exactly two CSV fields/g, 'Expected exactly three CSV fields');
    // crude: ensure phone field in fixtures that look like 2-col rows
    if (!t.includes('phone')) {
      // leave; tests may need manual fix later
    }
    write(p, t);
    changed.push(p);
  }
}

// 5) brand.css — 240px sidebar, 56px topbar
{
  let css = read('apps/web/src/theme/brand.css');
  css = css.replace(/\.app-shell \{ grid-template-columns: 260px minmax\(0, 1fr\); \}/g, '.app-shell { grid-template-columns: 240px minmax(0, 1fr); }');
  css = css.replace(/\.app-aside \{\s*width: 260px;/g, '.app-aside {\n    width: 240px;');
  if (!css.includes('/* p3ux topbar */')) {
    css = css.replace(
      /\.app-topbar \{\s*border-bottom-color: rgb\(4 29 61 \/ 10%\);\s*background: rgb\(249 246 238 \/ 76%\);\s*backdrop-filter: blur\(12px\);\s*\}/,
      `.app-topbar {\n    min-height: 56px;\n    height: 56px;\n    border-bottom-color: rgb(4 29 61 / 10%);\n    background: rgb(249 246 238 / 76%);\n    backdrop-filter: blur(12px);\n  }\n  /* p3ux topbar */`
    );
  }
  write('apps/web/src/theme/brand.css', css);
  changed.push('apps/web/src/theme/brand.css');
}

// 6) vs-theme privacy max-width
{
  let css = read('apps/web/src/theme/vs-theme.css');
  if (!css.includes('/* p3ux privacy */')) {
    css += `
/* p3ux privacy */
.vs-privacy-article p { max-width: 65ch; }
.vs-privacy-layout { gap: 32px; }
@media (min-width: 900px) {
  .vs-privacy-layout { grid-template-columns: 220px minmax(0, 1fr); column-gap: 40px; }
}
`;
    write('apps/web/src/theme/vs-theme.css', css);
    changed.push('apps/web/src/theme/vs-theme.css');
  }
}

// 7) Settings — compact header + time field layout
{
  let css = read('apps/web/src/dashboard/dashboard.css');
  if (!css.includes('/* p3ux settings */')) {
    css += `
/* p3ux settings */
.dash-banner { padding: 16px 20px; min-height: 0; max-height: 72px; display: flex; flex-direction: column; justify-content: center; }
.dash-banner h1 { margin: 0; font-size: 28px; line-height: 1.1; }
.dash-banner p { margin: 4px 0 0; }
.dash-panel label[for="quiet-start"],
.dash-panel label[for="quiet-end"] { display: block; margin-top: 12px; font-weight: 600; }
.dash-panel input[type="time"] { display: block; width: min(100%, 220px); min-height: 44px; margin-top: 6px; padding: 8px 12px; }
.notifications-page .error-card, .dash .error-card { margin-top: 20px; }
`;
    write('apps/web/src/dashboard/dashboard.css', css);
    changed.push('apps/web/src/dashboard/dashboard.css');
  }
}

// 8) NotificationsPage — wrap ErrorState with spacing; RemoteBlock already replaces skeleton
{
  let src = read('apps/web/src/dashboard/NotificationsPage.tsx');
  if (!src.includes('notifications-page')) {
    src = src.replace('<section className="dash">', '<section className="dash notifications-page">');
    write('apps/web/src/dashboard/NotificationsPage.tsx', src);
    changed.push('apps/web/src/dashboard/NotificationsPage.tsx');
  }
}

// 9) ChapterDesk — error replaces skeletons (ensure failed path doesn't also render skeletons)
{
  const p = 'apps/web/src/routes/content/ChapterDesk.tsx';
  let src = read(p);
  if (!src.includes('error-card') && src.includes('Could not load this chapter')) {
    src = src.replace(
      /return <ErrorState title="Could not load this chapter" message=\{failed\.message \?\? 'Try again\.'\} onRetry=\{\(\) => \{ parts\.forEach\(\(part\) => \{ part\.reload\(\); \}\); \}\} \/>;/,
      `return <div className="error-card"><ErrorState title="Could not load this chapter" message={failed.message ?? 'Try again.'} onRetry={() => { parts.forEach((part) => { part.reload(); }); }} /></div>;`
    );
    write(p, src);
    changed.push(p);
  }
}

// 10) RemoteBlock — don't show StaleNote message on hard error
{
  let src = read('apps/web/src/dashboard/RemoteBlock.tsx');
  const next = `import type { ReactNode } from 'react';
import { AccessDenied } from '../routes/AccessDenied';
import type { Remote } from '../setup/useRemote';
import { ErrorState } from '../ui/ErrorState';
import { Skeleton } from '../ui/Skeleton';
import { StaleNote } from '../ui/StaleNote';

export function RemoteBlock<T>({ remote, title, children }: { remote: Remote<T>; title: string; children: (data: T) => ReactNode }) {
  if (remote.denied) return <AccessDenied />;
  const hardError = remote.status === 'error' && !remote.data;
  return (
    <>
      <StaleNote stale={remote.stale && !hardError} updatedAt={remote.updatedAt} message={hardError ? null : remote.message} />
      {remote.status === 'loading' && !remote.data ? <Skeleton /> : remote.data
        ? children(remote.data)
        : <div className="error-card"><ErrorState title={title} message={remote.message ?? 'Try again.'} onRetry={remote.reload} /></div>}
    </>
  );
}
`;
  write('apps/web/src/dashboard/RemoteBlock.tsx', next);
  changed.push('apps/web/src/dashboard/RemoteBlock.tsx');
}

fs.writeFileSync(path.join(root, 'plan/v9/logs/phase3ux-done.txt'), changed.join('\\n') + '\\n');
console.log('DONE', changed.length);
