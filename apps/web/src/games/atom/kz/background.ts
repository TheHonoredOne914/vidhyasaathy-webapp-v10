import * as THREE from 'three';
import { softDiscTexture } from './electron';
/** Full-screen radial gradient + grain, drawn first. */
export function makeBackdrop(inner: string, outer: string, center: [number, number] = [0.5, 0.52]) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    depthWrite: false, depthTest: false,
    uniforms: { uA: { value: new THREE.Color(inner) }, uB: { value: new THREE.Color(outer) }, uC: { value: new THREE.Vector2(...center) }, uRes: { value: new THREE.Vector2(1600, 900) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.9999,1.0);} `,
    fragmentShader: `uniform vec3 uA,uB; uniform vec2 uC,uRes; varying vec2 vUv;
      float h(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*43758.5);} 
      void main(){ vec2 q=(vUv-uC)*vec2(uRes.x/uRes.y,1.0); float t=smoothstep(0.0,1.05,length(q)); vec3 c=mix(uA,uB,t); c+= (h(gl_FragCoord.xy)-0.5)*0.008; gl_FragColor=vec4(c,1.0);
#include <colorspace_fragment>
} `,
  }));
  m.frustumCulled = false; m.renderOrder = -10; return m;
}
/** Out-of-focus particles for depth layering (far = small/faint, near = big/soft). */
export function makeBokeh(count: number, color: string, zMin: number, zMax: number, spread: [number, number], size: [number, number], opacity: number, seed = 3) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDiscTexture(), color, transparent: true, opacity: opacity * (0.5 + rnd() * 0.5), depthWrite: false }));
    sp.position.set((rnd() - 0.5) * spread[0], (rnd() - 0.5) * spread[1], zMin + rnd() * (zMax - zMin));
    sp.scale.setScalar(size[0] + rnd() * (size[1] - size[0])); g.add(sp);
  }
  return g;
}
export function makeSparkles(count: number, spread: [number, number, number], color = '#ffffff', seed = 11) {
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) { pos[i * 3] = (rnd() - 0.5) * spread[0]; pos[i * 3 + 1] = (rnd() - 0.5) * spread[1]; pos[i * 3 + 2] = -rnd() * spread[2] - 2; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 0.05, transparent: true, opacity: 0.8, depthWrite: false }));
}
