import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, createPortal, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { PerspectiveCamera, Scene } from 'three';
import { CameraRig } from './kz/CameraRig';
import { BEATS } from './kz/beats';
import { Backdrop } from './kz/Backdrop';
import { Bokeh } from './kz/Bokeh';
import { Electron } from './kz/ElectronView';
import { Nucleus } from './kz/NucleusView';
import { ShellRing } from './kz/ShellRing';
import { Sparkles } from './kz/Sparkles';
import { KZ } from './kz/palette';
import type { ParticleKind } from './kz/Particle';
import type { ScreenAnchor } from './kz/useProjected';

export type SceneEpisode = 'zoom' | 'nucleus' | 'shells' | 'sodium' | 'bond' | 'cold-open' | 'stability' | 'isotopes' | 'recap';
export type ScenePhase = 'intro' | 'play' | 'act' | 'branch' | 'done';
export type SceneApi = {
  episode: SceneEpisode; phase: ScenePhase; t: number; branchKind: 'ok' | 'bad' | null;
  dragElectron: boolean; onNucleusTap: () => void;
  onShellDrop: (shell: 'k' | 'l' | 'm' | 'cl', ok: boolean) => void;
  targetShell: 'k' | 'l' | 'm' | 'cl' | null;
  beat?: number; protons?: number; neutrons?: number; electrons?: number; zoom?: number; reduced?: boolean;
  onParticleTap?: (kind: ParticleKind) => void; onAnchor?: (kind: ParticleKind, point: ScreenAnchor) => void;
};

function PerfGuard({ onSlow }: { onSlow: () => void }) {
  const { setDpr } = useThree();
  const sample = useRef({ seconds: 0, frames: 0, low: 0, dpr: false, effects: false });
  useFrame((_, dt) => {
    const s = sample.current;
    s.seconds += dt; s.frames++;
    if (s.seconds < 0.5) return;
    const fps = s.frames / s.seconds;
    s.low = fps < 45 ? s.low + s.seconds : 0;
    if (s.low >= 2 && !s.dpr) { setDpr(1); s.dpr = true; }
    if (s.low >= 2 && fps < 35 && !s.effects) { s.effects = true; onSlow(); }
    s.seconds = 0; s.frames = 0;
  });
  return null;
}

function Orbitals({ counts, radius = 1, reduced, onShell }: { counts: number[]; radius?: number; reduced?: boolean | undefined; onShell?: ((shell: 'k' | 'l' | 'm') => void) | undefined }) {
  return <>{counts.map((count, shell) => {
    const r = (1.65 + shell * 0.95) * radius;
    const label = (['k', 'l', 'm'] as const)[shell]!;
    return <group key={shell} rotation={[0.4 + shell * 0.18, shell % 2 ? -0.3 : 0.18, -0.12]}>
      <ShellRing radius={r} active={!!onShell} onTap={onShell && (() => onShell(label))} />
      {Array.from({ length: count }, (_, i) => <Electron key={i} radius={r} angle={i * Math.PI * 2 / count} speed={0.38 - shell * 0.08} reduced={reduced} />)}
    </group>;
  })}</>;
}

function Atom({ api, beat }: { api: SceneApi; beat: number }) {
  const p = api.protons ?? (beat === 3 ? 11 : 6);
  const n = api.neutrons ?? (beat === 2 ? 4 : beat === 3 ? 12 : 6);
  const stable = n === 6 || n === 7;
  const count = api.electrons ?? (beat === 3 ? 10 : 6);
  const shells = [Math.min(2, count), Math.min(8, Math.max(0, count - 2)), Math.max(0, count - 10)];
  const showShells = beat === 0 || beat === 3 || beat === 5 || (beat === 1 && api.phase === 'branch');
  return <group position={beat === 0 ? [0, -1.6, 0] : [0, 0, 0]}>
    <Nucleus p={p} n={n} radius={beat === 0 ? 0.34 : beat === 3 || beat === 5 ? 0.25 : 0.5}
      faces={3} mood={beat === 2 && !stable ? 'worried' : 'smile'} wobble={beat === 2 && !stable ? 0.1 : 0}
      reduced={api.reduced} onTap={(kind) => { api.onNucleusTap(); api.onParticleTap?.(kind); }} onProject={api.onAnchor} />
    {showShells && <Orbitals counts={shells} radius={beat === 0 ? 1.18 : 1} reduced={api.reduced}
      onShell={beat === 3 && api.phase === 'act' ? (shell) => api.onShellDrop(shell, shell === 'm') : undefined} />}
    {beat === 2 && <ShellRing radius={2.05} active />}
  </group>;
}

function IsotopePanels({ reduced }: { reduced?: boolean | undefined }) {
  const { gl, size } = useThree();
  const panels = useMemo(() => [KZ.coral, KZ.teal, KZ.lavender].map((color) => ({
    scene: new Scene(), camera: new PerspectiveCamera(36, 1, 0.1, 100), color,
  })), []);
  useFrame(() => {
    const previous = gl.autoClear;
    gl.autoClear = true; gl.setScissorTest(true);
    panels.forEach(({ scene, camera }, i) => {
      const left = Math.round(i * size.width / 3), right = Math.round((i + 1) * size.width / 3);
      camera.aspect = (right - left) / size.height; camera.position.set(0, 0, 11.5); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
      gl.setViewport(left, 0, right - left, size.height); gl.setScissor(left, 0, right - left, size.height);
      gl.render(scene, camera);
    });
    gl.setScissorTest(false); gl.setViewport(0, 0, size.width, size.height); gl.autoClear = previous;
  }, 1);
  return <>{panels.map(({ scene, color }, i) => createPortal(<>
    <Backdrop inner={color} outer={color} /><Bokeh count={8} color="#ffffff" />
    <Nucleus p={6} n={6 + i} radius={0.34} reduced={reduced} />
    <group rotation={[0.25, 0.15, 0]}><ShellRing radius={2.1} /><Electron radius={2.1} reduced={reduced} angle={i} /></group>
  </>, scene))}</>;
}

export function AtomForgeScene(api: SceneApi) {
  const [slow, setSlow] = useState(false);
  const beat = api.beat ?? ({ zoom: 0, nucleus: 1, shells: 2, sodium: 3, bond: 4, 'cold-open': 0, stability: 2, isotopes: 4, recap: 5 }[api.episode]);
  const inner = beat === 2 ? KZ.sunLift : beat === 3 ? KZ.azure : beat === 0 ? KZ.violet : KZ.violetLift;
  const outer = beat === 2 ? KZ.sun : beat === 3 ? '#006ec2' : beat === 0 ? KZ.violetDeep : KZ.violet;
  return <div className="afv-canvas" data-afv-canvas="1">
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 16], fov: 32 }} gl={{ antialias: true, alpha: false }}
      fallback={<p>Atom Forge needs a browser with WebGL.</p>}>
      <Suspense fallback={null}>
        <PerfGuard onSlow={() => setSlow(true)} />
        {beat === 4 ? <IsotopePanels reduced={api.reduced} /> : <>
          <CameraRig beat={BEATS[beat]!} time={api.t} act={api.phase === 'act'} zoom={api.zoom} reduced={api.reduced} />
          <Backdrop inner={inner} outer={outer} />
          <Bokeh count={slow ? 9 : 18} color={beat === 2 ? '#ffad13' : '#9967ee'} />
          <Bokeh count={slow ? 1 : 3} color={beat === 2 ? '#ff9800' : '#7d3ad5'} near />
          <Sparkles count={beat === 2 ? 20 : 42} />
          <Atom api={api} beat={beat} />
          <EffectComposer multisampling={0}>
            <Bloom luminanceThreshold={0.9} intensity={slow ? 0 : 0.5} mipmapBlur />
            <Vignette darkness={0.25} />
          </EffectComposer>
        </>}
      </Suspense>
    </Canvas>
  </div>;
}
