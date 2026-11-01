import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Spherical, Vector3 } from 'three';
import type { Beat } from './beats';

export const cubicInOut = (t: number) => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

export function CameraRig({ beat, time, act, interactive = act, zoom = 0, reduced = false }: {
  beat: Beat; time: number; act: boolean; interactive?: boolean; zoom?: number | undefined; reduced?: boolean | undefined;
}) {
  const { gl } = useThree();
  const orbit = useRef({ down: false, x: 0, y: 0, yaw: 0, pitch: 0, vx: 0, vy: 0, distance: 1, released: 0 });
  const vectors = useMemo(() => ({ position: new Vector3(), target: new Vector3(), offset: new Vector3(), sphere: new Spherical() }), []);
  useEffect(() => {
    if (!interactive) return;
    const element = gl.domElement, state = orbit.current;
    const down = (event: PointerEvent) => { if (event.button !== 0) return; state.down = true; state.x = event.clientX; state.y = event.clientY; element.setPointerCapture(event.pointerId); };
    const move = (event: PointerEvent) => {
      if (!state.down) return;
      state.vx = (event.clientX - state.x) * 0.004; state.vy = (event.clientY - state.y) * 0.004;
      state.x = event.clientX; state.y = event.clientY;
      state.yaw = Math.max(-0.61, Math.min(0.61, state.yaw + state.vx)); state.pitch = Math.max(-0.61, Math.min(0.61, state.pitch + state.vy));
    };
    const up = () => { state.down = false; state.released = performance.now(); };
    const wheel = (event: WheelEvent) => { event.preventDefault(); state.distance = Math.max(0.7, Math.min(1.4, state.distance + event.deltaY * 0.001)); state.released = performance.now(); };
    element.addEventListener('pointerdown', down); element.addEventListener('pointermove', move);
    element.addEventListener('pointerup', up); element.addEventListener('pointercancel', up); element.addEventListener('wheel', wheel, { passive: false });
    element.addEventListener('lostpointercapture', up); window.addEventListener('blur', up);
    return () => {
      up();
      element.removeEventListener('pointerdown', down); element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerup', up); element.removeEventListener('pointercancel', up); element.removeEventListener('wheel', wheel);
      element.removeEventListener('lostpointercapture', up); window.removeEventListener('blur', up);
    };
  }, [gl, interactive]);
  useEffect(() => { Object.assign(orbit.current, { down: false, yaw: 0, pitch: 0, distance: 1, vx: 0, vy: 0 }); }, [beat]);
  useFrame(({ camera, size }, dt) => {
    const ms = time * 1000, keys = beat.camera;
    const end = keys.findIndex((key) => key.ms > ms);
    const a = act ? beat.playCamera : keys[Math.max(0, end < 0 ? keys.length - 1 : end - 1)]!;
    const b = act || end < 0 ? a : keys[end]!;
    const t = reduced || a === b ? 0 : cubicInOut(Math.max(0, Math.min(1, (ms - a.ms) / (b.ms - a.ms))));
    vectors.position.fromArray(a.position).lerp(vectors.offset.fromArray(b.position), t);
    vectors.target.fromArray(a.target).lerp(vectors.offset.fromArray(b.target), t);
    const state = orbit.current;
    if (!state.down) {
      state.vx *= Math.exp(-dt * 10); state.vy *= Math.exp(-dt * 10);
      state.yaw = Math.max(-0.61, Math.min(0.61, state.yaw + state.vx)); state.pitch = Math.max(-0.61, Math.min(0.61, state.pitch + state.vy));
      if (!interactive && performance.now() - state.released > 100) { state.yaw *= Math.exp(-dt * 8); state.pitch *= Math.exp(-dt * 8); }
    }
    vectors.offset.copy(vectors.position).sub(vectors.target);
    vectors.sphere.setFromVector3(vectors.offset);
    vectors.sphere.theta -= state.yaw; vectors.sphere.phi = Math.max(0.2, Math.min(Math.PI - 0.2, vectors.sphere.phi + state.pitch));
    vectors.sphere.radius *= state.distance * (size.width < 600 ? 1.35 : 1) * (1 - zoom * 0.7);
    vectors.position.copy(vectors.target).add(vectors.offset.setFromSpherical(vectors.sphere));
    camera.position.lerp(vectors.position, reduced ? 1 : 1 - Math.exp(-dt * 8)); camera.lookAt(vectors.target);
    if (camera instanceof PerspectiveCamera) { camera.fov = a.fov + (b.fov - a.fov) * t; camera.updateProjectionMatrix(); }
  });
  return null;
}
