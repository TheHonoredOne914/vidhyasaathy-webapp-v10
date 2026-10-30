import { Saathy as NotebookSaathy, type SaathyMood } from '../student/notebook/Saathy';

type Mood = SaathyMood | 'wave';

export type SaathyMascotProps = { mood?: Mood; size?: number; alt?: string; className?: string };

export function SaathyMascot({ mood = 'happy', size = 120, alt = 'Saathy, your cloud learning companion', className = '' }: SaathyMascotProps) {
  const mapped: SaathyMood = mood === 'wave' ? 'happy' : mood;
  return <NotebookSaathy mood={mapped} size={size} label={alt || 'Saathy'} className={className} />;
}

export function Saathy(props: SaathyMascotProps) {
  return <SaathyMascot {...props} />;
}
