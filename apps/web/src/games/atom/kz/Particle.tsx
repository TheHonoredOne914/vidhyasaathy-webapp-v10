import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Group, SphereGeometry, Vector3 } from 'three';
import { makeParticleMaterial } from './particleMaterial';
import { KZ, MOOD_ID, type Mood } from './palette';
import { useProjected, type ScreenAnchor } from './useProjected';

const sphere = new SphereGeometry(1, 48, 48);
export type ParticleKind = 'p' | 'n';
export function Particle({ kind, radius = 0.5, position = [0, 0, 0], face = false, mood = 'smile', seed = 1, wobble = 0, reduced = false, onTap, onProject }: {
  kind: ParticleKind; radius?: number; position?: [number, number, number]; face?: boolean | (() => boolean); mood?: Mood;
  seed?: number; wobble?: number; reduced?: boolean; onTap?: ((kind: ParticleKind) => void) | undefined; onProject?: ((point: ScreenAnchor) => void) | undefined;
}) {
  const root = useRef<Group>(null);
  const bounce = useRef(0);
  const lookUntil = useRef(0);
  const material = useMemo(() => makeParticleMaterial(kind === 'p'
    ? { base: KZ.pBase, lit: KZ.pLit, shade: KZ.pShade, hi: KZ.pHi, rim: KZ.pRim, plus: true }
    : { base: KZ.nBase, lit: KZ.nLit, shade: KZ.nShade, hi: KZ.nHi, rim: KZ.nRim }), [kind]);
  const target = useMemo(() => new Vector3(...position), [position[0], position[1], position[2]]);
  useEffect(() => () => material.dispose(), [material]);
  useProjected(root, onProject);
  useFrame(({ clock, pointer }, dt) => {
    const time = clock.elapsedTime, u = material.uniforms;
    u.uTime.value = time;
    u.uMood.value = MOOD_ID[mood];
    u.uFace.value = (typeof face === 'function' ? face() : face) ? 1 : 0;
    const cycle = 3 + ((seed * 16807) % 2147483647) / 2147483647 * 3;
    const blink = (time + seed * 0.71) % cycle;
    u.uBlink.value = reduced ? 0 : Math.max(0, 1 - Math.abs(blink - 0.1) / 0.1);
    u.uLook.value.lerp(time < lookUntil.current ? pointer : { x: 0, y: 0 }, 1 - Math.exp(-dt * 10));
    if (!root.current) return;
    root.current.position.lerp(target, 1 - Math.exp(-dt * 9));
    if (!reduced) {
      root.current.position.x += Math.sin(time * 9 + seed) * wobble * dt * 6;
      root.current.position.y += Math.cos(time * 11 + seed) * wobble * dt * 6;
    }
    bounce.current = Math.max(0, bounce.current - dt * 4);
    root.current.scale.setScalar(radius * (1 + Math.sin(bounce.current * Math.PI) * 0.12));
  });
  const tap = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 8) return;
    bounce.current = reduced ? 0 : 1;
    lookUntil.current = material.uniforms.uTime.value + 4;
    onTap?.(kind);
  };
  return <group ref={root} position={position} scale={radius}><mesh geometry={sphere} material={material} onClick={tap} /></group>;
}
