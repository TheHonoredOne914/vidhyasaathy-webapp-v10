import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as THREE from 'three';

export type SceneEpisode = 'zoom' | 'nucleus' | 'shells' | 'sodium' | 'bond';
export type ScenePhase = 'intro' | 'play' | 'act' | 'branch' | 'done';

export type SceneApi = {
  episode: SceneEpisode;
  phase: ScenePhase;
  t: number; // 0..1 within episode
  branchKind: 'ok' | 'bad' | null;
  dragElectron: boolean;
  onNucleusTap: () => void;
  onShellDrop: (shell: 'k' | 'l' | 'm' | 'cl', ok: boolean) => void;
  targetShell: 'k' | 'l' | 'm' | 'cl' | null;
};

const PAL = {
  bg: '#071428',
  deep: '#0a1a36',
  proton: '#ff5a3c',
  neutron: '#ffc857',
  electron: '#4ef0e0',
  electronHot: '#9bffb0',
  ring: '#3d7cff',
  ringHot: '#ffd54a',
  na: '#ff7a45',
  cl: '#5ad4ff',
  salt: '#f4f1de',
  trail: '#ffe566',
};

function flatMat(color: string, emissive = '#000000', intensity = 0.35) {
  return (
    <meshStandardMaterial
      color={color}
      emissive={emissive}
      emissiveIntensity={intensity}
      roughness={0.55}
      metalness={0.08}
      flatShading
    />
  );
}

function SaltGrain({ scale = 1, visible = true }: { scale?: number; visible?: boolean }) {
  const cubes = useMemo(() => {
    const out: [number, number, number, number][] = [];
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          if (Math.abs(x) + Math.abs(y) + Math.abs(z) === 0) continue;
          out.push([x * 0.42, y * 0.42, z * 0.42, 0.36 + ((x + y + z) % 3) * 0.04]);
        }
      }
    }
    return out;
  }, []);
  if (!visible) return null;
  return (
    <group scale={scale}>
      {cubes.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[s, s, s]} />
          {flatMat(i % 2 ? '#f7f3e8' : '#e8dff5', '#fff6d0', 0.15)}
        </mesh>
      ))}
    </group>
  );
}

function NucleusCluster({
  protons = 6,
  neutrons = 6,
  label = 'N',
  scale = 1,
  glow = 1,
  onTap,
  hot,
}: {
  protons?: number;
  neutrons?: number;
  label?: string;
  scale?: number;
  glow?: number;
  onTap?: () => void;
  hot?: boolean;
}) {
  void label;
  const pts = useMemo(() => {
    const balls: { p: [number, number, number]; kind: 'p' | 'n' }[] = [];
    const total = protons + neutrons;
    for (let i = 0; i < total; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.55 + (i % 3) * 0.08;
      balls.push({
        p: [r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)],
        kind: i < protons ? 'p' : 'n',
      });
    }
    return balls;
  }, [protons, neutrons]);

  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.35 * glow;
  });

  return (
    <group
      ref={ref}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onTap?.();
      }}
      onPointerOver={() => {
        if (hot) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      {pts.map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <sphereGeometry args={[0.28, 16, 16]} />
          {flatMat(b.kind === 'p' ? PAL.proton : PAL.neutron, b.kind === 'p' ? '#ff8a6a' : '#ffe08a', 0.55 * glow)}
        </mesh>
      ))}
      {hot && (
        <mesh scale={2.2}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={PAL.ringHot} transparent opacity={0.08 + glow * 0.06} />
        </mesh>
      )}
    </group>
  );
}

function OrbitalRing({
  radius,
  tilt = 0.4,
  color = PAL.ring,
  hot = false,
  filled = 0,
  capacity = 2,
}: {
  radius: number;
  tilt?: number;
  color?: string;
  hot?: boolean;
  filled?: number;
  capacity?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * (hot ? 0.6 : 0.15);
  });
  const glow = hot ? 1.2 : 0.35 + filled / Math.max(1, capacity);
  return (
    <group rotation={[tilt, 0.2, 0.1]}>
      <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, hot ? 0.045 : 0.028, 12, 64]} />
        {flatMat(hot ? PAL.ringHot : color, hot ? '#ffe9a0' : color, glow)}
      </mesh>
      {Array.from({ length: filled }).map((_, i) => {
        const a = (i / Math.max(1, filled)) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            {flatMat(PAL.electron, '#9ffff0', 0.9)}
          </mesh>
        );
      })}
    </group>
  );
}

function DraggableElectron({
  enabled,
  home,
  targetShell,
  onDrop,
  wobble,
}: {
  enabled: boolean;
  home: [number, number, number];
  targetShell: 'k' | 'l' | 'm' | 'cl' | null;
  onDrop: (shell: 'k' | 'l' | 'm' | 'cl', ok: boolean) => void;
  wobble: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const dragging = useRef(false);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  const pos = useRef(new THREE.Vector3(...home));
  const wobbleT = useRef(0);

  useEffect(() => {
    pos.current.set(...home);
    if (ref.current) ref.current.position.copy(pos.current);
  }, [home, enabled]);

  useEffect(() => {
    if (wobble) wobbleT.current = 1.2;
  }, [wobble]);

  const shellCenters: Record<string, { c: THREE.Vector3; r: number }> = useMemo(
    () => ({
      k: { c: new THREE.Vector3(0, 0, 0), r: 1.35 },
      l: { c: new THREE.Vector3(0, 0, 0), r: 2.15 },
      m: { c: new THREE.Vector3(0, 0, 0), r: 3.0 },
      cl: { c: new THREE.Vector3(3.2, 0, 0), r: 0.9 },
    }),
    [],
  );

  const project = (e: PointerEvent | THREE.Event) => {
    const ce = 'clientX' in e ? e : (e as unknown as { clientX: number; clientY: number });
    const rect = gl.domElement.getBoundingClientRect();
    pointer.x = ((ce.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((ce.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    plane.normal.copy(camera.getWorldDirection(new THREE.Vector3()).negate());
    plane.constant = 0;
    raycaster.ray.intersectPlane(plane, hit);
    return hit.clone();
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    if (wobbleT.current > 0) {
      wobbleT.current -= dt;
      const w = Math.sin(wobbleT.current * 40) * 0.18 * Math.max(0, wobbleT.current);
      ref.current.position.set(pos.current.x + w, pos.current.y - w * 0.4, pos.current.z);
      return;
    }
    if (!dragging.current) {
      ref.current.position.lerp(pos.current, 0.15);
      ref.current.rotation.y += dt * 2;
    }
  });

  if (!enabled) return null;

  return (
    <mesh
      ref={ref}
      position={home}
      castShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as HTMLElement).setPointerCapture?.((e as unknown as PointerEvent).pointerId);
        dragging.current = true;
        document.body.style.cursor = 'grabbing';
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !ref.current) return;
        e.stopPropagation();
        const p = project(e as unknown as PointerEvent);
        if (p) {
          ref.current.position.set(p.x, p.y, p.z);
          pos.current.copy(ref.current.position);
        }
      }}
      onPointerUp={(e) => {
        if (!dragging.current || !ref.current) return;
        e.stopPropagation();
        dragging.current = false;
        document.body.style.cursor = 'auto';
        const p = ref.current.position;
        let best: { shell: 'k' | 'l' | 'm' | 'cl'; score: number } | null = null;
        (Object.keys(shellCenters) as Array<'k' | 'l' | 'm' | 'cl'>).forEach((shell) => {
          const { c, r } = shellCenters[shell]!;
          const d = Math.abs(p.distanceTo(c) - r);
          const radial = p.distanceTo(c);
          const score = shell === 'cl' ? p.distanceTo(c) : d + Math.abs(radial - r) * 0.2;
          if (!best || score < best.score) best = { shell, score };
        });
        const pick = best as { shell: 'k' | 'l' | 'm' | 'cl'; score: number } | null;
        const ok = Boolean(pick && targetShell && pick.shell === targetShell && pick.score < (targetShell === 'cl' ? 1.1 : 0.55));
        if (pick) onDrop(pick.shell, ok);
        if (!ok) {
          pos.current.set(...home);
          wobbleT.current = 1.1;
        }
      }}
    >
      <sphereGeometry args={[0.22, 20, 20]} />
      {flatMat(PAL.electronHot, '#b8ffe8', 1.4)}
      <pointLight color={PAL.electron} intensity={1.2} distance={3} />
    </mesh>
  );
}

function ElectronTrail({ from, to, active }: { from: THREE.Vector3; to: THREE.Vector3; active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!active || !ref.current) return;
    t.current = Math.min(1, t.current + dt * 0.85);
    ref.current.position.lerpVectors(from, to, t.current);
  });
  useEffect(() => {
    t.current = 0;
  }, [active, from, to]);
  if (!active) return null;
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.18, 16, 16]} />
      {flatMat(PAL.trail, '#fff3a0', 2)}
      <pointLight color={PAL.trail} intensity={2} distance={4} />
    </mesh>
  );
}

function SaltLattice({ progress }: { progress: number }) {
  const cells = useMemo(() => {
    const out: { p: [number, number, number]; kind: 'na' | 'cl' }[] = [];
    for (let x = -1; x <= 1; x += 1) {
      for (let y = -1; y <= 1; y += 1) {
        for (let z = -1; z <= 1; z += 1) {
          out.push({ p: [x * 0.85, y * 0.85, z * 0.85], kind: (x + y + z) % 2 === 0 ? 'na' : 'cl' });
        }
      }
    }
    return out;
  }, []);
  const s = Math.max(0.01, progress);
  return (
    <group scale={s}>
      {cells.map((c, i) => (
        <mesh key={i} position={c.p}>
          <sphereGeometry args={[0.28, 16, 16]} />
          {flatMat(c.kind === 'na' ? PAL.na : PAL.cl, c.kind === 'na' ? '#ffb08a' : '#a8ecff', 0.7)}
        </mesh>
      ))}
    </group>
  );
}

function CameraRig({
  episode,
  t,
  phase,
}: {
  episode: SceneEpisode;
  t: number;
  phase: ScenePhase;
}) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const pos = useRef(new THREE.Vector3(0, 1.2, 8));

  useFrame((_, dt) => {
    let desire = new THREE.Vector3(0, 1.1, 7.2);
    let look = new THREE.Vector3(0, 0, 0);
    if (episode === 'zoom') {
      const z = THREE.MathUtils.lerp(14, 6.5, Math.min(1, t * 1.2));
      desire.set(Math.sin(t * 1.2) * 1.5, 1.4 - t * 0.3, z);
      look.set(0, 0, 0);
    } else if (episode === 'nucleus') {
      desire.set(Math.cos(t * Math.PI * 2) * 4.2, 1.6, 5.2 + Math.sin(t * Math.PI) * 0.4);
      look.set(0, 0.2, 0);
    } else if (episode === 'shells') {
      desire.set(3.2, 2.4, 6.4);
      look.set(0, 0, 0);
    } else if (episode === 'sodium') {
      desire.set(-2.8, 2.0, 7.0);
      look.set(0, 0, 0);
    } else if (episode === 'bond') {
      const orbit = t * Math.PI * 1.4;
      desire.set(Math.cos(orbit) * 7.5, 2.2 + t, 4.5 + Math.sin(orbit) * 3.5);
      look.set(1.2, 0, 0);
      if (t > 0.72) {
        desire.set(0, 3.5, 9);
        look.set(0, 0, 0);
      }
    }
    if (phase === 'act') desire.y += 0.25;
    pos.current.lerp(desire, 1 - Math.exp(-dt * 2.4));
    target.current.lerp(look, 1 - Math.exp(-dt * 2.2));
    camera.position.copy(pos.current);
    camera.lookAt(target.current);
  });
  return null;
}

function World({ api }: { api: SceneApi }) {
  const { episode, phase, t, branchKind, dragElectron, onNucleusTap, onShellDrop, targetShell } = api;
  const showSaltZoom = episode === 'zoom';
  const saltScale = showSaltZoom ? THREE.MathUtils.lerp(2.4, 0.05, Math.min(1, t * 1.15)) : 0;
  const atomAppear = showSaltZoom ? (phase === 'act' || phase === 'branch' ? 1 : Math.max(0, (t - 0.45) / 0.55)) : 1;
  const lattice = episode === 'bond' ? Math.max(0, (t - 0.7) / 0.3) : 0;
  const trailOn = episode === 'bond' && t > 0.42 && t < 0.72 && phase !== 'act';
  const kFill = episode === 'shells' ? ((t > 0.55 || (phase === 'branch' && branchKind === 'ok')) ? 2 : phase === 'act' ? 1 : 0) : episode === 'sodium' || episode === 'bond' ? 2 : 0;
  const lFill = episode === 'sodium' || episode === 'bond' ? (t > 0.35 ? 8 : 4) : episode === 'shells' && t > 0.7 ? 2 : 0;
  const mFill = episode === 'sodium' && ((phase === 'branch' && branchKind === 'ok') || t > 0.85) ? 1 : episode === 'bond' ? 0 : 0;
  const showCl = episode === 'bond';
  const naShift = episode === 'bond' ? -2.4 : 0;

  return (
    <>
      <color attach="background" args={[PAL.bg]} />
      <fog attach="fog" args={[PAL.bg, 12, 28]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 4]} intensity={1.15} color="#fff1d6" />
      <pointLight position={[-4, 2, -2]} intensity={0.7} color="#6aa8ff" />

      <Stars radius={60} depth={30} count={1200} factor={3} saturation={0.6} fade speed={0.4} />
      <Sparkles count={48} scale={12} size={3} speed={0.35} color="#9ad7ff" opacity={0.55} />

      <CameraRig episode={episode} t={t} phase={phase} />

      {showSaltZoom && <SaltGrain scale={Math.max(0.001, saltScale)} visible={saltScale > 0.08} />}

      <group position={[naShift, 0, 0]} scale={atomAppear}>
        {(episode === 'zoom' || episode === 'nucleus' || episode === 'shells' || episode === 'sodium' || episode === 'bond') && (
          <NucleusCluster
            protons={episode === 'sodium' || episode === 'bond' ? 11 : 6}
            neutrons={episode === 'sodium' || episode === 'bond' ? 12 : 6}
            label={episode === 'sodium' || episode === 'bond' ? 'Na' : 'N'}
            glow={phase === 'act' && targetShell === null ? 1.4 : 1}
            hot={phase === 'act' && (episode === 'nucleus' || episode === 'zoom')}
            onTap={phase === 'act' && (episode === 'nucleus' || episode === 'zoom') ? onNucleusTap : undefined}
            scale={episode === 'nucleus' ? 1.15 : 1}
          />
        )}

        {(episode === 'shells' || episode === 'sodium' || episode === 'bond' || (episode === 'zoom' && t > 0.6)) && (
          <>
            <OrbitalRing radius={1.35} tilt={0.55} hot={phase === 'act' && targetShell === 'k'} filled={Math.min(2, kFill)} capacity={2} />
            <OrbitalRing radius={2.15} tilt={-0.35} color="#7b6cff" hot={phase === 'act' && targetShell === 'l'} filled={Math.min(8, lFill)} capacity={8} />
            {(episode === 'sodium' || episode === 'bond') && (
              <OrbitalRing radius={3.0} tilt={0.25} color="#ff8f6b" hot={phase === 'act' && targetShell === 'm'} filled={mFill} capacity={1} />
            )}
          </>
        )}
      </group>

      {showCl && (
        <group position={[3.2, 0, 0]}>
          <NucleusCluster protons={17} neutrons={18} label="Cl" scale={0.95} glow={1} />
          <OrbitalRing radius={1.2} tilt={0.4} filled={2} capacity={2} />
          <OrbitalRing radius={1.9} tilt={-0.25} color="#7b6cff" filled={8} capacity={8} />
          <OrbitalRing
            radius={2.6}
            tilt={0.15}
            color="#5ad4ff"
            hot={phase === 'act' && targetShell === 'cl'}
            filled={(phase === 'branch' && branchKind === 'ok') || t > 0.55 ? 8 : 7}
            capacity={8}
          />
        </group>
      )}

      <DraggableElectron
        enabled={dragElectron && phase === 'act'}
        home={targetShell === 'cl' ? [-0.2, 1.6, 2.2] : [-2.6, -1.4, 1.2]}
        targetShell={targetShell}
        onDrop={onShellDrop}
        wobble={branchKind === 'bad'}
      />

      <ElectronTrail
        from={new THREE.Vector3(-2.2, 0.6, 0.4)}
        to={new THREE.Vector3(3.0, 0.4, 0.2)}
        active={trailOn || (episode === 'bond' && branchKind === 'ok')}
      />

      {lattice > 0.02 && (
        <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.3}>
          <SaltLattice progress={lattice} />
        </Float>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.8, 0]} receiveShadow>
        <circleGeometry args={[10, 48]} />
        <meshStandardMaterial color={PAL.deep} roughness={1} metalness={0} transparent opacity={0.5} />
      </mesh>
    </>
  );
}

function PerfGuard({ children }: { children: ReactNode }) {
  const [bloom, setBloom] = useState(true);
  const frames = useRef<number[]>([]);
  useFrame((_, dt) => {
    const fps = 1 / Math.max(0.0001, dt);
    frames.current.push(fps);
    if (frames.current.length > 45) {
      frames.current.shift();
      const avg = frames.current.reduce((a, b) => a + b, 0) / frames.current.length;
      if (avg < 40 && bloom) setBloom(false);
      if (avg > 55 && !bloom) setBloom(true);
    }
  });
  return (
    <>
      {children}
      {bloom && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.85} luminanceThreshold={0.35} luminanceSmoothing={0.4} mipmapBlur />
        </EffectComposer>
      )}
    </>
  );
}

export function AtomForgeScene({ api }: { api: SceneApi }) {
  return (
    <div className="afv-canvas" data-afv-canvas="1">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={{ position: [0, 1.2, 8], fov: 42, near: 0.1, far: 80 }}
        frameloop="always"
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(PAL.bg));
        }}
      >
        <Suspense fallback={null}>
          <PerfGuard>
            <World api={api} />
          </PerfGuard>
        </Suspense>
      </Canvas>
    </div>
  );
}

export default AtomForgeScene;
