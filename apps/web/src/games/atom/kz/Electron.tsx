import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { makeElectron } from './electron';

export function Electron({ radius, angle = 0, speed = 0.3, reduced = false }: { radius: number; angle?: number; speed?: number; reduced?: boolean }) {
  const electron = useMemo(() => makeElectron(radius, angle), [radius, angle]);
  useEffect(() => () => electron.traverse((object) => {
    if ('geometry' in object) (object.geometry as { dispose: () => void }).dispose();
    if ('material' in object) (object.material as { dispose: () => void }).dispose();
  }), [electron]);
  useFrame((_, dt) => { if (!reduced) electron.rotation.y += dt * speed; });
  return <primitive object={electron} />;
}
