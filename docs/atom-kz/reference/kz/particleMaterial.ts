import * as THREE from 'three';
import { MOOD_ID, type Mood } from './palette';

/**
 * Kurzgesagt-style particle: flat base, soft crescent shadow, lit gradient, oval highlight,
 * rim bounce light, film grain. The face is drawn IN THE FRAGMENT SHADER in a camera-facing
 * frame built from the sphere's view-space centre, and the mouth uses abs(x), so the smile is
 * mirror-symmetric by construction at any rotation, any screen position, any parent transform.
 */
const vert = /* glsl */ `
varying vec3 vN; varying vec3 vP; varying vec3 vC;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vP = mv.xyz;
  vC = (modelViewMatrix * vec4(0.0,0.0,0.0,1.0)).xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

const frag = /* glsl */ `
uniform vec3 uBase,uLit,uShade,uHi,uRim,uInk,uBlush;
uniform vec3 uLight; uniform float uFace,uMood,uTilt,uBlink,uPlus,uTime,uGrain;
uniform vec2 uLook;
varying vec3 vN; varying vec3 vP; varying vec3 vC;
float hash(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
// IQ arc SDF, symmetric about +y by abs(p.x)
float sdArc(vec2 p, vec2 sc, float ra, float rb){ p.x=abs(p.x); return ((sc.y*p.x>sc.x*p.y)? length(p-sc*ra) : abs(length(p)-ra)) - rb; }
float sdEll(vec2 p, vec2 r){ float k=length(p/r); return (k-1.0)*min(r.x,r.y); }
float fill(float d){ float a=fwidth(d)*0.9; return 1.0-smoothstep(-a,a,d); }
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(-vP);
  vec3 L = normalize(uLight);
  float d = dot(n,L);
  float lit = smoothstep(-0.30,0.10,d);
  vec3 col = mix(uShade,uBase,lit);
  col = mix(col,uLit,smoothstep(0.30,0.95,d)*0.6);
  float fr = 1.0-max(dot(n,v),0.0);
  col = mix(col,uRim,smoothstep(0.62,0.98,fr)*(1.0-lit)*0.65);
  vec3 h = normalize(L+v);
  float sp = smoothstep(0.968,0.978,dot(n,h));
  col = mix(col,uHi,sp*0.7);
  if(uFace>0.5 || uPlus>0.5){
    // camera-facing face frame: forward = towards camera from sphere centre
    vec3 f = normalize(-vC);
    vec3 r = normalize(cross(vec3(0.0,1.0,0.0),f));
    vec3 u = cross(f,r);
    vec2 p = vec2(dot(n,r),dot(n,u)) - uLook*0.22;
    float c=cos(uTilt), s=sin(uTilt); p = mat2(c,s,-s,c)*p;
    if(uFace>0.5){
      vec2 ep = vec2(abs(p.x)-0.235, p.y-0.10);
      float eye = sdEll(ep, vec2(0.068, 0.092*mix(1.0,0.12,uBlink)));
      // highlight sits top-centre of each eye: mirror-symmetric like the mouth
      float gl = length(ep - vec2(0.0,0.038)) - 0.024;
      float mouth;
      vec2 mq = vec2(p.x, -(p.y+0.06));
      if(uMood<0.5){ mouth = sdArc(mq, vec2(sin(1.0),cos(1.0)), 0.13, 0.026); }
      else if(uMood<1.5){ vec2 g=vec2(p.x,p.y+0.05); mouth = max(length(g)-0.15, g.y); }
      else if(uMood<2.5){ vec2 w=vec2(p.x,p.y+0.20); mouth = sdArc(w, vec2(sin(0.8),cos(0.8)), 0.10, 0.024); }
      else { mouth = sdEll(vec2(p.x,p.y+0.10), vec2(0.06,0.075)); }
      float blush = sdEll(vec2(abs(p.x)-0.36,p.y+0.03), vec2(0.075,0.045));
      col = mix(col, uBlush, fill(blush)*0.45*lit);
      col = mix(col, uInk, fill(eye));
      col = mix(col, vec3(1.0), fill(gl)*fill(eye)*(1.0-uBlink));
      col = mix(col, uInk, fill(mouth));
      if(uMood>0.5 && uMood<1.5){ float tg = length(vec2(p.x,p.y+0.17))-0.07; col=mix(col,uBlush,fill(tg)*fill(mouth)); }
    } else {
      float a = min(sdEll(p, vec2(0.30,0.075)), sdEll(p, vec2(0.075,0.30)));
      col = mix(col, uHi, fill(a)*0.9);
    }
  }
  col += (hash(gl_FragCoord.xy+uTime)-0.5)*uGrain;
  gl_FragColor = vec4(col,1.0);
  #include <colorspace_fragment>
}`;

export type ParticleOpts = { base: string; lit: string; shade: string; hi: string; rim: string; face?: boolean; plus?: boolean; mood?: Mood; tilt?: number; look?: [number, number] };

export function makeParticleMaterial(o: ParticleOpts) {
  return new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uBase: { value: new THREE.Color(o.base) }, uLit: { value: new THREE.Color(o.lit) },
      uShade: { value: new THREE.Color(o.shade) }, uHi: { value: new THREE.Color(o.hi) },
      uRim: { value: new THREE.Color(o.rim) }, uInk: { value: new THREE.Color('#2a0b3d') },
      uBlush: { value: new THREE.Color('#ff5f8f') },
      uLight: { value: new THREE.Vector3(-0.55, 0.7, 0.55) },
      uFace: { value: o.face ? 1 : 0 }, uPlus: { value: o.plus ? 1 : 0 },
      uMood: { value: MOOD_ID[o.mood ?? 'smile'] }, uTilt: { value: o.tilt ?? 0 }, uBlink: { value: 0 },
      uLook: { value: new THREE.Vector2(...(o.look ?? [0, 0])) }, uTime: { value: 0 }, uGrain: { value: 0.035 },
    },
  });
}
