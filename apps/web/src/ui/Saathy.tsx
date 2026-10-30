import type { CSSProperties } from 'react';

type Mood = 'happy' | 'think' | 'cheer' | 'sleep' | 'wave';

export type SaathyMascotProps = { mood?: Mood; size?: number; alt?: string; className?: string };

export function SaathyMascot({ mood = 'happy', size = 120, alt = 'Saathy, your cloud learning companion', className = '' }: SaathyMascotProps) {
  const style = { '--saathy-size': `${size}px` } as CSSProperties;
  return <svg className={`saathy saathy--${mood}${className ? ` ${className}` : ''}`} style={style} width={size} height={Math.round(size * 0.78)} viewBox="0 0 120 94" role="img" aria-label={alt}>
    <path className="saathy__cloud" d="M36 72c-16 2-28-10-26-24 1-12 12-20 24-18 3-14 16-22 30-20 12 2 20 12 22 24 12 1 20 10 18 22-2 12-14 18-26 16H36z" />
    <circle cx="48" cy="42" r="2.4" fill="#041d3d" />
    <circle cx="72" cy="42" r="2.4" fill="#041d3d" />
    <path className="saathy__cheek" d="M40 50c2.2 2.4 5 2.4 7.2 0M74 50c2.2 2.4 5 2.4 7.2 0" />
    <path className="saathy__arm" d="M54 56c4 6 12 6 16 0" />
  </svg>;
}

export function Saathy(props: SaathyMascotProps) {
  return <SaathyMascot {...props} />;
}
