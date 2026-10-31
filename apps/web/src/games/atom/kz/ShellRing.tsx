import { useEffect, useMemo } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { makeShellRing } from './electron';

export function ShellRing({ radius, active = false, onTap }: { radius: number; active?: boolean; onTap?: () => void }) {
  const ring = useMemo(() => makeShellRing(radius, active ? 0.9 : 0.4, active ? 0.028 : 0.014), [radius, active]);
  useEffect(() => () => { ring.geometry.dispose(); ring.material.dispose(); }, [ring]);
  return <primitive object={ring} onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); if (event.delta < 8) onTap?.(); }} />;
}
