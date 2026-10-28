import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, DepthOfField } from '@react-three/postprocessing';
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';

export type SceneEpisode = 'zoom' | 'nucleus' | 'shells' | 'sodium' | 'bond';
export type ScenePhase = 'intro' | 'play' | 'act' | 'branch' | 'done';

export type SceneApi = {
  episode: SceneEpisode;
  phase: ScenePhase;
  t: number;
  branchKind: 'ok' | 'bad' | null;
  dragElectron: boolean;
  onNucleusTap: () => void;
  onShellDrop: (shell: 'k' | 'l' | 'm' | 'cl', ok: boolean) => void;
  targetShell: 'k' | 'l' | 'm' | 'cl' | null;
};

const SKY: Record<SceneEpisode, [string, string, string]> = {
  zoom: ['#3a1568', '#1a2a78', '#0e4a8a'],
  nucleus: ['#5a1248', '#2a1868', '#123a78'],
  shells: ['#142868', '#1a3a88', '#0e5a9a'],
  sodium: ['#3a2060', '#243878', '#145088'],
  bond: ['#2a1858', '#283878', '#145a90'],
};

function useFresnelMat(base: string, rim: string, glow = 0.85) {
  return useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(base) },
        uRim: { value: new THREE.Color(rim) },
        uGlow: { value: glow },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform vec3 uRim; uniform float uGlow; uniform float uTime;
        varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 1.8);
          float pulse = 0.92 + 0.08 * sin(uTime * 2.5);
          vec3 col = mix(uColor * pulse, uRim, f * 1.15);
          col += uRim * f * uGlow * 0.95;
          col = mix(col, vec3(1.0), f * 0.22);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    return mat;
  }, [base, rim, glow]);
}


function Billboard({ children, offset = [0, 0, 0] as [number, number, number] }: { children: ReactNode; offset?: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  useFrame(() => {
    if (ref.current) ref.current.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={ref} position={offset}>
      {children}
    </group>
  );
}

function CuteFace({ scale = 1, mood = 'happy' }: { scale?: number; mood?: 'happy' | 'wow' }) {
  const eyeY = 0.12 * scale;
  const eyeX = 0.16 * scale;
  const eyeR = 0.055 * scale;
  return (
    <group>
      <mesh position={[-eyeX, eyeY, 0.02]}>
        <sphereGeometry args={[eyeR, 10, 10]} />
        <meshBasicMaterial color="#1a1030" />
      </mesh>
      <mesh position={[eyeX, eyeY, 0.02]}>
        <sphereGeometry args={[eyeR, 10, 10]} />
        <meshBasicMaterial color="#1a1030" />
      </mesh>
      <mesh position={[-eyeX + 0.015 * scale, eyeY + 0.015 * scale, eyeR * 0.7]}>
        <sphereGeometry args={[eyeR * 0.28, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[eyeX + 0.015 * scale, eyeY + 0.015 * scale, eyeR * 0.7]}>
        <sphereGeometry args={[eyeR * 0.28, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {mood === 'happy' ? (
        <mesh position={[0, -0.1 * scale, 0.02]}>
          <ringGeometry args={[0.06 * scale, 0.09 * scale, 16, 1, Math.PI, Math.PI]} />
          <meshBasicMaterial color="#1a1030" side={THREE.DoubleSide} />
        </mesh>
      ) : (
        <mesh position={[0, -0.06 * scale, 0.02]}>
          <circleGeometry args={[0.045 * scale, 12]} />
          <meshBasicMaterial color="#1a1030" />
        </mesh>
      )}
    </group>
  );
}

function PlusDecal({ scale = 1 }: { scale?: number }) {
  const w = 0.07 * scale;
  const h = 0.22 * scale;
  return (
    <group>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color="#fff6e0" transparent opacity={0.95} depthTest={false} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[h, w]} />
        <meshBasicMaterial color="#fff6e0" transparent opacity={0.95} depthTest={false} />
      </mesh>
    </group>
  );
}

function ParticleBall({
  color,
  rim,
  radius = 0.32,
  face,
  plus,
  glow = 0.6,
}: {
  color: string;
  rim: string;
  radius?: number;
  face?: boolean;
  plus?: boolean;
  glow?: number;
}) {
  const mat = useFresnelMat(color, rim, glow);
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (mat.uniforms.uTime) mat.uniforms.uTime.value = state.clock.elapsedTime;
  });
  return (
    <group>
      <mesh ref={ref} castShadow>
        <sphereGeometry args={[radius, 28, 28]} />
        <primitive object={mat} attach="material" />
      </mesh>
      {plus && (
        <Billboard offset={[0, 0, radius * 1.02]}>
          <PlusDecal scale={radius / 0.32} />
        </Billboard>
      )}
      {face && (
        <Billboard offset={[0, 0, radius * 1.05]}>
          <CuteFace scale={radius / 0.32} />
        </Billboard>
      )}
      <pointLight color={rim} intensity={0.85 * glow} distance={3.2} decay={2} />
    </group>
  );
}

function SaathyCloud({ episode }: { episode: SceneEpisode }) {
  const ref = useRef<THREE.Group>(null);
  const local = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const cam = state.camera;
    const corner = episode === 'bond' ? -2.95 : 2.95;
    local.set(corner + Math.sin(t * 0.55) * 0.12, 0.95 + Math.sin(t * 0.8) * 0.1, -6.2);
    ref.current.position.copy(local.applyMatrix4(cam.matrixWorld));
    ref.current.quaternion.copy(cam.quaternion);
    ref.current.rotateY(Math.sin(t * 0.4) * 0.25);
  });
  const puff = (x: number, y: number, z: number, s: number) => (
    <mesh position={[x, y, z]}>
      <sphereGeometry args={[s, 16, 16]} />
      <meshStandardMaterial color="#fff8ef" emissive="#ffe9c8" emissiveIntensity={0.35} roughness={0.8} flatShading />
    </mesh>
  );
  return (
    <group ref={ref} scale={0.62}>
      {puff(0, 0, 0, 0.55)}
      {puff(0.45, 0.05, 0.1, 0.42)}
      {puff(-0.4, 0.08, -0.05, 0.4)}
      {puff(0.1, 0.35, 0.05, 0.36)}
      {puff(-0.05, -0.28, 0.15, 0.3)}
      <group position={[0.05, 0.08, 0.55]}>
        <CuteFace scale={1.35} mood="happy" />
      </group>
      <pointLight color="#fff0c8" intensity={0.8} distance={4} />
    </group>
  );
}

function ParallaxStars() {
  const far = useRef<THREE.Points>(null);
  const mid = useRef<THREE.Points>(null);
  const near = useRef<THREE.Points>(null);
  const mk = (n: number, spread: number, size: number) => {
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i += 1) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return { pos, size };
  };
  const a = useMemo(() => mk(500, 40, 0.06), []);
  const b = useMemo(() => mk(220, 28, 0.1), []);
  const c = useMemo(() => mk(80, 18, 0.16), []);
  useFrame((_, dt) => {
    if (far.current) far.current.rotation.y += dt * 0.012;
    if (mid.current) mid.current.rotation.y -= dt * 0.035;
    if (near.current) {
      near.current.rotation.y += dt * 0.06;
      near.current.rotation.x = Math.sin(performance.now() * 0.0002) * 0.04;
    }
  });
  const Points = ({
    data,
    color,
    refObj,
  }: {
    data: { pos: Float32Array; size: number };
    color: string;
    refObj: React.RefObject<THREE.Points | null>;
  }) => (
    <points ref={refObj}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={data.size} sizeAttenuation transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
  return (
    <group>
      <Points data={a} color="#9ec9ff" refObj={far} />
      <Points data={b} color="#ffd6a8" refObj={mid} />
      <Points data={c} color="#ffffff" refObj={near} />
    </group>
  );
}

function GradientSky({ episode }: { episode: SceneEpisode }) {
  const colors = SKY[episode];
  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTop: { value: new THREE.Color(colors[0]) },
        uMid: { value: new THREE.Color(colors[1]) },
        uBot: { value: new THREE.Color(colors[2]) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBot; varying vec3 vP;
        void main(){
          float h = normalize(vP).y * 0.5 + 0.5;
          vec3 col = mix(uBot, uMid, smoothstep(0.0, 0.55, h));
          col = mix(col, uTop, smoothstep(0.45, 1.0, h));
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
  }, [colors]);
  useEffect(() => {
    mat.uniforms.uTop.value.set(colors[0]);
    mat.uniforms.uMid.value.set(colors[1]);
    mat.uniforms.uBot.value.set(colors[2]);
  }, [colors, mat]);
  return (
    <mesh scale={40}>
      <sphereGeometry args={[1, 32, 32]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function SaltGrain({ scale = 1, spin = 0 }: { scale?: number; spin?: number }) {
  const ref = useRef<THREE.Group>(null);
  const cubes = useMemo(() => {
    const out: [number, number, number, number][] = [];
    for (let x = -2; x <= 2; x += 1) {
      for (let y = -2; y <= 2; y += 1) {
        for (let z = -2; z <= 2; z += 1) {
          if (Math.hypot(x, y, z) > 2.6) continue;
          out.push([x * 0.55, y * 0.55, z * 0.55, 0.48]);
        }
      }
    }
    return out;
  }, []);
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * (0.35 + spin);
      ref.current.rotation.x += dt * 0.12;
    }
  });
  return (
    <group ref={ref} scale={scale}>
      {cubes.map(([x, y, z, s], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <boxGeometry args={[s, s, s]} />
          <meshStandardMaterial
            color={i % 2 ? '#fff6e8' : '#e4d7ff'}
            emissive={i % 3 === 0 ? '#ffe6a8' : '#c8b6ff'}
            emissiveIntensity={0.25}
            roughness={0.45}
            flatShading
          />
        </mesh>
      ))}
      <Sparkles count={30} scale={4} size={4} speed={0.5} color="#ffe9a8" />
    </group>
  );
}

function NucleusCluster({
  protons = 6,
  neutrons = 6,
  scale = 1,
  hot = false,
  onTap,
  jiggle = 1,
}: {
  protons?: number;
  neutrons?: number;
  scale?: number;
  hot?: boolean;
  onTap?: (() => void) | undefined;
  jiggle?: number;
}) {
  const pts = useMemo(() => {
    const balls: { p: THREE.Vector3; kind: 'p' | 'n'; phase: number }[] = [];
    const total = protons + neutrons;
    for (let i = 0; i < total; i += 1) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / total);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 0.62 + (i % 3) * 0.07;
      balls.push({
        p: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        ),
        kind: i < protons ? 'p' : 'n',
        phase: i * 0.7,
      });
    }
    return balls;
  }, [protons, neutrons]);
  const root = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!root.current) return;
    const t = state.clock.elapsedTime;
    root.current.rotation.y = t * 0.4;
    root.current.rotation.x = Math.sin(t * 0.7) * 0.08 * jiggle;
    root.current.children.forEach((ch, i) => {
      const b = pts[i];
      if (!b || !(ch instanceof THREE.Group)) return;
      const wob = 1 + Math.sin(t * 2.2 + b.phase) * 0.045 * jiggle;
      ch.position.copy(b.p).multiplyScalar(wob);
    });
  });
  return (
    <group
      ref={root}
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
        <group key={i} position={b.p.toArray()}>
          <ParticleBall
            color={b.kind === 'p' ? '#ff5a3c' : '#ffc857'}
            rim={b.kind === 'p' ? '#ffb199' : '#ffe9a8'}
            radius={0.34}
            face={b.kind === 'p' ? i % 2 === 0 : i % 4 === 0}
            plus={b.kind === 'p'}
            glow={hot ? 1.45 : 1.05}
          />
        </group>
      ))}
      {hot && (
        <mesh scale={2.6}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshBasicMaterial color="#ffd54a" transparent opacity={0.07} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

function RibbonTrail({ color = '#4ef0e0' }: { color?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 20; i += 1) {
      const a = (i / 20) * Math.PI * 1.2;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.4, Math.sin(a * 2) * 0.15, -i * 0.08));
    }
    return new THREE.CatmullRomCurve3(pts);
  }, []);
  const geom = useMemo(() => new THREE.TubeGeometry(curve, 40, 0.035, 6, false), [curve]);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 2.5;
  });
  return (
    <mesh ref={ref} geometry={geom}>
      <meshBasicMaterial color={color} transparent opacity={0.75} />
    </mesh>
  );
}

function OrbitalRing({
  radius,
  tilt = 0.4,
  color = '#3d7cff',
  hot = false,
  filled = 0,
  capacity = 2,
  spin = 1,
}: {
  radius: number;
  tilt?: number;
  color?: string;
  hot?: boolean;
  filled?: number;
  capacity?: number;
  spin?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * spin * (hot ? 0.9 : 0.35);
  });
  return (
    <group rotation={[tilt, 0.25, 0.05]}>
      <group ref={ref}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, hot ? 0.055 : 0.032, 16, 96]} />
          <meshStandardMaterial
            color={hot ? '#ffd54a' : color}
            emissive={hot ? '#ffe08a' : color}
            emissiveIntensity={hot ? 1.2 : 0.55}
            roughness={0.35}
            flatShading
          />
        </mesh>
        {Array.from({ length: Math.min(filled, capacity) }).map((_, i) => {
          const a = (i / Math.max(capacity, 1)) * Math.PI * 2 + i;
          return (
            <group key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]}>
              <ParticleBall color="#4ef0e0" rim="#b8fff0" radius={0.18} face={i === 0} glow={1} />
              <RibbonTrail color="#7dffe8" />
            </group>
          );
        })}
      </group>
    </group>
  );
}

function DraggableElectron({
  enabled,
  home,
  targetShell,
  onDrop,
  wobble,
  center,
  ringScale,
}: {
  center: [number, number, number];
  ringScale: number;
  enabled: boolean;
  home: [number, number, number];
  targetShell: 'k' | 'l' | 'm' | 'cl' | null;
  onDrop: (shell: 'k' | 'l' | 'm' | 'cl', ok: boolean) => void;
  wobble: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
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
  }, [home, enabled]);
  useEffect(() => {
    if (wobble) wobbleT.current = 1.15;
  }, [wobble]);

  const shellCenters = useMemo(
    () => ({
      k: { c: new THREE.Vector3(...center), r: 1.55 * ringScale },
      l: { c: new THREE.Vector3(...center), r: 2.4 * ringScale },
      m: { c: new THREE.Vector3(...center), r: 3.3 * ringScale },
      cl: { c: new THREE.Vector3(3.6, 0, 0), r: 1.0 },
    }),
    [center, ringScale],
  );

  const project = (e: { clientX: number; clientY: number }) => {
    const rect = gl.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const anchor = shellCenters[targetShell ?? 'k'].c;
    plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), anchor);
    raycaster.ray.intersectPlane(plane, hit);
    return hit.clone();
  };

  useFrame((_, dt) => {
    if (!ref.current) return;
    if (wobbleT.current > 0) {
      wobbleT.current -= dt;
      const w = Math.sin(wobbleT.current * 42) * 0.22 * Math.max(0, wobbleT.current);
      ref.current.position.set(pos.current.x + w, pos.current.y - w * 0.5, pos.current.z);
      return;
    }
    if (!dragging.current) ref.current.position.lerp(pos.current, 0.18);
    ref.current.rotation.y += dt * 2.4;
    // expose screen positions (electron + drop target) for automated play tests
    const rect = gl.domElement.getBoundingClientRect();
    const toScreen = (v: THREE.Vector3) => {
      const p = v.clone().project(camera);
      return `${Math.round(rect.left + ((p.x + 1) / 2) * rect.width)},${Math.round(rect.top + ((1 - p.y) / 2) * rect.height)}`;
    };
    gl.domElement.dataset.afvEl = toScreen(ref.current.getWorldPosition(new THREE.Vector3()));
    if (targetShell) {
      const sc = shellCenters[targetShell];
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const tgt = targetShell === 'cl' ? sc.c.clone() : sc.c.clone().add(right.multiplyScalar(-sc.r));
      gl.domElement.dataset.afvTarget = toScreen(tgt);
    }
  });

  if (!enabled) return null;
  return (
    <group
      ref={ref}
      position={home}
      onPointerDown={(e) => {
        e.stopPropagation();
        (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
        dragging.current = true;
        document.body.style.cursor = 'grabbing';
      }}
      onPointerMove={(e) => {
        if (!dragging.current || !ref.current) return;
        e.stopPropagation();
        const p = project(e as unknown as PointerEvent);
        ref.current.position.copy(p);
        pos.current.copy(p);
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
          const score = shell === 'cl' ? p.distanceTo(c) : Math.abs(p.distanceTo(c) - r);
          if (!best || score < best.score) best = { shell, score };
        });
        const pick = best!;
        const ok = Boolean(targetShell && pick.shell === targetShell && pick.score < (targetShell === 'cl' ? 1.6 : 0.85));
        onDrop(pick.shell, ok);
        if (!ok) {
          pos.current.set(...home);
          wobbleT.current = 1.1;
        }
      }}
    >
      <ParticleBall color="#9bffb0" rim="#e9ffe8" radius={0.26} face glow={1.4} />
      <RibbonTrail color="#ffe566" />
      <pointLight color="#9bffb0" intensity={1.6} distance={3.5} />
    </group>
  );
}

function ElectronTrailLeap({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useEffect(() => {
    t.current = 0;
  }, [active]);
  useFrame((_, dt) => {
    if (!active || !ref.current) return;
    t.current = Math.min(1, t.current + dt * 0.7);
    const p = t.current;
    ref.current.position.set(
      THREE.MathUtils.lerp(-2.4, 3.4, p),
      Math.sin(p * Math.PI) * 1.4,
      Math.sin(p * Math.PI * 2) * 0.4,
    );
  });
  if (!active) return null;
  return (
    <group ref={ref}>
      <ParticleBall color="#ffe566" rim="#fff6c0" radius={0.22} face glow={1.6} />
      <RibbonTrail color="#ffe566" />
      <pointLight color="#ffe566" intensity={2.2} distance={5} />
    </group>
  );
}

function SaltLattice({ progress }: { progress: number }) {
  const cells = useMemo(() => {
    const out: { p: [number, number, number]; kind: 'na' | 'cl' }[] = [];
    for (let x = -1; x <= 1; x += 1)
      for (let y = -1; y <= 1; y += 1)
        for (let z = -1; z <= 1; z += 1)
          out.push({ p: [x * 0.95, y * 0.95, z * 0.95], kind: (x + y + z) % 2 === 0 ? 'na' : 'cl' });
    return out;
  }, []);
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.25;
  });
  return (
    <group ref={ref} scale={Math.max(0.01, progress) * 1.35}>
      {cells.map((c, i) => (
        <group key={i} position={c.p}>
          <ParticleBall
            color={c.kind === 'na' ? '#ff7a45' : '#5ad4ff'}
            rim={c.kind === 'na' ? '#ffd0b0' : '#c8f0ff'}
            radius={0.32}
            face={i === 13}
            glow={0.9}
          />
        </group>
      ))}
    </group>
  );
}

function CameraRig({
  episode,
  t,
  phase,
  epKey,
}: {
  episode: SceneEpisode;
  t: number;
  phase: ScenePhase;
  epKey: string;
}) {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(0, 1.4, 9));
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const whip = useRef(0);
  const lastEp = useRef(epKey);

  useEffect(() => {
    if (lastEp.current !== epKey) {
      whip.current = 1;
      lastEp.current = epKey;
    }
  }, [epKey]);

  useFrame((state, dt) => {
    const time = state.clock.elapsedTime;
    whip.current = Math.max(0, whip.current - dt * 1.6);
    const breathe = Math.sin(time * 0.7) * 0.35;
    const orbit = time * 0.22;

    let desire = new THREE.Vector3(0, 1.3, 7.5);
    let target = new THREE.Vector3(0, 0.1, 0);

    if (episode === 'zoom') {
      const z = THREE.MathUtils.lerp(11, 5.2, Math.min(1, t * 1.15));
      desire.set(Math.sin(orbit) * 1.8, 1.6 + breathe * 0.3, z);
    } else if (episode === 'nucleus') {
      desire.set(Math.cos(orbit * 1.15) * 1.6, 1.2 + Math.sin(time * 0.85) * 0.3, 6.6 + Math.sin(orbit) * 0.4);
      target.set(0, 0.08, 0);
    } else if (episode === 'shells') {
      desire.set(3.6 + Math.sin(time * 0.5) * 0.5, 2.3 + breathe, 5.8);
    } else if (episode === 'sodium') {
      desire.set(-3.2 + Math.cos(time * 0.4) * 0.4, 2.1, 6.4 + Math.sin(time * 0.35) * 0.5);
    } else if (episode === 'bond') {
      const a = orbit * 1.3;
      desire.set(Math.cos(a) * 7.2, 2.4 + breathe, 4.2 + Math.sin(a) * 3.2);
      target.set(1.4, 0.1, 0);
      if (t > 0.7) {
        desire.set(Math.sin(time * 0.3) * 1.2, 3.6, 8.5);
        target.set(0, 0, 0);
      }
    }
    if (phase === 'act') desire.multiplyScalar(0.92).add(new THREE.Vector3(0, 0.2, 0));

    // whip zoom punch
    if (whip.current > 0) {
      desire.multiplyScalar(1 + whip.current * 0.85);
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = THREE.MathUtils.lerp(cam.fov, 38 + whip.current * 22, 0.2);
      cam.updateProjectionMatrix();
    } else {
      const cam = camera as THREE.PerspectiveCamera;
      cam.fov = THREE.MathUtils.lerp(cam.fov, 40, 0.08);
      cam.updateProjectionMatrix();
    }

    pos.current.lerp(desire, 1 - Math.exp(-dt * 2.6));
    look.current.lerp(target, 1 - Math.exp(-dt * 2.4));
    // perpetual micro-move so camera never rests
    camera.position.copy(pos.current).add(new THREE.Vector3(Math.sin(time * 1.3) * 0.05, Math.cos(time * 1.1) * 0.04, 0));
    camera.lookAt(look.current);
  });
  return null;
}

function NebulaDust() {
  return (
    <>
      <Float speed={0.6} floatIntensity={0.6} rotationIntensity={0.2}>
        <mesh position={[-5, -1.5, -6]}>
          <sphereGeometry args={[2.2, 16, 16]} />
          <meshBasicMaterial color="#5b2d8e" transparent opacity={0.18} depthWrite={false} />
        </mesh>
      </Float>
      <Float speed={0.8} floatIntensity={0.5}>
        <mesh position={[5.5, 2.2, -7]}>
          <sphereGeometry args={[2.8, 16, 16]} />
          <meshBasicMaterial color="#1f6aa5" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      </Float>
      <Float speed={0.5} floatIntensity={0.4}>
        <mesh position={[0.5, -2.8, -5]}>
          <sphereGeometry args={[1.8, 16, 16]} />
          <meshBasicMaterial color="#a3456a" transparent opacity={0.14} depthWrite={false} />
        </mesh>
      </Float>
    </>
  );
}

function World({ api }: { api: SceneApi }) {
  const { episode, phase, t, branchKind, dragElectron, onNucleusTap, onShellDrop, targetShell } = api;
  const showSalt = episode === 'zoom' && t < 0.72 && phase !== 'act' && phase !== 'branch';
  const saltScale = showSalt ? THREE.MathUtils.lerp(3.2, 0.08, Math.min(1, t * 1.25)) : 0;
  const atomAppear =
    episode !== 'zoom' ? 1 : phase === 'act' || phase === 'branch' ? 1 : THREE.MathUtils.smoothstep(t, 0.38, 0.72);
  const atomScale = atomAppear;
  const lattice = episode === 'bond' ? Math.max(0, (t - 0.68) / 0.32) : 0;
  const trailOn = episode === 'bond' && ((t > 0.4 && t < 0.7) || branchKind === 'ok');
  const kFill =
    episode === 'shells'
      ? t > 0.55 || (phase === 'branch' && branchKind === 'ok')
        ? 2
        : phase === 'act'
          ? 1
          : 0
      : episode === 'sodium' || episode === 'bond'
        ? 2
        : 0;
  const lFill = episode === 'sodium' || episode === 'bond' ? (t > 0.3 ? 8 : 3) : episode === 'shells' && t > 0.65 ? 3 : 0;
  const mFill =
    episode === 'sodium' && ((phase === 'branch' && branchKind === 'ok') || t > 0.85) ? 1 : episode === 'bond' ? 0 : 0;
  const naShift = episode === 'bond' ? -2.6 : 0;
  const atomGroupScale = episode === 'nucleus' ? 1.45 : episode === 'shells' ? 1.3 : episode === 'bond' ? 1.0 : 1.15;
  const showAtom = episode !== 'zoom' || atomScale > 0.05 || phase === 'act' || phase === 'branch';

  return (
    <>
      <GradientSky episode={episode} />
      <fog attach="fog" args={[SKY[episode][1], 14, 36]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 7, 4]} intensity={1.55} color="#fff4dc" />
      <pointLight position={[-5, 2, -2]} intensity={0.9} color="#7aa8ff" />
      <pointLight position={[4, -2, 3]} intensity={0.55} color="#ff8ec8" />

      <ParallaxStars />
      <NebulaDust />
      <Sparkles count={70} scale={14} size={3.5} speed={0.45} color="#b8e0ff" opacity={0.65} />
      <SaathyCloud episode={episode} />
      <CameraRig episode={episode} t={t} phase={phase} epKey={episode} />

      {showSalt && <SaltGrain scale={Math.max(0.001, saltScale)} spin={t * 2} />}

      {showAtom && (
        <group position={[naShift, 0, 0]} scale={Math.max(0.001, atomScale) * atomGroupScale}>
          <NucleusCluster
            protons={episode === 'sodium' || episode === 'bond' ? 11 : 6}
            neutrons={episode === 'sodium' || episode === 'bond' ? 12 : 6}
            hot={phase === 'act' && (episode === 'nucleus' || episode === 'zoom')}
            onTap={phase === 'act' && (episode === 'nucleus' || episode === 'zoom') ? onNucleusTap : undefined}
            jiggle={1.2}
            scale={1}
          />
          {(episode === 'shells' || episode === 'sodium' || episode === 'bond' || (episode === 'zoom' && (t > 0.55 || phase !== 'play'))) && (
            <>
              <OrbitalRing radius={1.55} tilt={0.6} hot={phase === 'act' && targetShell === 'k'} filled={kFill} capacity={2} spin={1.1} />
              <OrbitalRing radius={2.4} tilt={-0.4} color="#7b6cff" hot={phase === 'act' && targetShell === 'l'} filled={Math.min(8, lFill)} capacity={8} spin={-0.7} />
              {(episode === 'sodium' || episode === 'bond') && (
                <OrbitalRing radius={3.3} tilt={0.28} color="#ff8f6b" hot={phase === 'act' && targetShell === 'm'} filled={mFill} capacity={1} spin={0.55} />
              )}
            </>
          )}
        </group>
      )}

      {episode === 'bond' && (
        <group position={[3.6, 0, 0]} scale={1.05}>
          <NucleusCluster protons={17} neutrons={18} jiggle={0.8} />
          <OrbitalRing radius={1.35} tilt={0.45} filled={2} capacity={2} />
          <OrbitalRing radius={2.1} tilt={-0.3} color="#7b6cff" filled={8} capacity={8} spin={-0.5} />
          <OrbitalRing
            radius={2.85}
            tilt={0.18}
            color="#5ad4ff"
            hot={phase === 'act' && targetShell === 'cl'}
            filled={(phase === 'branch' && branchKind === 'ok') || t > 0.55 ? 8 : 7}
            capacity={8}
          />
        </group>
      )}

      <DraggableElectron
        enabled={dragElectron && phase === 'act'}
        home={targetShell === 'cl' ? [-1.2, 1.1, 0.9] : targetShell === 'm' ? [0.4, -1.0, 2.2] : [-3.0, -1.5, 1.4]}
        targetShell={targetShell}
        center={[naShift, 0, 0]}
        ringScale={atomGroupScale}
        onDrop={onShellDrop}
        wobble={branchKind === 'bad'}
      />
      <ElectronTrailLeap active={trailOn} />
      {lattice > 0.02 && (
        <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.25}>
          <SaltLattice progress={lattice} />
        </Float>
      )}
    </>
  );
}

function PerfGuard({ children }: { children: ReactNode }) {
  const [fx, setFx] = useState(true);
  const frames = useRef<number[]>([]);
  useFrame((_, dt) => {
    const fps = 1 / Math.max(0.0001, dt);
    frames.current.push(fps);
    if (frames.current.length > 50) {
      frames.current.shift();
      const avg = frames.current.reduce((a, b) => a + b, 0) / frames.current.length;
      if (avg < 38 && fx) setFx(false);
    }
  });
  return (
    <>
      {children}
      {fx ? (
        <EffectComposer multisampling={0}>
          <DepthOfField focusDistance={0.025} focalLength={0.045} bokehScale={1.6} />
          <Bloom intensity={1.25} luminanceThreshold={0.2} luminanceSmoothing={0.3} mipmapBlur />
          <Vignette eskil={false} offset={0.18} darkness={0.62} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.1} luminanceThreshold={0.25} luminanceSmoothing={0.32} mipmapBlur />
          <Vignette eskil={false} offset={0.25} darkness={0.45} />
        </EffectComposer>
      )}
    </>
  );
}

export function AtomForgeScene({ api }: { api: SceneApi }) {
  return (
    <div className="afv-canvas" data-afv-canvas="1">
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false }}
        camera={{ position: [0, 1.4, 8], fov: 40, near: 0.1, far: 90 }}
        frameloop="always"
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
