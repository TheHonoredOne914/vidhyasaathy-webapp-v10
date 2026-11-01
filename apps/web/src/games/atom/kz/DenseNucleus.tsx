import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { InstancedBufferAttribute, InstancedMesh, Matrix4, SphereGeometry, Vector3 } from 'three';
import { makeParticleMaterial } from './particleMaterial';
import { KZ, MOOD_ID, type Mood } from './palette';
import type { ParticleKind } from './Particle';
import type { packNucleus } from './nucleus';

export function DenseNucleus({ packed, radius, mood, reduced, onTap }: {
  packed: ReturnType<typeof packNucleus>; radius: number; mood: Mood; reduced: boolean; onTap?: ((kind: ParticleKind) => void) | undefined;
}) {
  return <>{(['p', 'n'] as const).map((kind) => <Instances key={kind} kind={kind} packed={packed} radius={radius} mood={mood} reduced={reduced} onTap={onTap} />)}</>;
}

function Instances({ packed, kind, radius, mood, reduced, onTap }: {
  packed: ReturnType<typeof packNucleus>; kind: ParticleKind; radius: number; mood: Mood; reduced: boolean; onTap?: ((kind: ParticleKind) => void) | undefined;
}) {
  const mesh = useRef<InstancedMesh>(null), lookUntil = useRef(0);
  const points = useMemo(() => packed.filter((point) => point.kind === kind), [packed, kind]);
  const resources = useMemo(() => {
    const geometry = new SphereGeometry(1, 32, 32);
    geometry.setAttribute('aFace', new InstancedBufferAttribute(new Float32Array(points.length), 1));
    const material = makeParticleMaterial(kind === 'p'
      ? { base: KZ.pBase, lit: KZ.pLit, shade: KZ.pShade, hi: KZ.pHi, rim: KZ.pRim, plus: true }
      : { base: KZ.nBase, lit: KZ.nLit, shade: KZ.nShade, hi: KZ.nHi, rim: KZ.nRim });
    return { geometry, material, matrix: new Matrix4(), world: new Vector3() };
  }, [kind, points.length]);
  useEffect(() => () => { resources.geometry.dispose(); resources.material.dispose(); }, [resources]);
  useFrame(({ camera, clock, pointer }) => {
    if (!mesh.current) return;
    mesh.current.updateWorldMatrix(true, false);
    const nearest = packed.map(({ pos }, index) => ({ index, distance: resources.world.copy(pos).applyMatrix4(mesh.current!.matrixWorld).distanceToSquared(camera.position) })).sort((a, b) => a.distance - b.distance).slice(0, 3);
    const faces = resources.geometry.getAttribute('aFace');
    points.forEach(({ pos }, index) => {
      resources.matrix.makeScale(radius, radius, radius).setPosition(pos);
      mesh.current!.setMatrixAt(index, resources.matrix);
      faces.setX(index, nearest.some((item) => packed[item.index] === points[index]) ? 1 : 0);
    });
    faces.needsUpdate = true; mesh.current.instanceMatrix.needsUpdate = true;
    const u = resources.material.uniforms, time = clock.elapsedTime;
    u.uTime.value = time; u.uMood.value = MOOD_ID[mood];
    u.uBlink.value = reduced ? 0 : Math.max(0, 1 - Math.abs((time + (kind === 'p' ? 0 : 1.7)) % 4.7 - 0.1) / 0.1);
    u.uLook.value.copy(time < lookUntil.current ? pointer : { x: 0, y: 0 });
  });
  return <instancedMesh ref={mesh} args={[resources.geometry, resources.material, points.length]} frustumCulled={false} onClick={(event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation(); if (event.delta > 8) return;
    lookUntil.current = resources.material.uniforms.uTime.value + 4; onTap?.(kind);
  }} />;
}
