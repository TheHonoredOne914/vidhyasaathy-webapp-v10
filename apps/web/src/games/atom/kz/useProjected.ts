import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, type Object3D } from 'three';

export type ScreenAnchor = { x: number; y: number; visible: boolean };
export function useProjected(anchor: { current: Object3D | null }, onProject?: (point: ScreenAnchor) => void) {
  const world = useRef(new Vector3());
  const screen = useRef<ScreenAnchor>({ x: 0, y: 0, visible: false });
  useFrame(({ camera, size }) => {
    if (!anchor.current) return;
    camera.updateMatrixWorld();
    anchor.current.getWorldPosition(world.current).project(camera);
    const { x, y, z } = world.current;
    screen.current = { x: (x + 1) * size.width / 2, y: (1 - y) * size.height / 2, visible: z >= -1 && z <= 1 };
    onProject?.(screen.current);
  });
  return screen;
}
