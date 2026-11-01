import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { makeElectron } from './electron';

export function Electron({ radius, angle = 0, speed = 0.3, reduced = false }: { radius: number; angle?: number; speed?: number; reduced?: boolean | undefined }) {
  const electron = useMemo(() => makeElectron(radius, angle), [radius, angle]);
  const age = useRef(0);
  useEffect(() => () => electron.traverse((object) => {
    if ('geometry' in object) (object.geometry as { dispose: () => void }).dispose();
    if ('material' in object) (object.material as { dispose: () => void }).dispose();
  }), [electron]);
  useFrame((_, dt) => {
    age.current += dt;
    electron.scale.setScalar(reduced ? 1 : 1 - Math.exp(-age.current * 12));
    if (!reduced) electron.rotation.y += dt * speed;
  });
  return <primitive object={electron} />;
}
