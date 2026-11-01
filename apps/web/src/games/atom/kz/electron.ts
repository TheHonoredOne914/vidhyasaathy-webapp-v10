import * as THREE from 'three';
/** Electron = bright azure core + soft halo sprite + fading comet trail along its orbit. */
let haloTex: THREE.Texture | null = null;
export function softDiscTexture() {
  if (haloTex) return haloTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); haloTex = new THREE.CanvasTexture(c); return haloTex;
}
const trailVert = `varying float vU; void main(){ vU = uv.x; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `;
const trailFrag = `uniform vec3 uCol; uniform float uAlpha; varying float vU; void main(){ float a = pow(vU,1.6)*uAlpha; gl_FragColor = vec4(uCol,a);
#include <colorspace_fragment>
} `;
export function makeElectron(radius: number, angle: number, size = 0.12, trailLen = 1.1, color = '#4d8bff') {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 24), new THREE.MeshBasicMaterial({ color: '#dff0ff' }));
  const shell = new THREE.Mesh(new THREE.SphereGeometry(size * 1.3, 24, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 }));
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDiscTexture(), color, transparent: true, opacity: 0.75, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(size * 4.5);
  const pos = new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
  core.position.copy(pos); shell.position.copy(pos); halo.position.copy(pos);
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i++) { const a = angle - trailLen + (trailLen * i) / 32; pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)); }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, size * 0.32, 8, false);
  const trail = new THREE.Mesh(tube, new THREE.ShaderMaterial({ vertexShader: trailVert, fragmentShader: trailFrag, transparent: true, depthWrite: false, uniforms: { uCol: { value: new THREE.Color('#cfe6ff') }, uAlpha: { value: 0.8 } } }));
  g.add(trail, shell, core, halo);
  return g;
}
export function makeShellRing(radius: number, opacity = 0.5, width = 0.018, color = '#ffffff') {
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, width, 8, 160), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = Math.PI / 2; return m;
}
