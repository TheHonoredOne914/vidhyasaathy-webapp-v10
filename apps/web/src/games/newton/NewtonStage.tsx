import { useEffect, useState } from 'react';
import type { ArenaApi } from '../engine/types';
import { validateFma, validateInertia, validateMomentum, validateReaction } from './validators';

function Slider({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (value: number) => void }) {
  return <label className="newton-slider"><span>{label} <b>{value} {unit}</b></span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}

export function NewtonStage({ api }: { api: ArenaApi }) {
  const level = api.round;
  const [speed, setSpeed] = useState(4);
  const [force, setForce] = useState(8);
  const [mass, setMass] = useState(3);
  const [reaction, setReaction] = useState('balloon-wall');
  const [collided, setCollided] = useState(false);
  const acceleration = Number((force / mass).toFixed(1));
  const before = 8;
  const after = collided ? 8 : 0;
  useEffect(() => {
    if (level === 1) { api.setStats({ label: 'Pull speed', value: `${speed} m/s` }); api.setReadout({ speed: String(speed), inertia: speed >= 7 ? 'coin stays' : 'coin moves' }); api.registerPrimary(() => api.reportResult(validateInertia(speed).correct)); }
    else if (level === 2) { api.setStats({ label: 'Acceleration', value: `${acceleration} m/s²` }); api.setReadout({ force: `${force} N`, mass: `${mass} kg`, acceleration: `${acceleration} m/s²` }); api.registerPrimary(() => api.reportResult(validateFma({ force, mass, acceleration }).correct)); }
    else if (level === 3) { api.setStats({ label: 'Rocket thrust', value: reaction === 'balloon-air' ? 'balanced pair' : 'choose pair' }); api.setReadout({ pair: reaction === 'balloon-air' ? 'Balloon ↔ Air' : 'Balloon ↔ Wall' }); api.registerPrimary(() => api.reportResult(validateReaction(reaction).correct)); }
    else { api.setStats({ label: 'Momentum', value: `${after} kg·m/s` }); api.setReadout({ before: '8 kg·m/s', after: `${after} kg·m/s`, collision: collided ? 'complete' : 'ready' }); api.registerPrimary(() => api.reportResult(validateMomentum({ before, after }).correct)); }
  }, [acceleration, after, api, collided, force, level, mass, reaction, speed]);
  const reset = () => { setSpeed(4); setForce(8); setMass(3); setReaction('balloon-wall'); setCollided(false); };
  return <div className="newton-stage"><svg viewBox="0 0 780 540" role="img" aria-label="Interactive Newton laws simulation">
    <defs><linearGradient id="newton-track" x1="0" x2="1"><stop stopColor="#dce8f3" /><stop offset="1" stopColor="#9db5cc" /></linearGradient><linearGradient id="newton-cart" x1="0" x2="1"><stop stopColor="#4c78a4" /><stop offset="1" stopColor="#193e69" /></linearGradient><radialGradient id="newton-ball" cx="30%" cy="25%"><stop stopColor="#ffe47c" /><stop offset="1" stopColor="#c58c06" /></radialGradient><marker id="newton-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="currentColor" /></marker></defs>
    <rect width="780" height="540" fill="#f4f7fc" /><path d="M88 390H700" stroke="url(#newton-track)" strokeWidth="24" /><path d="M88 390H700" stroke="#28517c" strokeWidth="4" /><path d="M88 396H700" stroke="#d4a017" strokeWidth="3" strokeDasharray="8 8" />
    {level === 1 && <><text x="110" y="75" className="newton-svg-title">INERTIA LAB</text><text x="110" y="98" className="newton-svg-copy">Quick pull · coin resists the change</text><rect x="245" y="325" width="210" height="28" rx="6" fill="#d4a017" /><rect x="322" y="278" width="58" height="48" rx="5" fill="#e9edf2" stroke="#28517c" /><circle cx="351" cy="270" r="18" fill="url(#newton-ball)" /><path d={`M275 338 H${275 + speed * 28}`} stroke="#d94f43" strokeWidth="5" markerEnd="url(#newton-arrow)" /><text x="300" y="438" className="newton-svg-label">card</text><text x="335" y="190" className="newton-svg-label">coin · nearly at rest</text></>}
    {level === 2 && <><text x="110" y="75" className="newton-svg-title">F = ma CART LAB</text><text x="110" y="98" className="newton-svg-copy">Applied force changes acceleration</text><rect x="285" y="335" width="130" height="52" rx="10" fill="url(#newton-cart)" /><circle cx="315" cy="395" r="18" fill="#193e69" /><circle cx="385" cy="395" r="18" fill="#193e69" /><path d="M420 360H560" stroke="#d94f43" strokeWidth="8" markerEnd="url(#newton-arrow)" /><text x="475" y="342" className="newton-svg-label">{force} N applied</text><text x="316" y="365" fill="white" fontSize="14" fontWeight="800">{mass} kg</text><rect x="540" y="160" width="140" height="92" rx="10" fill="white" stroke="#d8e1ec" /><text x="560" y="188" className="newton-svg-label">a = F ÷ m</text><text x="560" y="222" fontSize="25" fill="#193e69" fontWeight="800">{acceleration} m/s²</text></>}
    {level === 3 && <><text x="110" y="75" className="newton-svg-title">ACTION · REACTION</text><text x="110" y="98" className="newton-svg-copy">Equal forces act on different bodies</text><ellipse cx="360" cy="270" rx="72" ry="58" fill="#df4d38" /><path d="M300 300 Q360 340 420 300" fill="#bd332c" /><path d="M430 270 H610" stroke="#d94f43" strokeWidth="8" markerEnd="url(#newton-arrow)" /><path d="M290 270 H150" stroke="#28517c" strokeWidth="8" markerEnd="url(#newton-arrow)" /><text x="480" y="245" className="newton-svg-label">balloon pushes air</text><text x="120" y="245" className="newton-svg-label">air pushes balloon</text><circle cx="625" cy="270" r="14" fill="#7ba1c0" /><circle cx="120" cy="270" r="14" fill="#7ba1c0" /></>}
    {level === 4 && <><text x="110" y="75" className="newton-svg-title">MOMENTUM COLLISION</text><text x="110" y="98" className="newton-svg-copy">p = mv · isolated system</text><rect x={collided ? 355 : 190} y="330" width="100" height="50" rx="8" fill="#d94f43" /><rect x={collided ? 465 : 560} y="330" width="100" height="50" rx="8" fill="#4c78a4" /><text x="300" y="210" className="newton-svg-label">before: 3×4 + 2×(−2) = 8</text><text x="300" y="240" className="newton-svg-label">after: {after} kg·m/s</text></>}
    <path d="M95 465H685" stroke="#b4c5d7" strokeDasharray="5 6" /><text x="105" y="490" className="newton-svg-label">Force Arena · NCERT Class 9</text>
  </svg><div className="newton-controls">
    {level === 1 && <Slider label="Pull speed" value={speed} min={1} max={10} unit="m/s" onChange={setSpeed} />}
    {level === 2 && <><Slider label="Applied force" value={force} min={2} max={20} unit="N" onChange={setForce} /><Slider label="Cart mass" value={mass} min={1} max={6} unit="kg" onChange={setMass} /></>}
    {level === 3 && <div className="reaction-choices"><button className={reaction === 'balloon-air' ? 'selected' : ''} onClick={() => setReaction('balloon-air')}>Balloon ↔ Air</button><button className={reaction === 'balloon-wall' ? 'selected' : ''} onClick={() => setReaction('balloon-wall')}>Balloon ↔ Wall</button></div>}
    {level === 4 && <button type="button" onClick={() => setCollided(true)}>{collided ? 'Collision complete' : 'Run collision'}</button>}<button type="button" onClick={reset}>Reset experiment</button>
  </div><div className="newton-legend"><span className="force-dot" /> Applied force <span className="mass-dot" /> Cart / mass <span className="guide-dot" /> Guide</div></div>;
}
