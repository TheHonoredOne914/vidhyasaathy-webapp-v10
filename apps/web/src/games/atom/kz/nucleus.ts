import * as THREE from 'three';
/** Deterministic tight packing: seeded spiral start + relaxation (attract to centre, push overlaps apart). */
export function packNucleus(protons: number, neutrons: number, r = 0.5, seed = 7, spread = 1) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const total = protons + neutrons;
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < total; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / total); const th = Math.PI * (1 + Math.sqrt(5)) * i;
    const rr = r * Math.cbrt(total) * 0.9;
    pts.push(new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)).multiplyScalar(rr * (0.4 + rnd() * 0.6)));
  }
  for (let it = 0; it < 260; it++) {
    for (const p of pts) p.multiplyScalar(0.985);
    for (let i = 0; i < total; i++) for (let j = i + 1; j < total; j++) {
      const a = pts[i]!, b = pts[j]!; const d = a.distanceTo(b); const min = 2 * r * 0.93;
      if (d < min && d > 1e-5) { const push = b.clone().sub(a).multiplyScalar((min - d) / d / 2); a.sub(push); b.add(push); }
    }
  }
  // alternate kinds by a seeded shuffle so colours mix like the reference
  const kinds: ('p' | 'n')[] = [...Array(protons).fill('p'), ...Array(neutrons).fill('n')];
  for (let i = kinds.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [kinds[i], kinds[j]] = [kinds[j]!, kinds[i]!]; }
  return pts.map((p, i) => ({ pos: p.multiplyScalar(spread), kind: kinds[i]! }));
}
