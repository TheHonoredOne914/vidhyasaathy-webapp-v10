import type { CSSProperties } from 'react';
import './school-background.css';

export { BellButton } from './BellButton';
export { SchoolScene } from './SchoolScene';

const drawings = {
  pencil: 'M4 44 L36 12 L44 20 L12 52 L2 54 Z M32 16 L40 24 M4 44 L12 52',
  eraser: 'M8 30 L28 10 L46 28 L26 48 L14 48 Z M18 20 L36 38',
  ruler: 'M2 20 L70 4 L74 18 L6 34 Z M14 18 l1 5 M24 16 l1 7 M34 13 l1 5 M44 11 l1 7 M54 9 l1 5',
  plane: 'M2 26 L56 4 L40 50 L28 32 Z M28 32 L56 4',
};

const doodles = [
  { kind: 'pencil', left: '6%', top: '7%', rotation: '-18deg' },
  { kind: 'plane', left: '76%', top: '14%', rotation: '8deg' },
  { kind: 'eraser', left: '89%', top: '28%', rotation: '12deg' },
  { kind: 'ruler', left: '4%', top: '40%', rotation: '-8deg' },
  { kind: 'plane', left: '46%', top: '53%', rotation: '-12deg' },
  { kind: 'pencil', left: '85%', top: '65%', rotation: '24deg' },
  { kind: 'eraser', left: '12%', top: '79%', rotation: '-10deg' },
  { kind: 'ruler', left: '69%', top: '91%', rotation: '6deg' },
] as const;

export function SchoolBackground({ faint = false, sky = false }: { faint?: boolean; sky?: boolean }) {
  const tone = [faint ? 'school-background--faint' : '', sky ? 'school-background--sky' : ''].filter(Boolean).join(' ');
  const clouds = sky
    ? [['4%', '46%', 132], ['58%', '10%', 118]] as const
    : [['8%', '3%', 160], ['67%', '24%', 190], ['25%', '57%', 140]] as const;
  return <div className={`school-background${tone ? ` ${tone}` : ''}`} aria-hidden="true">
      {clouds.map(([left, top, width], index) => <svg
      key={left} className="school-background-cloud" viewBox="0 0 96 48" focusable="false"
      style={{ left, top, width, animationDuration: `${110 + index * 28}s`, animationDelay: `${-index * 31}s` }}
    ><path d="M10 40 C0 40,0 24,14 24 C14 10,34 6,42 16 C48 4,72 6,74 20 C90 18,94 40,78 40 Z" /></svg>)}
    {sky ? null : doodles.map(({ kind, left, top, rotation }, index) => <svg
      key={`${kind}-${index}`} className="school-background-doodle" viewBox="0 0 76 56" focusable="false"
      style={{ left, top, width: kind === 'ruler' ? 72 : 48, '--school-rotation': rotation, animationDuration: `${18 + index % 4 * 3}s`, animationDelay: `${-index * 3}s` } as CSSProperties}
    ><path d={drawings[kind]} /></svg>)}
  </div>;
}
