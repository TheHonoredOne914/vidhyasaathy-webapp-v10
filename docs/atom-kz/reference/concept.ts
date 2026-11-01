import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { KZ, type Mood } from './kz/palette';
import { makeParticleMaterial } from './kz/particleMaterial';
import { packNucleus } from './kz/nucleus';
import { makeElectron, makeShellRing } from './kz/electron';
import { makeBackdrop, makeBokeh, makeSparkles } from './kz/background';

const q = new URLSearchParams(location.search);
const F = Number(q.get('f') ?? '1');
const W = innerWidth, H = innerHeight;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const hud = document.getElementById('hud')!;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.autoClear = false;

const cloudSvg = `<svg viewBox="0 0 64 44" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 38h32a10 10 0 0 0 1-20 14 14 0 0 0-27-3A11 11 0 0 0 16 38z"/><circle cx="27" cy="25" r="1.6" fill="#fff" stroke="none"/><circle cx="39" cy="25" r="1.6" fill="#fff" stroke="none"/><path d="M29.5 30.5q3.5 3 7 0"/></svg>`;
const cap = (html: string, hl = '#ffd23f') => `<div class="cap" style="--hl:${hl}">${cloudSvg}<span>${html}</span></div>`;
const prog = (n: number) => `<div class="prog">${[1, 2, 3, 4, 5, 6].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
const chip = (beat: string, bg: string) => `<div class="chip"><span class="tag" style="background:#fff;color:${KZ.violet}">Atom Forge</span><span class="tag" style="background:${bg}">${beat}</span></div>`;

function particle(kind: 'p' | 'n', r: number, face = false, mood: Mood = 'smile', tilt = 0, look: [number, number] = [0, 0]) {
  const m = kind === 'p'
    ? makeParticleMaterial({ base: KZ.pBase, lit: KZ.pLit, shade: KZ.pShade, hi: KZ.pHi, rim: KZ.pRim, face, plus: !face, mood, tilt, look })
    : makeParticleMaterial({ base: KZ.nBase, lit: KZ.nLit, shade: KZ.nShade, hi: KZ.nHi, rim: KZ.nRim, face, mood, tilt, look });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 48, 48), m);
}
function nucleus(cam: THREE.Camera, p: number, n: number, r: number, faces: number, mood: Mood = 'smile', seed = 7, spread = 1, at = new THREE.Vector3()) {
  const g = new THREE.Group(); g.position.copy(at);
  const pk = packNucleus(p, n, r, seed, spread);
  const camPos = cam.position.clone();
  const order = pk.map((b, i) => ({ i, d: b.pos.clone().add(at).distanceTo(camPos) })).sort((a, b) => a.d - b.d).map((o) => o.i);
  const faceSet = new Set(order.slice(0, faces));
  pk.forEach((b, i) => { const m = particle(b.kind, r, faceSet.has(i), mood, ((i * 37) % 7 - 3) * 0.05); m.position.copy(b.pos); g.add(m); });
  return g;
}
function project(v: THREE.Vector3, cam: THREE.Camera) { cam.updateMatrixWorld(); const p = v.clone().project(cam); return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H] as const; }
function lead(x1: number, y1: number, x2: number, y2: number) { const len = Math.hypot(x2 - x1, y2 - y1); const a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI; return `<div class="lead" style="left:${x1}px;top:${y1}px;width:${len}px;transform:rotate(${a}deg)"></div>`; }

const scene = new THREE.Scene();
const cam = new THREE.PerspectiveCamera(32, W / H, 0.1, 200);
let bg = makeBackdrop(KZ.violetLift, KZ.violetDeep);
let bloom = { strength: 0.5, radius: 0.6, threshold: 0.9 };
let extra: (() => void) | null = null;
let html = '';

if (F === 1) {
  // COLD OPEN — the player holds to zoom; title card over a carbon atom in deep space
  cam.position.set(0, 0.6, 18); cam.lookAt(0, -0.9, 0);
  const atom = new THREE.Group(); atom.position.set(0, -1.6, 0); scene.add(atom);
  { const nu = nucleus(cam, 6, 6, 0.34, 2, 'smile', 5, 1, atom.position); nu.position.set(0, 0, 0); atom.add(nu); }
  const k = new THREE.Group(); k.rotation.set(0.35, 0, 0.18); atom.add(k); k.add(makeShellRing(2.0, 0.35, 0.014));
  [0.6, 0.6 + Math.PI].forEach((a) => k.add(makeElectron(2.0, a, 0.11, 1.0)));
  const l = new THREE.Group(); l.rotation.set(-0.45, 0, -0.3); atom.add(l); l.add(makeShellRing(3.3, 0.3, 0.014));
  [0.2, 1.8, 3.4, 5.0].forEach((a) => l.add(makeElectron(3.3, a, 0.11, 0.9)));
  scene.add(makeBokeh(26, KZ.violetGlow, -40, -14, [70, 40], [1.5, 5], 0.35));
  scene.add(makeBokeh(10, KZ.pBase, -30, -10, [60, 34], [0.6, 1.6], 0.3, 9));
  scene.add(makeBokeh(4, KZ.nBase, 6, 10, [14, 8], [2.2, 3.6], 0.55, 21));
  scene.add(makeSparkles(260, [60, 36, 40]));
  html = chip('Chapter 4 · Structure of the atom', KZ.pBase) + prog(1)
    + `<div class="title"><h1>What is everything<br/>made of?</h1><p>Hold to zoom in</p></div>`
    + `<div class="hint" style="right:3vw;bottom:16vh"><div class="ring"></div>Hold anywhere</div>`
    + cap('Your desk, your hand, the air you breathe. Zoom in far enough and it is all <b>atoms</b>.');
}

if (F === 2) {
  // MEET THE NUCLEUS — slow dolly, tags pop in, player can drag to spin
  bg = makeBackdrop('#4a0fb0', KZ.violetDeep, [0.5, 0.5]);
  cam.position.set(0.0, 0.3, 7.4); cam.lookAt(0, 0, 0);
  const nuc = nucleus(cam, 6, 6, 0.5, 3, 'smile', 5); scene.add(nuc);
  const k = new THREE.Group(); k.rotation.set(0.42, 0, 0.12); scene.add(k); k.add(makeShellRing(2.55, 0.3, 0.016));
  [2.2, 2.2 + Math.PI].forEach((a) => k.add(makeElectron(2.55, a, 0.13, 1.2)));
  scene.add(makeBokeh(22, KZ.violetGlow, -30, -10, [50, 30], [1.5, 4], 0.35));
  scene.add(makeBokeh(3, KZ.pBase, 3.5, 5, [8, 5], [1.6, 2.6], 0.5, 31));
  scene.add(makeSparkles(160, [40, 24, 30]));
  extra = () => {
    // pick a proton and a neutron nearest the camera for leader lines
    const ms = nuc.children as THREE.Mesh[]; const wp = (m: THREE.Mesh) => m.getWorldPosition(new THREE.Vector3());
    const byDist = [...ms].sort((a, b) => wp(a).distanceTo(cam.position) - wp(b).distanceTo(cam.position));
    const pr = byDist.find((m) => (m.material as THREE.ShaderMaterial).uniforms.uBase!.value.getHexString() === KZ.pBase.slice(1))!;
    const ne = byDist.find((m) => (m.material as THREE.ShaderMaterial).uniforms.uBase!.value.getHexString() === KZ.nBase.slice(1))!;
    const [px, py] = project(wp(pr), cam); const [nx, ny] = project(wp(ne), cam);
    const tx = W * 0.16, ty = H * 0.3, ux = W * 0.74, uy = H * 0.64;
    html += lead(tx + 140, ty + 18, px, py) + `<span class="tag big" style="left:${tx - 30}px;top:${ty}px;background:${KZ.pShade}">Proton <small>charge +1</small></span>`;
    html += lead(ux, uy + 18, nx, ny) + `<span class="tag big" style="left:${ux}px;top:${uy}px;background:${KZ.nShade}">Neutron <small>no charge</small></span>`;
    html += `<div class="hint" style="right:3vw;bottom:16vh"><div class="ring"></div>Drag to spin</div>`;
  };
  html = chip('The nucleus', KZ.pShade) + prog(2) + cap('At the very centre sits the <b>nucleus</b>: protons and neutrons, packed tight. It is 100,000 times smaller than the atom.');
}

if (F === 3) {
  // YOUR TURN — drag neutrons in until the nucleus stops wobbling
  bg = makeBackdrop(KZ.sunLift, '#ff9a1a', [0.45, 0.48]);
  cam.position.set(0, 0.2, 9); cam.lookAt(0, 0, 0);
  const nuc = nucleus(cam, 6, 4, 0.5, 4, 'worried', 12, 1.16, new THREE.Vector3(-1.2, 0.15, 0)); scene.add(nuc);
  // repulsion arrows (Kurzgesagt pressure arrows), flat red chevrons around nucleus
  const arrowMat = new THREE.MeshBasicMaterial({ color: '#e0244f' });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.35; const s = new THREE.Shape(); s.moveTo(0, 0.13); s.lineTo(0.42, 0.13); s.lineTo(0.42, 0.26); s.lineTo(0.7, 0); s.lineTo(0.42, -0.26); s.lineTo(0.42, -0.13); s.lineTo(0, -0.13);
    const m = new THREE.Mesh(new THREE.ShapeGeometry(s), arrowMat); m.scale.setScalar(0.8); m.position.set(-1.2 + Math.cos(a) * 2.3, 0.15 + Math.sin(a) * 2.3, -0.6); m.rotation.z = a; scene.add(m);
  }
  // dragged neutron with happy face + dotted path + drop ring
  const dn = particle('n', 0.52, true, 'grin', -0.12, [-0.6, -0.1]); dn.position.set(3.05, -0.35, 0.6); scene.add(dn);
  const dots = new THREE.Group(); for (let i = 1; i < 9; i++) { const t = i / 9; const d = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshBasicMaterial({ color: '#ffffff' })); d.position.set(THREE.MathUtils.lerp(2.45, 0.35, t), -0.35 + Math.sin(t * Math.PI) * 0.55, 0.4); dots.add(d); } scene.add(dots);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.02, 128), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 })); ring.position.set(-1.2, 0.15, -0.3); scene.add(ring);
  scene.add(makeBokeh(14, '#fff2a8', -24, -8, [44, 26], [1.4, 3.6], 0.45));
  bloom = { strength: 0.25, radius: 0.5, threshold: 0.95 };
  extra = () => {
    const [x, y] = project(dn.position.clone().add(new THREE.Vector3(0.25, -0.35, 0)), cam);
    html += `<div class="hint" style="left:${x + 10}px;top:${y + 10}px;color:${KZ.ink}"><div class="ring" style="border-color:${KZ.ink};box-shadow:0 0 0 8px rgba(42,11,61,.15)"></div>Drag in</div>`;
  };
  html = chip('Your turn', '#e0244f') + prog(3)
    + `<div class="count"><span class="tag big" style="background:${KZ.pShade}">6 protons</span><span class="tag big" style="background:${KZ.nShade}">4 neutrons</span><span class="tag" style="background:${KZ.violet}">Mass number A = 10</span></div>`
    + `<div class="meter"><div class="row"><span class="end" style="background:#e0244f">Wobbly</span><div class="bar"><div class="fill" style="width:34%"></div><div class="mid" style="left:60%"></div><div class="knob" style="left:34%"></div></div><span class="end" style="background:${KZ.violet}">Steady</span></div></div>`
    + cap('Six protons all push each other away. Neutrons add glue without adding push. <b>Drag neutrons in</b> until it stops wobbling.', '#ffe066');
}

if (F === 4) {
  // FILL THE SHELLS — sodium 2,8,1; tap the glowing slot on the M shell
  bg = makeBackdrop('#16a6ff', '#0050b8', [0.5, 0.5]);
  cam.position.set(0, 5.6, 9.6); cam.lookAt(0, -0.3, 0);
  const atom = new THREE.Group(); atom.position.set(-0.6, -0.3, 0); scene.add(atom);
  { const nu = nucleus(cam, 11, 12, 0.28, 2, 'smile', 21, 1, atom.position); nu.position.set(0, 0, 0); atom.add(nu); }
  const radii = [1.5, 2.6, 3.7];
  const fills = [2, 8, 0];
  radii.forEach((r, si) => {
    const g = new THREE.Group(); atom.add(g); g.add(makeShellRing(r, si === 2 ? 0.9 : 0.45, si === 2 ? 0.026 : 0.016));
    for (let i = 0; i < fills[si]!; i++) g.add(makeElectron(r, (i / fills[si]!) * Math.PI * 2 + si * 0.4, 0.12, 0.7));
  });
  // empty target slot on M shell, pulsing ring
  const slotA = 0.55; const slot = new THREE.Group(); slot.position.set(Math.cos(slotA) * 3.7, 0, Math.sin(slotA) * 3.7); atom.add(slot);
  [0.2, 0.34].forEach((rr, i) => { const m = new THREE.Mesh(new THREE.RingGeometry(rr, rr + 0.035, 64), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: i ? 0.45 : 0.95, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; slot.add(m); });
  // waiting electron in tray
  const wait = makeElectron(0.0001, 0, 0.17, 0.0001); wait.position.set(5.2, 1.2, 1.6); scene.add(wait);
  scene.add(makeBokeh(18, '#7fd3ff', -26, -8, [50, 30], [1.4, 4], 0.35));
  scene.add(makeSparkles(140, [40, 24, 30]));
  extra = () => {
    const [sx, sy] = project(slot.getWorldPosition(new THREE.Vector3()), cam);
    html += `<div class="hint" style="left:${sx + 30}px;top:${sy - 14}px"><div class="ring"></div>Tap to place</div>`;
    const [nx, ny] = project(atom.position, cam);
    html += `<span class="tag" style="left:${nx - 40}px;top:${ny - 120}px;background:${KZ.violet}">Na · Z = 11</span>`;
  };
  html = chip('Electron shells', KZ.violet) + prog(4)
    + `<div class="count"><span class="tag big" style="background:#fff;color:#0050b8">K 2</span><span class="tag big" style="background:#fff;color:#0050b8">L 8</span><span class="tag big" style="background:${KZ.sun};color:${KZ.ink}">M 0 / 1</span></div>`
    + cap('Electrons fill shells from the inside out. K holds 2, L holds 8. Sodium has 11, so <b>one goes to M</b>.', '#ffe066');
}

if (F === 5) {
  // ISOTOPE REVEAL — three panels, same protons, different neutrons
  html = chip('Isotopes', KZ.teal) + prog(5) + cap('Same 6 protons, so all three are carbon. Only the neutrons change. These are <b>isotopes</b>.', '#ffe066');
  extra = null;
}

if (F === 6) {
  // CHARACTER CLOSE-UP — proton and neutron, perfectly even smiles
  bg = makeBackdrop('#21f0cc', '#00a98d', [0.5, 0.45]);
  cam.position.set(0, 0, 8); cam.lookAt(0, 0, 0);
  const pr = particle('p', 1.25, true, 'smile', 0.1); pr.position.set(-1.45, 0.15, 0); scene.add(pr);
  const ne = particle('n', 1.25, true, 'grin', -0.1); ne.position.set(1.45, 0.15, 0); scene.add(ne);
  const e = new THREE.Group(); e.rotation.set(-0.35, 0, 0.18); e.position.set(0, 0.6, -1.5); scene.add(e); e.add(makeElectron(4.2, 3.9, 0.13, 1.1));
  scene.add(makeBokeh(12, '#bffff2', -20, -6, [40, 24], [1.2, 3.4], 0.4));
  // contact shadow ellipses
  [-1.45, 1.45].forEach((x) => { const s = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: '#008a73', transparent: true, opacity: 0.55 })); s.scale.set(1.15, 0.22, 1); s.position.set(x, -1.42, -0.4); scene.add(s); });
  bloom = { strength: 0.3, radius: 0.5, threshold: 0.95 };
  extra = () => {
    const [px, py] = project(new THREE.Vector3(-1.45, 1.55, 0), cam); const [nx, ny] = project(new THREE.Vector3(1.45, 1.55, 0), cam);
    html += `<span class="tag big" style="left:${px}px;top:${py - 30}px;transform:translateX(-50%);background:${KZ.pShade}">Proton <small>+1</small></span>`;
    html += `<span class="tag big" style="left:${nx}px;top:${ny - 30}px;transform:translateX(-50%);background:${KZ.nShade}">Neutron <small>0</small></span>`;
  };
  html = chip('Meet the crew', '#008a73') + prog(2) + cap('Protons carry a <b>+1</b> charge. Neutrons carry none. Together they make up almost all of an atom\'s mass.', '#ffe066');
}

if (F === 7) {
  // SYMMETRY PROOF — same face under hostile transforms: spinning parent, rolled parent, off-axis in perspective
  bg = makeBackdrop('#4a0fb0', KZ.violetDeep);
  cam.position.set(0, 0, 10); cam.fov = 40; cam.updateProjectionMatrix(); cam.lookAt(0, 0, 0);
  const cases: [number, number, number, number, number][] = [[-4.6, 1.6, 2.4, 0.9, -0.7], [0, 1.6, -1.1, 2.2, 0.4], [4.6, 1.6, 0.3, -2.8, 1.9], [-4.6, -1.7, -0.8, 0.5, 3.0], [0, -1.7, 1.7, -1.2, -2.2], [4.6, -1.7, 3.1, 3.1, 0.2]];
  cases.forEach(([x, y, rx, ry, rz], i) => { const g = new THREE.Group(); g.position.set(x, y, 0); g.rotation.set(rx, ry, rz); const m = particle(i % 2 ? 'n' : 'p', 1.05, true, 'smile', 0); m.position.set(0.4, -0.2, 0.3); g.add(m); scene.add(g); });
  bloom = { strength: 0.2, radius: 0.4, threshold: 0.97 };
  html = chip('Symmetry check', KZ.pShade) + '<span class="tag" style="left:50%;bottom:4vh;transform:translateX(-50%);background:#fff;color:#2d0089">Six random parent rotations, off-axis perspective: the smile stays even</span>';
}

scene.add(bg);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), bloom.strength, bloom.radius, bloom.threshold));
composer.addPass(new OutputPass());

if (F === 5) {
  // three scissored viewports, each its own scene
  const panels = [
    { name: 'Carbon-12', sup: '12', n: 6, bg: [KZ.coral, '#f0505a'], tag: '#e0244f' },
    { name: 'Carbon-13', sup: '13', n: 7, bg: ['#22f0cc', '#00b597'], tag: '#008a73' },
    { name: 'Carbon-14', sup: '14', n: 8, bg: ['#9a9bff', '#6366e8'], tag: '#3f3fc4' },
  ];
  const pw = W / 3;
  panels.forEach((p, i) => {
    const sc = new THREE.Scene(); const c = new THREE.PerspectiveCamera(30, pw / H, 0.1, 100); c.position.set(0, 0.5, 15.5); c.lookAt(0, -0.9, 0);
    const b = makeBackdrop(p.bg[0]!, p.bg[1]!); sc.add(b);
    sc.add(nucleus(c, 6, p.n, 0.42, 2, i === 2 ? 'wow' : 'smile', 5 + i));
    const r = new THREE.Mesh(new THREE.RingGeometry(2.05, 2.12, 128), new THREE.MeshBasicMaterial({ color: '#fff' })); sc.add(r);
    const e1 = makeElectron(2.08, 0, 0.12, 1.2); e1.rotation.x = Math.PI / 2; e1.rotation.y = -0.6 - i * 0.5; sc.add(e1);
    const e2 = makeElectron(2.08, 0, 0.12, 1.2); e2.rotation.x = Math.PI / 2; e2.rotation.y = -2.6 - i * 0.5; sc.add(e2);
    const sh = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.12 })); sh.scale.set(1.3, 0.25, 1); sh.position.set(0, -1.55, -1); sc.add(sh);
    renderer.setScissorTest(true); renderer.setViewport(i * pw, 0, pw, H); renderer.setScissor(i * pw, 0, pw, H);
    renderer.render(sc, c);
    html += `<span class="tag panelTag big" style="left:${i * pw + pw / 2}px;background:${p.tag}"><small style="opacity:1">${p.sup}</small>C · ${p.name}</span>`;
    html += `<div class="panelData" style="left:${i * pw + pw / 2}px">6 protons · ${p.n} neutrons<span>Z = 6 · A = ${6 + p.n}</span></div>`;
  });
  hud.innerHTML = html;
} else {
  extra?.();
  hud.innerHTML = html;
  composer.render();
}
document.fonts.ready.then(() => { (window as unknown as { __ready: boolean }).__ready = true; });
