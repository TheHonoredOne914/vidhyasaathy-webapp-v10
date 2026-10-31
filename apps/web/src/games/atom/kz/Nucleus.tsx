import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { packNucleus } from './nucleus';
import { Particle, type ParticleKind } from './Particle';
import type { Mood } from './palette';
import type { ScreenAnchor } from './useProjected';

export function Nucleus({ p, n, radius = 0.5, faces = 3, wobble = 0, mood = 'smile', reduced = false, onTap, onProject }: {
  p: number; n: number; radius?: number; faces?: number; wobble?: number; mood?: Mood; reduced?: boolean;
  onTap?: (kind: ParticleKind) => void; onProject?: (kind: ParticleKind, point: ScreenAnchor) => void;
}) {
  const root = useRef<Group>(null);
  const packed = useMemo(() => packNucleus(p, n, radius), [p, n, radius]);
  const front = useRef(new Set<number>());
  const world = useMemo(() => new Vector3(), []);
  useFrame(({ camera, clock }) => {
    if (!root.current) return;
    root.current.rotation.y = reduced ? 0 : Math.sin(clock.elapsedTime * 0.18) * 0.25;
    root.current.updateWorldMatrix(true, false);
    const nearest = packed.map(({ pos }, i) => ({ i, d: world.copy(pos).applyMatrix4(root.current!.matrixWorld).distanceToSquared(camera.position) }));
    nearest.sort((a, b) => a.d - b.d);
    front.current = new Set(nearest.slice(0, faces).map(({ i }) => i));
  });
  const occurrence = { p: 0, n: 0 };
  return <group ref={root}>{packed.map(({ pos, kind }, i) => <Particle key={`${kind}${occurrence[kind]++}`} kind={kind} radius={radius}
    position={pos.toArray()} face={() => front.current.has(i)} mood={mood} wobble={wobble} seed={i * 7919 + 7} reduced={reduced} onTap={onTap}
    onProject={onProject && ((point) => { if (front.current.has(i)) onProject(kind, point); })} />)}</group>;
}
