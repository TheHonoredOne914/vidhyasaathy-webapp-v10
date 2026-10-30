import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, Scribble } from './icons';

const MASTERY: Record<string, string> = {
  "Let's fix this": 'fix',
  'Almost there': 'almost',
  Mastered: 'mastered',
  'Top form': 'top',
  New: 'new',
};

export function masteryKey(level: string): string {
  return MASTERY[level] ?? 'new';
}

export function MasteryChip({ level }: { level: string }) {
  const known = level in MASTERY;
  return <span className={`nb-mastery nb-mastery--${masteryKey(level)}`}>{known ? level : 'New'}</span>;
}

export function Chip({ tone, dashed, children }: { tone?: 'green' | 'orange' | 'red' | 'sand' | 'sky'; dashed?: boolean; children: ReactNode }) {
  return <span className={['nb-chip', tone ? `nb-chip--${tone}` : '', dashed ? 'nb-chip--dashed' : ''].filter(Boolean).join(' ')}>{children}</span>;
}

export function NbButton({ variant = 'primary', size, children, ...rest }: { variant?: 'primary' | 'ghost' | 'quiet' | 'gold'; size?: 'sm' | 'lg'; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={['nb-btn', `nb-btn--${variant}`, size ? `nb-btn--${size}` : ''].filter(Boolean).join(' ')} {...rest}>{children}</button>;
}

export function PageHead({ eyebrow, title, sub, actions, doodle = true }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode; doodle?: boolean }) {
  return <header className="nb-head"><div><div>{eyebrow ? <div className="nb-head__eyebrow">{eyebrow}</div> : null}<h1 className="nb-h1">{title}</h1>{doodle ? <Scribble /> : null}{sub ? <p className="nb-sub">{sub}</p> : null}</div></div>{actions}</header>;
}

export function Card({ title, meta, accent, flat, gold, grow, tape, className = '', children }: { title?: ReactNode; meta?: ReactNode; accent?: boolean; flat?: boolean; gold?: boolean; grow?: boolean; tape?: boolean; className?: string; children: ReactNode }) {
  const cls = ['nb-card', accent ? 'nb-card--accent' : '', flat ? 'nb-card--flat' : '', gold ? 'nb-card--gold' : '', grow ? 'nb-grow' : '', className].filter(Boolean).join(' ');
  return <section className={cls}>{tape ? <span className="nb-tape" /> : null}{title || meta ? <div className="nb-card__head">{title ? <h3 className="nb-h3">{title}</h3> : <span />}{meta}</div> : null}{children}</section>;
}

export function Sticky({ color, who, tape, children }: { color?: 'pink' | 'blue' | 'green' | 'lilac'; who?: ReactNode; tape?: 'sky' | 'left'; children: ReactNode }) {
  return <div className={['nb-sticky', color ? `nb-sticky--${color}` : ''].filter(Boolean).join(' ')}>{tape ? <span className={tape === 'left' ? 'nb-tape nb-tape--left' : 'nb-tape nb-tape--sky'} /> : null}{who ? <div className="nb-sticky__who">{who}</div> : null}{children}</div>;
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  const width = `${Math.max(0, Math.min(100, value))}%`;
  return <div className="nb-bar" aria-hidden="true"><i style={{ width, background: color }} /></div>;
}

export function Row({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return <div className="nb-row"><div><div className="nb-row__t">{title}</div>{sub ? <div className="nb-row__s">{sub}</div> : null}</div>{children}</div>;
}

export function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (value: boolean) => void }) {
  return <button type="button" className={on ? 'nb-toggle is-on' : 'nb-toggle'} role="switch" aria-checked={on} aria-label={label} onClick={() => { onChange(!on); }} />;
}

export function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
  return <div className="nb-tabs" role="tablist">{tabs.map((tab) => <button type="button" role="tab" aria-selected={tab.id === active} className={tab.id === active ? 'nb-tab is-active' : 'nb-tab'} key={tab.id} onClick={() => { onChange(tab.id); }}>{tab.label}</button>)}</div>;
}

export function SaathyTip({ children }: { children: ReactNode }) {
  return <div className="nb-saathy-tip">{children}</div>;
}

const SUBJECT_SVG: Record<string, string> = {
  phy: '<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.6" stroke-linecap="round"><circle cx="16" cy="16" r="2.5" fill="#3D6FB8" stroke="none"/><ellipse cx="16" cy="16" rx="11" ry="5"/><ellipse cx="16" cy="16" rx="11" ry="5" transform="rotate(60 16 16)"/><ellipse cx="16" cy="16" rx="11" ry="5" transform="rotate(120 16 16)"/></svg>',
  chem: '<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4h8v6l5 14H7l5-14V4z"/><path d="M12 10h8" stroke="#D9823B"/><circle cx="14" cy="20" r="1.2" fill="#D9823B" stroke="none"/><circle cx="19" cy="22" r="1.5" fill="#E8B84A" stroke="none"/></svg>',
  bio: '<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 24c0-8 6-16 16-16-2 8-2 14-8 18"/><path d="M10 22c4-2 8-6 10-12" stroke="#5A9A62"/></svg>',
  math: '<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="10" r="3"/><path d="M16 13 L10 26"/><path d="M16 13 L22 26"/><path d="M11 21h10" stroke="#6B5CA5"/></svg>',
  eng: '<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8c4-1.5 8-1.5 11 1 3-2.5 7-2.5 11-1v16c-4-1.5-8-1.5-11 1-3-2.5-7-2.5-11-1z"/><path d="M16 9v16"/><path d="M8 13h5M8 17h5M19 13h5" stroke="#C9962E"/></svg>',
  sst: '<svg viewBox="0 0 32 32" fill="none" stroke="#1B2A4A" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="14" r="9"/><path d="M8 12c3 1 4 3 3 6M18 6c-1 3 1 5 4 5M17 23c0-3 2-4 4-4" stroke="#C9433A"/><path d="M16 23v4M11 28h10"/></svg>',
};

export function subjectKey(name: string): keyof typeof SUBJECT_SVG {
  const lower = name.toLowerCase();
  if (lower.includes('phys')) return 'phy';
  if (lower.includes('chem')) return 'chem';
  if (lower.includes('bio')) return 'bio';
  if (lower.includes('math')) return 'math';
  if (lower.includes('eng')) return 'eng';
  if (lower.includes('social') || lower.includes('sst') || lower.includes('histor') || lower.includes('geog') || lower.includes('civics')) return 'sst';
  return 'eng';
}

export const SUBJECT_COLOR: Record<string, string> = {
  phy: 'var(--nb-blue)', chem: 'var(--nb-orange)', bio: 'var(--nb-leaf)', math: 'var(--nb-violet)', eng: 'var(--nb-gold-deep)', sst: 'var(--nb-redpen)',
};

export function SubjectIcon({ subject, large }: { subject: string; large?: boolean }) {
  const key = subjectKey(subject);
  return <div className={large ? `nb-ico nb-ico--${key} nb-ico--lg` : `nb-ico nb-ico--${key}`} dangerouslySetInnerHTML={{ __html: SUBJECT_SVG[key] }} />;
}

export function ConfidenceRow({ value, locked, onChange }: { value: '' | 'sure' | 'unsure' | 'guess'; locked?: boolean; onChange: (value: 'sure' | 'unsure' | 'guess') => void }) {
  const items = [
    { id: 'sure' as const, label: 'Sure', hint: 'I know this', icon: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>' },
    { id: 'unsure' as const, label: 'Unsure', hint: 'I think so', icon: '<path d="M4 12c2-3 4-3 6 0s4 3 6 0 2-2 4-1"/><circle cx="12" cy="18.5" r=".6"/><path d="M12 4v4"/>' },
    { id: 'guess' as const, label: 'Guess', hint: 'No idea, picked one', icon: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="15" cy="9" r="1"/><circle cx="9" cy="15" r="1"/>' },
  ];
  return <div className="nb-conf"><p className="nb-conf__q">How sure are you?</p><div className="nb-conf__row">{items.map((item) => <button type="button" key={item.id} className={`nb-confbtn nb-confbtn--${item.id}${value === item.id ? ' is-selected' : ''}`} disabled={locked} aria-pressed={value === item.id} onClick={() => { onChange(item.id); }}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: item.icon }} /><span>{item.label}<small>{item.hint}</small></span></button>)}</div></div>;
}

export function Bubble({ hand, children }: { hand?: boolean; children: ReactNode }) {
  return <div className={hand ? 'nb-bubble nb-bubble--hand' : 'nb-bubble'}>{children}</div>;
}

export function DoodleStrip({ states }: { states: Array<'right' | 'wrong' | 'current' | 'todo'> }) {
  return <div className="nb-strip">{states.map((state, index) => <span key={index} className="nb-strip__slot">{index > 0 ? <span className="nb-strip__link" /> : null}<span className={`nb-strip__node${state === 'right' ? ' is-right' : ''}${state === 'wrong' ? ' is-wrong' : ''}${state === 'current' ? ' is-current' : ''}`}>{state === 'right' ? <Icon name="check" /> : state === 'wrong' ? <Icon name="x" /> : index + 1}</span></span>)}</div>;
}
