import type { CSSProperties } from 'react';

type Mood = 'happy' | 'think' | 'cheer' | 'sleep' | 'wave';

export type SaathyMascotProps = { mood?: Mood; size?: number; alt?: string; className?: string };

export function SaathyMascot({ mood = 'happy', size = 120, alt = 'Saathy, your cloud learning companion', className = '' }: SaathyMascotProps) {
  const style = { '--saathy-size': `${size}px` } as CSSProperties;
  return <img className={`saathy saathy--${mood}${className ? ` ${className}` : ''}`} style={style} src="/img/mascot.webp" width={size} height={size * .78} alt={alt} />;
}

export function Saathy(props: SaathyMascotProps) {
  return <SaathyMascot {...props} />;
}
